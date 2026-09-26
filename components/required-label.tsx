import type { ComponentProps } from "react";
import { Label } from "@/components/ui/label";

/**
 * A label for a mandatory field: adds a red asterisk. The asterisk is hidden
 * from screen readers, which announce "required" from the input's own
 * `required` attribute, so pair this with `required` on the input.
 */
export function RequiredLabel({ children, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label {...props}>
      {children}
      <span aria-hidden="true" className="-ml-1 text-destructive">
        *
      </span>
    </Label>
  );
}
