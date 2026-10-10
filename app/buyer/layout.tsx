import { AppShell } from "@/components/app/app-shell";
import { RoleGate } from "@/components/app/role-gate";
import type { ReactNode } from "react";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate role="buyer">
      <AppShell role="buyer">{children}</AppShell>
    </RoleGate>
  );
}
