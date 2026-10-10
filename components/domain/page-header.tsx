import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the title block for a screen. A quiet context line (the role in
 * sentence case, never a tracked-out eyebrow), the page title, an optional
 * one-line description and right-aligned actions.
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
        {context && <p className="text-xs text-ink-muted">{context}</p>}
        <h1 className="mt-0.5 font-display text-xl leading-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[80ch] text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
