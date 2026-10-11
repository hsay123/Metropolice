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
    { key: "human", label: "Human-reviewed", count: human, color: "var(--primary)" },
    { key: "ai", label: "AI-suggested", count: ai, color: "var(--fg-muted)" },
    { key: "adjudicated", label: "Adjudicated", count: adjudicated, color: "var(--s-paid-fg)" },
  ];
  const total = slices.reduce((n, s) => n + s.count, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-[6px] bg-[var(--surface-2)]"
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
          <li key={s.key} className="flex items-center gap-2 text-[14px]">
            <span className="size-2.5 rounded-[6px]" style={{ background: s.color }} aria-hidden />
            <span className="text-[var(--fg)]">{s.label}</span>
            <span className="flex items-center gap-1.5 tabular-nums text-[var(--fg-muted)]">
              <span>{s.count}</span>
              {total > 0 && <span>{Math.round((s.count / total) * 100)}%</span>}
            </span>
          </li>
        ))}
      </ul>
      {total === 0 && <p className="text-[14px] text-[var(--fg-muted)]">No decisions yet.</p>}
    </div>
  );
}
