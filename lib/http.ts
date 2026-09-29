import { t } from "@/lib/i18n";
/** Default limit for a JSON API call, so a hung request can't leave a spinner
 * or a disabled button stuck. */
export const REQUEST_TIMEOUT_MS = 20_000;

export interface JsonRequestInit extends RequestInit {
  /** Abort after this long (ms). Defaults to REQUEST_TIMEOUT_MS; 0 disables. */
  timeoutMs?: number;
}

/** True for an error thrown because the request was aborted (by the caller's
 * signal — e.g. TanStack Query cancelling a stale read — or by unmount). */
export const isAbortError = (err: unknown) =>
  err instanceof DOMException ? err.name === "AbortError" : (err as { name?: string })?.name === "AbortError";

/**
 * fetch + JSON with cancellation: the caller's `signal` aborts the request,
 * and so does the timeout (reported as "Request timed out"). Non-2xx responses
 * throw the backend's `{ error }` message.
 */
export async function fetchJson<T>(url: string, { timeoutMs = REQUEST_TIMEOUT_MS, signal, ...init }: JsonRequestInit = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", onAbort, { once: true });

  try {
    // Don't send at all if the caller already gave up.
    controller.signal.throwIfAborted();
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || t("errors.requestFailed", { status: res.status }));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (timedOut && isAbortError(err)) throw new Error(t("errors.timedOut"));
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
