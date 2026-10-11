import * as React from "react";
import { cn } from "@/lib/utils";

export type PipelineStage = {
  key: string;
  label: string;
  count: number;
  /** Token colour for the meter. The label and number always carry the meaning. */
  color: string;
};

/**
 * PipelineLedger — where the work is across the four stations. Each stage shows
 * its count and a meter sized against the number that entered the funnel, so the
 * dashboard shows the pipeline rather than a row of KPI tiles (docs/DESIGN.md
 * §4.3, §8). The meter is decorative; the label and the count carry the state.
 */
export function PipelineLedger({
  stages,
  reference,
  note,
  className,
}: {
  stages: PipelineStage[];
  /** The 100% basis, normally the number submitted. Defaults to the largest stage. */
  reference?: number;
  note?: React.ReactNode;
  className?: string;
}) {
  const top = Math.max(1, reference ?? Math.max(...stages.map((s) => s.count), 0));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ol className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {stages.map((s) => {
          const pct = Math.min(100, Math.round((s.count / top) * 100));
          return (
            <li key={s.key} className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-muted">{s.label}</span>
              <span className="font-display text-xl leading-none font-semibold tabular-nums text-ink">
                {s.count.toLocaleString("en-US")}
              </span>
              <span className="mt-0.5 h-1 w-full overflow-hidden rounded-[8px] bg-wash" aria-hidden>
                <span
                  className="block h-full rounded-[8px]"
                  style={{ width: `${pct}%`, background: s.color }}
                />
              </span>
            </li>
          );
        })}
      </ol>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
    </div>
  );
}
