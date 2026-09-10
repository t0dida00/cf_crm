import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/components/workspace-provider";
import "../node_modules/tw-animate-css/dist/tw-animate.css";
import "./globals.scss";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Tably",
  description: "Set up a restaurant or café workspace and manage it.",
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
    apple: "/icons/bell_master.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <WorkspaceProvider accessToken={accessToken ?? null}>
          {children}
        </WorkspaceProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
