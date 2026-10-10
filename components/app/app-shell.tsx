"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FlaskConical } from "lucide-react";
import type { Role } from "@/lib/api/types";
import { NAV, ROLE_LABEL } from "@/lib/roles";
import { IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = { href: string; label: string };

/**
 * PrimaryNav reads usePathname to mark the current page. It lives in a child
 * component wrapped in Suspense by AppShell, because URL data blocks
 * prerendering of dynamic routes if it is read above a Suspense boundary
 * (Next.js: blocking-prerender-client-hook).
 */
function PrimaryNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[2px] px-2.5 py-1 text-sm transition-colors",
              active
                ? "bg-brand-tint font-medium text-brand-hover"
                : "text-ink-muted hover:bg-wash hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Same shape as PrimaryNav with no active state, shown while it streams in. */
function PrimaryNavFallback({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {items.map((item) => (
        <span key={item.href} className="rounded-[2px] px-2.5 py-1 text-sm text-ink-muted">
          {item.label}
        </span>
      ))}
    </nav>
  );
}

/**
 * AppShell — the chrome for every role except workbenches. A 48px top bar, no
 * left sidebar. Workbenches use the focus TaskBar instead (docs/DESIGN.md §3).
 */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const items = NAV[role];

  return (
    <div className="flex min-h-dvh flex-col bg-bench text-ink">
      <header className="sticky top-0 z-40 h-12 border-b border-rule bg-sheet">
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link
            href="/"
            className="shrink-0 font-display text-sm font-semibold tracking-tight whitespace-nowrap"
          >
            PhysicalData Network
          </Link>

          <div className="-mx-1 min-w-0 overflow-x-auto px-1">
            <React.Suspense fallback={<PrimaryNavFallback items={items} />}>
              <PrimaryNav items={items} />
            </React.Suspense>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  title={TEST_TOKEN_NOTE}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-muted"
                >
                  <FlaskConical className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Monad testnet</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{TEST_TOKEN_NOTE}</TooltipContent>
            </Tooltip>

            <span className="machine hidden rounded-[2px] bg-wash px-1.5 py-0.5 text-xs text-ink md:inline">
              0x4f…a1
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] px-1.5 py-1 text-sm text-ink",
                  "hover:bg-wash focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                )}
              >
                {ROLE_LABEL[role]}
                <ChevronDown className="size-3.5 text-ink-muted" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/login">Switch account</Link>
                </DropdownMenuItem>
                {IS_MOCK && (
                  <DropdownMenuItem disabled>Role switch is in the Mock bar</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-6">{children}</main>
    </div>
  );
}

/**
 * Focus-mode task bar for workbenches: no site navigation, just the task, reward,
 * lease and the save/submit actions (docs/DESIGN.md §3).
 */
export function TaskBar({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex h-10 items-center gap-4 border-b border-rule bg-sheet px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-ink-muted hover:text-ink focus-visible:outline-none"
        >
          Back to tasks
        </button>
      )}
      <div className="flex flex-1 items-center gap-4">{children}</div>
    </div>
  );
}
