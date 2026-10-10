import { AppShell } from "@/components/app/app-shell";
import { RoleGate } from "@/components/app/role-gate";
import type { ReactNode } from "react";

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate role="reviewer">
      <AppShell role="reviewer">{children}</AppShell>
    </RoleGate>
  );
}
