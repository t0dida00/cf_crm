# CRM Restaurant — Frontend

Next.js 15 (App Router) frontend for a restaurant/cafe ordering and
management platform: a staff/admin app for running the floor, and a
guest-facing ordering app reached by scanning a table's QR code. Talks to
the `CRM_backend` Express + Prisma API.

Stack: **Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui · NextAuth v5
(credentials) · Pusher Channels** (real-time) · Phosphor Icons.

## Running locally

There are two ways to run the frontend: with Docker (easiest, no Node.js
needed) or directly with Node. Either way it serves on
**http://localhost:3001** and needs the API running first: start
[`crm_backend`](https://github.com/t0dida00/crm_backend) (its README's
"Running locally", port 3000).

Once both are up, sign in with the backend's seeded login:
**`admin@example.com` / `password123`**.

### Option A — Docker Compose

Requires Docker (Docker Desktop on macOS/Windows).

```bash
git clone https://github.com/t0dida00/cf_crm.git
cd cf_crm

cp .env.production.local.example .env.production.local   # then fill it in (see below)

docker compose --env-file .env.production.local up -d --build   # builds and starts the app (port 3001)

curl -I http://localhost:3001/login   # → HTTP/1.1 200 OK
```

What goes in `.env.production.local` (gitignored, so every developer makes
their own; real keys are shared privately, never committed):

| Var | Value |
|---|---|
| `AUTH_SECRET` | Generate your own: `openssl rand -base64 32` |
| `API_URL` | `http://host.docker.internal:3000` for a backend on your machine (not `localhost`, which inside the container is the container itself), or the team's backend URL |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | The shared Pusher app's public key/cluster; ask the team |
| `RESEND_API_KEY` | Optional; only the contact form and signup emails need it |

Useful commands:

```bash
docker compose logs -f              # follow the app's logs
docker compose down                 # stop
docker compose --env-file .env.production.local up -d --build   # rebuild after pulling code or changing Pusher vars
API_URL=http://host.docker.internal:3000 docker compose --env-file .env.production.local up -d
                                    # override the backend for one run
```

`NEXT_PUBLIC_PUSHER_*` are baked into the image at build time (Next.js inlines
them into the browser bundle), so changing them needs `--build`. `AUTH_SECRET`,
`API_URL` and `RESEND_API_KEY` are read when the container starts. The image
(`Dockerfile`: Node 22 Alpine, Next.js `standalone` output, non-root) sets
`AUTH_TRUST_HOST=true`, which NextAuth needs outside Vercel;
`NEXT_OUTPUT=standalone` is set only inside it, so Vercel builds are unchanged.

To build and run just the image, without Compose:

```bash
docker build -t crm-frontend \
  --build-arg NEXT_PUBLIC_PUSHER_KEY=your-key \
  --build-arg NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster .
docker run -p 3001:3001 --env-file .env.production.local crm-frontend
```

### Option B — Node directly

Requires **Node.js 20+**.

```bash
git clone https://github.com/t0dida00/cf_crm.git
cd cf_crm

npm install
cp .env.development.local.example .env.development.local   # then fill in AUTH_SECRET, API_URL,
                                                            # NEXT_PUBLIC_PUSHER_KEY/CLUSTER (see Environment)
npm run dev                          # next dev -p 3001, reloads on change
```

Here `API_URL` is `http://localhost:3000` for a local backend. To try the
production build instead: `npm run build && npm start -- -p 3001` (reads
`.env.production.local`).

## Environment

Next.js auto-selects the env file by mode, so **don't use `.env.local`** —
it would apply to both dev and a production build ambiguously. Use instead:

- **`.env.development.local`** — loaded by `npm run dev`
- **`.env.production.local`** — loaded by `npm run build` / `npm start`

Both gitignored; `.env.development.local.example` /
`.env.production.local.example` are the committed templates.

