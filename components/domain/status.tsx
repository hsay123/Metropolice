import * as React from "react";
import { Check, Clock, Coins, Flag, Pencil, X, type LucideIcon } from "lucide-react";
import type { JobStatus, TaskState } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { StatusChip, type ChipTone } from "@/components/ui/status-chip";

/**
 * Status is never colour alone: every status carries an icon and a text label, and
 * the chip vocabulary is fixed by docs/MOODBOARD-SPEC.md §2. `paid` is teal, not the
 * brand violet.
 */
type Visual = { label: string; Icon: LucideIcon; tone: ChipTone };

export const STATUS_VISUAL: Record<TaskState, Visual> = {
  draft: { label: "Draft", Icon: Clock, tone: "pending" },
  submitted: { label: "Submitted", Icon: Clock, tone: "progress" },
  needs_revision: { label: "Needs revision", Icon: Pencil, tone: "review" },
  accepted: { label: "Accepted", Icon: Check, tone: "accepted" },
  rejected: { label: "Rejected", Icon: X, tone: "rejected" },
  appealed: { label: "Appealed", Icon: Flag, tone: "appealed" },
  paid: { label: "Paid", Icon: Coins, tone: "paid" },
};

export function StatusPill({ state, className }: { state: TaskState; className?: string }) {
  const v = STATUS_VISUAL[state];
  return (
    <StatusChip tone={v.tone} icon={v.Icon} className={className}>
      {v.label}
    </StatusChip>
  );
}

/**
 * StatusRail: Submitted, Accepted and Paid are always visible as three separate
 * stations, and the rail advances when a claim confirms (AGENTS.md A2).
 */
const STATIONS = ["Submitted", "Accepted", "Paid"] as const;

function progress(state: TaskState): number {
  if (state === "paid") return 2;
  if (state === "accepted") return 1;
  if (state === "draft" || state === "submitted") return 0;
  return -1; // needs_revision, rejected, appealed sit before acceptance
}

export function StatusRail({ state, className }: { state: TaskState; className?: string }) {
  const reached = progress(state);
  const note =
    state === "needs_revision"
      ? "Waiting on you to fix and resubmit."
      : state === "rejected"
        ? "Not paid. You can appeal."
        : state === "appealed"
          ? "Appeal under review."
          : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ol className="flex items-center" aria-label="Submission status">
        {STATIONS.map((label, i) => {
          const done = i <= reached;
          const current = i === reached;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                aria-hidden
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-[8px] text-[11px] tabular-nums",
                  done ? "text-white" : "border border-[var(--border-field)] text-[var(--fg-muted)]",
                )}
                style={{
                  background: done
                    ? i === 2
                      ? "var(--s-paid-fg)"
                      : i === 1
                        ? "var(--s-accepted-fg)"
                        : "var(--primary)"
                    : "var(--surface)",
                  transition: "background var(--motion-base) var(--ease-out)",
                }}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[14px]",
                  done ? "text-[var(--fg)]" : "text-[var(--fg-muted)]",
                  current && "font-semibold",
                )}
              >
                {label}
              </span>
              {i < STATIONS.length - 1 && (
                <span
                  aria-hidden
                  className="mx-3 h-px flex-1"
                  style={{
                    background: i < reached ? "var(--primary)" : "var(--border)",
                    transition: "background var(--motion-base) var(--ease-out)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
      {note && <p className="text-[13px] text-[var(--fg-muted)]">{note}</p>}
    </div>
  );
}

/**
 * JobStatusPill — the status of a job, distinct from a task's result state.
 */
const JOB_VISUAL: Record<JobStatus, Visual> = {
  draft: { label: "Draft", Icon: Clock, tone: "pending" },
  funding: { label: "Funding", Icon: Clock, tone: "progress" },
  active: { label: "Active", Icon: Check, tone: "accepted" },
  paused: { label: "Paused", Icon: Pencil, tone: "review" },
  closed: { label: "Closed", Icon: X, tone: "pending" },
};

export function JobStatusPill({ status, className }: { status: JobStatus; className?: string }) {
  const v = JOB_VISUAL[status];
  return (
    <StatusChip tone={v.tone} icon={v.Icon} className={className}>
      {v.label}
    </StatusChip>
  );
}
