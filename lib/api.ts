import { fetchJson, type JsonRequestInit } from "./http";

/** Staff API call through the authenticated proxy. Pass `signal` to make it
 * cancellable (TanStack Query supplies one to every queryFn). */
export function apiFetch<T>(path: string, options?: JsonRequestInit): Promise<T> {
  return fetchJson<T>(`/api/proxy${path}`, options);
}
