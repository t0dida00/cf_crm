import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { RequiredLabel } from "./required-label";

afterEach(cleanup);

describe("RequiredLabel", () => {
  test("shows a red asterisk that screen readers skip", () => {
    render(
      <>
        <RequiredLabel htmlFor="f">Phone</RequiredLabel>
        <input id="f" required />
      </>,
    );
    const star = screen.getByText("*");
    expect(star.className).toContain("text-destructive");
    expect(star.getAttribute("aria-hidden")).toBe("true");
    // The field's accessible name stays "Phone".
    expect(screen.getByRole("textbox", { name: "Phone" })).toBeTruthy();
  });
});
