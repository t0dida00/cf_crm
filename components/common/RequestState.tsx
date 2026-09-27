"use client";

import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
        className,
      )}
    >
      <CircleNotch size={16} weight="bold" className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  message = "Couldn't load this data.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}
    >
      <p className="flex items-center gap-2 text-sm text-destructive">
        <WarningCircle size={16} weight="bold" />
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
