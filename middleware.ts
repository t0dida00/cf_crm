import { NextResponse } from "next/server";
import { auth } from "@/auth";

const OWNER_ONLY_PREFIXES = ["/admin", "/qr-generation"];

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth as { role?: string | null }).role;
  const isOwnerOnlyRoute = OWNER_ONLY_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isOwnerOnlyRoute && role !== "OWNER") {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/", "/admin/:path*", "/staff/:path*", "/qr-generation/:path*"],
};
