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

The local publishable key is printed by `npx supabase status`.

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/payment-sheet \
  -H 'apikey: <PUBLISHABLE_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"amount":1000}'
```

From the app, `supabase.functions.invoke('payment-sheet', { body })` adds the key itself.

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
  app calls it via `supabase.functions.invoke('payment-sheet', { body })`; the function creates
  a Stripe Customer (or reuses the saved one), a CustomerSession and a PaymentIntent and
  returns the secrets the Payment Sheet needs.

Before the first deploy, run `link` (above) and set the secrets in the cloud —
`supabase/functions/.env` is used only locally:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_PUBLISHABLE_KEY=pk_...
```

Redeploy after every change to the function or `_utils/`.

`npx supabase functions deploy` with no name deploys every function in `supabase/functions/`.

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

**Deploy functions before pushing a migration they depend on.** If a migration removes a
privilege that the live function still uses, the function breaks the moment the migration
lands. Example: after `restrict_profile_updates`, only `supabaseAdmin` may write
`stripe_customer_id`, so the fixed `payment-sheet` has to be deployed first:

```bash
npx supabase functions deploy payment-sheet
npx supabase db push
```

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
