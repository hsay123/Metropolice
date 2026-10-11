"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Database, RotateCcw, X } from "lucide-react";
import { IS_MOCK, TEST_TOKEN_NOTE } from "@/lib/config";
import { useDevStore } from "@/lib/store/dev";
import { ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { resetDemo } from "@/mocks/api";

const ROLES: Role[] = ["buyer", "contributor", "reviewer", "admin"];

/** Clean mode: `?clean=1` in the URL, or the env flag, hides the dock for recordings. */
function useCleanMode() {
  const fromUrl = React.useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("clean") === "1",
    () => false,
  );
  return fromUrl || process.env.NEXT_PUBLIC_DEMO_CLEAN === "true";
}

/**
 * DevToolbar — mock mode only. It is the one piece of debug chrome in the product, so
 * it is a single collapsible dock pinned bottom-right: collapsed to one control, never
 * overlapping the framework dev indicator, and absent in clean mode for recordings.
 * The test-token notice it carries is also printed on every screen that shows money,
 * so clean mode never removes the honesty copy (AGENTS.md A6).
 */
export function DevToolbar() {
  const role = useDevStore((s) => s.role);
  const setRole = useDevStore((s) => s.setRole);
  const queryClient = useQueryClient();
  const clean = useCleanMode();
  const [open, setOpen] = React.useState(false);

  if (!IS_MOCK || clean) return null;

  function reset() {
    resetDemo();
    queryClient.clear();
    toast.success("Demo reset", { description: "Mock data is back to its starting state." });
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-rule bg-sheet p-2 shadow-popover">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--revision-ink)]/30 bg-[var(--revision-bg)] px-2.5 py-1 text-xs font-medium text-[var(--revision-ink)]">
                <Database className="size-3.5" aria-hidden />
                Mock data
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              {TEST_TOKEN_NOTE} Nothing here is real activity.
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Viewing as {ROLE_LABEL[role]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Switch role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLES.map((r) => (
                <DropdownMenuItem key={r} onSelect={() => setRole(r)}>
                  {ROLE_LABEL[r]}
                  {r === role && <span className="ml-auto text-xs text-ink-muted">current</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={reset}>
                <RotateCcw className="size-3.5" aria-hidden />
                Reset demo
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dev/components">Component gallery</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse demo dock"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="h-7 shadow-popover"
              aria-expanded={false}
              onClick={() => setOpen(true)}
            >
              <Database className="size-3.5" aria-hidden />
              Demo · {ROLE_LABEL[role]}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Demo dock: mock data, role switcher, reset</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}