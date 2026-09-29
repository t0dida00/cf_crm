import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { axeViolations } from "@/test/axe";
import { fitLine, TableTentCard } from "./TableTentCard";

afterEach(cleanup);

describe("fitLine", () => {
  test("keeps short text and cuts long text with an ellipsis", () => {
    expect(fitLine("  Table 4 ", 14)).toBe("Table 4");
    expect(fitLine("The long terrace table", 14)).toBe("The long terr…");
  });
});

describe("TableTentCard", () => {
  test("carries the restaurant, the table, the code and what to do", () => {
    const { container } = render(
      <TableTentCard id="tent-a" qrId="qr-a" restaurant="Khoa Restaurant" table="Table 4" url="http://x/client?t=a" />,
    );
    const card = screen.getByRole("img", { name: "Table card for Table 4: scan to see the menu and order" });
    expect(card.textContent).toContain("Khoa Restaurant");
    expect(card.textContent).toContain("Scan to see the menu and order");
    // The code is its own SVG inside the card, so "Code only" can save it alone.
    expect(container.querySelector("#tent-a #qr-a")).toBeTruthy();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <TableTentCard id="tent-a" qrId="qr-a" restaurant="" table="Table 4" url="http://x/client?t=a" />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
