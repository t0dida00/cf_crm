import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { LoginCard } from "@/components/auth/LoginCard";
import { MarketingHeader, MarketingShell } from "@/components/marketing/MarketingTheme";
import { PassRail, TicketClip } from "@/components/marketing/TicketRail";
import { DEMO_ACCOUNT } from "@/lib/demoAccount";
import { safeCallbackPath } from "@/lib/safeRedirect";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl) ?? undefined;

  const postLoginUrl = callbackUrl
    ? `/post-login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/post-login";

  async function loginWithCredentials(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        signInAs: formData.get("signInAs"),
        redirectTo: postLoginUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const url = new URL("/login", "http://localhost");
        if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
        url.searchParams.set(
          "error",
          err.type === "CredentialsSignin" ? "CredentialsSignin" : "Default",
        );
        if ("code" in err && typeof err.code === "string") {
          url.searchParams.set("code", err.code);
        }
        redirect(url.pathname + url.search);
      }
      throw err;
    }
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

      {/* The form is a ticket clipped to the pass rail, like the landing hero. */}
      <main className="mx-auto w-full max-w-lg px-4 pt-10 pb-16 sm:pt-16">
        <PassRail />
        <div className="-mt-1.5 flex justify-between px-10" aria-hidden>
          <TicketClip />
          <TicketClip />
        </div>
        <div className="ticket-torn -mt-1 bg-(--landing-card) px-6 pt-8 pb-12 shadow-[0_14px_24px_-14px_rgb(21_32_45/0.45)] sm:px-10">
          <LoginCard loginWithCredentials={loginWithCredentials} error={error} code={code} />
        </div>
        <p className="mt-6 text-sm text-pretty text-(--landing-muted)">
          Trying the demo? Sign in as Owner with{" "}
          <span className="font-semibold text-(--landing-ink) select-all">{DEMO_ACCOUNT.email}</span> and{" "}
          <span className="font-semibold text-(--landing-ink) select-all">{DEMO_ACCOUNT.password}</span>.
        </p>
      </main>
    </MarketingShell>
  );
}
