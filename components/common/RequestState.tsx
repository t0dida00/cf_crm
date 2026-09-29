"use client";

import { useTranslation } from "react-i18next";
import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
        className,
      )}
    >
      <CircleNotch size={16} weight="bold" className="animate-spin" />
      {label ?? t("common.loading")}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}
    >
      <p className="flex items-center gap-2 text-sm text-destructive">
        <WarningCircle size={16} weight="bold" />
        {message ?? t("common.loadFailed")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.tryAgain")}
        </Button>
      )}
    </div>
  );
}