| Var | Purpose |
|---|---|
| `AUTH_SECRET` | **Required.** Encrypts the NextAuth session cookie that holds the backend JWT (`openssl rand -base64 32`). Our code never reads it: NextAuth picks it up from the environment by name, and production sign-in fails (`MissingSecret`) without it. Changing it signs everyone out |
| `API_URL` | Backend origin, used **server-side only** (the `/api/proxy*` routes attach the JWT and forward here — the browser never talks to the backend directly for authenticated staff calls) |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | The **shared** Pusher app's public key/cluster (see Real-time below), used by businesses that haven't connected their own. Same values as the backend's `PUSHER_KEY`/`PUSHER_CLUSTER`, safe to expose client-side (unlike `PUSHER_SECRET`, which stays backend-only) |
| `RESEND_API_KEY` | Emails the admin (`ADMIN_EMAIL` in `lib/notify.ts`): the contact form on the landing and login pages (`app/api/contact`), and a "New Account Registration" notice (full name and email) for every signup. Only the admin is emailed, never the new user |

**Vercel deployment** (`cf-crm` project) reads none of these files — set the
same variables in the Vercel dashboard (Settings → Environment Variables).
Same gotcha as the backend: a newly-added var sometimes needs a remove +
re-add + redeploy cycle before it actually reaches the running function.

## Business connections

Each business can run on its own PostgreSQL database, Pusher app and image
storage (a Vercel Blob store or any S3-compatible bucket). The owner connects
all three together during onboarding (step 1, before the business details) or
in **Settings → Connections**. The
backend checks each one before saving, stores the secrets encrypted, and never
sends them back: the page shows only the database's `host/database`, the
Pusher app id and cluster, and the storage's store or bucket name. Connecting a
different database or storage later doesn't move existing data. See the
backend README for how it works.

Image uploads (`app/api/upload`) forward the file to the backend
(`POST /platforms/me/uploads`), which holds the storage credentials. Businesses
without their own storage use the shared Vercel Blob store, whose
`BLOB_READ_WRITE_TOKEN` is now set on the **backend**.

## Routing

| Route | Who | What |
|---|---|---|
| `/login` | anyone | email and password sign-in, choosing **Owner** or **Staff** first (remembered per browser). A wrong choice gets the same "Email or password is wrong" message as a wrong password. Owners land on `/admin`, staff on `/staff` |
| `/signup` | anyone | create an owner account and email the admin, then continue to `/`. When the backend has `REQUIRE_ACCOUNT_APPROVAL=true`, it shows "Dear <name>, your request is being reviewed…" with an OK button (to `/login`) instead, and sign-in is refused until the account is approved |
| `/terms`, `/privacy`, `/cookies` | anyone | terms of use, privacy policy and cookie policy (`components/marketing/LegalPage.tsx`). They describe what the code does (Auth.js cookies, browser-storage keys, Resend, Pusher, Vercel), so update them with any change to those, along with `LEGAL_UPDATED` |
| `/` | signed-in, no platform yet | step 1: connect the business's own database, Pusher app and image storage (only checked here, since the business doesn't exist yet; skippable while the backend allows the shared service) → step 2: business details, which creates the business, then saves the checked connections and uploads the logo to them → build animation → `/admin` |
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

Guest paths (1 and 2) never see `WorkspaceProvider.tsx`'s data — they use
`ClientWorkspaceProvider.tsx`, which only ever calls the **public**,
unauthenticated backend endpoints (`/platforms/:platformId/...`).

## API access patterns

Three different ways this app reaches the backend, by trust level:

- **`lib/api.ts` (`apiFetch`)** — staff calls. Goes through
  `app/api/proxy/[...path]/route.ts`, a Next.js route handler that reads the
  session server-side, attaches `Authorization: Bearer <token>`, and
  forwards to `API_URL`. The browser never holds or sends the JWT itself
  for these calls.
- **`lib/publicApi.ts` (`publicApiFetch`)** — guest calls. Goes through
  `app/api/proxy-public/[platformId]/[...path]/route.ts`, which forwards to
  the backend's public endpoints. No auth involved either side.
