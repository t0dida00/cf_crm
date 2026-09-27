import axe from "axe-core";

/**
 * Runs axe-core (WCAG 2.x A/AA rules) on a rendered component and returns
 * readable violations, so tests can `expect(await axeViolations(c)).toEqual([])`.
 * Color contrast needs real rendering, which jsdom doesn't do, so it's off
 * here; "region" is off because components are tested outside the page's
 * landmarks.
 */
export async function axeViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
  );
}
