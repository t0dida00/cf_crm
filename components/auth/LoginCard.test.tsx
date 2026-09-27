import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/common/ContactForm", () => ({ ContactForm: () => null }));

import { LoginCard, loginNotice } from "./LoginCard";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

describe("loginNotice", () => {
  test("an account under review is a warning, not an error", () => {
    expect(loginNotice("CredentialsSignin", "account_pending")).toEqual({
      text: expect.stringMatching(/still being reviewed/),
      tone: "warning",
    });
  });

  test("everything else is an error", () => {
    expect(loginNotice("CredentialsSignin", "account_disabled")?.tone).toBe("error");
    expect(loginNotice("CredentialsSignin")).toEqual({ text: "Email or password is wrong, please try again.", tone: "error" });
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
    expect(alert.textContent).toBe("Email or password is wrong, please try again.");
    expect(alert.className).toContain("text-destructive");
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("asks Owner or Staff before signing in, starting on Owner, and sends the choice with the form", () => {
    const { container } = render(<LoginCard loginWithCredentials={vi.fn()} />);
    const owner = screen.getByRole("radio", { name: "Owner" }) as HTMLInputElement;
    const staff = screen.getByRole("radio", { name: "Staff" }) as HTMLInputElement;
    expect(owner.checked).toBe(true);
    expect(staff.checked).toBe(false);

    fireEvent.click(staff);
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("signInAs")).toBe("staff");
  });

  test("the help below the form follows the choice", () => {
    render(<LoginCard loginWithCredentials={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Create an account" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "contact us" })).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Staff" }));
    expect(screen.queryByRole("link", { name: "Create an account" })).toBeNull();
    expect(screen.getByText(/Ask your owner for one/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "contact us" })).toBeTruthy();
  });

  test("remembers the last choice on this browser", () => {
    render(<LoginCard loginWithCredentials={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: "Staff" }));
    expect(localStorage.getItem("tably:sign-in-as")).toBe("staff");
    cleanup();

    render(<LoginCard loginWithCredentials={vi.fn()} />);
    expect((screen.getByRole("radio", { name: "Staff" }) as HTMLInputElement).checked).toBe(true);
  });
});
