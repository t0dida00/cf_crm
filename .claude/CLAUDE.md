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

**Every new feature or utility ships with tests in the same change**, and a behavior change to existing code updates the tests that cover it. Run `npm test` before committing. Conventions: `.claude/rules/testing.md`.

## Rules

Detailed guidance lives in `.claude/rules/` and is loaded automatically:

| File | Covers |
|---|---|
| `data-and-api.md` | Workspace provider vs TanStack Query, order history at scale, request status, cancellation, API access and real-time |
| `orders-and-menu.md` | Sessions, tax snapshots, sold count and best sellers, order-line keys |
| `onboarding-and-connections.md` | Signup, workspace setup, the business's own database and Pusher |
| `ui-and-forms.md` | Admin tabs, formatting, images, button borders, form validation, save toasts |
| `testing.md` | Vitest setup and test patterns |
| `bookings.md` | Bookings (loaded when working on booking files) |
| `dashboard.md` | Dashboard chart (loaded when working on dashboard files) |
