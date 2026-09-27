import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { QueryProvider } from "@/components/query-provider";
import { WorkspaceProvider } from "@/components/workspace-provider";
import "../node_modules/tw-animate-css/dist/tw-animate.css";
import "./globals.scss";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  // Pages set their own title ("Sign in · Tably"); WCAG 2.4.2.
  title: { default: "Tably", template: "%s · Tably" },
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
  // Only whether someone is signed in: the backend JWT never goes to the browser.
  const signedIn = !!(await auth());

  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <QueryProvider>
          <WorkspaceProvider signedIn={signedIn}>
            {children}
          </WorkspaceProvider>
        </QueryProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
