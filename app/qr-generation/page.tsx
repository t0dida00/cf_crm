import os from "os";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { fetchMyPlatform } from "@/lib/platform-api";
import { QrGenerationView } from "@/components/qr-generation-view";

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
  const port = host.includes(":") ? host.split(":")[1] : "";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const lanIp = detectLanIp();
  const defaultOrigin = lanIp ? `${protocol}://${lanIp}${port ? `:${port}` : ""}` : "";

  return <QrGenerationView platformName={platform.name} defaultOrigin={defaultOrigin} />;
}
