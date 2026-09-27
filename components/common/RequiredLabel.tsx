import type { ComponentProps } from "react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

/**
 * A label for a mandatory field: adds a red asterisk. The asterisk is hidden
 * from screen readers, which announce "required" from the input's own
 * `required` attribute, so pair this with `required` on the input.
 */
export function RequiredLabel({ children, className, ...props }: ComponentProps<typeof Label>) {
  // The asterisk keeps a fixed 4px gap whether the label is flex (the default,
  // which has its own gap) or block (e.g. the setup screen's labels).
  return (
    <Label className={cn("gap-0", className)} {...props}>
      {children}
      <span aria-hidden="true" className="ml-1 text-destructive">
        *
      </span>
    </Label>
  );
}
