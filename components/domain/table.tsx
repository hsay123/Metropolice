import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A quiet data table built on the tokens. Header is `wash`, rows are separated by
 * 1px `rule` lines, numbers are tabular. No zebra striping and no card wrapper —
 * the panel around it provides the surface (AGENTS.md A3: rules instead of cards).
 *
 * These are thin wrappers so every table in the app reads the same. Screens compose
 * them directly; nothing here is a third-party table library.
 */
export function DataTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-wash text-left", className)} {...props} />;
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn(className)} {...props} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-rule last:border-0 transition-colors", className)}
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
        "h-9 px-3 align-middle text-xs font-medium whitespace-nowrap text-ink-muted",
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
        "px-3 py-2.5 align-middle text-sm text-ink",
        numeric && "text-right tabular-nums whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
