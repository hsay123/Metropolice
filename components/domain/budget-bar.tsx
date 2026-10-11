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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-[var(--fg-muted)]">Spent</span>
        <span className="text-[14px] tabular-nums text-[var(--fg)]">
          {formatAmount(spent)}{" "}
          <span className="text-[var(--fg-muted)]">of {formatAmount(budget)}</span>
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-[6px] bg-[var(--surface-2)]"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget spent"
      >
        <div className="h-full rounded-[6px] bg-[var(--primary)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-[var(--fg-muted)]">
        <span>{formatAmount(left)} test USDC left</span>
        <span className="tabular-nums">{pct}% spent</span>
      </p>
    </div>
  );
}
