import { Gavel, ShieldCheck, Sparkles, UserCheck, type LucideIcon } from "lucide-react";
import type { ReviewerType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * DecisionSource — every label and decision is marked human-made, AI-suggested,
 * human-reviewed or adjudicated (PRD §9, AGENTS.md A7). Quiet text badge, not a
 * status pill.
 */
const SOURCE: Record<ReviewerType, { label: string; Icon: LucideIcon }> = {
  code: { label: "Automatic check", Icon: ShieldCheck },
  ai: { label: "AI-suggested", Icon: Sparkles },
  human: { label: "Human-reviewed", Icon: UserCheck },
  adjudicated: { label: "Adjudicated", Icon: Gavel },
};

export function DecisionSource({
  source,
  className,
}: {
  source: ReviewerType;
  className?: string;
}) {
  const { label, Icon } = SOURCE[source];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-ink-muted", className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
