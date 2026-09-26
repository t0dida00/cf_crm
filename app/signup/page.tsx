import { ArrowLeft, SquaresFour } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { SignupCard } from "@/components/signup-card";
import { registerAccount } from "@/lib/register";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  async function signUp(formData: FormData) {
    "use server";
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await registerAccount({ fullName, email, password });
    if (!result.ok) {
      const params = new URLSearchParams({ error: result.error });
      if (result.message) params.set("message", result.message);
      redirect(`/signup?${params}`);
    }
    // New accounts have no business yet: "/" shows the workspace setup.
    await signIn("credentials", { email, password, redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} weight="bold" />
          Back to sign in
        </Link>

        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">CREATE ACCOUNT</span>
        </div>

        <SignupCard signUp={signUp} error={error} message={message} />
      </div>
    </div>
  );
}
