# FoodOrdering

Expo app + local Supabase (Postgres, Storage, Auth, Edge Functions) running in Docker.

## Supabase scripts

| Script                     | Command                                             |
| -------------------------- | --------------------------------------------------- |
| `npm run supabase:restart` | `supabase stop && supabase start`                   |
| `npm run functions:serve`  | `supabase functions serve`                          |
| `npm run functions:logs`   | `docker logs -f supabase_edge_runtime_FoodOrdering` |

### `npm run supabase:restart`

Stops every local Supabase container and starts them again: DB, Storage, Auth, Studio, Kong
and the Edge Runtime (`supabase_edge_runtime_FoodOrdering`). Database data survives the
restart (it lives in a Docker volume).

`supabase start` already serves all Edge Functions from `supabase/functions/` at
`http://127.0.0.1:54321/functions/v1/<name>` — no separate command needed. But the list of
functions and their config are fixed when the container starts, so run this after:

- adding a new function or changing `supabase/config.toml`;
- stopping `functions:serve` (see below).

### `npm run functions:serve`

Development mode for Edge Functions. Recreates the Edge Runtime container and watches
`supabase/functions/` on your machine: on every save you see
`File change detected: ...` and the runtime reloads, so the next request runs the new code.
Function logs (`console.log`) print right in this terminal. Reads secrets from
`supabase/functions/.env`.

It serves **all** functions; a function name after `serve` is ignored (legacy argument).

Gotchas:

- **Logs appear only when a request comes in.** Saving a file reloads the runtime but prints
  nothing from your code until you call the function.
- **A request without `apikey` never reaches your code.** `withSupabase(...)` rejects it with
  `MISSING_CREDENTIALS`, so your `console.log` inside the handler doesn't run.
- **Stopping it (Ctrl+C) removes the Edge Runtime container.** `supabase start` alone won't
  bring it back while the other containers are running — run `npm run supabase:restart`.

### `npm run functions:logs`

Follows the logs of the Edge Runtime container — useful when functions run via
`supabase start` (no `functions:serve` terminal). Ctrl+C stops following; the container
keeps running.

## Calling a function locally

`payment-sheet` and `create-order` use `withSupabase({ auth: ['user'] })`, so a request needs
both the publishable key and a **signed-in user's JWT**. With the key alone you get
`MISSING_CREDENTIALS`. The keys are printed by `npx supabase status`.

Get a user JWT without knowing the password (local only: it uses the secret key):

```bash
# magic link for an existing user -> token_hash
curl -s http://127.0.0.1:54321/auth/v1/admin/generate_link \
  -H 'apikey: <SECRET_KEY>' -H 'Authorization: Bearer <SECRET_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"type":"magiclink","email":"user@test.com"}'          # -> "hashed_token"

# exchange it for a session -> access_token (the user JWT)
curl -s http://127.0.0.1:54321/auth/v1/verify \
  -H 'apikey: <PUBLISHABLE_KEY>' -H 'Content-Type: application/json' \
  -d '{"type":"magiclink","token_hash":"<hashed_token>"}'   # -> "access_token"
```

Then call the function:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/payment-sheet \
  -H 'apikey: <PUBLISHABLE_KEY>' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"product_id":1,"size":"M","quantity":2}]}'
