import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/app/actions";
import { getServerT } from "@/lib/i18n/server";

export default async function UnauthorizedPage() {
  const { t } = await getServerT();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <WarningCircle size={26} weight="bold" />
        </span>
        <h1 className="mt-4 text-xl font-bold">{t("auth.unauthorized.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          {t("auth.unauthorized.body")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <Button asChild>
            <Link href="/staff">{t("auth.unauthorized.backToStaff")}</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              {t("auth.unauthorized.signOut")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
