# FoodOrdering Admin

Web admin panel for the FoodOrdering app: products, orders and order status, on top of the same Supabase project as the Expo app (same tables, RLS policies and Edge Functions).

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui on Radix UI, Supabase (`@supabase/ssr`).

## Running locally

Start the local Supabase from the repo root first (see the root [README](../README.md)), then:

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:3000. If port 3000 is taken, Next.js picks the next free one (3001, 3002, ...) and prints it in the terminal.

`admin/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # from `npx supabase status`
```

Database types, from the repo root:

```bash
npx supabase gen types typescript --local > admin/lib/database.types.ts
```

## Decisions

### A separate Next.js app in `admin/`, not inside the Expo app

The Expo app already has an admin section on mobile. The web admin is a separate Next.js app so that it can use server rendering, Server Actions and a server-side Supabase session, which Expo Router web does not give. It lives in `admin/` with its own `package.json` for now; the plan is to move both apps into a Turborepo (`apps/mobile`, `apps/admin`, `packages/core` with the shared Supabase types and order statuses).

The root `tsconfig.json`, `eslint.config.js` and `.prettierignore` exclude `admin/` so the Expo tooling does not check Next.js files.

### The database is not changed for the admin

The admin uses the schema, RLS policies and Edge Functions that already protect the mobile app:

- Admin access is checked on the server with `rpc('is_admin')` (`profiles.group = 'ADMIN'`). The route guard in `proxy.ts` only redirects; the security boundary is RLS.
- Order status is changed by calling the `update-order-status` Edge Function with the admin's session, not by updating `orders` directly. There is no UPDATE policy on `orders`, and the function also sends the push notification to the customer.
- Admins cannot read other users' profiles, so the orders list shows the user id, not a name.

### Next.js 16 rather than the course's 14

The admin follows the Next.js part of a freeCodeCamp course built on Next.js 14.2, but uses the current version. Differences met so far:

- `middleware.ts` is `proxy.ts` in Next.js 16.
- `cookies()`, `headers()`, `params` and `searchParams` are async.
- `fetch` and GET Route Handlers are not cached by default.
- `useFormState` is `useActionState` (React 19).

### shadcn/ui on Radix UI, not Base UI

Since July 2026 `shadcn init` asks for a component library first and recommends Base UI; the other options are React Aria and Radix UI. Radix UI was chosen because:

- The course code and most shadcn examples are written against Radix (`asChild`, `Popover.Content`, `Select` with non-null values). Base UI uses a different API (`render` instead of `asChild`, `Positioner`/`Popup` parts, nullable `Select` values), so every component would need translating while learning Next.js.
- Job postings for React roles still name Radix UI, not Base UI.
- Radix is not deprecated: shadcn ships every component for both libraries. The component code lives in this repo (`components/ui/`), so moving to Base UI later is a contained change.

### Preset: Nova

Nova (Lucide icons, Geist font) is the default shadcn preset and the closest to what the course uses. Presets only change the look (fonts, radius, icons), not the component code.

### Tailwind CSS 4

Comes with `create-next-app`. The theme is configured in `app/globals.css` (`@theme`, CSS variables), so there is no `tailwind.config.js`; `components.json` has `"config": ""`.

### `cn` from the `cn` package

shadcn 4 generates `lib/utils.ts` as `export { cn } from "cn"`. `cn` is shadcn's own package (maintainer `shadcn`, repo `shadcn-ui/cn`, no install scripts) that replaces `clsx` + `tailwind-merge`. Checked before keeping it.

### No `src/` directory

`app/`, `components/` and `lib/` sit at the top of `admin/`, which is what shadcn and the course expect. The `@/*` alias points at `admin/`.

### 403 with `forbidden()`, not a redirect

`app/(admin)/layout.tsx` checks `rpc('is_admin')` and calls `forbidden()` for non-admins, which renders `app/forbidden.tsx` (with a Log Out button, since the proxy keeps a signed-in user away from `/login`). `forbidden()` is still experimental and needs `experimental.authInterrupts` in `next.config.ts`.

The check runs inside `<Suspense>` because `cacheComponents` is on and reading cookies outside a Suspense boundary blocks the route. The response is already streaming when `forbidden()` runs, so the HTTP status stays 200 while the page shows 403. The layout is not a security boundary either: Server Actions and Route Handlers are called directly, so data stays protected by RLS.

### Layout: shadcn Sidebar, `next-themes`, one `getClaims` per request

The `(admin)` layout renders the shadcn `Sidebar` (collapses to icons, a sheet on mobile that closes on navigation), a header with the user's email, theme toggle and Log Out. Dark mode follows the shadcn guide: `next-themes` with `attribute="class"` and `suppressHydrationWarning` on `<html>`. `lib/auth.ts` wraps `getClaims()` in React `cache()`, so the layout and pages share one result per request.

`hooks/use-mobile.ts` is rewritten with `useSyncExternalStore`: the generated version calls `setState` inside an effect, which `react-hooks/set-state-in-effect` rejects. Re-running `shadcn add sidebar` overwrites it, so redo the change after that.

`--font-sans` in `app/globals.css` points at `--font-geist-sans`, the variable `next/font` sets in `app/layout.tsx`. The shadcn preset generated a self-reference, which made the browser fall back to a serif font.

### Products list: public Storage URLs through `next/image`

`products.image` holds a path in the public `product-images` bucket, so the page builds the URL with `getPublicUrl()` (no network call) instead of downloading the file like the mobile app does. `next.config.ts` allows that path in `images.remotePatterns`, built from `NEXT_PUBLIC_SUPABASE_URL` so the cloud host works after deploy. Next.js 16 refuses to optimize images from private IPs (SSRF protection), and local Supabase is on `127.0.0.1`, so `dangerouslyAllowLocalIP` is on in development only. Optimized images are cached in `.next`, so the check fires only on a cache miss.

Queries use `.throwOnError()`. Without it supabase-js returns a plain object typed as `PostgrestError`, and throwing that shows `{code: …, message: …}` in `error.tsx` instead of the message.

### `connection()` in the server Supabase client

With `cacheComponents` and `partialPrefetching`, Next.js prerenders an App Shell that may read cookies but not `Date.now()`. `createServerClient` reads the clock while it loads the session, so `lib/supabase/server.ts` calls `await connection()` first: everything that talks to Supabase renders at request time, and the shell keeps the sidebar and `loading.tsx`.

### Product form: react-hook-form on the client, the same zod schema on the server

`lib/schemas/product.ts` is shared. `components/product-form.tsx` validates with `zodResolver` and calls a Server Action with the parsed object; the action runs `safeParse` again, because a Server Action is a public POST endpoint. The page passes `submitLabel` and `onSave` explicitly (`updateProduct.bind(null, id)` for edit), so the form does not guess its mode from the data.

With Cache Components, Next.js hides visited pages with React `<Activity>` instead of unmounting them, so a form keeps its values after navigation. The form resets itself in a `useLayoutEffect` cleanup, which runs when the page is hidden.

RLS rejects a forbidden `insert` with an error, but a forbidden `update` or `delete` just matches zero rows and succeeds. `updateProduct` asks for the row back with `.select('id')` and treats an empty result as "not found or access denied".

## Next step

Session 6b: product image upload to Storage and product delete (course 5:24-6:40).
