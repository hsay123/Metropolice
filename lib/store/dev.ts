"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/api/types";

/**
 * Dev-only UI state: the mock role switcher. In mock mode the demo can be
 * rehearsed as any role without a backend. Persisted so a reload keeps the role.
 * This is for experience only — the server checks every role (AGENTS.md A5).
 */
type DevState = {
  role: Role;
  setRole: (role: Role) => void;
};

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      role: "buyer",
      setRole: (role) => set({ role }),
    }),
    { name: "pdn-dev-role" },
  ),
);
