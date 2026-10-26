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

Open http://localhost:3000.

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
