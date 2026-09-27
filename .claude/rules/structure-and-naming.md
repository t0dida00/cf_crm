# Folder structure and naming

- **Components are grouped by the part of the UI they belong to**, one component per file, named in **PascalCase** after its main export (`components/auth/LoginCard.tsx` exports `LoginCard`). Tests sit beside them (`LoginCard.test.tsx`).
  - `ui/`: shadcn primitives (`Button`, `Input`, `Select`, `Dialog`…).
  - `common/`: building blocks used across areas (`DataTable`, `DishImage`, `FieldError`, `ImageDropzone`, `PaginationBar`, `RequestState`, `RequiredLabel`, `ContactForm`).
  - `providers/`: React context providers (`WorkspaceProvider`, `ClientWorkspaceProvider`, `QueryProvider`).
  - `layout/`: app chrome. `AppShell` is the one frame (sidebar, drawer, header, footer) and `useShellTab` the `?tab=` handling; `AdminShell` and `StaffShell` only supply their tabs, counts, header `actions`, `overlays` and panels. Change the frame in `AppShell`, never by copying it into a shell.
  - Areas: `auth/`, `onboarding/`, `marketing/`, `client/` (guest app), `orders/`, `bookings/` (shared by admin and staff), `admin/` (admin tab panels), `staff/` (staff tab panels).
  - A new component goes in the area that uses it; move it to `common/` once a second area needs it.
- **Hooks, utilities, helpers and services are camelCase**: `hooks/useOrderHistory.ts`, `lib/printReceipt.ts`, `lib/orderMath.ts`. Single words stay lowercase (`lib/api.ts`).
- **Constants are UPPER_SNAKE_CASE**: module-level values that never change (`MAX_IMAGE_BYTES`, `EMPTY_WORKSPACE`, `STORAGE_PROVIDERS`). Functions, components and mutable caches (e.g. `clients` in `usePlatformSocket.ts`) aren't constants. Next.js's required export names stay as Next.js wants them (`metadata`).
- **Next.js route files keep their fixed names**: `app/**/page.tsx`, `layout.tsx`, `route.ts`. They may only export what Next.js allows, so shared logic lives in `lib/` (e.g. `lib/guestRoutes.ts` for `app/api/proxy-public`).
- Import with the `@/` alias across folders; `./` only within the same folder.
