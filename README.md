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
