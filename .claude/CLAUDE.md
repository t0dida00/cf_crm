# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Next.js 15 (App Router) frontend for a restaurant/cafe ordering platform: an owner admin app (`/admin`), a staff floor app (`/staff`) and a guest ordering app reached by scanning a table QR code (`/client`). It talks to the `CRM_backend` Express API (sibling directory, `localhost:3000` in dev). `README.md` is the project brief (routing, env, API access, real-time, deployment); read it before larger changes, though its Structure section predates some files below.

## Commands

```bash
npm run dev          # next dev -p 3001 (needs CRM_backend running on :3000)
npm run build        # next build — also type-checks
npx tsc --noEmit     # type-check only
npm test             # Vitest, all tests
npm run test:watch
npx vitest run lib/format.test.ts        # one file
npx vitest run -t "formatTaxRates"       # tests matching a name
```

`npm run lint` (`next lint`) fails: ESLint's config needs migrating to the flat format.

## Tests

**Every new feature or utility ships with tests in the same change**, and a behavior change to existing code updates the tests that cover it. Run `npm test` before committing.

- Vitest + jsdom + React Testing Library; config in `vitest.config.ts` (`@/` alias, automatic JSX).
- Tests sit next to the code as `*.test.ts(x)` (e.g. `lib/format.test.ts`, `hooks/use-debounced-value.test.ts`). Import `describe`/`test`/`expect`/`vi` from `vitest` explicitly; there are no globals.
- Pure helpers in `lib/` get plain unit tests; hooks use `renderHook` (with `vi.useFakeTimers()` for timing).
- Components that read `useWorkspace()` are tested by mocking `@/components/workspace-provider` with `vi.mock` and a fixed workspace (see `components/panels/bookings-panel.test.tsx`).

## Architecture

- **Two data layers.**
  - `components/workspace-provider.tsx` loads the signed-in user's whole workspace on mount (tables, menu, orders, bookings, settings). It exposes the CRUD actions, which call `apiFetch` and patch local state; UI reads it via `useWorkspace()`.
  - Paged or large reads use **TanStack Query** (`components/query-provider.tsx`, mounted in `app/layout.tsx`): order history, dashboard stats, staff list, QR tokens, table requests, and the guest menu.
  - The provider invalidates `["orders"]` queries whenever its order list changes, so real-time updates reach cached reads.
  - No Zustand; don't add a second client store.
- **Order history at scale.** The workspace's `orders` holds every open order but only the 500 most recently closed (a backend cap). Anything spanning history must use `hooks/use-order-history.ts` (`GET /orders/history`, server-paged sessions) or `hooks/use-order-stats.ts` (`GET /orders/stats`), never `workspace.orders`.
- **Staff history** shows only today and yesterday: `staff-history-panel.tsx` passes `from: daysAgoStart(1)` (`lib/range.ts`) to `useOrderHistory`, which forwards it as `GET /orders/history?from=`. Admin history has no limit. This limits the view only; the backend doesn't restrict staff to 2 days.
- **Dashboard chart.** Chart.js via `react-chartjs-2` (`components/takings-chart.tsx`). `lib/chart-buckets.ts` maps the range to buckets: today → hours, last 7 days → weekdays, this month → days, this year → months, all time → years from the oldest order, none for custom. Bucketing uses the viewer's time zone (`GET /orders/stats/series?tz=`). Bars use brand-600 (`#1e90cc`) because brand-500 is under 3:1 contrast on white.
- **Bookings.** A booking's day is `booking.date` ("YYYY-MM-DD", a calendar date, never shifted by time zone); compare days with `dayKey()` from `lib/booking-slots.ts`. Start times come every 15 minutes (`SLOT_TIMES`, 09:00–21:45). No bookings for past days or already-passed times today: forms offer `availableTimes(date)`, and the backend rejects past dates. Past bookings show in the Bookings tab's history list (`pastBookings()`). Guests can stay as long as they like, so there is no seat-capacity or "full" calculation; don't add one without a dining-duration rule.
- **Staff bookings reuse the admin view.** The staff Bookings tab renders `components/panels/bookings-panel.tsx` with `allowTableAssign`, which adds a per-booking "Assign table" action (`components/booking-assign-dialog.tsx`). Its "New booking" header button drives the panel's `createSignal`, as the admin shell does. Change the panel once for both apps; there's no separate staff bookings panel.
- **Sold count and best sellers.** `Dish.soldCount` comes from the backend's `menu_items.sold_count` (a trigger keeps it current). Only the admin menu shows the number. Staff and guest menus show a "Best seller" tag on the top 5:
  - Staff compute it with `bestSellerIds()` (`lib/best-sellers.ts`).
  - Guests get `Dish.isBestSeller` from the public menu API and never receive the count.
  - `lib/best-sellers.ts` mirrors the backend rule (not hidden, active category, sold at least once, ties by name); change both together.
