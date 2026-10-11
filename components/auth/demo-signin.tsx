"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, User, type LucideIcon } from "lucide-react";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const OPTIONS: { role: Role; icon: LucideIcon; tint: string; blurb: string }[] = [
  {
    role: "buyer",
    icon: Building2,
    tint: "var(--s-progress-bg)",
    blurb: "Upload data, manage annotation projects, and receive only the labels that pass review.",
  },
  {
    role: "contributor",
    icon: User,
    tint: "var(--primary-tint)",
    blurb: "Annotate real-world data, build your profile, and earn for accepted work.",
  },
];

/**
 * DemoSignIn — the mock chooser. It is a role landing, not a fake auth system, and
 * it says so. Reviewer and admin sign-in is deliberately not offered here: those
 * roles are assigned, not self-selected, and pretending otherwise would overstate
 * who can reach the money controls (AGENTS.md A5, A6).
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {OPTIONS.map(({ role, icon: Icon, tint, blurb }) => {
        const isCurrent = role === current;
        const isPending = pending === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => choose(role)}
            disabled={pending !== null}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "group flex h-full flex-col items-start rounded-[16px] border border-[var(--border)] bg-white p-6 text-left shadow-[var(--elev-card)]",
              "transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--elev-float)]",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
              isCurrent && "border-[var(--primary)] ring-1 ring-[var(--primary)]",
              pending !== null && "cursor-not-allowed opacity-70",
            )}
          >
            <span
              className="grid size-12 place-items-center rounded-[12px]"
              style={{ background: tint }}
            >
              <Icon className="size-5 text-[var(--primary-hover)]" aria-hidden />
            </span>

            <span className="mt-5 font-display text-[18px] font-bold">
              {role === "buyer" ? "I'm from a company" : "I'm a contributor"}
            </span>
            <span className="mt-2 text-[14px] text-[var(--fg-muted)]">{blurb}</span>

            <span className="mt-6 flex items-center gap-3">
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-full border border-[var(--border-field)]",
                  "transition-colors group-hover:border-[var(--primary)] group-hover:bg-[var(--primary-tint)]",
                )}
                aria-hidden
              >
                <ArrowRight className="size-4" />
              </span>
              <span className="text-[13px] font-medium text-[var(--primary-hover)]">
                {isPending
                  ? "Opening…"
                  : isCurrent
                    ? `Continue as ${ROLE_LABEL[role]}`
                    : role === "buyer"
                      ? "Continue as a company"
                      : "Continue as a contributor"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}