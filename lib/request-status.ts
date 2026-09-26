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

export const errorMessage = (error: unknown, fallback = "Something went wrong.") =>
  error instanceof Error && error.message ? error.message : fallback;
