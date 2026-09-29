import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { StaffSeats } from "./StaffSeats";

afterEach(cleanup);

describe("StaffSeats", () => {
  test("says how many accounts are used, with one mark per account", () => {
    const { container } = render(<StaffSeats used={2} limit={5} />);
    expect(container.textContent).toContain("2 of 5 staff accounts used");
    expect(container.querySelectorAll("[aria-hidden] > span")).toHaveLength(5);
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("says so when every account is in use", () => {
    render(<StaffSeats used={5} limit={5} />);
    expect(screen.getByRole("status").textContent).toBe("All 5 are in use. Remove an account to add someone new.");
  });
});
