"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  ShieldCheck,
  Tags,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/api/types";
import { NAV, ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { workspaceFor } from "@/lib/workspace";
import { IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/primitives";
import { CommandPalette, type PaletteItem } from "@/components/app/command-palette";
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
  "/buyer": Tags,
  "/buyer/jobs/new": ReceiptText,
  "/work/tasks": Tags,
  "/work/earnings": Wallet,
  "/review": ShieldCheck,
  "/admin": ShieldCheck,
};

function iconFor(href: string) {
  return NAV_ICON[href] ?? Tags;
}

/** Human labels for breadcrumb segments. Ids stay as-is rather than being prettified. */
const SEGMENT_LABEL: Record<string, string> = {
  buyer: "Buyer",
  jobs: "Jobs",
  new: "New job",
  work: "Contributor",
  tasks: "Tasks",
  earnings: "Earnings",
  qualify: "Qualification",
  review: "Review",
  admin: "Admin",
  receipts: "Receipt",
  dev: "Dev",
  components: "Components",
};

function crumbFor(pathname: string, role: Role): string[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [ROLE_LABEL[role]];
  return parts.map((p) => SEGMENT_LABEL[p] ?? p);
}

function paletteItems(role: Role): PaletteItem[] {
  const items: PaletteItem[] = NAV[role].map((n) => ({ group: "Go to", label: n.label, href: n.href }));
  if (role === "buyer") {
    items.push({ group: "Actions", label: "Post a labelling job", href: "/buyer/jobs/new" });
  }
  if (role === "contributor") {
    items.push({ group: "Go to", label: "Start qualification", href: "/work/qualify" });
  }
  items.push({ group: "Account", label: "Switch workspace", href: "/login" });
  return items;
}

/**
 * SideNav reads usePathname to mark the current page. It lives in a child
 * component wrapped in Suspense by AppShell, because URL data blocks
 * prerendering of dynamic routes if it is read above a Suspense boundary
 * (Next.js: blocking-prerender-client-hook).
 */
function SideNav({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = iconFor(item.href);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-[var(--primary-tint)] font-semibold text-[var(--primary-hover)]"
                : "font-medium text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
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

/** Same shape, no active state: shown while the real nav streams in. */
function SideNavFallback({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = iconFor(item.href);
        return (
          <span
            key={item.href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium text-[var(--fg-muted)]",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}

/** The persistent mock badge. Present whenever the client is serving mock data. */
function MockBadge({ className }: { className?: string }) {
  return (
    <span
      data-ui="mock-badge"
      className={cn(
        "inline-flex h-6 items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] px-2 text-[12px] font-semibold text-[var(--fg-muted)]",
        className,
      )}
    >
      Mock data
    </span>
  );
}

/** Monad testnet state, pinned to the bottom of the sidebar. */
function NetworkCard({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="grid size-9 place-items-center rounded-[10px] bg-[var(--surface-2)]" aria-hidden>
            <span className="size-2.5 rounded-full bg-[var(--s-accepted-fg)]" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          Connected to Monad testnet. {TEST_TOKEN_NOTE}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--fg)]">
        <span className="size-2 rounded-full bg-[var(--s-accepted-fg)]" aria-hidden />
        Monad testnet
      </p>
      <p className="mt-1 text-[11px] leading-[1.4] text-[var(--fg-muted)]">{TEST_TOKEN_NOTE}</p>
    </div>
  );
}

function WalletChip({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "machine inline-flex h-7 items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 text-[12px] text-[var(--fg-muted)]",
        compact && "px-1.5 text-[11px]",
      )}
      title="Demo wallet address"
    >
      0x4f…a1
    </span>
  );
}

/**
 * AppShell — the chrome for every role. A 240px left sidebar (68px icon rail when
 * collapsed) carrying the workspace switcher, role nav, network state and wallet,
 * beside a 64px top bar and one content column capped at 1280px so every screen
 * shares a measure (docs/MOODBOARD-SPEC.md §3, §4). Below the sidebar breakpoint it
 * collapses to a compact top bar so the dense tables keep their full width.
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
  const workspace = workspaceFor(role);
  const [collapsed, setCollapsed] = React.useState(false);

  if (bare) {
    /* Focus surface: no sidebar, no content padding, and its own landmark id.
       The id is deliberately not "main" so a shell left over from a client-side
       navigation can never become the skip-link target. */
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--fg)]">
        <a
          href="#workbench"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-3 focus:z-50 focus:rounded-[10px] focus:border focus:border-[var(--border-field)] focus:bg-white focus:px-3 focus:py-1.5 focus:text-[14px]"
        >
          Skip to content
        </a>
        <main id="workbench" className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[var(--bg)] text-[var(--fg)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-3 focus:z-50 focus:rounded-[10px] focus:border focus:border-[var(--border-field)] focus:bg-white focus:px-3 focus:py-1.5 focus:text-[14px]"
      >
        Skip to content
      </a>

      {/* sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex",
          collapsed ? "w-[68px]" : "w-[240px]",
        )}
      >
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
          <Logo showWord={!collapsed} />
        </div>

        {/* workspace switcher */}
        <div className={cn("px-3 pb-3", collapsed && "px-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex h-11 w-full items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-left transition-colors",
                "hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none",
                collapsed && "justify-center px-0",
              )}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--primary-tint)] text-[11px] font-bold text-[var(--primary-hover)]"
                aria-hidden
              >
                {workspace.initials}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--fg)]">
                    {workspace.name}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-[var(--fg-muted)]" aria-hidden />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
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

        <div className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<SideNavFallback items={items} collapsed={collapsed} />}>
            <SideNav items={items} collapsed={collapsed} />
          </React.Suspense>
        </div>

        <div className={cn("flex flex-col gap-3 border-t border-[var(--border)] p-3")}>
          <NetworkCard collapsed={collapsed} />
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <WalletChip compact={collapsed} />
            {!collapsed && (
              <button
                type="button"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-pressed={collapsed}
                onClick={() => setCollapsed(true)}
                className="ml-auto grid size-7 shrink-0 place-items-center rounded-[8px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none"
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              type="button"
              aria-label="Expand sidebar"
              aria-pressed={collapsed}
              onClick={() => setCollapsed(false)}
              className="grid size-9 place-items-center self-center rounded-[8px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none"
            >
              <PanelLeftOpen className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </aside>

      {/* content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar role={role} items={items} />
        <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Breadcrumbs({ role }: { role: Role }) {
  const pathname = usePathname();
  const breadcrumb = crumbFor(pathname, role);
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 lg:flex">
      {breadcrumb.map((crumb, i) => (
        <React.Fragment key={`${crumb}-${i}`}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden />}
          <span
            className={cn(
              "truncate text-[14px]",
              i === breadcrumb.length - 1
                ? "font-semibold text-[var(--fg)]"
                : "text-[var(--fg-muted)]",
            )}
          >
            {crumb}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

function TopBar({ role, items }: { role: Role; items: NavItem[] }) {
  const workspace = workspaceFor(role);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const palette = React.useMemo(() => paletteItems(role), [role]);

  // ⌘K / Ctrl-K opens the palette. One shortcut, no money action behind it.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-6">
        {/* compact nav below the sidebar breakpoint */}
        <div className="lg:hidden">
          <React.Suspense fallback={<SideNavFallback items={items} collapsed={false} />}>
            <SideNav items={items} collapsed={false} />
          </React.Suspense>
        </div>

        <React.Suspense
          fallback={<span className="hidden text-[14px] font-semibold lg:inline">{ROLE_LABEL[role]}</span>}
        >
          <Breadcrumbs role={role} />
        </React.Suspense>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 w-[320px] items-center gap-2 rounded-[10px] border border-[var(--border-field)] bg-[var(--surface)] px-3 text-[14px] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none sm:flex"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Search</span>
            <kbd className="machine ml-auto rounded-[6px] border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--fg-muted)]">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="grid size-10 place-items-center rounded-[10px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none sm:hidden"
          >
            <Search className="size-[18px]" aria-hidden />
          </button>

          {IS_MOCK && <MockBadge className="hidden sm:inline-flex" />}

          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-[10px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--fg)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] focus-visible:outline-none"
          >
            <Bell className="size-[18px]" aria-hidden />
          </button>

          <Avatar name={workspace.name} size={32} className="rounded-[10px]" />
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={palette}
        role={role}
      />
    </>
  );
}

/**
 * Focus-mode task bar for workbenches: no site navigation, just the task, reward,
 * lease and the save and submit actions.
 */
export function TaskBar({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-[14px] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] focus-visible:outline-none"
        >
          Back to tasks
        </button>
      )}
      <div className="flex flex-1 items-center gap-4">{children}</div>
    </div>
  );
}
