import * as React from "react"

import { cn } from "@/lib/utils"

/** Every text input is capped at 250 characters unless it passes its own maxLength
 * (text areas aren't limited). The backend rejects longer values too. */
export const INPUT_MAX_LENGTH = 250

function Input({ className, type, maxLength = INPUT_MAX_LENGTH, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      maxLength={maxLength}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input-border bg-transparent px-3 py-1 text-base transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
