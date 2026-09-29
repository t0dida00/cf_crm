import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { axeViolations } from "@/test/axe";
import { flowPath, SERVICE_FLOW, ServiceFlow } from "./ServiceFlow";

afterEach(cleanup);

describe("flowPath", () => {
  test("hops between lanes at the gap between columns", () => {
    // Staff (row 2) → Guest (row 1) → Guest → Owner (row 3).
    expect(flowPath(["Staff", "Guest", "Guest", "Owner"])).toBe(
      "M50 150 H100 V50 H150 H200 V50 H250 H300 V250 H350",
    );
  });
});

describe("ServiceFlow", () => {
  test("lists the evening's steps in order, each saying who does it", () => {
    render(<ServiceFlow />);
    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps).toHaveLength(SERVICE_FLOW.length);
    expect(steps[0].textContent).toBe("Guest20:02Sits down and scans Table 4's QR code");
    expect(steps.at(-1)?.textContent).toBe("Owner21:08Takings and best sellers update");
  });

  test("has no axe violations", async () => {
    const { container } = render(<ServiceFlow />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
