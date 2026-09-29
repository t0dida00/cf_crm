import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { axeViolations } from "@/test/axe";
import { t } from "@/lib/i18n";
import { SIGNUP_STEPS, SignupSteps } from "./SignupSteps";

afterEach(cleanup);

describe("SignupSteps", () => {
  test("lists the setup steps in order, with account creation as the current one", () => {
    render(<SignupSteps />);
    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps.map((li) => li.querySelector("h3")?.textContent?.replace("You're here", ""))).toEqual(
      SIGNUP_STEPS.map((s) => t(`auth.steps.${s}.title`)),
    );
    expect(steps.filter((li) => li.getAttribute("aria-current") === "step")).toEqual([steps[0]]);
    expect(within(steps[0]).getByText("You're here")).toBeTruthy();
  });

  test("has no axe violations", async () => {
    const { container } = render(<SignupSteps />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
