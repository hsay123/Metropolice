import { AppShell } from "@/components/app/app-shell";
import { RoleGate } from "@/components/app/role-gate";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate role="admin">
      <AppShell role="admin">{children}</AppShell>
    </RoleGate>
  );
}