```

The server prices the cart from `products`; an invalid cart returns `400 {"error": "..."}`, a
server-side failure returns `500 {"error": "Payment setup failed"}` (details in the function logs).

From the app, `supabase.functions.invoke('payment-sheet', { body })` adds the key and the
user's JWT itself.

## Edge Functions

| Function              | Called by          | Auth                                 | What it does                                                                                                         |
| --------------------- | ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `payment-sheet`       | app, on checkout   | user JWT                             | validates the cart, prices it from `products`, creates the Stripe customer (once), CustomerSession and PaymentIntent |
| `create-order`        | app, after payment | user JWT                             | checks the PaymentIntent in Stripe (succeeded, belongs to the user) and creates `orders` + `order_items`             |
| `stripe-webhook`      | Stripe             | `Stripe-Signature` (no Supabase key) | on `payment_intent.succeeded` creates the same order, so it exists even if the app was closed right after paying     |
| `update-order-status` | admin app          | user JWT + `is_admin()`              | changes the order status and sends the owner an Expo push notification                                               |

Shared code lives in `supabase/functions/_utils/` (`cart.ts`, `orders.ts`, `stripe.ts`,
`supabase.ts`); redeploy every function that imports a changed file.

### How an order is created

1. App → `payment-sheet` with `{ items: [{ product_id, size, quantity }] }`. The amount is
   computed on the server; the user id and the cart go into the PaymentIntent `metadata`.
2. The user pays in the Stripe Payment Sheet.
3. App → `create-order` with `{ paymentIntentId }`, **and** Stripe → `stripe-webhook`. Whichever
   comes first creates the order; `orders.payment_intent_id` is unique, so the other one gets the
   same order back.

Clients can't insert into `orders` / `order_items` or update `orders` (RLS); they only read
their own orders (admins read all). Push tokens never leave the server.

### Secrets

| Name                     | Used by                               | Where it comes from                                                                       |
| ------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`      | all Stripe functions                  | Stripe Dashboard → API keys (`sk_test_...` in the sandbox)                                |
| `STRIPE_PUBLISHABLE_KEY` | `payment-sheet` (returned to the app) | Stripe Dashboard → API keys (`pk_test_...`)                                               |
| `STRIPE_WEBHOOK_SECRET`  | `stripe-webhook`                      | locally: `stripe listen --print-secret`; cloud: the endpoint's signing secret (see below) |
| `EXPO_ACCESS_TOKEN`      | `update-order-status` (optional)      | needed only if "Enhanced security for push notifications" is on in the Expo project       |

Locally they go into `supabase/functions/.env` (restart `npm run functions:serve` after a
change); in the cloud, `npx supabase secrets set NAME=value`. A function that needs
`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` fails on boot without it.

### Stripe webhook locally: `stripe listen`

Stripe can't reach `127.0.0.1`, so the Stripe CLI forwards events to the local function.

