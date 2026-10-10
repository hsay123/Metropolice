import * as React from "react";
import { cn } from "@/lib/utils";

export type MixSlice = {
  key: string;
  label: string;
  count: number;
  color: string;
};

/**
 * ReviewMix — how accepted work was decided: AI-suggested, human-reviewed,
 * adjudicated. A stacked bar with a written legend and counts, so the split is
 * never colour alone (AGENTS.md A2: buyers see the AI vs human review share).
 */
export function ReviewMix({
  ai,
  human,
  adjudicated,
  className,
}: {
  ai: number;
  human: number;
  adjudicated: number;
  className?: string;
}) {
  const slices: MixSlice[] = [
    { key: "human", label: "Human-reviewed", count: human, color: "var(--brand)" },
    { key: "ai", label: "AI-suggested", count: ai, color: "var(--ink-muted)" },
    { key: "adjudicated", label: "Adjudicated", count: adjudicated, color: "var(--paid-ink)" },
  ];
  const total = slices.reduce((n, s) => n + s.count, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="flex h-2 w-full overflow-hidden rounded-[2px] bg-wash"
        role="img"
        aria-label={slices.map((s) => `${s.label} ${s.count}`).join(", ")}
      >
        {total > 0 &&
          slices.map((s) =>
            s.count > 0 ? (
              <span
                key={s.key}
                style={{ width: `${(s.count / total) * 100}%`, background: s.color }}
                className="h-full"
              />
            ) : null,
          )}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-[2px]" style={{ background: s.color }} aria-hidden />
            <span className="text-ink">{s.label}</span>
            <span className="flex items-center gap-1.5 tabular-nums text-ink-muted">
              <span>{s.count}</span>
              {total > 0 && <span>{Math.round((s.count / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
      {total === 0 && <p className="text-sm text-ink-muted">No decisions yet.</p>}
    </div>
  );
}
