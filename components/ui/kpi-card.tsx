import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * KpiCard — one figure from the board's four-across row.
 *
 * The board shows a delta chip and a 56x24 sparkline. Both are **optional and
 * off by default**: a trend implies history we do not have, so a sparkline or a
 * "+12%" only renders when the caller supplies a real `series`. With no series
 * this is deliberately just a label and a number.
 *
 * `series` is requested from the backend in docs/API-NEEDS.md; until it arrives,
 * every card renders the plain form.
 */
export type KpiSeries = {
  /** Oldest to newest. Two or more points. */
  points: number[];
  /** Percentage change across the window, e.g. 12.4 for +12.4%. */
  deltaPct?: number;
};

export function KpiCard({
  label,
  value,
  hint,
  series,
  tone = "neutral",
  loading = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  series?: KpiSeries;
  tone?: "neutral" | "primary" | "positive";
  /** While the figure is loading, render a placeholder rather than a zero. */
  loading?: boolean;
  className?: string;
}) {
  const spark = series && series.points.length > 1 ? buildSparkPath(series.points) : null;
  const up = (series?.deltaPct ?? 0) >= 0;

  return (
    <Card data-ui="kpi-card" className={cn("p-5", className)}>
      <p className="text-[13px] text-[var(--fg-muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        {loading ? (
          <span
            className="h-8 w-24 animate-pulse rounded-[8px] bg-[var(--surface-2)]"
            aria-busy
            aria-label={`${label} is loading`}
          />
        ) : (
          <span
            className={cn(
              "font-display text-[32px] leading-none font-bold tabular-nums",
              tone === "primary" && "text-[var(--primary)]",
              tone === "positive" && "text-[var(--s-accepted-fg)]",
              tone === "neutral" && "text-[var(--fg)]",
            )}
          >
            {value}
          </span>
        )}

        {series?.deltaPct != null && (
          <span
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-[8px] px-2 text-[12px] font-semibold tabular-nums",
              up ? "bg-[var(--s-accepted-bg)] text-[var(--s-accepted-fg)]" : "bg-[var(--s-rejected-bg)] text-[var(--s-rejected-fg)]",
            )}
          >
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {up ? "+" : ""}
            {series.deltaPct.toFixed(1)}%
          </span>
        )}
      </div>

      {spark && (
        <svg
          data-ui="sparkline"
          viewBox="0 0 56 24"
          className="mt-3 h-6 w-14 text-[var(--primary)]"
          role="img"
          aria-label={`Trend for ${label}`}
        >
          <path d={spark} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {hint && <p className="mt-2 text-[13px] text-[var(--fg-muted)]">{hint}</p>}
    </Card>
  );
}

/** Maps a series onto a 56x24 path, scaled to its own min and max. */
function buildSparkPath(points: number[]): string {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 56;
      const y = 22 - ((p - min) / span) * 20;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}