# Page Builder — Next.js + TypeScript port

Port of the `Page Builder.dc.html` prototype: business setup → workspace build
animation → admin panel at **`/admin`** (Dashboard, Tables, Categories, Menu,
Orders, Bookings, Settings).

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
TanStack Table v8 · Phosphor Icons**.

## Install

```bash
npm install

# shadcn primitives this code imports from @/components/ui
npx shadcn@latest add accordion badge button card checkbox dialog input label select table

npm run dev
```

`components.json` is already configured (new-york style, CSS variables, `@/*`
alias). `app/globals.scss` maps the epixlife pro tokens — brand cyan `#2da8e5`,
`#232f3f` sidebar ink, `#f7f7f7` canvas, 12px card radius — onto shadcn's CSS
variable contract, so the generated primitives pick the palette up automatically.

## Routing

- `/` — setup form, then the workspace build animation. On completion it
  navigates to `/admin`.
- `/admin` — the admin panel (`AdminShell`): sidebar nav + header switch
  between Dashboard, Tables, Categories, Menu, Orders, Bookings and Settings.
  Since workspace state is in-memory only (see Notes), landing on `/admin`
  without having gone through setup redirects back to `/`.

Both routes render under the same root layout, so the single
`WorkspaceProvider` instance (and its in-memory state) is shared across the
client-side navigation between them.

## Structure

```
app/
  layout.tsx              Nunito Sans + WorkspaceProvider
  page.tsx                setup → building screen, then routes to /admin
  admin/page.tsx           renders AdminShell, guards against missing workspace
  globals.scss            tokens, keyframes
lib/
  types.ts                Workspace, Order, Dish, Booking, Settings…
  lexicon.ts              per-domain copy, zones, seed catalogue, slot times
  seed.ts                 deterministic 400-day order + booking history
  range.ts                date-range bounds, captions, currency formatting
  utils.ts                cn()
components/
  workspace-provider.tsx  single client store (context + CRUD actions)
  setup-screen.tsx        setup form (business name + domain)
  building-screen.tsx     build animation (cards fly into place, CSS keyframes)
  admin-shell.tsx         sidebar + header + panel switch
  data-table.tsx          TanStack ↔ shadcn Table bridge
  order-detail-dialog.tsx line items + net/tax/total breakdown
  panels/                 dashboard, tables, categories, menu, orders,
                          bookings, settings
```

## Notes

- State lives in memory in `WorkspaceProvider`. Swap the action bodies for API
  calls (or TanStack Query mutations) to back it with a real database.
- Orders and Bookings are generated for the last 400 days by a seeded PRNG, so
  the dashboard date ranges have data and stay stable between renders.
- Tax model: one **common tax** (default 10%) applies to every order. **Special
  taxes** are an optional library — a dish can *include* one in its price or
  *exclude* a percentage added at checkout; the order detail lists the ones that
  apply.
- `DataTable` is presentational; each panel owns its `useReactTable` instance so
  it can pick its own column defs, filtering and pagination models.
