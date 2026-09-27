const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * The signed-in user's current role from the backend (`GET /platforms/me`):
 * "OWNER"/"STAFF", null when they have no business yet, or undefined when it
 * couldn't be checked (keep the role the session already has). Server-side only.
 */
export async function fetchRole(accessToken: string): Promise<string | null | undefined> {
  try {
    const res = await fetch(`${API_URL}/platforms/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    const data = (await res.json()) as { role?: string | null };
    return data.role ?? null;
  } catch {
    return undefined;
  }
}
