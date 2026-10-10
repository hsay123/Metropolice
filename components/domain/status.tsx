import * as React from "react";
import { Check, Clock, Coins, Flag, Pencil, X, type LucideIcon } from "lucide-react";
import type { JobStatus, TaskState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Status is never colour alone: every status carries an icon and a text label.
 * Colours come straight from the design tokens (AGENTS.md A3).
 */
type Visual = {
  label: string;
  Icon: LucideIcon;
  ink: string;
  bg: string;
  border?: string;
  dashed?: boolean;
};

export const STATUS_VISUAL: Record<TaskState, Visual> = {
  draft: { label: "Draft", Icon: Clock, ink: "var(--pending-ink)", bg: "var(--pending-bg)" },
  submitted: {
    label: "Submitted",
    Icon: Clock,
    ink: "var(--pending-ink)",
    bg: "var(--pending-bg)",
  },
  needs_revision: {
    label: "Needs revision",
    Icon: Pencil,
    ink: "var(--revision-ink)",
    bg: "var(--revision-bg)",
  },
  accepted: {
    label: "Accepted",
    Icon: Check,
    ink: "var(--accepted-ink)",
    bg: "var(--accepted-bg)",
  },
  rejected: { label: "Rejected", Icon: X, ink: "var(--rejected-ink)", bg: "var(--rejected-bg)" },
  appealed: {
    label: "Appealed",
    Icon: Flag,
    ink: "var(--ink)",
    bg: "var(--sheet)",
    border: "var(--ink)",
    dashed: true,
  },
  paid: { label: "Paid", Icon: Coins, ink: "var(--paid-ink)", bg: "var(--paid-bg)" },
};

export function StatusPill({
  state,
  className,
}: {
  state: TaskState;
  className?: string;
}) {
  const v = STATUS_VISUAL[state];
  const { Icon } = v;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium",
        v.dashed && "border border-dashed",
        className,
      )}
      style={{
        color: v.ink,
        background: v.bg,
        borderColor: v.border,
      }}
    >
      <Icon className="size-3" aria-hidden />
      {v.label}
    </span>
  );
}

/** How far along the rail a given state sits. Needs-revision/rejected stop at Submitted. */
function progress(state: TaskState): number {
  switch (state) {
    case "accepted":
      return 1;
    case "paid":
      return 2;
    case "draft":
      return -1;
    default:
      return 0;
  }
}

const STATIONS = [
  { key: "submitted", label: "Submitted" },
  { key: "accepted", label: "Accepted" },
  { key: "paid", label: "Paid" },
] as const;

/**
 * StatusRail — Submitted, Accepted and Paid are always visible as three separate
 * stations, never collapsed. The fill answers the claim action (AGENTS.md A3).
 */
export function StatusRail({
  state,
  className,
}: {
  state: TaskState;
  className?: string;
}) {
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
      <ol className="flex items-center gap-0" aria-label="Submission status">
        {STATIONS.map((s, i) => {
          const done = i <= reached;
          const current = i === reached;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 place-items-center rounded-[2px] border text-xs tabular-nums",
                    done
                      ? "border-transparent text-white"
                      : "border-[var(--field-edge)] text-[var(--ink-muted)]",
                  )}
                  style={{
                    background: done
                      ? current && i === 2
                        ? "var(--paid-ink)"
                        : current && i === 1
                          ? "var(--accepted-ink)"
                          : "var(--brand)"
                      : "var(--sheet)",
                    transition: "background 300ms var(--ease-out)",
                  }}
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    done ? "text-ink" : "text-ink-muted",
                    current && "font-medium",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STATIONS.length - 1 && (
                <span
                  aria-hidden
                  className="mx-2 h-px flex-1"
                  style={{
                    background: i < reached ? "var(--brand)" : "var(--rule)",
                    transition: "background 300ms var(--ease-out)",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
    </div>
  );
}

/**
 * JobStatusPill — the status of a job, distinct from a task's result state.
 * Same rule as elsewhere: an icon and a label, never colour alone.
 */
const JOB_VISUAL: Record<JobStatus, { label: string; Icon: LucideIcon; ink: string; bg: string }> = {
  draft: { label: "Draft", Icon: Clock, ink: "var(--pending-ink)", bg: "var(--pending-bg)" },
  funding: { label: "Funding", Icon: Clock, ink: "var(--pending-ink)", bg: "var(--pending-bg)" },
  active: { label: "Active", Icon: Check, ink: "var(--accepted-ink)", bg: "var(--accepted-bg)" },
  paused: { label: "Paused", Icon: Pencil, ink: "var(--revision-ink)", bg: "var(--revision-bg)" },
  closed: { label: "Closed", Icon: X, ink: "var(--ink-muted)", bg: "var(--wash)" },
};

export function JobStatusPill({ status, className }: { status: JobStatus; className?: string }) {
  const v = JOB_VISUAL[status];
  const { Icon } = v;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium",
        className,
      )}
      style={{ color: v.ink, background: v.bg }}
    >
      <Icon className="size-3" aria-hidden />
      {v.label}
    </span>
  );
}
