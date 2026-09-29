import { vi } from "vitest";
// Registers the app's i18n instance with react-i18next, in English: components
// render real text in tests, not keys.
import "@/lib/i18n";

/**
 * Next's app router isn't mounted in unit tests; components that use it (the
 * language switcher in every header, for one) get a stand-in. A test that
 * needs its own router still mocks "next/navigation" itself, which wins.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
