"use client";

import * as React from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route error boundary. It says what happened and offers a retry, per the voice
 * rules. It never hides the failure behind a success state.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-6 py-16"
    >
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-[12px] border border-[var(--rejected-ink)]/30 bg-[var(--rejected-bg)] px-6 py-6"
      >
        <span className="inline-flex items-center gap-2 text-[var(--rejected-ink)]">
          <TriangleAlert className="size-4" aria-hidden />
          <span className="font-display text-base">Something went wrong</span>
        </span>
        <p className="max-w-[60ch] text-sm text-ink">
          This screen could not finish loading. Nothing was saved or paid. Try again, and if it
          keeps failing, send us the reference below.
        </p>
        {error.digest && (
          <p className="machine text-xs text-ink-muted">Reference {error.digest}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Go to the homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
