import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusChip — the board's status vocabulary. Height 24, radius 8, 12/600, always
 * with a 14px icon so the state never depends on colour alone.
 *
 * `paid` is teal here, not purple: violet is the brand in this system (see the
 * conflict resolution in docs/MOODBOARD-SPEC.md §1).
 */
export type ChipTone =
  | "progress"
  | "review"
  | "accepted"
  | "rejected"
  | "paid"
  | "pending"
  | "appealed";

const TONE: Record<ChipTone, { bg: string; fg: string }> = {
  progress: { bg: "var(--s-progress-bg)", fg: "var(--s-progress-fg)" },
  review: { bg: "var(--s-review-bg)", fg: "var(--s-review-fg)" },
  accepted: { bg: "var(--s-accepted-bg)", fg: "var(--s-accepted-fg)" },
  rejected: { bg: "var(--s-rejected-bg)", fg: "var(--s-rejected-fg)" },
  paid: { bg: "var(--s-paid-bg)", fg: "var(--s-paid-fg)" },
  pending: { bg: "var(--s-pending-bg)", fg: "var(--s-pending-fg)" },
  appealed: { bg: "#FFFFFF", fg: "var(--fg-muted)" },
};

export function StatusChip({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: ChipTone;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      data-ui="status-chip"
      data-tone={tone}
      style={{ background: t.bg, color: t.fg }}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-semibold whitespace-nowrap",
        tone === "appealed" && "border border-dashed border-[var(--fg-muted)]",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

/** Tag — the violet-tint label used for data types and rubric kinds. */
export function Tag({
  tone = "primary",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: "primary" | "neutral" }) {
  return (
    <span
      data-ui="tag"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-semibold whitespace-nowrap",
        tone === "primary"
          ? "bg-[var(--primary-tint)] text-[var(--primary-hover)]"
          : "bg-[var(--surface-2)] text-[var(--fg-muted)]",
        className,
      )}
      {...props}
    />
  );
}