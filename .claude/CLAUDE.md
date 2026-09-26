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

## Architecture

- **Two data layers.**
  - `components/workspace-provider.tsx` loads the signed-in user's whole workspace on mount (tables, menu, orders, bookings, settings). It exposes the CRUD actions, which call `apiFetch` and patch local state; UI reads it via `useWorkspace()`.
  - Paged or large reads use **TanStack Query** (`components/query-provider.tsx`, mounted in `app/layout.tsx`): order history, dashboard stats, staff list, QR tokens, table requests, and the guest menu.
  - The provider invalidates `["orders"]` queries whenever its order list changes, so real-time updates reach cached reads.
  - No Zustand; don't add a second client store.
- **Order history at scale.** The workspace's `orders` holds every open order but only the 500 most recently closed (a backend cap). Anything spanning history must use `hooks/use-order-history.ts` (`GET /orders/history`, server-paged sessions) or `hooks/use-order-stats.ts` (`GET /orders/stats`), never `workspace.orders`.
- **Dashboard chart.** Chart.js via `react-chartjs-2` (`components/takings-chart.tsx`). `lib/chart-buckets.ts` maps the range to buckets: today → hours, last 7 days → weekdays, this month → days, this year → months, all time → years from the oldest order, none for custom. Bucketing uses the viewer's time zone (`GET /orders/stats/series?tz=`). Bars use brand-600 (`#1e90cc`) because brand-500 is under 3:1 contrast on white.
- **Bookings.** A booking's day is `booking.date` ("YYYY-MM-DD", a calendar date, never shifted by time zone); compare days with `dayKey()` from `lib/booking-slots.ts`. Start times come every 15 minutes (`SLOT_TIMES`, 09:00–21:45). No bookings for past days or already-passed times today: forms offer `availableTimes(date)`, and the backend rejects past dates. Past bookings show in the Bookings tab's history list (`pastBookings()`). Guests can stay as long as they like, so there is no seat-capacity or "full" calculation; don't add one without a dining-duration rule.
- **Request status.** Reads expose `RequestStatus` (`idle | loading | success | error`, `lib/request-status.ts`; `toRequestStatus()` maps a TanStack query). Render them with `LoadingState` / `ErrorState` from `components/request-state.tsx`, or pass `status`/`error`/`onRetry` to `DataTable`. Mutations use `useAsyncAction` (button spinner + error toast) instead.
- **API access.**
  - Staff calls: `apiFetch` → `/api/proxy/*`, which attaches the session JWT server-side.
  - Guest calls: `publicApiFetch` → `/api/proxy-public/:platformId/*`, no auth.
  - Real-time: Pusher, subscribed directly from the browser (`usePlatformSocket`).
- **Admin shell tabs** are driven by `?tab=` (`TabId` in `lib/types.ts`, `TITLES`/`SUBTITLES` in `admin-shell.tsx`). Table QR codes is the `qr` tab. Its LAN-address detection runs in `app/api/qr-origin`; `/qr-generation` just redirects there.
- **Sessions.** History and bills group orders by `sessionId` (one dining party). An order without one stands alone. `lib/order-math.ts` has the grouping (`toSession`, `groupIntoSessions`).
- **Tax.** Each order snapshots its own `taxRate`. Always use `order.taxRate` for past orders, never the current Settings rate. Label taxes with `formatTaxRates()`.
- **Formatting.** Money and counts go through `lib/format.ts` (`money()`, re-exported from `lib/range.ts`; `formatNumber()`), usually via `useWorkspace().fmt`. Don't format numbers ad hoc.
- **Images.** Dish photos render through `components/dish-image.tsx` (`next/image`, AVIF/WebP, lazy). Vercel Blob is the allowed remote host in `next.config.ts`; other hosts are passed through unoptimized. Give its parent `relative` and a fixed size.
- **React keys for order lines** use `line.id ?? line.itemId`: one order can contain the same dish on two lines.