```bash
brew install stripe/stripe-cli/stripe
stripe login                 # pick the SAME sandbox as STRIPE_SECRET_KEY in .env
stripe config --list | grep account_id

stripe listen --print-secret # -> whsec_..., put into supabase/functions/.env as STRIPE_WEBHOOK_SECRET
npm run functions:serve      # restart so it reads the secret

# keep this running while testing payments
stripe listen --events payment_intent.succeeded \
  --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

Each forwarded event shows up as `payment_intent.succeeded [200]`.

- **Wrong account.** If `stripe login` picked another account or sandbox, `listen` waits for
  events that never come. Either log in again, or use the key from `.env` for one terminal:
  `export STRIPE_API_KEY=$(grep -E '^STRIPE_SECRET_KEY=' supabase/functions/.env | cut -d= -f2-)`.
- **Test event.** `stripe trigger payment_intent.succeeded` fails on newer API versions
  (`payment_method_types ... no longer supported`). Use:

  ```bash
  stripe trigger payment_intent.succeeded \
    --remove payment_intent:payment_method_types \
    --add 'payment_intent:automatic_payment_methods[enabled]=true' \
    --add 'payment_intent:automatic_payment_methods[allow_redirects]=never'
  ```

  It has no cart in `metadata`, so the webhook answers `200 {"ignored":"no cart metadata"}`.

- **One sandbox for local and cloud.** Every test payment is sent to the cloud endpoint and to
  `stripe listen`. The database that doesn't know the user answers
  `200 {"ignored":"unknown user"}`, so Stripe doesn't retry.

## Running the app

### `npx expo start -c`

Starts the Metro dev server (same as `npm start`), and `-c` (`--clear`) wipes the Metro
bundler cache first. Scan the QR code or press `i` / `a` to open the app.

Use `-c` when the app shows stale code or config that a normal reload doesn't fix:

- after changing `.env` — `EXPO_PUBLIC_*` variables are inlined into the bundle, so the old
  values stay cached;
- after changing `babel.config.js`, `metro.config.js` or `app.json`;
- after installing/removing packages or switching branches.

The first bundle after `-c` is slower; for everyday work plain `npx expo start` is enough.

## Database migrations

Schema changes (tables, columns, RLS policies, `GRANT`/`REVOKE`) live as SQL files in
`supabase/migrations/`, applied in timestamp order. A change made only in Studio exists only
in the local Docker database: it is not in git, never reaches the cloud, and disappears after
`npx supabase db reset` (which rebuilds the local DB from the migration files). Always capture
it in a migration.

There are two ways to create one.

### `npx supabase migration new <name>`

Creates an empty file `supabase/migrations/<timestamp>_<name>.sql` that you fill with SQL by
hand. Best when you know the SQL up front: the file stays short and shows the intent.

```bash
npx supabase migration new restrict_profile_updates
# write SQL into supabase/migrations/<timestamp>_restrict_profile_updates.sql, then:
npx supabase migration up
```

### `npx supabase migration up`

Applies the local migrations that the local database hasn't run yet. Data is kept, unlike
`db reset`. Run it after `migration new` (or after pulling someone else's migrations).

### `npx supabase db diff -f <name>`

Use it when you changed the schema in Studio first (Table Editor, Policies, SQL Editor). It
spins up a temporary shadow database, applies all migrations to it, compares that with your
local database, and writes the difference to `supabase/migrations/<timestamp>_<name>.sql`.
The local DB already has the change, but `db diff -f` does **not** record the new file as
applied. Mark it right away with `migration repair` (below), otherwise the next
`migration up` tries to run it again and fails.

```bash
npx supabase db diff --schema public            # preview only, no file written
npx supabase db diff -f restrict_profile_updates
npx supabase migration repair --local --status applied 20261020142057   # its timestamp
```

`db diff` sees only schema (tables, policies, grants, functions). Rows such as bucket limits in
`storage.buckets` are data, so write those migrations by hand with `migration new`.

Review the generated file before committing:

- it contains **everything** that differs between the DB and the migrations, including
  accidental Studio edits;
- it can be more verbose than hand-written SQL. For example, two lines of
  `REVOKE UPDATE` / `GRANT UPDATE (cols)` come out as `REVOKE ALL` plus one grant per column.
  The result is the same; you can replace the body with the shorter SQL.

### `npx supabase migration list --local`

Shows which migration files the local database has recorded as applied. The CLI decides what
to run from the table `supabase_migrations.schema_migrations`, not from the actual schema.
Without `--local`, it compares local files with the linked cloud project.

```bash
npx supabase migration list --local
# "local" = file in supabase/migrations/, "remote" = recorded in the local DB.
# A version with an empty "remote" column will be run by the next `migration up`.
```

### `npx supabase migration repair --local --status applied <version...>`

Edits only the migration history: it marks versions as applied (or `--status reverted` to
unmark) **without running their SQL**. Use it when the change is already in the database
(made in Studio, then captured with `db diff -f`) but the history doesn't know.

Symptom: `migration up` fails on something that already exists, for example:

```
Applying migration 20261015101310_add_stripe_field.sql...
ERROR: column "stripe_customer_id" of relation "profiles" already exists (SQLSTATE 42701)
```

Fix:

```bash
# 1. find versions missing from the history
npx supabase migration list --local
# 2. check in the DB that their changes really are there, then mark only those
npx supabase migration repair --local --status applied 20261015101310 20261018101918
# 3. run the rest
npx supabase migration up
```

Never mark a migration whose changes are **not** in the database: it would be skipped forever
locally. `--linked` does the same for the cloud project's history.

`npx supabase db reset` also fixes the history (it rebuilds the local DB from all migrations),
but it wipes local data: users, orders, storage objects.

### Running SQL against the local database

- **Studio SQL Editor**: http://127.0.0.1:54323/project/default/sql/new. Runs as `postgres`
  (superuser), so it can change privileges. Table Editor and Policies can't: Policies covers
  only RLS (which rows), not column privileges (which columns).
- **Terminal, without installing `psql`**: run it inside the DB container:

```bash
docker exec supabase_db_FoodOrdering psql -U postgres -c "select 1"
```

Example: which `profiles` columns client roles may `UPDATE`:

```sql
select grantee, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and privilege_type = 'UPDATE' and grantee in ('anon', 'authenticated')
order by grantee, column_name;
```

## Cloud Supabase project

Replace `<project-ref>` below with your project's ref — the subdomain of
`https://<project-ref>.supabase.co`, also shown in the Supabase Dashboard → Project Settings →
General. Run `npx supabase login` once before the
commands below.

### `npx supabase link --project-ref <project-ref>`

Links this local folder to the cloud project. The CLI stores the ref in `supabase/.temp/`, so
later commands (`functions deploy`, `secrets set`, `db push`, `gen types --linked`) know which
project to target without `--project-ref`. It may ask for the database password (from the
Supabase Dashboard → Project Settings → Database).

Run it once per machine/clone, or again to switch to a different project. It doesn't change the
local Docker stack.

### `npx supabase functions deploy payment-sheet`

