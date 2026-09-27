import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

/**
 * The backend JWT of the signed-in user, read on the server from the
 * encrypted session cookie. Server-side only: the token is never put in the
 * session object, so it can't be read from the browser (/api/auth/session or
 * the page payload). The cookie is `__Secure-` over HTTPS and plain on
 * localhost, so both names are tried.
 */
export async function getAccessToken(): Promise<string | null> {
  const req = { headers: await headers() };
  const secret = process.env.AUTH_SECRET;
  for (const secureCookie of [true, false]) {
    const token = await getToken({ req, secret, secureCookie });
    if (typeof token?.accessToken === "string") return token.accessToken;
  }
  return null;
}
