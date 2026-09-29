"use client";

import { useFormStatus } from "react-dom";
import { useTranslation } from "react-i18next";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export function LoginSubmitButton({ label, pendingLabel }: { label?: string; pendingLabel?: string }) {
  const { t } = useTranslation();
  const { pending } = useFormStatus();
  label ??= t("auth.signIn");
  pendingLabel ??= t("auth.signingIn");

  return (
    <Button type="submit" disabled={pending} className="h-11 w-full text-base" size="lg">
      {pending ? (
        <>
          <CircleNotch size={18} weight="bold" className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
