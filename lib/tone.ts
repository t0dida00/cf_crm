/** Shared badge tone → Tailwind class lookup, used across staff-facing panels. */
export const TONE_CLASSES: Record<string, string> = {
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  brand: "bg-brand-100 text-brand-600",
  green: "bg-green-50 text-green-700",
  gray: "bg-secondary text-muted-foreground",
};

const ORDER_FLOW_TONES = ["sky", "amber", "brand", "green"];
const TABLE_STATE_TONES: Record<string, string> = {
  Free: "green",
  Booked: "amber",
  Seated: "brand",
  Finished: "gray",
};

export const orderTone = (status: string, flow: string[]) =>
  TONE_CLASSES[ORDER_FLOW_TONES[Math.max(0, flow.indexOf(status))]];

export const tableStateTone = (state: string) =>
  TONE_CLASSES[TABLE_STATE_TONES[state] ?? "gray"];

export const bookingTone = (status: string) =>
  TONE_CLASSES[status === "Arrived" ? "green" : "sky"];
