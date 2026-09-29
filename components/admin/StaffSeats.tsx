import { cn } from "@/lib/utils";

/** How many of the plan's staff accounts are taken: a line of text and a small meter. */
export function StaffSeats({ used, limit }: { used: number; limit: number }) {
  const full = used >= limit;
  return (
    <div className="mb-4 max-w-sm">
      <p className="text-sm">
        <span className="font-semibold">
          {used} of {limit}
        </span>{" "}
        <span className="text-muted-foreground">staff accounts used</span>
      </p>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < used ? (full ? "bg-amber-500" : "bg-brand-600") : "bg-brand-100")}
          />
        ))}
      </div>
      {full && (
        <p role="status" className="mt-1.5 text-sm text-amber-800">
          All {limit} are in use. Remove an account to add someone new.
        </p>
      )}
    </div>
  );
}
