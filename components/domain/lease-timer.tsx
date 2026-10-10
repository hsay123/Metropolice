"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { msToCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNow } from "@/lib/hooks/useNow";

/**
 * LeaseTimer — how long the contributor still holds the task. Announces the last
 * minute and the end in a live region (AGENTS.md A7).
 *
 * `expiresAt` comes from the server. The live clock lives in useNow, which never
 * calls Date.now during a render pass, so SSR stays deterministic.
 */
export function LeaseTimer({
  expiresAt,
  className,
}: {
  expiresAt: string;
  className?: string;
}) {
  const end = React.useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const now = useNow(1000);
  const mounted = now !== null;

  const remaining = end - (now ?? end);
  const ended = remaining <= 0;
  const urgent = !ended && remaining <= 2 * 60_000;

  const announcement = ended
    ? "Lease ended. Your draft is saved."
    : remaining <= 60_000
      ? "Lease ends in less than one minute."
      : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs tabular-nums",
        ended
          ? "text-[var(--rejected-ink)]"
          : urgent
            ? "text-[var(--revision-ink)]"
            : "text-ink-muted",
        className,
      )}
    >
      <Clock className="size-3.5" aria-hidden />
      <span className="machine" suppressHydrationWarning>
        {!mounted ? "--:--" : ended ? "Lease ended" : msToCountdown(remaining)}
      </span>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}