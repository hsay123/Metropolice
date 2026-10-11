import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the title block for a screen. A quiet context line (the role in
 * sentence case, never a tracked-out eyebrow), a 28px display title, an optional
 * one-line description and right-aligned actions. Sits at the top of every screen
 * inside the shell's 1280px column.
 */
export function PageHeader({
  context,
  title,
  description,
  actions,
  className,
}: {
  context?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {context && <p className="text-[13px] font-medium text-[var(--fg-muted)]">{context}</p>}
        <h1 className="mt-1 font-display text-[28px] leading-tight font-bold tracking-[-0.02em] text-[var(--fg)]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[68ch] text-[14px] text-[var(--fg-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
