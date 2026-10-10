import { AdminConsole } from "@/components/admin/admin-console";

/**
 * /admin — pause, roles, signer policy and quorum approvals (AGENTS.md A5).
 * The shell and the role gate are in app/admin/layout.tsx.
 */
export default function AdminPage() {
  return <AdminConsole />;
}
