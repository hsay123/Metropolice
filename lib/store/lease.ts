"use client";

import { create } from "zustand";
import type { Lease } from "@/lib/api/types";

/**
 * Active task leases, keyed by task id. A claim returns a lease from the server;
 * the workbench reads it to show the countdown. Kept out of the query cache so a
 * refetch of the task list never drops the lease mid-task.
 */
type LeaseState = {
  leases: Record<string, Lease>;
  setLease: (lease: Lease) => void;
  clear: () => void;
};

export const useLeaseStore = create<LeaseState>((set) => ({
  leases: {},
  setLease: (lease) => set((s) => ({ leases: { ...s.leases, [lease.taskId]: lease } })),
  clear: () => set({ leases: {} }),
}));
