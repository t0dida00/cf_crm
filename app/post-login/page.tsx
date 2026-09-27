import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackPath } from "@/lib/safe-redirect";

const OWNER_ONLY_PREFIXES = ["/admin", "/qr-generation"];

export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Only paths inside the app: never another site (open redirect).
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  const session = await auth();
  const role = (session as { role?: string | null } | null)?.role;

  const isOwner = role === "OWNER";
  const defaultTarget = isOwner ? "/admin" : "/staff";

  // A callbackUrl from being bounced off an owner-only page is only honored
  // for an OWNER — a STAFF login goes straight to /staff instead of
  // bouncing through the page it can't access and back out again.
  const wantsOwnerOnlyRoute =
    callbackUrl && OWNER_ONLY_PREFIXES.some((p) => callbackUrl.startsWith(p));
  const target = callbackUrl && (!wantsOwnerOnlyRoute || isOwner) ? callbackUrl : defaultTarget;

  redirect(target);
}
