import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <WarningCircle size={26} weight="bold" />
        </span>
        <h1 className="mt-4 text-xl font-bold">You don&apos;t have access to this page</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          This page is only available to workspace owners. If you think this is a
          mistake, ask an owner to give you access.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <Button asChild>
            <Link href="/staff">Back to Staff</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
