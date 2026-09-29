import { t } from "@/lib/i18n";
/** Lifecycle of a server read, shown consistently across the app:
 * idle (not started / disabled), loading, success, error. */
export type RequestStatus = "idle" | "loading" | "success" | "error";

/** Maps a TanStack Query result onto RequestStatus. A query with no data yet
 * that isn't fetching (e.g. `enabled: false`) is idle. */
export function toRequestStatus(query: {
  status: "pending" | "error" | "success";
  fetchStatus: "fetching" | "paused" | "idle";
}): RequestStatus {
  if (query.status === "error") return "error";
  if (query.status === "success") return "success";
  return query.fetchStatus === "idle" ? "idle" : "loading";
}

/** The backend's answer when a business has no database of its own and the shared one is turned off. */
export const DATABASE_NOT_CONNECTED = "DATABASE_NOT_CONNECTED";

export const errorMessage = (error: unknown, fallback: string = t("errors.generic")) =>
  error instanceof Error && error.message ? error.message : fallback;
