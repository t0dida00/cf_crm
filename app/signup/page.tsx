import { ArrowLeft } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { SignupCard, type SignupState } from "@/components/auth/SignupCard";
import { SignupSteps } from "@/components/auth/SignupSteps";
import { MarketingFooter, MarketingHeader, MarketingShell } from "@/components/marketing/MarketingTheme";
import { PassRail, TicketClip } from "@/components/marketing/TicketRail";
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
    <MarketingShell>
      <MarketingHeader>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-sm text-sm font-medium text-(--landing-muted) hover:text-(--landing-ink)"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden />
          Back to home
        </Link>
      </MarketingHeader>

      {/* The form is a ticket on the pass rail, like sign-in; the setup order hangs beside it. */}
      <main className="mx-auto grid w-full max-w-5xl gap-12 px-4 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-16">
        <div>
          <PassRail />
          <div className="-mt-1.5 flex justify-between px-10" aria-hidden>
            <TicketClip />
            <TicketClip />
          </div>
          <div className="ticket-torn -mt-1 bg-(--landing-card) px-6 pt-8 pb-12 shadow-[0_14px_24px_-14px_rgb(21_32_45/0.45)] sm:px-10">
            <SignupCard signUp={signUp} error={error} message={message} />
          </div>
        </div>
        <div className="lg:pt-16">
          <SignupSteps />
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}
