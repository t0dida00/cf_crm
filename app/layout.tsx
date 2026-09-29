import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { getLocale, getServerT } from "@/lib/i18n/server";
import "../node_modules/tw-animate-css/dist/tw-animate.css";
import "./globals.scss";

const nunito = Nunito_Sans({
  // "vietnamese" carries ơ, ư, ạ…; without it they fall back to another font mid-word.
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return {
  // Pages set their own title ("Sign in · Tably"); WCAG 2.4.2.
  title: { default: "Tably", template: "%s · Tably" },
  description: t("meta.description"),
  icons: {
    icon: "/icons/favicon.ico",
    shortcut: "/icons/favicon.ico",
    apple: "/icons/bell_master.png",
  },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Only whether someone is signed in: the backend JWT never goes to the browser.
  const signedIn = !!(await auth());
  // English or Vietnamese: the visitor's saved choice, else their browser's language.
  const locale = await getLocale();

  return (
    <html lang={locale} className={nunito.variable}>
      <body>
        <I18nProvider locale={locale}>
          <QueryProvider>
            <WorkspaceProvider signedIn={signedIn}>
              {children}
            </WorkspaceProvider>
          </QueryProvider>
        </I18nProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
