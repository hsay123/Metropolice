import type { Role } from "@/lib/api/types";

export const ROLE_LABEL: Record<Role, string> = {
  buyer: "Buyer",
  contributor: "Contributor",
  reviewer: "Reviewer",
  admin: "Admin",
};

/** Top-bar nav per role. Workbenches replace this with a focus task bar. */
export const NAV: Record<Role, { href: string; label: string }[]> = {
  buyer: [{ href: "/buyer", label: "Jobs" }],
  contributor: [
    { href: "/work/tasks", label: "Tasks" },
    { href: "/work/earnings", label: "Earnings" },
  ],
  reviewer: [{ href: "/review", label: "Queue" }],
  admin: [{ href: "/admin", label: "Admin" }],
};

/** Which role each route area belongs to. Experience only; the server enforces. */
export const ROUTE_ROLE: { prefix: string; role: Role }[] = [
  { prefix: "/buyer", role: "buyer" },
  { prefix: "/work", role: "contributor" },
  { prefix: "/review", role: "reviewer" },
  { prefix: "/admin", role: "admin" },
];

/** Where each role lands after sign-in. */
export const ROLE_HOME: Record<Role, string> = {
  buyer: "/buyer",
  contributor: "/work",
  reviewer: "/review",
  admin: "/admin",
};

export function roleForPath(pathname: string): Role | null {
  return ROUTE_ROLE.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))?.role ?? null;
}
