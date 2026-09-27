const API_URL = process.env.API_URL || "http://localhost:3000";

export type RegisterError = "exists" | "invalid" | "default";

/**
 * Creates an account on the backend (`POST /auth/register`). Server-side only.
 * `pendingApproval`: the account waits for review (REQUIRE_ACCOUNT_APPROVAL on
 * the backend) and can't sign in yet.
 */
export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ ok: true; pendingApproval: boolean } | { ok: false; error: RegisterError; message?: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as { pendingApproval?: boolean };
    return { ok: true, pendingApproval: body.pendingApproval === true };
  }
  if (res.status === 409) return { ok: false, error: "exists" };
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: "invalid", message: body.error };
  }
  return { ok: false, error: "default" };
}
