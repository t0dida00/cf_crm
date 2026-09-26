import os from "os";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Only useful for local dev, where phones on the same WiFi need the host
// machine's real LAN IP rather than "localhost". Vercel (and most other
// hosts) report ephemeral/link-local container addresses here instead, so
// this must never be trusted once a real public host header is available.
function detectLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return null;
}

/** The origin table QR codes should point guests at: the request's own host on
 * a real deployment, or this machine's LAN address when running on localhost. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const host = req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  let origin = "";
  if (isLocalHost) {
    const port = host.includes(":") ? host.split(":")[1] : "";
    const lanIp = detectLanIp();
    if (lanIp) origin = `${protocol}://${lanIp}${port ? `:${port}` : ""}`;
  } else if (host) {
    origin = `${protocol}://${host}`;
  }

  return NextResponse.json({ origin });
}
