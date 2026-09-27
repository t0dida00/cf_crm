/**
 * `url` if it's a path inside this app ("/admin?tab=menu"), else null. Keeps
 * a sign-in link like /login?callbackUrl=https://evil.example from sending
 * people to another site after a real sign-in (open redirect).
 */
export function safeCallbackPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return null;
  // Control characters and backslashes can make browsers read it as another host.
  if (/[\u0000-\u001f\\]/.test(url)) return null;
  return url;
}
