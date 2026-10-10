"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ROLES: { role: Role; blurb: string }[] = [
  { role: "buyer", blurb: "Post a job, fund it, and export accepted work." },
  { role: "contributor", blurb: "Claim a task, label the media, get paid when it passes review." },
  { role: "reviewer", blurb: "Compare a submission with the reference and decide with a reason." },
  { role: "admin", blurb: "Guard the money: roles, the signer policy, and approvals." },
];

/**
 * DemoSignIn — the mock sign-in. It is a role landing, not a fake auth system, and
 * it says so. Choosing a role sets the dev role and opens that role's home
 * (AGENTS.md A5, A6). Real email and wallet sign-in is Privy and is used when
 * NEXT_PUBLIC_PRIVY_APP_ID is set.
 */
export function DemoSignIn() {
  const router = useRouter();
  const setRole = useDevStore((s) => s.setRole);
  const current = useDevStore((s) => s.role);
  const [pending, setPending] = React.useState<Role | null>(null);

  function choose(role: Role) {
    setPending(role);
    setRole(role);
    router.push(ROLE_HOME[role]);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="overflow-hidden rounded-[6px] border border-rule bg-sheet">
        {ROLES.map(({ role, blurb }, i) => (
          <li key={role} className={cn(i > 0 && "border-t border-rule")}>
            <button
              type="button"
              onClick={() => choose(role)}
              disabled={pending !== null}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                "hover:bg-wash focus-visible:bg-wash focus-visible:outline-none",
                "disabled:opacity-60",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-base text-ink">{ROLE_LABEL[role]}</span>
                <span className="text-sm text-ink-muted">{blurb}</span>
              </span>
              {role === current ? (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--accepted-ink)]">
                  <Check className="size-3.5" aria-hidden />
                  Current
                </span>
              ) : (
                <ArrowRight
                  className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
