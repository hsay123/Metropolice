import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * BudgetBar — spend against budget. One bar, one accent, with the numbers written
 * out so the split is never colour alone.
 */
export function BudgetBar({
  spent,
  budget,
  className,
}: {
  spent: number;
  budget: number;
  className?: string;
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const left = Math.max(0, budget - spent);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-muted">Spent</span>
        <span className="text-sm tabular-nums text-ink">
          {formatAmount(spent)}{" "}
          <span className="text-ink-muted">of {formatAmount(budget)}</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-[8px] bg-wash"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget spent"
      >
        <div className="h-full rounded-[8px] bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
        <span>{formatAmount(left)} left</span>
        <span className="tabular-nums">{pct}% spent</span>
      </p>
    </div>
  );
}
