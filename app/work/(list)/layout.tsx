import { AppShell } from "@/components/app/app-shell";
import type { ReactNode } from "react";

/**
 * List screens for the contributor role share one AppShell instance.
 *
 * The workbench lives outside this group on purpose: it renders AppShell's bare
 * (focus) variant, and because the group contributes no URL segment, `/work/tasks`
 * and `/work/tasks/[id]` keep their public paths while owning different chrome.
 * Keeping the shell in a layout rather than in each page also stops two shells
 * from being mounted across a client-side navigation.
 */
export default function WorkListLayout({ children }: { children: ReactNode }) {
  return <AppShell role="contributor">{children}</AppShell>;
}
