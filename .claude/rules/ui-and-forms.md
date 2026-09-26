# UI conventions, forms and validation

- **Admin shell tabs** are driven by `?tab=` (`TabId` in `lib/types.ts`, `TITLES`/`SUBTITLES` in `admin-shell.tsx`). Table QR codes is the `qr` tab. Its LAN-address detection runs in `app/api/qr-origin`; `/qr-generation` just redirects there.
- **Formatting.** Money and counts go through `lib/format.ts` (`money()`, re-exported from `lib/range.ts`; `formatNumber()`), usually via `useWorkspace().fmt`. Don't format numbers ad hoc.
- **Images.** Dish photos render through `components/dish-image.tsx` (`next/image`, AVIF/WebP, lazy). Vercel Blob is the allowed remote host in `next.config.ts`; other hosts are passed through unoptimized. Give its parent `relative` and a fixed size.
- **Buttons on a white or near-white background need a border.** The `outline` and `secondary` variants in `components/ui/button.tsx` already have one; hand-built light buttons (e.g. quantity-stepper "−" buttons) add `border`. Transparent icon buttons that only tint on hover don't.
- **Forms and validation.** Rules live in `lib/validation.ts`, mirrored by the backend's `src/lib/validation.ts`; change both together.
  - Phone: digits with an optional leading `+`, filtered as typed with `sanitizePhone`.
  - Email format; full name of at least two words.
  - Counts (seats, party size, quantity): whole numbers from 1. Prices and percentages: never negative. Common tax at most 100%, special and dish tax at most 200% (`acceptNumberInput` ignores keystrokes above the limit; `blockInvalidNumberKeys` blocks `-`, `+`, `e`).
  - Each form keeps a `FieldErrors` object from its `validateX()`, checks on save and on blur (`withFieldError`; not on dropdowns, whose focus moves into the list), and renders `<FieldError>` plus `fieldErrorProps()` on the input.
  - Mandatory fields use `RequiredLabel` (red `*`, hidden from screen readers) with `required` on the input. Tests find those fields with `getByLabelText(/^Label/)`.
  - `components/ui/input.tsx` caps every input at 250 characters (`INPUT_MAX_LENGTH`), except where a field passes its own `maxLength`, e.g. the database URL. Text areas aren't capped.
- **Save feedback.** Every successful save shows the "Saved successfully" toast: pass `SAVED_MESSAGE` as `run()`'s fourth argument (`hooks/use-async-action.ts`), or call `toast.success(SAVED_MESSAGE)` where a save doesn't go through `run()`.
