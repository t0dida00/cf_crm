# Testing

- Vitest + jsdom + React Testing Library; config in `vitest.config.ts` (`@/` alias, automatic JSX).
- Tests sit next to the code as `*.test.ts(x)` (e.g. `lib/format.test.ts`, `hooks/use-debounced-value.test.ts`). Import `describe`/`test`/`expect`/`vi` from `vitest` explicitly; there are no globals.
- Pure helpers in `lib/` get plain unit tests; hooks use `renderHook` (with `vi.useFakeTimers()` for timing).
- Components that read `useWorkspace()` are tested by mocking `@/components/workspace-provider` with `vi.mock` and a fixed workspace (see `components/panels/bookings-panel.test.tsx`).
- Accessibility: `expect(await axeViolations(container)).toEqual([])` (`test/axe.ts`, axe-core). Color contrast is off there (jsdom doesn't render); check it with the token ratios in `ui-and-forms.md`.

