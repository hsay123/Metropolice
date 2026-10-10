import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Panel — the one surface for content zones. A sheet with a hairline rule, 6px
 * radius. Panels are separated by 1px `rule` lines, not by shadows (AGENTS.md A3).
 * Shadows belong to floating layers only.
 */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("overflow-hidden rounded-[6px] border border-rule bg-sheet", className)}
      {...props}
    />
  );
}

/** PanelHeader: title on the left, actions on the right, hairline underneath. */
export function PanelHeader({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-rule px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base leading-snug text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 py-4", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

/** A labelled value line inside a panel, used by receipt-like and detail views. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-[140px_1fr] items-baseline gap-4 py-1.5", className)}
    >
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}
