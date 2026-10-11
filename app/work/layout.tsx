import { RoleGate } from "@/components/app/role-gate";
import type { ReactNode } from "react";

/**
 * The contributor segment. Chrome is owned by each route: list screens wrap
 * themselves in AppShell, and the workbench wraps itself in the focus variant,
 * because a full-bleed canvas and a sidebar cannot coexist (docs/DESIGN.md §3).
 */
export default function WorkLayout({ children }: { children: ReactNode }) {
  return <RoleGate role="contributor">{children}</RoleGate>;
}
