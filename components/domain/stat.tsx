import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stat — a number that matters, set in Satoshi with tabular figures. A label sits
 * above it; an optional hint (a caveat, a sample size) sits below. Flat, so a row of
 * stats can live inside a panel without nesting cards (docs/MOODBOARD-SPEC.md §3).
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] text-[var(--fg-muted)]">{label}</span>
      <span className="font-display text-[28px] leading-none font-bold tracking-[-0.02em] tabular-nums text-[var(--fg)]">
        {value}
      </span>
      {hint && <span className="text-[13px] text-[var(--fg-muted)]">{hint}</span>}
    </div>
  );
}

/** A grid of stats. No boxes: the panel around them is the only surface. */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3", className)}>
      {children}
    </div>
  );
}
