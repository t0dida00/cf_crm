import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("legal.terms.title") };
}

export default function Page() {
  return <LegalPage doc="terms" />;
}
