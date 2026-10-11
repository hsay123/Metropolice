"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { HAS_PRIVY, IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";
import { DemoSignIn } from "@/components/auth/demo-signin";

/**
 * The real sign-in is loaded lazily and only on the client, so Privy never runs
 * during prerender and the demo build carries no Privy bundle. When no app id is
 * configured, mock mode falls back to the role picker and real mode says plainly
 * that sign-in is not configured (AGENTS.md A5, A6: never fake it).
 */
const PrivySignIn = dynamic(
  () => import("@/components/auth/privy-signin").then((m) => m.PrivySignIn),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 animate-pulse rounded-[8px] bg-wash" aria-busy />
    ),
  },
);

export function LoginPanel() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        PhysicalData Network
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl">Sign in</h1>
        <p className="text-sm text-ink-muted">
          Choose how you work. Route guards are for experience; the server checks every role.
        </p>
      </div>

      <div className="mt-6">
        {HAS_PRIVY ? (
          <PrivySignIn />
        ) : IS_MOCK ? (
          <DemoSignIn />
        ) : (
          <div className="rounded-[12px] border border-dashed border-[var(--field-edge)] bg-sheet px-4 py-4">
            <p className="text-sm text-ink">Sign-in is not configured.</p>
            <p className="mt-1 text-sm text-ink-muted">
              Set <span className="machine text-xs">NEXT_PUBLIC_PRIVY_APP_ID</span> to turn on email
              and wallet sign-in. This build will not pretend to sign you in.
            </p>
          </div>
        )}
      </div>

      {!HAS_PRIVY && IS_MOCK && (
        <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-muted">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Demo sign-in. In production this is Privy email or wallet sign-in. {TEST_TOKEN_NOTE}
        </p>
      )}
    </main>
  );
}
