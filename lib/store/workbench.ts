"use client";

import { create } from "zustand";
import type { Box } from "@/lib/api/types";

/**
 * Workbench state for the image box tool. Kept in a store (not component state)
 * so undo/redo is a single source of truth and a submit reads the exact list that
 * was validated (AGENTS.md A4: zustand for workbench state with undo/redo).
 *
 * Only the image branch uses this in Phase 1. The video branch gets its own
 * segment store in Phase 2.
 */
type WorkbenchState = {
  taskId: string | null;
  imageWidth: number;
  imageHeight: number;
  /** The live box list the person is editing. */
  boxes: Box[];
  /** Undo/redo stacks of whole box lists. */
  past: Box[][];
  future: Box[][];
  selectedId: string | null;
  /** The class new boxes get. Set from the job's class list. */
  activeClass: string;
  /** True when there are edits the autosave has not persisted yet. */
  dirty: boolean;

  init: (args: {
    taskId: string;
    boxes: Box[];
    width: number;
    height: number;
    activeClass: string;
  }) => void;
  setActiveClass: (name: string) => void;
  select: (id: string | null) => void;
  addBox: (box: Box) => void;
  updateBox: (id: string, patch: Partial<Omit<Box, "id">>) => void;
  removeBox: (id: string) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  reset: () => void;
};

const MAX_HISTORY = 50;

function pushPast(past: Box[][], boxes: Box[]) {
  const next = [...past, boxes];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useWorkbench = create<WorkbenchState>((set, get) => ({
  taskId: null,
  imageWidth: 1280,
  imageHeight: 960,
  boxes: [],
  past: [],
  future: [],
  selectedId: null,
  activeClass: "",
  dirty: false,

  init: ({ taskId, boxes, width, height, activeClass }) => {
    const current = get();
    if (current.taskId === taskId) return;
    set({
      taskId,
      boxes,
      imageWidth: width,
      imageHeight: height,
      activeClass,
      past: [],
      future: [],
      selectedId: null,
      dirty: false,
    });
  },

  setActiveClass: (name) => set({ activeClass: name }),
  select: (id) => set({ selectedId: id }),

  addBox: (box) =>
    set((s) => ({
      past: pushPast(s.past, s.boxes),
      boxes: [...s.boxes, box],
      future: [],
      selectedId: box.id,
      dirty: true,
    })),

  updateBox: (id, patch) =>
    set((s) => ({
      past: pushPast(s.past, s.boxes),
      boxes: s.boxes.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      future: [],
      dirty: true,
    })),

  removeBox: (id) =>
    set((s) => ({
      past: pushPast(s.past, s.boxes),
      boxes: s.boxes.filter((b) => b.id !== id),
      future: [],
      selectedId: s.selectedId === id ? null : s.selectedId,
      dirty: true,
    })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        boxes: previous,
        future: [s.boxes, ...s.future].slice(0, MAX_HISTORY),
        selectedId: null,
        dirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return {
        past: pushPast(s.past, s.boxes),
        boxes: next,
        future: rest,
        selectedId: null,
        dirty: true,
      };
    }),

  markSaved: () => set({ dirty: false }),

  reset: () =>
    set({
      taskId: null,
      boxes: [],
      past: [],
      future: [],
      selectedId: null,
      activeClass: "",
      dirty: false,
    }),
}));
