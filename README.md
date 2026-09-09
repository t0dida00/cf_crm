# CRM Restaurant — Frontend

Next.js 15 (App Router) frontend for a restaurant/cafe ordering and
management platform: a staff/admin app for running the floor, and a
guest-facing ordering app reached by scanning a table's QR code. Talks to
the `CRM_backend` Express + Prisma API.

Stack: **Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · NextAuth v5
(credentials) · Pusher Channels** (real-time) · Phosphor Icons.

## Install

```bash
npm install
cp .env.development.local.example .env.development.local
# fill in AUTH_SECRET, API_URL, NEXT_PUBLIC_PUSHER_KEY/CLUSTER — see Environment below
npm run dev   # next dev -p 3001
```

Requires `CRM_backend` running (default `http://localhost:3000`) and its
database seeded (`npm run prisma:seed` in that repo) — sign in with
`admin@example.com` / `password123` unless you've changed it.

## Environment

Next.js auto-selects the env file by mode, so **don't use `.env.local`** —
it would apply to both dev and a production build ambiguously. Use instead:

- **`.env.development.local`** — loaded by `npm run dev`
- **`.env.production.local`** — loaded by `npm run build` / `npm start`

Both gitignored; `.env.development.local.example` /
`.env.production.local.example` are the committed templates.

| Var | Purpose |
|---|---|
| `AUTH_SECRET` | NextAuth session encryption — `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google sign-in provider (currently a demo stub in `auth.ts`, not wired to real OAuth) |
| `API_URL` | Backend origin, used **server-side only** (the `/api/proxy*` routes attach the JWT and forward here — the browser never talks to the backend directly for authenticated staff calls) |
| `NEXT_PUBLIC_API_URL` | Backend origin, used **client-side** — currently only for building direct URLs where a server-side proxy isn't in the path |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Public Pusher app key/cluster for the real-time subscription (see Real-time below) — same values as the backend's `PUSHER_KEY`/`PUSHER_CLUSTER`, safe to expose client-side (unlike `PUSHER_SECRET`, which stays backend-only) |

**Vercel deployment** (`cf-crm` project) reads none of these files — set the
same variables in the Vercel dashboard (Settings → Environment Variables).
Same gotcha as the backend: a newly-added var sometimes needs a remove +
re-add + redeploy cycle before it actually reaches the running function.

## Routing

| Route | Who | What |
|---|---|---|
| `/login` | anyone | credentials sign-in |
| `/` | signed-in, no platform yet | workspace setup form → build animation → `/admin` |
| `/admin` | signed-in staff (owner) | full admin panel: Dashboard, Tables, Categories, Menu, Orders, Bookings, Settings |
| `/staff` | signed-in staff | day-to-day floor app: Orders, Tables, Bookings, Menu, History |
| `/qr-generation` | signed-in staff | generates one QR code per table, linking to `/client?t=<signed token>` |
| `/client` | guest (no session) **or** signed-in staff previewing | the ordering app for one table — see below |

`middleware.ts` gates everything except `/login` and `/client` behind a
session (redirects to `/login` with a `callbackUrl`).

### `/client`'s three entry paths

`app/client/page.tsx` branches on how it was reached:

1. **`?t=<token>`** — a QR scan. `TokenClientPage` resolves the signed
   token via `GET /tokens/:token` (through `/api/token-resolve`) to a
   `platformId` + `tableName`, then renders as a guest.
2. **`?platform=&table=`** — a direct guest link with no token (e.g. for
   testing). Same guest rendering, skips the resolve step.
3. **No query params, but a staff session exists** — `SessionClientPage`
   renders using the signed-in staff member's own workspace data instead of
   the public API, so staff can preview the ordering experience without a
   QR code.

Guest paths (1 and 2) never see `workspace-provider.tsx`'s data — they use
`client-workspace-provider.tsx`, which only ever calls the **public**,
unauthenticated backend endpoints (`/platforms/:platformId/...`).

## API access patterns

Three different ways this app reaches the backend, by trust level:

- **`lib/api.ts` (`apiFetch`)** — staff calls. Goes through
  `app/api/proxy/[...path]/route.ts`, a Next.js route handler that reads the
  session server-side, attaches `Authorization: Bearer <token>`, and
  forwards to `API_URL`. The browser never holds or sends the JWT itself
  for these calls.
- **`lib/public-api.ts` (`publicApiFetch`)** — guest calls. Goes through
  `app/api/proxy-public/[platformId]/[...path]/route.ts`, which forwards to
  the backend's public endpoints. No auth involved either side.
- **`hooks/use-platform-socket.ts`** — real-time. This one talks to Pusher
  directly from the browser (not through any Next.js API route), since it's
  a client-side subscription, not a REST call.

## Real-time

`usePlatformSocket(platformId)` subscribes to a public Pusher channel
(`platform-{platformId}`) and returns the channel for `.bind(event,
handler)` calls. Three consumers:

- `hooks/use-new-order-notifications.ts` — staff shells toast + refresh on
  `order:created` / `order:updated` (only toasts on updates that changed the
  order's total, so a plain status advance doesn't spam a "new order" toast)
- `hooks/use-table-request-notifications.ts` — staff shells toast on
  `table_request:created` (guest hit "call staff" / "checkout")
- `app/client/page.tsx` (guest) — refetches this table's order history on
  `order:created` / `order:updated` / `table:checked_out`, so a staff-side
  checkout clears the guest's view live instead of needing a reload

No auth on the channel — a guest only ever knows their own `platformId`
anyway, and the same data is already readable through the public REST
endpoints with just that id.

## Structure

```
app/
  layout.tsx                Nunito Sans font, WorkspaceProvider, page <title>
  page.tsx                  setup form -> build animation -> /admin
  login/page.tsx             credentials sign-in
  admin/page.tsx             AdminShell, gated on hydrated workspace
  staff/page.tsx              StaffShell, same gating
  qr-generation/page.tsx      per-table QR codes, defaults the guest link's
                             host to the current request's own host
  client/page.tsx             guest ordering app, see routing table above
  api/
    proxy/[...path]/          staff API proxy (attaches JWT)
    proxy-public/[platformId]/[...path]/   guest API proxy (no auth)
    auth/[...nextauth]/       NextAuth handler
    token-resolve/[token]/    resolves a QR token before proxying to the backend
  actions.ts                 server actions: signOutAction, createPlatformAction
