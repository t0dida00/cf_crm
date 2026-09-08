export async function publicApiFetch<T>(
  platformId: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/proxy-public/${platformId}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
