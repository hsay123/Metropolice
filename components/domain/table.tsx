import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A quiet data table built on the tokens (docs/MOODBOARD-SPEC.md §3). A light,
 * low-contrast header, rows separated by 1px `--border` lines, numbers tabular, no
 * zebra striping and no card wrapper — the panel around it provides the surface.
 *
 * These are thin wrappers so every table in the app reads the same. Screens compose
 * them directly; nothing here is a third-party table library.
 */
export function DataTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-[14px]", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-[var(--border)] bg-[var(--surface-2)] text-left", className)}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn(className)} {...props} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface-2)]",
        className,
      )}
      {...props}
    />
  );
}

export function TH({
  numeric,
  className,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "h-11 px-4 align-middle text-[12px] font-semibold whitespace-nowrap text-[var(--fg-muted)]",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  numeric,
  className,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-[14px] text-[var(--fg)]",
        numeric && "text-right tabular-nums whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
