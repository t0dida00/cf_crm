import os from "os";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchMyPlatform } from "@/lib/platform-api";
import { QrGenerationView } from "@/components/qr-generation-view";

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

export default async function QrGenerationPage() {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  const platform = accessToken ? await fetchMyPlatform(accessToken).catch(() => null) : null;

  if (!platform) redirect("/");

  const headerList = await headers();
  const host = headerList.get("host") || "";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  // On a real deployment, the request's own host is already the address
  // guests should hit — no LAN detection needed or trustworthy there.
  const defaultOrigin = isLocalHost
    ? (() => {
        const port = host.includes(":") ? host.split(":")[1] : "";
        const lanIp = detectLanIp();
        return lanIp ? `${protocol}://${lanIp}${port ? `:${port}` : ""}` : "";
      })()
    : host
      ? `${protocol}://${host}`
      : "";

  return <QrGenerationView platformName={platform.name} defaultOrigin={defaultOrigin} />;
}
