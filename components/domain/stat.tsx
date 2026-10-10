import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stat — a number that matters, so it is set in Bricolage with tabular figures.
 * A label sits above it; an optional hint (a caveat, a sample size) sits below.
 */
export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="font-display text-xl leading-none font-semibold tabular-nums text-ink">
        {value}
      </span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}

/** A row of stats separated by hairline rules, no boxes. */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-y-4 divide-x divide-rule",
        "[&>*]:min-w-[140px] [&>*]:px-5 [&>*:first-child]:pl-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
