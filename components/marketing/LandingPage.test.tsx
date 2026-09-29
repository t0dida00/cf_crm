import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";

vi.mock("next/font/google", () => ({ Nunito_Sans: () => ({ className: "font-nunito-sans", variable: "--font-nunito-marketing" }) }));
vi.mock("@/components/common/ContactForm", () => ({ ContactForm: () => null }));

import { LandingPage } from "./LandingPage";
import { InstructionPage } from "./InstructionPage";
import { TICKETS } from "./TicketRail";

afterEach(cleanup);

describe("LandingPage", () => {
  test("has no axe violations", async () => {
    const { container } = render(<LandingPage />);
    expect(await axeViolations(container)).toEqual([]);
  });

  test("asks visitors to get in touch for a demo instead of showing credentials", () => {
    const { container } = render(<LandingPage />);
    const demo = within(screen.getByRole("region", { name: "Want a demo?" }));
    expect(demo.getByRole("link", { name: "Contact me" }).getAttribute("href")).toBe("#contact");
    expect(container.textContent).not.toMatch(/password/i);
  });

  test("sends the demo to sign-in and new owners to sign-up", () => {
    render(<LandingPage />);
    const demo = screen.getAllByRole("link", { name: "Try the demo" });
    expect(demo.every((a) => a.getAttribute("href") === "/login")).toBe(true);
    const signup = screen.getAllByRole("link", { name: "Create an account" });
    expect(signup.every((a) => a.getAttribute("href") === "/signup")).toBe(true);
  });

  test("the ticket rail is one image with a description", () => {
    render(<LandingPage />);
    const rail = screen.getByRole("img", { name: /order tickets on the kitchen rail/ });
    expect(rail.querySelectorAll(".ticket-drop")).toHaveLength(1);
  });
});

describe("TicketRail", () => {
  test("exactly one ticket is the new order", () => {
    expect(TICKETS.filter((t) => t.fresh).map((t) => t.status)).toEqual(["New"]);
  });
});

describe("InstructionPage", () => {
  test("has no axe violations", async () => {
    const { container } = render(<InstructionPage />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
