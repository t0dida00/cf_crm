import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/contact-form", () => ({ ContactForm: () => null }));

import { LoginCard, loginNotice } from "./login-card";

afterEach(cleanup);

describe("loginNotice", () => {
  test("an account under review is a warning, not an error", () => {
    expect(loginNotice("CredentialsSignin", "account_pending")).toEqual({
      text: expect.stringMatching(/still being reviewed/),
      tone: "warning",
    });
  });

  test("everything else is an error", () => {
    expect(loginNotice("CredentialsSignin", "account_disabled")?.tone).toBe("error");
    expect(loginNotice("CredentialsSignin")).toEqual({ text: "Invalid email or password.", tone: "error" });
    expect(loginNotice("Configuration")?.text).toMatch(/Something went wrong/);
    expect(loginNotice()).toBeNull();
  });
});

describe("LoginCard", () => {
  test("shows the review notice in the warning style, as a status", () => {
    render(<LoginCard loginWithCredentials={vi.fn()} error="CredentialsSignin" code="account_pending" />);
    const notice = screen.getByRole("status");
    expect(notice.textContent).toMatch(/still being reviewed/);
    expect(notice.className).toContain("bg-amber-50");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows errors in the error style, as an alert", () => {
    render(<LoginCard loginWithCredentials={vi.fn()} error="CredentialsSignin" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Invalid email or password.");
    expect(alert.className).toContain("text-destructive");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
