const API_URL = process.env.API_URL || "http://localhost:3000";

export type RegisterError = "exists" | "invalid" | "default";

/** Creates an account on the backend (`POST /auth/register`). Server-side only. */
export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: RegisterError; message?: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true };
  if (res.status === 409) return { ok: false, error: "exists" };
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: "invalid", message: body.error };
  }
  return { ok: false, error: "default" };
}
