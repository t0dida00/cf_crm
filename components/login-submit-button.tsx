"use client";

import { useFormStatus } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-11 w-full text-base" size="lg">
      {pending ? (
        <>
          <CircleNotch size={18} weight="bold" className="animate-spin" />
          Signing in…
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  );
}
