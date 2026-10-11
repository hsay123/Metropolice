import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MediaStage — the dark surround media is judged against (AGENTS.md A3: `stage` is
 * for media only). Everything on it uses `stage-ink` so text stays legible. The
 * brand cobalt is too dark on the stage, so accents here use `brand-on-stage`.
 */
export function MediaStage({
  children,
  toolbar,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  /** A thin control strip pinned to the top of the stage. */
  toolbar?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] bg-stage text-stage-ink",
        className,
      )}
    >
      {toolbar && (
        <div className="flex h-10 shrink-0 items-center gap-3 overflow-x-auto border-b border-white/10 px-3">
          {toolbar}
        </div>
      )}
      <div className={cn("relative flex min-h-0 flex-1 items-center justify-center p-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

/** A control that sits on the dark stage. */
export function StageButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-[8px] px-2 text-xs text-stage-ink/80 transition-colors",
        "hover:bg-stage-raised hover:text-stage-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-on-stage)]",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
