"use client";

import * as React from "react";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_LABEL } from "@/lib/roles";
import { IS_MOCK } from "@/lib/config";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

/**
 * RoleGate — experience only. The server checks every role; this just prevents a
 * confusing screen. In mock mode it offers a one-click role switch instead of a
 * hard redirect, so the demo can be rehearsed.
 *
 * Children are always rendered so the segment stays in the render tree for
 * instant-navigation validation. When the mock role does not match, the page is
 * covered by a one-click switch card instead of being unmounted.
 */
export function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const current = useDevStore((s) => s.role);
  const setRole = useDevStore((s) => s.setRole);

  // Real mode: rely on the server. The UI only hides what it can.
  if (!IS_MOCK || current === role) return <>{children}</>;

  return (
    <div className="relative">
      <div aria-hidden inert className="pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 z-10 grid place-items-center bg-bench/90 p-6">
        <div className="w-full max-w-[520px] rounded-[12px] border border-rule bg-sheet p-6 shadow-popover">
          <h1 className="font-display text-lg">
            This screen is for {ROLE_LABEL[role].toLowerCase()}s
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            You are viewing as {ROLE_LABEL[current].toLowerCase()}. Switch role to open it.
          </p>
          <Button className="mt-4" onClick={() => setRole(role)}>
            View as {ROLE_LABEL[role].toLowerCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