- **Request status.** Reads expose `RequestStatus` (`idle | loading | success | error`, `lib/request-status.ts`; `toRequestStatus()` maps a TanStack query). Render them with `LoadingState` / `ErrorState` from `components/request-state.tsx`, or pass `status`/`error`/`onRetry` to `DataTable`. Mutations use `useAsyncAction` (button spinner + error toast) instead.
- **Cancellation.** Every API call goes through `fetchJson` (`lib/http.ts`, used by `apiFetch`/`publicApiFetch`): it takes a `signal` and has a default 20 s timeout ("Request timed out"). Always pass TanStack's `signal` from `queryFn: async ({ signal }) => …`. Refetches triggered by real-time events are latest-wins (abort the previous `AbortController`). Swallow aborts with `isAbortError()`, never surface them as errors. The `/api/proxy*` routes forward `req.signal` to the backend and answer 499 when the client went away. Mutations aren't aborted on purpose, only timed out.
- **API access.**
  - Staff calls: `apiFetch` → `/api/proxy/*`, which attaches the session JWT server-side.
  - Guest calls: `publicApiFetch` → `/api/proxy-public/:platformId/*`, no auth.
  - Real-time: Pusher, subscribed directly from the browser (`usePlatformSocket(platformId, pusher)`). Pass the business's own app: `workspace.pusher` (staff/admin, from `GET /platforms/me`) or the guest workspace's `pusher` (public settings). Null falls back to `NEXT_PUBLIC_PUSHER_*`. The hook keeps one client per Pusher key.
- **Accounts and onboarding.** Owners sign up at `/signup` (a server action calls `POST /auth/register`, then signs in and lands on `/`). `/` shows the workspace setup (step 1, `setup-screen.tsx`), then `connections-step.tsx` (step 2: the business's own PostgreSQL database and Pusher app, skippable while the backend allows the shared service). Staff accounts are still created by the owner in the admin Staff tab.
- **Connections.** `hooks/use-connections.ts` (`["connections"]` query) and `components/connections-form.tsx` are shared by onboarding and Settings → Connections (`panels/connections-panel.tsx`, owner-only, like the whole admin app). One form and one "Test & save" set up both the database and Pusher (all fields required). Settings saves use `refresh()` from `useWorkspace()`, a background reload that keeps the page on screen, not `reload()`, which shows the loading state. The backend never returns the database URL or the Pusher secret; show only the label and app id/key/cluster. If the workspace load fails with `DATABASE_NOT_CONNECTED` (`lib/request-status.ts`), `/admin` shows the connections step and `/staff` tells staff to ask the owner.
- **Admin shell tabs** are driven by `?tab=` (`TabId` in `lib/types.ts`, `TITLES`/`SUBTITLES` in `admin-shell.tsx`). Table QR codes is the `qr` tab. Its LAN-address detection runs in `app/api/qr-origin`; `/qr-generation` just redirects there.
- **Sessions.** History and bills group orders by `sessionId` (one dining party). An order without one stands alone. `lib/order-math.ts` has the grouping (`toSession`, `groupIntoSessions`).
- **Tax.** Each order snapshots its own `taxRate`. Always use `order.taxRate` for past orders, never the current Settings rate. Label taxes with `formatTaxRates()`.
- **Formatting.** Money and counts go through `lib/format.ts` (`money()`, re-exported from `lib/range.ts`; `formatNumber()`), usually via `useWorkspace().fmt`. Don't format numbers ad hoc.
- **Images.** Dish photos render through `components/dish-image.tsx` (`next/image`, AVIF/WebP, lazy). Vercel Blob is the allowed remote host in `next.config.ts`; other hosts are passed through unoptimized. Give its parent `relative` and a fixed size.
- **Buttons on a white or near-white background need a border.** The `outline` and `secondary` variants in `components/ui/button.tsx` already have one; hand-built light buttons (e.g. quantity-stepper "−" buttons) add `border`. Transparent icon buttons that only tint on hover don't.
- **React keys for order lines** use `line.id ?? line.itemId`: one order can contain the same dish on two lines.
