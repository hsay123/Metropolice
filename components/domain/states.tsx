import * as React from "react";
import { Inbox, RotateCcw, TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Empty states invite action: say what is missing and how to start. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-[16px] border border-dashed border-[var(--border-field)] bg-[var(--surface-2)] px-6 py-10",
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-[10px] bg-[var(--surface)] text-[var(--fg-muted)]">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <p className="font-display text-[17px] font-bold text-[var(--fg)]">{title}</p>
      {description && <p className="max-w-[60ch] text-[14px] text-[var(--fg-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Errors say what happened and how to fix it. They do not apologise. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-2 rounded-[16px] border border-[var(--s-rejected-fg)]/30 bg-[var(--s-rejected-bg)] px-6 py-6",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 text-[var(--s-rejected-fg)]">
        <TriangleAlert className="size-4" aria-hidden />
        <span className="font-display text-[16px] font-bold">{title}</span>
      </span>
      <p className="max-w-[60ch] text-[14px] text-[var(--fg)]">{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          <RotateCcw aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}

/** Skeleton shaped like the table it replaces, so there is no layout shift. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" style={{ opacity: 1 - r * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
