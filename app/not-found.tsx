import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TEST_TOKEN_NOTE } from "@/lib/config";

/**
 * 404 — a branded dead end that always offers a way back (AGENTS.md A3: empty
 * states invite action; every page needs a way out).
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-6 py-16"
    >
      <p className="machine text-xs text-ink-muted">404</p>
      <h1 className="mt-2 font-display text-xl text-ink">This page does not exist</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-ink-muted">
        The link may be old, or the job or receipt may have been removed. Nothing was changed by
        opening this address.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/">Go to the home page</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-ink-muted">{TEST_TOKEN_NOTE}</p>
    </main>
  );
}
