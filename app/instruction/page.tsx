import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { InstructionPage } from "@/components/marketing/InstructionPage";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("meta.guide"), description: t("meta.guideDescription") };
}

export default function Page() {
  return <InstructionPage />;
}
