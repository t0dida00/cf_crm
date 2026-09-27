import { fetchJson, type JsonRequestInit } from "./http";

/** Guest API call through the unauthenticated public proxy. Pass `signal` to
 * make it cancellable. */
export function publicApiFetch<T>(platformId: string, path: string, options?: JsonRequestInit): Promise<T> {
  return fetchJson<T>(`/api/proxy-public/${platformId}${path}`, options);
}
