import type { Metadata } from "next";
import { InstructionPage } from "@/components/instruction-page";

export const metadata: Metadata = {
  title: "How Tably works",
  description: "What clients, staff, and admins can each do in Tably.",
};

export default function Page() {
  return <InstructionPage />;
}
