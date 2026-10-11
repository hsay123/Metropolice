"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { IS_MOCK } from "@/lib/config";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

/**
 * RoleGate — experience only. The server checks every role; this just tells the
 * person what happened when the mock role and the route disagree.
 *
 * It is a banner, not a modal. An earlier version covered the page with a faded
 * overlay and a card, which turned a one-click fix into a dead end and hid the
 * screen entirely. The banner states the mismatch, offers one click, and leaves
 * the content readable so the demo can rehearse a role switch without losing its
 * place.
 *
 * Children always render so the segment stays mounted for instant navigation.
 */
export function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const current = useDevStore((s) => s.role);
  const setRole = useDevStore((s) => s.setRole);

  // Real mode: rely on the server. The UI only hides what it can.
  if (!IS_MOCK || current === role) return <>{children}</>;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-[var(--revision-ink)]/30 bg-[var(--revision-bg)] px-4 py-3"
      >
        <UserCheck className="size-4 shrink-0 text-[var(--revision-ink)]" aria-hidden />
        <p className="flex-1 text-sm text-ink">
          You are viewing as {ROLE_LABEL[current].toLowerCase()}. This is the{" "}
          {ROLE_LABEL[role].toLowerCase()} area.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setRole(role)}
          className="shrink-0"
        >
          Switch to {ROLE_LABEL[role].toLowerCase()}
        </Button>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={ROLE_HOME[current]}>
            <ArrowLeft aria-hidden />
            Back to {ROLE_LABEL[current].toLowerCase()} home
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}