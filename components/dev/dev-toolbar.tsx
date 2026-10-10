"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Database, RotateCcw } from "lucide-react";
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

/**
 * DevToolbar — only in mock mode. A persistent "Mock data" badge, a role
 * switcher, and "Reset demo". Disappears entirely in real mode (AGENTS.md A6).
 */
export function DevToolbar() {
  const role = useDevStore((s) => s.role);
  const setRole = useDevStore((s) => s.setRole);
  const queryClient = useQueryClient();

  if (!IS_MOCK) return null;

  function reset() {
    resetDemo();
    queryClient.clear();
    toast.success("Demo reset", { description: "Mock data is back to its starting state." });
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
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
          <Button variant="outline" size="sm" className="shadow-popover">
            Viewing as {ROLE_LABEL[role]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
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
    </div>
  );
}
