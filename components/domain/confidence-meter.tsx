import { KIMI_CONFIDENCE_THRESHOLD } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * ConfidenceMeter — Kimi's confidence as a bar plus a number. Below the threshold
 * the item is sent to human review, and we say so (AGENTS.md A7).
 */
export function ConfidenceMeter({
  confidence,
  threshold = KIMI_CONFIDENCE_THRESHOLD,
  className,
}: {
  confidence: number;
  threshold?: number;
  className?: string;
}) {
  const pct = Math.round(confidence * 100);
  const below = confidence < threshold;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-muted">AI confidence</span>
        <span className="machine text-xs tabular-nums text-ink">{pct}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-[8px] bg-wash"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="AI confidence"
      >
        <div
          className="h-full rounded-[8px]"
          style={{
            width: `${pct}%`,
            background: below ? "var(--revision-ink)" : "var(--accepted-ink)",
            transition: "width 200ms var(--ease-out)",
          }}
        />
      </div>
      {below && <p className="text-xs text-[var(--revision-ink)]">Sent to human review</p>}
    </div>
  );
}
