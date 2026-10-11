import {
  CheckCircle2,
  Coins,
  FilePlus2,
  Landmark,
  PauseCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { TxLink } from "@/components/domain/machine";
import { formatAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import type { ChainEvent } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const EVENTS: Record<ChainEvent["name"], { label: string; Icon: LucideIcon }> = {
  JobCreated: { label: "Job created", Icon: FilePlus2 },
  JobFunded: { label: "Job funded", Icon: Landmark },
  TaskAccepted: { label: "Task accepted", Icon: CheckCircle2 },
  PayoutClaimable: { label: "Payout claimable", Icon: Wallet },
  PayoutClaimed: { label: "Payout claimed", Icon: Coins },
  JobPaused: { label: "Job paused", Icon: PauseCircle },
};

/**
 * ChainFeed — the on-chain trail for a job or the whole workspace. Every row
 * carries its own transaction link, so a buyer can check any claim against Monad
 * without trusting the app (AGENTS.md A2).
 */
export function ChainFeed({ events, className }: { events: ChainEvent[]; className?: string }) {
  if (events.length === 0) {
    return <p className={cn("text-sm text-ink-muted", className)}>No on-chain activity yet.</p>;
  }
  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((ev) => {
        const { label, Icon } = EVENTS[ev.name];
        return (
          <li
            key={ev.id}
            className="flex items-start gap-3 border-t border-rule py-3 first:border-t-0 first:pt-0"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[8px] bg-wash">
              <Icon className="size-3.5 text-ink-muted" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-ink">{label}</span>
                {typeof ev.amount === "number" && (
                  <span className="text-sm tabular-nums text-ink-muted">
                    {formatAmount(ev.amount)}
                  </span>
                )}
                {ev.taskId && <span className="machine text-xs text-ink-muted">{ev.taskId}</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                <span>{formatDateTime(ev.at)}</span>
                {typeof ev.blockNumber === "number" && (
                  <span className="tabular-nums">Block {ev.blockNumber.toLocaleString("en-US")}</span>
                )}
                <TxLink txHash={ev.txHash} state="confirmed" />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
