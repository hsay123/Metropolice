import { AppShell } from "@/components/app/app-shell";
import { RoleGate } from "@/components/app/role-gate";
import type { ReactNode } from "react";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate role="contributor">
      <AppShell role="contributor">{children}</AppShell>
    </RoleGate>
  );
}
