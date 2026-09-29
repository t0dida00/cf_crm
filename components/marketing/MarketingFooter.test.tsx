import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";

vi.mock("next/font/google", () => ({ Archivo: () => ({ className: "font-archivo", variable: "--font-archivo" }) }));

import { MarketingFooter } from "./MarketingTheme";
import TermsPage from "@/app/terms/page";
import PrivacyPage from "@/app/privacy/page";
import CookiesPage from "@/app/cookies/page";
import { SITE_OWNER } from "@/lib/siteOwner";

afterEach(cleanup);

describe("MarketingFooter", () => {
  test("has no axe violations", async () => {
    const { container } = render(<MarketingFooter />);
    expect(await axeViolations(container)).toEqual([]);
  });

  test("links the legal pages", () => {
    render(<MarketingFooter />);
    const legal = within(screen.getByRole("navigation", { name: "Legal" }));
    expect(legal.getByRole("link", { name: "Terms of use" }).getAttribute("href")).toBe("/terms");
    expect(legal.getByRole("link", { name: "Privacy policy" }).getAttribute("href")).toBe("/privacy");
    expect(legal.getByRole("link", { name: "Cookies" }).getAttribute("href")).toBe("/cookies");
  });

  test("section links go through the home page, so they work from any page", () => {
    render(<MarketingFooter />);
    const product = within(screen.getByRole("navigation", { name: "Product" }));
    expect(product.getByRole("link", { name: "Features" }).getAttribute("href")).toBe("/#features");
    const contact = within(screen.getByRole("navigation", { name: "Contact" }));
    expect(contact.getByRole("link", { name: SITE_OWNER.email }).getAttribute("href")).toBe(`mailto:${SITE_OWNER.email}`);
  });
});

describe("legal pages", () => {
  test.each([
    ["Terms of use", TermsPage],
    ["Privacy policy", PrivacyPage],
    ["Cookie policy", CookiesPage],
  ])("%s has its heading and no axe violations", async (title, Page) => {
    const { container } = render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});
