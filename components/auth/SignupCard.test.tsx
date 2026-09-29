import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }) }));
import { t } from "@/lib/i18n";
import { MIN_PASSWORD_LENGTH, SignupCard, signupErrorMessage } from "./SignupCard";

afterEach(cleanup);

describe("signupErrorMessage", () => {
  test("no error, no message", () => {
    expect(signupErrorMessage(t)).toBeNull();
  });

  test("explains a duplicate email", () => {
    expect(signupErrorMessage(t, "exists")).toMatch(/already exists/);
  });

  test("shows the backend's validation message, with a fallback", () => {
    expect(signupErrorMessage(t, "invalid", "A valid email is required")).toBe("A valid email is required");
    expect(signupErrorMessage(t, "invalid")).toBe("Check your details and try again.");
  });

  test("falls back to a generic message", () => {
    expect(signupErrorMessage(t, "default")).toMatch(/Something went wrong/);
  });
});

describe("SignupCard", () => {
  test("requires every field and enforces the password length", () => {
    render(<SignupCard signUp={vi.fn()} />);
    expect((screen.getByLabelText(/^Full name/) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/^Email/) as HTMLInputElement).type).toBe("email");
    const password = screen.getByLabelText(/^Password/) as HTMLInputElement;
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(MIN_PASSWORD_LENGTH);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("blocks submitting and explains each invalid field", () => {
    const signUp = vi.fn();
    render(<SignupCard signUp={signUp} />);
    fireEvent.change(screen.getByLabelText(/^Full name/), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "ana@" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "short" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a first and last name.")).toBeTruthy();
    expect(screen.getByText("Enter a valid email, like name@example.com.")).toBeTruthy();
    expect(screen.getByLabelText(/^Full name/).getAttribute("aria-invalid")).toBe("true");
  });

  test("leaving a field shows its error straight away", () => {
    render(<SignupCard signUp={vi.fn()} />);
    const name = screen.getByLabelText(/^Full name/);
    fireEvent.change(name, { target: { value: "Ana" } });
    fireEvent.blur(name);
    expect(screen.getByText("Enter a first and last name.")).toBeTruthy();
    // Only the field that was left is checked.
    expect(screen.queryByText("Email is required.")).toBeNull();

    fireEvent.change(name, { target: { value: "Ana Ruiz" } });
    fireEvent.blur(name);
    expect(screen.queryByText("Enter a first and last name.")).toBeNull();
  });

  test("shows the error as an alert", () => {
    render(<SignupCard signUp={vi.fn()} error="exists" />);
    expect(screen.getByRole("alert").textContent).toMatch(/already exists/);
  });

  test("an account waiting for review gets the review banner, and OK goes to sign in", async () => {
    const signUp = vi.fn(async () => ({ pending: { fullName: "Ana Ruiz", email: "ana@example.com" } }));
    render(<SignupCard signUp={signUp} />);
    fireEvent.change(screen.getByLabelText(/^Full name/), { target: { value: "Ana Ruiz" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "longenough" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    await waitFor(() => expect(screen.getByText("Dear Ana Ruiz,")).toBeTruthy());
    expect(screen.getByRole("status").textContent).toMatch(/being reviewed.*ana@example\.com/);
    expect(screen.queryByLabelText(/^Password/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(push).toHaveBeenCalledWith("/login");
  });
});
