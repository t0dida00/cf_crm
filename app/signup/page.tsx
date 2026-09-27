import { ArrowLeft, SquaresFour } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { SignupCard, type SignupState } from "@/components/signup-card";
import { notifyNewAccount } from "@/lib/notify";
import { registerAccount } from "@/lib/register";

export const metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
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
    // Only the admin is emailed, whether or not the account needs review.
    await notifyNewAccount({ fullName: fullName.trim(), email: email.trim(), pendingApproval: result.pendingApproval });
    // Waiting for review: it can't sign in yet, so the card says so instead.
    if (result.pendingApproval) return { pending: { fullName: fullName.trim(), email: email.trim() } };
    // New accounts have no business yet: "/" shows the workspace setup.
    await signIn("credentials", { email, password, redirectTo: "/" });
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
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
    </main>
  );
}