- **`hooks/usePlatformSocket.ts`** — real-time. This one talks to Pusher
  directly from the browser (not through any Next.js API route), since it's
  a client-side subscription, not a REST call.

## Real-time

`usePlatformSocket(platformId, pusher)` subscribes to a public Pusher channel
(`platform-{platformId}`) and returns the channel for `.bind(event,
handler)` calls. `pusher` is the business's own Pusher app (`{ key, cluster }`
from `GET /platforms/me` or the guest settings); without one it uses the
shared app from `NEXT_PUBLIC_PUSHER_*`. Three consumers:

- `hooks/useNewOrderNotifications.ts` — staff shells toast + refresh on
  `order:created` / `order:updated` (only toasts on updates that changed the
  order's total, so a plain status advance doesn't spam a "new order" toast)
- `hooks/useTableRequestNotifications.ts` — staff shells toast on
  `table_request:created` (guest hit "call staff" / "checkout")
- `app/client/page.tsx` (guest) — refetches this table's order history on
  `order:created` / `order:updated` / `table:checked_out`, so a staff-side
  checkout clears the guest's view live instead of needing a reload

No auth on the channel — a guest only ever knows their own `platformId`
anyway, and the same data is already readable through the public REST
endpoints with just that id.

## Structure

```
Dockerfile                   production image (standalone server, port 3001)
docker-compose.yml           builds and runs that image with .env.production.local
app/
  layout.tsx                Nunito Sans font, WorkspaceProvider, page <title>
  page.tsx                  setup form -> build animation -> /admin
  login/page.tsx             credentials sign-in (the form as a ticket on
                             the pass rail, plus the demo account)
  terms/ privacy/ cookies/   legal pages, on LegalPage
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
    upload/                   forwards an image to POST /platforms/me/uploads
                             (the generic proxy only carries JSON)
  actions.ts                 server actions: signOutAction, createPlatformAction
auth.ts                      NextAuth config: credentials provider calls
                            POST /auth/login on the backend, stores its JWT
                            as session.accessToken
middleware.ts                 session gate (redirects to /login)
components/                   one folder per part of the UI; one PascalCase
                              file per component (tests sit beside them)
  ui/                         shadcn primitives: Button, Input, Select, Dialog…
  common/                     shared building blocks: DataTable, DishImage,
                              FieldError, ImageDropzone (uploads, or hands the
                              file over with onFile before the business exists),
                              PaginationBar, RequestState, RequiredLabel,
                              ContactForm
  providers/                  WorkspaceProvider (staff-side data: loads the
                              workspace, CRUD actions, applies real-time
                              events), ClientWorkspaceProvider (guest side,
                              public endpoints only), QueryProvider
  layout/                     AppShell (the shared frame: collapsible
                              sidebar / mobile drawer, header, footer) and
                              useShellTab (?tab= handling); AdminShell /
                              StaffShell only add their tabs and panels;
                              MobileNavDrawer, SidebarClock
  auth/                       LoginCard (Owner / Staff choice), SignupCard,
                              SignupSteps (setup order beside the form),
                              LoginSubmitButton
  onboarding/                 WorkspaceSetupFlow (step 1 connections, checked
                              not saved → step 2 details, which creates the
                              business, saves them and uploads the logo →
                              building); ConnectionsStep, SetupScreen,
                              BuildingScreen; ConnectionsForm (database +
                              Pusher + storage, shared with Settings)
  marketing/                  LandingPage, InstructionPage; MarketingTheme
                              (the kitchen-pass tokens, Nunito Sans, header and
                              footer with Product / Contact / Legal links,
                              also used by /login and /signup); LegalPage; typeScale
                              (DISPLAY headline class); TicketRail (landing
                              hero, PassRail and TicketClip reused by /login
                              and /signup)
  client/                     ClientShell: the guest ordering UI
  orders/                     BillReceipt (the bill on screen, its printable
                              copy and PrintReceiptButton), SessionDetailDialog
  bookings/                   BookingsPanel (admin tab, reused by staff with
                              allowTableAssign), BookingAssignDialog
  admin/                      one panel per admin tab (Dashboard, Tables,
                              Categories, Menu, Orders, Staff, Settings,
                              Connections, QR codes), TakingsChart,
                              BestSellers (dashboard bars), StaffSeats
                              (accounts used of the plan's limit),
                              TableTile (a table drawn with its chairs on
                              the Tables floor plan), TableTentCard (the
                              printable QR card, one SVG) and ReceiptPreview
                              (Settings' live sample bill)
  staff/                      staff-specific panel variants (simpler than
                              admin's) and TableRequestsModal
hooks/
  usePlatformSocket.ts      Pusher subscription
  useConnections.ts          the owner's connections: load, check, save
  useNewOrderNotifications.ts / useTableRequestNotifications.ts
  useSidebarCollapse.ts      localStorage-persisted sidebar state
  useNow.ts                  the current time on an interval (for a clock
                             component only, so ticks don't re-render pages)
lib/
  types.ts                    Workspace, Order, Dish, Booking, Settings…
  siteOwner.ts                SITE_OWNER (name, email): landing, footer, legal pages
  api.ts / publicApi.ts      fetch wrappers for the two proxy routes
  platformApi.ts             server-side-only platform fetch/create (used
                             by layout.tsx and actions.ts, needs a raw JWT)
  lexicon.ts                  per-domain (restaurant/cafe) copy and flow steps
  range.ts                    date formatting, currency formatting
  orderMath.ts               shared line-total math
  bestSellers.ts             bestSellerIds(): the top 5 dishes by soldCount
                             (mirrors the backend's rule for the guest menu)
  uploadImage.ts             uploadImage(file): 4 MB check (under Vercel's
                             4.5 MB body limit), POST /api/upload
  serverToken.ts             getAccessToken(): the backend JWT, read on the
                             server from the session cookie (never sent to
                             the browser)
  safeRedirect.ts            safeCallbackPath(): only in-app paths after
                             sign-in (no open redirect)
  guestRoutes.ts             the only backend routes /api/proxy-public forwards
  tableEvents.ts             eventIsForTable(): guest phones skip other
                             tables' real-time events
  liveMerge.ts               upsertById / removeById / isNewer: applying
                             real-time events to the workspace without refetching
  focus.ts                    focusFirstInvalid(): failed submits focus the
                             first field with an error
test/
  axe.ts                      axeViolations(): axe-core WCAG 2.2 A/AA check
                             for rendered components
  a11y.test.tsx               axe on sign-in, sign-up and onboarding screens
  printReceipt.ts            printReceipt(): prints a bill in a hidden frame
                             as one page sized to the receipt (80 or 58 mm
                             paper, remembered per browser)
  register.ts                 registerAccount(): POST /auth/register (server-side)
  notify.ts                   notifyNewAccount(): Resend email to the admin only
  tone.ts                     status/state -> badge color mapping
  zone.ts                     hasZone(): blank and "—" both mean no zone
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
- Guest order history (`tableOrders` in `ClientWorkspaceProvider.tsx`) is
  scoped to still-open orders only (`closed_ts: null` on the backend) — a
  newly-seated guest never sees a previous party's order history at the
  same table, and a staff-side checkout clears it from the guest's view.
- `Dish.soldCount` is how many of a dish have been ordered, counted by the
  backend. Only the admin Menu shows the number. The staff and guest menus
  instead tag the top 5 sellers "Best seller":
  - staff compute the top 5 with `bestSellerIds()`;
  - guests get `Dish.isBestSeller` from the public menu API and never see
    the count.
- The staff History tab shows only sessions checked out today or yesterday
  (`GET /orders/history?from=`). The admin Orders tab keeps the full history.

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
