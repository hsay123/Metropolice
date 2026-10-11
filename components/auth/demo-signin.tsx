"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Check, Loader2, ScanSearch, ShieldCheck, Tag, type LucideIcon } from "lucide-react";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ROLES: { role: Role; icon: LucideIcon; blurb: string }[] = [
  {
    role: "buyer",
    icon: Briefcase,
    blurb: "Post a job, fund it, and export accepted work.",
  },
  {
    role: "contributor",
    icon: Tag,
    blurb: "Claim a task, label the media, get paid when it passes review.",
  },
  {
    role: "reviewer",
    icon: ScanSearch,
    blurb: "Compare a submission with the reference and decide with a reason.",
  },
  {
    role: "admin",
    icon: ShieldCheck,
    blurb: "Guard the money: roles, the signer policy, and quorum approvals.",
  },
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
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ROLES.map(({ role, icon: Icon, blurb }) => {
        const isCurrent = role === current;
        return (
          <li key={role} className="flex">
            <button
              type="button"
              onClick={() => choose(role)}
              disabled={pending !== null}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "group flex h-full w-full flex-col gap-2 rounded-[6px] border p-3.5 text-left transition-colors",
                "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                isCurrent
                  ? "border-brand bg-brand-tint"
                  : "border-field-edge bg-sheet hover:bg-wash",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
                <span className="font-display text-base text-ink">{ROLE_LABEL[role]}</span>
                {pending === role ? (
                  <Loader2 className="ml-auto size-4 animate-spin text-ink-muted" aria-hidden />
                ) : role === current ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--accepted-ink)]">
                    <Check className="size-3.5" aria-hidden />
                    Current
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
                    Continue
                  </span>
                )}
              </span>
              <span className="text-sm text-ink-muted">{blurb}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