auth.ts                      NextAuth config: credentials provider calls
                            POST /auth/login on the backend, stores its JWT
                            as session.accessToken
middleware.ts                 session gate (redirects to /login)
components/
  workspace-provider.tsx     staff-side data store: fetches everything on
                            mount from the backend, exposes CRUD actions
                            that call apiFetch and patch local state
  client-workspace-provider.tsx   guest-side equivalent, public endpoints only
  admin-shell.tsx / staff-shell.tsx   sidebar + header + panel switch,
                            collapsible sidebar (useSidebarCollapse,
                            persisted via localStorage)
  client-shell.tsx            the guest ordering UI itself
  setup-screen.tsx / building-screen.tsx   first-time workspace setup flow
  order-detail-dialog.tsx    line items + net/tax breakdown for one order
  qr-generation-view.tsx      QR code grid + downloadable SVGs
  panels/                     one file per admin/staff tab
    staff/                    staff-specific panel variants (simpler than admin's)
hooks/
  use-platform-socket.ts      Pusher subscription
  use-new-order-notifications.ts / use-table-request-notifications.ts
  use-sidebar-collapse.ts      localStorage-persisted sidebar state
lib/
  types.ts                    Workspace, Order, Dish, Booking, Settings…
  api.ts / public-api.ts      fetch wrappers for the two proxy routes
  platform-api.ts             server-side-only platform fetch/create (used
                             by layout.tsx and actions.ts, needs a raw JWT)
  lexicon.ts                  per-domain (restaurant/cafe) copy and flow steps
  range.ts                    date formatting, currency formatting
  order-math.ts               shared line-total math
  tone.ts                     status/state -> badge color mapping
  utils.ts                    cn()
```

## Data model notes

- `Workspace` (staff-side state) carries the platform's `id`, `name`,
  `domain`, contact fields, and every operational collection (tables,
  categories, dishes, orders, bookings, settings) fetched fresh from the
  backend on mount — nothing is persisted to `localStorage` except UI-only
  preferences like sidebar-collapsed state.
- Every `Order` carries its own `taxRate`, snapshotted by the backend at
  creation time — the frontend always uses `order.taxRate` for a past
  order's breakdown, never the platform's *current* tax rate from Settings,
  so a later rate change can't retroactively alter how a closed order
  displays.
- Placing an order always creates a **new** order row (no merging into a
  prior open one at the same table) — a table's "Orders" list can show
  several open orders if it's ordered more than once before checkout.
- Guest order history (`tableOrders` in `client-workspace-provider.tsx`) is
  scoped to still-open orders only (`closed_ts: null` on the backend) — a
  newly-seated guest never sees a previous party's order history at the
  same table, and a staff-side checkout clears it from the guest's view.

## Deployment

Deployed to Vercel (`cf-crm` project). A couple of things that only bite in
production, not local dev:

- **QR codes**: `app/qr-generation/page.tsx` defaults the guest-facing
  address to the current request's own `host` header when it isn't
  `localhost` — `os.networkInterfaces()`-based LAN detection is local-dev
  only (on Vercel it returns a useless ephemeral container address).
- **No WebSocket server**: real-time uses Pusher specifically because
  Vercel's serverless functions can't hold a persistent connection open —
  see the backend README's Real-time section for why this isn't Socket.IO.
