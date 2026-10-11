"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Circle,
  FlaskConical,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShieldCheck,
  Tags,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/api/types";
import { NAV, ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = { href: string; label: string };

/** One icon per destination so the collapsed rail still reads as navigation. */
const NAV_ICON: Record<string, typeof Tags> = {
  "/buyer": LayoutGrid,
  "/work/tasks": Tags,
  "/work/earnings": Wallet,
  "/review": ShieldCheck,
  "/admin": ShieldCheck,
  "/receipts": ReceiptText,
};

function iconFor(href: string) {
  return NAV_ICON[href] ?? LayoutGrid;
}

/**
 * SideNav reads usePathname to mark the current page. It lives in a child
 * component wrapped in Suspense by AppShell, because URL data blocks
 * prerendering of dynamic routes if it is read above a Suspense boundary
 * (Next.js: blocking-prerender-client-hook).
 */
function SideNav({
  items,
  collapsed,
}: {
  items: NavItem[];
  collapsed: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = iconFor(item.href);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-sheet font-medium text-ink shadow-[0_1px_2px_rgb(24_32_43/0.06)]"
                : "text-ink-muted hover:bg-sheet/70 hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );

        if (!collapsed) return link;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/** Same shape with no active state, shown while the real nav streams in. */
function SideNavFallback({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const Icon = iconFor(item.href);
        return (
          <span
            key={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm text-ink-muted",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}

/** The compact bar used below the sidebar breakpoint, and the workbench bar. */
function MobileBar({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-rule bg-sheet px-4 sm:px-6">
        <Link href="/" className="shrink-0 font-display text-sm font-semibold whitespace-nowrap">
          PhysicalData Network
        </Link>
        <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
          <React.Suspense fallback={<SideNavFallback items={items} collapsed={false} />}>
            <SideNav items={items} collapsed={false} />
          </React.Suspense>
        </div>
        <NetworkBadge className="shrink-0" />
      </header>
    </div>
  );
}

function NetworkBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex items-center gap-1.5 text-xs text-ink-muted", className)}
        >
          <Circle className="size-2 fill-[var(--accepted-ink)] text-[var(--accepted-ink)]" aria-hidden />
          <span className="hidden sm:inline">Monad testnet</span>
          <span className="sr-only">Connected to Monad testnet</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{TEST_TOKEN_NOTE}</TooltipContent>
    </Tooltip>
  );
}

function WalletChip() {
  return (
    <span className="machine inline-flex items-center gap-1.5 rounded-[8px] bg-sheet px-2 py-1 text-xs text-ink-muted">
      <FlaskConical className="size-3" aria-hidden />
      0x4f…a1
    </span>
  );
}

/**
 * AppShell — the chrome for every role. A 232px left sidebar (collapsible to a
 * 68px icon rail) carrying the workspace, role nav, network state and wallet,
 * beside one content column capped at 1200px so every screen shares a measure
 * (docs/DESIGN.md §3, §8). Below the sidebar breakpoint it collapses to a
 * compact top bar so the dense tables keep their full width.
 */
export function AppShell({
  role,
  children,
  bare = false,
}: {
  role: Role;
  children: React.ReactNode;
  /** Focus mode: no sidebar and no content padding, for workbenches. */
  bare?: boolean;
}) {
  const items = NAV[role];
  const [collapsed, setCollapsed] = React.useState(false);

  if (bare) {
    return (
      <div className="flex min-h-dvh flex-col bg-bench text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-3 focus:z-50 focus:rounded-[8px] focus:border focus:border-field-edge focus:bg-sheet focus:px-3 focus:py-1.5 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-bench text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-3 focus:z-50 focus:rounded-[8px] focus:border focus:border-field-edge focus:bg-sheet focus:px-3 focus:py-1.5 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      {/* sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-rule bg-surface-2 lg:flex",
          collapsed ? "w-[68px]" : "w-[232px]",
        )}
      >
        <div
          className={cn(
            "flex h-12 items-center border-b border-rule px-3",
            collapsed && "justify-center px-0",
          )}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-[8px] bg-brand text-xs font-semibold text-white">
              P
            </span>
            {!collapsed && (
              <span className="truncate font-display text-sm font-semibold">PhysicalData</span>
            )}
          </Link>
        </div>

        <div className={cn("flex h-12 items-center border-b border-rule px-3", collapsed && "justify-center px-0")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm text-ink transition-colors",
                "hover:bg-sheet focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                collapsed && "justify-center px-0",
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-sheet text-[10px] font-semibold text-ink-muted">
                {ROLE_LABEL[role].slice(0, 1)}
              </span>
              {!collapsed && <span className="truncate">{ROLE_LABEL[role]}</span>}
              {!collapsed && <ChevronDown className="ml-auto size-3.5 text-ink-muted" aria-hidden />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <DropdownMenuItem key={r} asChild={IS_MOCK}>
                  {IS_MOCK ? (
                    <Link href={ROLE_HOME[r]}>{ROLE_LABEL[r]}</Link>
                  ) : (
                    <span>{ROLE_LABEL[r]}</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">Switch account</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <React.Suspense fallback={<SideNavFallback items={items} collapsed={collapsed} />}>
            <SideNav items={items} collapsed={collapsed} />
          </React.Suspense>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 border-t border-rule px-3 py-3",
            collapsed ? "flex-col gap-2 px-0" : "justify-between",
          )}
        >
          {collapsed ? (
            <>
              <NetworkBadge />
              <span className="machine rounded-[8px] bg-sheet px-1.5 py-0.5 text-[10px] text-ink-muted">
                0x4f…a1
              </span>
            </>
          ) : (
            <>
              <NetworkBadge />
              <WalletChip />
            </>
          )}
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((v) => !v)}
            className="grid size-7 shrink-0 place-items-center rounded-[8px] text-ink-muted transition-colors hover:bg-sheet hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {collapsed ? <PanelLeftOpen className="size-4" aria-hidden /> : <PanelLeftClose className="size-4" aria-hidden />}
          </button>
        </div>
      </aside>

      {/* content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <MobileBar items={items} />
        </div>
        <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-6">
          {children}
        </main>
      </div>
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