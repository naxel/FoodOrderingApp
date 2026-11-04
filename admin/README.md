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
npx supabase gen types typescript --local > src/database.types.ts
npx prettier --write admin/lib/database.types.ts src/database.types.ts
```

`gen types` writes unformatted output, so run Prettier after it or `prettier --check` fails.

## Decisions

### A separate Next.js app in `admin/`, not inside the Expo app

The Expo app already has an admin section on mobile. The web admin is a separate Next.js app so that it can use server rendering, Server Actions and a server-side Supabase session, which Expo Router web does not give. It lives in `admin/` with its own `package.json` for now; the plan is to move both apps into a Turborepo (`apps/mobile`, `apps/admin`, `packages/core` with the shared Supabase types and order statuses).

The root `tsconfig.json`, `eslint.config.js` and `.prettierignore` exclude `admin/` so the Expo tooling does not check Next.js files.

### The admin reuses the mobile app's database rules

The admin uses the schema, RLS policies and Edge Functions that already protect the mobile app. The only schema change made for it so far is product archiving (below).

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

### Products are archived, not deleted

`order_items.product_id` was `ON DELETE CASCADE`, so deleting a product silently removed it from every past order. Migration `20261029104023_products_soft_delete.sql`:

- adds `products.archived_at`; "Delete" in both apps sets it instead of deleting the row;
- changes the foreign key to `ON DELETE RESTRICT`, so a hard delete of a product with orders fails with `23503` instead of rewriting order history;
- adds a Storage DELETE policy for admins on `product-images` (without one, `remove()` matches nothing and returns an empty list), needed to replace a product photo.

RLS on `products` SELECT is unchanged: order history still shows archived products by id. The menu queries (admin list, mobile list) filter `archived_at is null`, and `priceCart` in the Edge Functions does too, so a cart that still holds an archived product is rejected with `Unknown product` before payment.

The archive action follows `updateProduct`: `.select('id')` and an empty result means "not found or access denied".

### Row actions: one client component for the menu and the dialog

`components/product-row-actions.tsx` renders the row's `DropdownMenu` and the confirm `AlertDialog` side by side, and the page passes it `{ id, name }`. A dialog inside `DropdownMenuContent` unmounts when the menu closes on select, so the menu item only sets `open`, and the dialog has no `Trigger`. Because of that, Radix never reports `onOpenChange(true)`, so the error message is reset in the item's `onSelect`. "Continue" calls `preventDefault()` to keep the dialog open while the action runs in `useTransition`; the dialog cannot be closed while it is pending. The open state is reset in a `useLayoutEffect` cleanup for the same `<Activity>` reason as the form.

### Product photos: uploaded by the Server Action, 4 MB cap

The form sends a `FormData` (name, price, optional file) to the action. `FormData` is a documented Server Function argument type and carries the file as binary multipart; the form builds it from the values react-hook-form already validated, not from the DOM.

- `lib/schemas/product.ts` validates the file with zod's `z.file()` (PNG, JPEG or WebP, at most 4 MB), so the client and the action share one rule. The bucket checks type and size again.
- The cap is 4 MB, not the bucket's 5 MB, because a Vercel Function accepts a request body of at most 4.5 MB. `experimental.serverActions.bodySizeLimit` is `'4.5mb'` (the default is 1 MB, and the limit counts the multipart overhead too).
- Files are stored as `<uuid>.<ext>`, with the extension taken from the MIME type, never from the file name. A new photo always gets a new path, so no Storage UPDATE policy is needed and no CDN cache can serve the old picture.
- `updateProduct` reads the old path first, uploads the new file, updates the row, and only after a successful update removes the old file. If the insert or update fails, the file it just uploaded is removed. A failed cleanup only logs: the worst case is an orphaned file, never a product pointing at a missing one.
- The type check trusts the `Content-Type` the browser sends; file contents are not inspected. Only admins can upload (Storage INSERT policy), so this is accepted.

The alternative was uploading from the browser straight to Storage, as the mobile app does. That avoids the body limit, but it splits validation between client and bucket and leaves orphaned files when the form is abandoned after the upload.

In the form, the file input is uncontrolled. `form.reset()` does not clear it: `Controller` passes a proxy object as the field ref, so react-hook-form's native `<form>.reset()` path never runs. The form clears the input through its own ref in the same `useLayoutEffect` cleanup. The preview URL is created in the `onChange` handler and revoked in an effect cleanup.

### Pages: a sync page and an async child under `<Suspense>`

`(admin)/loading.tsx` covers the first load, but not client navigation inside the mounted `(admin)` layout, and Next.js warns that such a navigation is not instant. So every data page is a synchronous component that renders the heading (and static links) and passes `params` / `searchParams` unawaited to an async child inside `<Suspense fallback={<ListSkeleton />}>`. The child awaits them, queries Supabase and renders the data. The child's props are typed as `PageProps<'/orders/[id]'>['params']`.

`notFound()` called inside that boundary renders the 404 page, but the HTTP status stays 200, for the same streaming reason as `forbidden()`.

### Orders list: the status filter is a link, not client state

`/orders?status=Cooking` filters on the server. The filter buttons are `<Link>`s styled as buttons (`aria-current` on the active one), so the page stays a Server Component, a filtered list has its own URL, and Back works.

`orders.status` is a `text` column with no CHECK constraint, so the value from the URL and the value from the row are both checked with `isOrderStatus()` from `lib/orders.ts`. An unknown `?status=` shows all orders instead of an empty list, and `OrderStatusBadge` renders an unknown row status as plain text instead of crashing on the badge variant lookup.

Dates are formatted with `timeZone: 'Europe/Kyiv'` in `lib/format.ts`. Without it, the server's time zone is used, which is UTC on Vercel.

### Order page: line prices are current prices

`/orders/[id]` loads the order with `order_items(..., products(...))` in one query. `order_items` has no price column, so the line prices are today's product prices, and the page says so. The total is `orders.total`, which the Edge Functions take from the Stripe PaymentIntent's `amount_received` when they create the order. Today these match because no price has changed since; once one does, the lines and the total will differ.

`order_items.product_id` is not nullable, and products are archived rather than deleted, so `products` is always present and an archived product still shows in its old orders.

### Order status: a Server Action that calls the Edge Function

The status `Select` on `/orders/[id]` calls the `updateOrderStatus` Server Action, which calls `update-order-status` with `functions.invoke`. The server Supabase client reads the session from cookies, so the function receives the admin's JWT and checks `is_admin` itself. The action validates the id and the status first anyway, because a Server Action is a public POST endpoint and its TypeScript parameter types are not checked at runtime.

- A non-2xx response from a function comes back as `FunctionsHttpError`, not as a thrown error. `lib/functions.ts` reads the function's own `{ error }` text from `error.context.json()`; the mobile app has the same helper.
- The action returns `{ error }` instead of throwing. In production Next.js replaces the message of an error thrown from a Server Action with a generic one, so "Forbidden" or "Order not found" would not reach the page.
- After success the action calls `refresh()` from `next/cache` (new in Next.js 16), which re-renders the current route on the client. `revalidatePath` is not needed because nothing is cached: every Supabase query runs at request time.
- The `Select` is controlled by `useOptimistic(status)`. It shows the new status while the action runs; if the action fails, the transition ends and React shows the server's status again without any manual rollback. On success the response says whether the customer was notified or has no push token.
- An order whose status is not one of the four known values shows the plain badge instead of the `Select`.

### Realtime: `router.refresh()` on every change to `orders`

`components/orders-realtime.tsx` is a client component that renders nothing. It subscribes to `postgres_changes` on `orders` (the table is already in the `supabase_realtime` publication) and calls `router.refresh()`, so the Server Components re-render with fresh data. The list listens to every order; the order page passes `filter: id=eq.<id>`.

- Realtime checks the SELECT policy of each subscriber before sending an event, using the JWT of the browser client's session. Admins can read every order, so they get every event; a customer would only get their own. The subscription needs no filter for security.
- With Cache Components a hidden page is kept in `<Activity>`, which runs effect cleanups. The hidden page unsubscribes (`removeChannel`) and subscribes again when shown.
- Each page uses its own channel name. The browser client is a singleton, and `channel(name)` returns an existing channel with that name if the previous page's `removeChannel` (async) has not finished yet.
- A new order is inserted before its `order_items`, in a separate statement with no transaction, so an `INSERT` event can arrive before the items exist. The list does not show items, so it is not affected.
- A status change made in the admin refreshes twice: once from the action, once from the Realtime event. That is harmless.

## Next step

Session 9: dashboard with orders per day, revenue and top products, aggregated on the server.
