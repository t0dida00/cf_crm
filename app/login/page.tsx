import { ArrowLeft, SquaresFour } from "@phosphor-icons/react/ssr";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { LoginCard } from "@/components/login-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; code?: string }>;
}) {
  const { callbackUrl, error, code } = await searchParams;

  const postLoginUrl = callbackUrl
    ? `/post-login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/post-login";

  async function loginWithCredentials(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
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
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} weight="bold" />
          Back to home
        </Link>

        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            SIGN IN
          </span>
        </div>

        <LoginCard loginWithCredentials={loginWithCredentials} error={error} code={code} />
      </div>
    </div>
  );
}
