"use client";

import { useState } from "react";
import { HandWaving, Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hhmm } from "@/lib/range";
import { TONE_CLASSES } from "@/lib/tone";
import type { TableRequest, TableRequestType } from "@/lib/types";

const TYPE_LABELS: Record<TableRequestType, string> = {
  call_staff: "Called staff",
  checkout: "Requested checkout",
};

export function TableRequestsModal({
  open,
  onOpenChange,
  requests,
  onResolve,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: TableRequest[];
  onResolve: (id: string) => Promise<void>;
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolve(id);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table requests</DialogTitle>
          <DialogDescription>
            Oldest first — first come, first served.
          </DialogDescription>
        </DialogHeader>

        {requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 rounded-xl border p-3.5"
              >
                {request.type === "call_staff" ? (
                  <HandWaving size={18} weight="bold" className="shrink-0 text-brand-500" />
                ) : (
                  <Receipt size={18} weight="bold" className="shrink-0 text-brand-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{request.tableName}</span>
                    <Badge className={TONE_CLASSES.amber}>{TYPE_LABELS[request.type]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Since {hhmm(request.ts)}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={resolvingId === request.id}
                  onClick={() => handleResolve(request.id)}
                >
                  {resolvingId === request.id ? "Resolving…" : "Resolve"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
