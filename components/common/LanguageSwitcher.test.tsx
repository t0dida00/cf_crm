import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { i18n } from "@/lib/i18n";
import { axeViolations } from "@/test/axe";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { LanguageSwitcher } from "./LanguageSwitcher";

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
  document.cookie = "lang=; max-age=0; path=/";
  refresh.mockClear();
});

describe("LanguageSwitcher", () => {
  test("each language is a radio named in its own language", async () => {
    const { container } = render(<LanguageSwitcher />);
    expect((screen.getByRole("radio", { name: "English" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("radio", { name: "Tiếng Việt" }).closest("label")?.getAttribute("lang")).toBe("vi");
    expect(await axeViolations(container)).toEqual([]);
  });

  test("choosing Tiếng Việt switches the app, remembers it and refreshes server content", () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("radio", { name: "Tiếng Việt" }));
    expect(i18n.language).toBe("vi");
    expect(document.cookie).toContain("lang=vi");
    expect(document.documentElement.lang).toBe("vi");
    expect(refresh).toHaveBeenCalled();
    expect((screen.getByRole("radio", { name: "Tiếng Việt" }) as HTMLInputElement).checked).toBe(true);
  });
});
