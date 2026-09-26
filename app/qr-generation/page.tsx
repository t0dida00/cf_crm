import { redirect } from "next/navigation";

// Table QR codes now live in the admin shell as a tab; keep old links working.
export default function QrGenerationPage() {
  redirect("/admin?tab=qr");
}
