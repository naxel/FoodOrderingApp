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
