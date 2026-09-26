import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MIN_PASSWORD_LENGTH, SignupCard, signupErrorMessage } from "./signup-card";

afterEach(cleanup);

describe("signupErrorMessage", () => {
  test("no error, no message", () => {
    expect(signupErrorMessage()).toBeNull();
  });

  test("explains a duplicate email", () => {
    expect(signupErrorMessage("exists")).toMatch(/already exists/);
  });

  test("shows the backend's validation message, with a fallback", () => {
    expect(signupErrorMessage("invalid", "A valid email is required")).toBe("A valid email is required");
    expect(signupErrorMessage("invalid")).toBe("Check your details and try again.");
  });

  test("falls back to a generic message", () => {
    expect(signupErrorMessage("default")).toMatch(/Something went wrong/);
  });
});

describe("SignupCard", () => {
  test("requires every field and enforces the password length", () => {
    render(<SignupCard signUp={vi.fn()} />);
    expect((screen.getByLabelText("Full name") as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText("Email") as HTMLInputElement).type).toBe("email");
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.required).toBe(true);
    expect(password.minLength).toBe(MIN_PASSWORD_LENGTH);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows the error as an alert", () => {
    render(<SignupCard signUp={vi.fn()} error="exists" />);
    expect(screen.getByRole("alert").textContent).toMatch(/already exists/);
  });
});
