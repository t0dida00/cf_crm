import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { fetchMyPlatform } from "@/lib/platform-api";
import { WorkspaceProvider } from "@/components/workspace-provider";
import "../node_modules/tw-animate-css/dist/tw-animate.css";
import "./globals.scss";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Page Builder — Admin",
  description: "Set up a restaurant or café workspace and manage it.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  const initialPlatform = accessToken ? await fetchMyPlatform(accessToken).catch(() => null) : null;

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <WorkspaceProvider initialPlatform={initialPlatform}>{children}</WorkspaceProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
