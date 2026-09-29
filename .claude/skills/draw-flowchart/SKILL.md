---
name: draw-flowchart
description: Draw a process as a swimlane flow inside a web page or app screen: who does what, step by step, with a connector that hops between the actors' lanes, collapsing to a vertical timeline on narrow screens. Use when the user asks to draw, show or visualize a flow, flowchart, process, journey, scenario, pipeline or "how it works" sequence as part of the UI (landing sections, onboarding, docs pages, dashboards), especially when several roles hand work to each other.
---

# Draw a flowchart

A flow in a product's UI is read by people deciding whether they understand the
product, so every step must be something the product really does, in the order
it really happens. The drawing is the easy part; getting the steps right is the
job.

## 1. Get the steps right first

- **Ground each step in the code or the user's words.** Before writing a step,
  find what makes it true: the route, the handler, the status change, the
  button. If the product does it automatically (a trigger, a webhook, a state
  change on save), say so in the step; don't invent a manual step for it. If you
  can't find it, ask instead of guessing.
- **One concrete scenario beats a generic one.** Follow one real case through
  (one order, one table's evening, one support ticket) with real names and
  times. "Scans Table 4's QR code at 20:02" is clearer than "Customer scans code".
- **Name the actors as users know them** (Guest, Staff, Owner, Customer, Agent),
  never system parts (Frontend, API, DB) unless the audience is engineers.
- **Keep each step to one action, about 40 characters**, written from the
  actor's side in plain, active words. 5–8 steps; more than 9 means the flow
  should be split or summarized.

## 2. Pick the form

| The process | Form |
|---|---|
| 2–4 actors handing work to each other, in order | **Swimlane** (this skill) |
| One actor, in order | A single-lane **timeline**: the narrow layout below at every width |
| Yes/no decisions or branches | A branching flowchart (boxes, diamonds, labeled arrows); keep this skill's accessibility and responsive rules |
| Numbers over time | Not a flowchart: a chart |

Numbering or times on the steps are fine only because a flow really is a sequence.

## 3. Lay out the swimlane

- **Grid:** a label column for the lane names, then one column per step and one
  row per lane, in time order left to right. Each step sits at
  `(column = its index, row = its actor's lane)`, so a hand-off is visible as a
  change of row.
- **Lanes:** alternate a faint band behind every other lane so rows read across.
  Give each actor a colour from the project's own tokens (not new ones), shown as
  a dot beside the lane name and a thick left edge on its step cards. Keep
  text in text colours; colour only marks identity.
- **Step cards:** a small card with the time or step marker, then the action.
  All cards the same size, vertically centered in their cell. Fixed lane height
  (about 7rem) so the connector lines up; make sure the longest step fits.
- **Connector:** one SVG path behind the cards, drawn in viewBox units of 100
  per column and 100 per lane, stretched over the step area with
  `preserveAspectRatio="none"` and `vector-effect="non-scaling-stroke"` so the
  line stays 2px at any size. From each step center go across to the gap
  between columns, then up or down to the next step's lane, then across into
  it: `H(x - 50) V(y) H(x)`. The cards cover the line's ends, so no arrowheads
  are needed; left-to-right time gives the direction.
- **Stacking order:** lane bands, then the connector, then the cards.
- **Motion:** none by default. If the page already has one signature animation,
  don't add another here.

## 4. Narrow screens

Below the width where every column still fits a readable card (roughly 130px of
card per step; check, don't assume), switch to a **vertical timeline**: the same
ordered list, one card per row, a line down the left with a dot per step in the
actor's colour, and the actor's name shown on each card (the lanes are gone, so
the card must say who). Cap the timeline's width so cards don't stretch across
a tablet.

## 5. Accessibility

- Render the steps as an **ordered list** (`<ol>`) in a `<figure>` with a caption
  naming the scenario; the list is the source of truth, the drawing decorates it.
- Every step includes its actor as text. When the lane labels show it visually,
  keep that text for screen readers (visually hidden), not duplicated.
- The connector SVG and lane labels are `aria-hidden`.
- Text contrast meets WCAG AA against the card; colours never carry meaning alone.

## 6. Check it and test it

- **Look at it** at a wide desktop, the narrowest width that still shows the
  swimlane, a tablet and a phone. Fix cards that overflow their lane, dots off
  the line, or empty stretches of the rail.
- **Tests beside the component:** the connector path for a small known lane
  sequence (exact path string), the steps render in order with their actor, and
  an accessibility (axe) check.

## Reference

This project's implementation: `components/marketing/ServiceFlow.tsx` (React +
Tailwind) with `ServiceFlow.test.tsx`. It exports the steps as data
(`SERVICE_FLOW`), the lanes (`LANES`) and the path builder (`flowPath()`); copy
that shape and replace the content. In another stack, keep the same data shape,
grid and path math.
