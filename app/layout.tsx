import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
