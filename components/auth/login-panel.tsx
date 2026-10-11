"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Building2, FlaskConical, Lock, ShieldCheck, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DemoSignIn } from "@/components/auth/demo-signin";
import { HAS_PRIVY, IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";

/**
 * Real sign-in loads lazily and only on the client, so Privy never runs during
 * prerender and the demo build carries no Privy bundle. With no app id configured,
 * mock mode falls back to the role chooser and real mode says plainly that sign-in
 * is not configured (AGENTS.md A5, A6: never fake it).
 */
const PrivySignIn = dynamic(
  () => import("@/components/auth/privy-signin").then((m) => m.PrivySignIn),
  {
    ssr: false,
    loading: () => <div className="h-10 animate-pulse rounded-[10px] bg-[var(--surface-2)]" aria-busy />,
  },
);

/** Product facts, not partner logos. Mirrors the landing's honesty rules. */
const FACTS = [
  { icon: ShieldCheck, title: "Six review layers", sub: "Automatic and human" },
  { icon: Lock, title: "Private media", sub: "Never onchain" },
  { icon: Building2, title: "One receipt per payout", sub: "Monad testnet" },
  { icon: User, title: "Test tokens only", sub: "No real value" },
];

export function LoginPanel() {
  return (
    <div
      className="min-h-dvh"
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, #FFFFFF 0%, var(--bg) 45%, var(--primary-tint) 100%)",
      }}
    >
      <header className="border-b border-[var(--border)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-5 sm:gap-8 sm:px-8">
          <Logo />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 sm:flex" aria-hidden>
              <span className="size-2 rounded-full bg-[var(--fg)]" />
              <span className="h-[2px] w-10 rounded-full bg-[var(--primary)]" />
              <span className="size-2 rounded-full bg-[var(--border-field)]" />
              <span className="h-[2px] w-6 rounded-full bg-[var(--border)]" />
              <span className="size-2 rounded-full bg-[var(--border-field)]" />
              <span className="h-[2px] w-6 rounded-full bg-[var(--border)]" />
              <span className="size-2 rounded-full bg-[var(--border-field)]" />
            </span>
            <span className="text-[13px] font-medium text-[var(--fg-muted)]">Step 1 of 4</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-8 py-16">
        <div className="max-w-[640px]">
          <p className="text-[13px] font-medium text-[var(--fg-muted)]">Physical Data labelling</p>
          <h1 className="mt-3 text-[length:var(--t-hero)] leading-[1.05] font-bold tracking-[-0.025em]">
            Get started with PhysicalData
          </h1>
          <p className="mt-5 text-[18px] leading-[1.55] text-[var(--fg-muted)]">
            Choose how you want to use the platform.
          </p>
        </div>

        <div className="mt-10 max-w-[640px]">
          {HAS_PRIVY ? (
            <PrivySignIn />
          ) : IS_MOCK ? (
            <DemoSignIn />
          ) : (
            <div className="rounded-[16px] border border-dashed border-[var(--border-field)] bg-white px-5 py-5">
              <p className="text-[15px] font-semibold">Sign-in is not configured.</p>
              <p className="mt-1.5 text-[14px] text-[var(--fg-muted)]">
                Set <span className="machine text-xs">NEXT_PUBLIC_PRIVY_APP_ID</span> to turn on email
                and wallet sign-in. This build will not pretend to sign you in.
              </p>
            </div>
          )}

          {!HAS_PRIVY && IS_MOCK && (
            <p className="mt-5 flex items-start gap-2 text-[13px] text-[var(--fg-muted)]">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Demo sign-in. In production this is Privy email or wallet sign-in.{" "}
                {TEST_TOKEN_NOTE}
              </span>
            </p>
          )}
        </div>

        <div className="mt-20 max-w-[880px]">
          <h2 className="text-[16px] font-semibold text-[var(--fg)]">How this platform works</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-8 gap-y-7 lg:grid-cols-4">
            {FACTS.map((f) => (
              <li key={f.title} className="flex flex-col items-center gap-2 text-center">
                <f.icon className="size-5 text-[var(--primary)]" aria-hidden />
                <span className="text-[14px] font-semibold">{f.title}</span>
                <span className="text-[12px] text-[var(--fg-subtle)]">{f.sub}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}