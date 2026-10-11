import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — 40px, 10px radius, 1px field border, white. Placeholder uses the subtle
 * tone, which is reserved for 14px and above.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-ui="input"
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border border-[var(--border-field)] bg-white px-3 text-[14px] text-[var(--fg)] transition-colors outline-none",
        "placeholder:text-[var(--fg-subtle)]",
        "focus-visible:border-[var(--primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:opacity-60",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[14px] file:font-medium file:text-[var(--fg)]",
        "aria-invalid:border-[var(--s-rejected-fg)] aria-invalid:ring-[3px] aria-invalid:ring-[var(--s-rejected-fg)]/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };