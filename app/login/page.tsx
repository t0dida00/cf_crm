import { ArrowLeft, SquaresFour } from "@phosphor-icons/react/ssr";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSubmitButton } from "@/components/login-submit-button";

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

        <div className="rounded-xl border bg-card p-10">
          <h1 className="text-2xl font-bold">Staff &amp; admin sign in</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
            Access to the admin and staff dashboards is restricted.
          </p>

          {error && (
            <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {code === "account_disabled"
                ? "Your account is disabled temporarily. Please contact your owner(s)."
                : error === "AccessDenied"
                  ? "That account isn't allowed. Sign in with a @gmail.com account."
                  : error === "CredentialsSignin"
                    ? "Invalid email or password."
                    : "Something went wrong signing in. Please try again."}
            </p>
          )}

          <form action={loginWithCredentials} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>
            <LoginSubmitButton />
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Only @gmail.com accounts can access /admin and /staff.
          </p>
        </div>
      </div>
    </div>
  );
}
