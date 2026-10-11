import type { Role } from "@/lib/api/types";

/**
 * The workspace identity shown in the sidebar switcher and the header.
 *
 * In mock mode this is a clearly fictional demo workspace and the shell prints a
 * persistent "Mock data" badge beside it. In real mode the name comes from the
 * signed-in account; contributors are shown by pseudonym only (AGENTS.md A6).
 * The initials drive the 28px violet workspace tile.
 */
export type Workspace = { name: string; initials: string };

const WORKSPACES: Record<Role, Workspace> = {
  buyer: { name: "Demo Robotics Co.", initials: "DR" },
  contributor: { name: "Contributor 4F2A", initials: "C4" },
  reviewer: { name: "Review ops", initials: "RO" },
  admin: { name: "Platform admin", initials: "PA" },
};

export function workspaceFor(role: Role): Workspace {
  return WORKSPACES[role];
}