Uploads `payment-sheet` to the **cloud project**, so the app built with EAS (or pointed at the
cloud URL) can create Stripe payments. Local `supabase start` / `functions:serve` never touch
the cloud — without a deploy, the cloud keeps running the old code (or has no function at all).

What it does:

- bundles `supabase/functions/payment-sheet/index.ts` plus the shared `_utils/` and the
  import map `payment-sheet/deno.json`, using the settings from `[functions.payment-sheet]` in
  `supabase/config.toml` (e.g. `verify_jwt = false`);
- publishes it at `https://<project-ref>.supabase.co/functions/v1/payment-sheet`. The
  app calls it via `supabase.functions.invoke('payment-sheet', { body })`; the function prices
  the cart, creates a Stripe Customer (or reuses the saved one), a CustomerSession and a
  PaymentIntent and returns the secrets the Payment Sheet needs.

Before the first deploy, run `link` (above) and set the secrets in the cloud —
`supabase/functions/.env` is used only locally (full list in [Secrets](#secrets)):

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_PUBLISHABLE_KEY=pk_...
```

Redeploy after every change to the function or `_utils/`. The other functions deploy the same
way, several at once:

```bash
npx supabase functions deploy payment-sheet create-order stripe-webhook update-order-status
```

`npx supabase functions deploy` with no name deploys every function in `supabase/functions/`.

### Stripe webhook endpoint (cloud)

Once per Stripe environment (sandbox and live each need their own):

1. Stripe Dashboard → **Workbench → Webhooks** →
   **Add destination** (direct link: `https://dashboard.stripe.com/<account-id>/test/workbench/webhooks`).
2. Events from **Your account**, payload style **Snapshot** (the function reads the full
   PaymentIntent from the event; **Thin** events won't work), API version = the one of the
   `stripe` SDK in `deno.json`, event `payment_intent.succeeded`.
3. Destination type **Webhook endpoint**, URL
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`.
4. Copy the destination's **Signing secret**. It's not the one from `stripe listen`.
5. Set the secret **before** deploying, since the function fails on boot without it:

   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   npx supabase functions deploy stripe-webhook
   ```

6. **Send test events** → `payment_intent.succeeded` → expect
   `200 {"received":true,"ignored":"no cart metadata"}`. Real deliveries are listed under
   **Event deliveries**; a non-2xx response is retried by Stripe for up to 3 days.

### Deploy order

When a migration takes away something the **running** code still uses, deploy the code first:

1. `npx supabase secrets set ...` for any new secret;
2. `npx supabase functions deploy <changed functions>`;
3. release the app version that uses them (old builds may stop working at step 4);
4. `npx supabase db push`.

Examples from this project:

- `orders_server_side_insert_only` removes client inserts into `orders`. Deploy `payment-sheet`
  and `create-order` first, otherwise users pay but no order is saved.
- `orders_status_via_function` removes the admin's direct `UPDATE` on `orders` and access to
  other profiles. Deploy `update-order-status` first, otherwise the admin can't change statuses.
- `restrict_profile_updates` removes the client's right to write `stripe_customer_id`. Deploy the
  `payment-sheet` that writes it with `supabaseAdmin` first.

When a migration only **adds** something (a column, a table), push it before the code that
uses it.

### `npx supabase db push`

Applies to the **cloud database** the migrations from `supabase/migrations/` that it hasn't
run yet (the cloud tracks applied ones in `supabase_migrations.schema_migrations`). Uses the
project from `link`.

Preview first, since nothing gets applied in this mode:

```bash
npx supabase db push --dry-run
# Would push these migrations:
#  • 20261020142057_restrict_profile_updates.sql
npx supabase db push
```

If a pending migration takes away something the running code uses, deploy the code first. See
[Deploy order](#deploy-order).

After a push, regenerate types (below) if the schema changed.

### `npx supabase gen types typescript --project-id <project-ref> > src/database.types.ts`

Reads the schema of the **cloud** database (tables, views, enums, functions) and writes
matching TypeScript types to `src/database.types.ts`. The app uses them in
`src/lib/supabase.ts` (`createClient<Database>`) and `src/types.ts`, so queries like
`supabase.from('orders').select()` get typed rows and autocomplete.

Run it after every schema change (new table/column, e.g. `expo_push_token`) once the change is
applied to the cloud database. The file is fully overwritten — never edit it by hand.

To generate from the local Docker database instead (before pushing migrations):

```bash
npx supabase gen types typescript --local > src/database.types.ts
```
