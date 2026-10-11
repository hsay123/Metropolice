import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Panel — a white card on the lilac-grey canvas: 1px light border, 16px radius, one
 * soft shadow, 20px padding (docs/MOODBOARD-SPEC.md §3). Panels are separated by
 * space; a rule inside a panel only divides a header from its body.
 */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-ui="panel"
      className={cn(
        "overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--elev-card)]",
        className,
      )}
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
        "flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-[17px] leading-snug font-bold text-[var(--fg)]">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-[var(--fg-muted)]">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3.5",
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
    <div className={cn("grid grid-cols-[140px_1fr] items-baseline gap-4 py-1.5", className)}>
      <dt className="text-[13px] text-[var(--fg-muted)]">{label}</dt>
      <dd className="min-w-0 text-[14px] text-[var(--fg)]">{children}</dd>
    </div>
  );
}
