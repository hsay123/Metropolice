"use client";

import { create } from "zustand";
import type { ActionLabel, Segment } from "@/lib/api/types";
import { snapToFrame } from "@/lib/timecode";

/**
 * Workbench state for the video dope sheet (action-segments-v1). Kept in a store
 * (not component state) so undo/redo is one source of truth, keyboard shortcuts
 * read the same list the submit validates, and the in/out markers survive a
 * re-render (AGENTS.md A4).
 *
 * Segments are always kept in time order. Overlaps are allowed while editing —
 * the validator names them in plain language and blocks submit — so a person can
 * nudge a boundary rather than be stopped mid-edit.
 */
type VideoWorkbenchState = {
  taskId: string | null;
  durationMs: number;
  fps: number;
  /** Live segment list, kept sorted by start time. */
  segments: Segment[];
  /** Undo/redo stacks of whole segment lists. */
  past: Segment[][];
  future: Segment[][];
  selectedId: string | null;
  /** The action label new segments get. */
  activeLabel: ActionLabel;
  /** In/out markers, in ms, set with I and O or by the field pair. */
  inMs: number;
  outMs: number;
  /** True when there are edits the autosave has not persisted yet. */
  dirty: boolean;

  init: (args: {
    taskId: string;
    segments: Segment[];
    durationMs: number;
    fps: number;
    activeLabel: ActionLabel;
  }) => void;
  setActiveLabel: (label: ActionLabel) => void;
  select: (id: string | null) => void;
  addSegment: (segment: Segment) => void;
  updateSegment: (id: string, patch: Partial<Omit<Segment, "id">>) => void;
  removeSegment: (id: string) => void;
  setIn: (ms: number) => void;
  setOut: (ms: number) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  reset: () => void;
};

const MAX_HISTORY = 50;

function sortSegments(segments: Segment[]): Segment[] {
  return [...segments].sort((a, b) => a.start_ms - b.start_ms || a.end_ms - b.end_ms);
}

function pushPast(past: Segment[][], segments: Segment[]) {
  const next = [...past, segments];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useVideoWorkbench = create<VideoWorkbenchState>((set, get) => ({
  taskId: null,
  durationMs: 0,
  fps: 30,
  segments: [],
  past: [],
  future: [],
  selectedId: null,
  activeLabel: "reach",
  inMs: 0,
  outMs: 0,
  dirty: false,

  init: ({ taskId, segments, durationMs, fps, activeLabel }) => {
    const current = get();
    if (current.taskId === taskId) return;
    set({
      taskId,
      segments: sortSegments(segments),
      durationMs,
      fps,
      activeLabel,
      inMs: 0,
      outMs: Math.min(durationMs, 1200),
      selectedId: null,
      past: [],
      future: [],
      dirty: false,
    });
  },

  setActiveLabel: (label) => set({ activeLabel: label }),
  select: (id) => set({ selectedId: id }),

  addSegment: (segment) =>
    set((s) => ({
      past: pushPast(s.past, s.segments),
      segments: sortSegments([...s.segments, segment]),
      future: [],
      selectedId: segment.id,
      dirty: true,
    })),

  updateSegment: (id, patch) =>
    set((s) => ({
      past: pushPast(s.past, s.segments),
      segments: sortSegments(s.segments.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      future: [],
      dirty: true,
    })),

  removeSegment: (id) =>
    set((s) => ({
      past: pushPast(s.past, s.segments),
      segments: s.segments.filter((x) => x.id !== id),
      future: [],
      selectedId: s.selectedId === id ? null : s.selectedId,
      dirty: true,
    })),

  setIn: (ms) => set({ inMs: Math.max(0, ms) }),
  setOut: (ms) => set({ outMs: Math.max(0, ms) }),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        segments: previous,
        future: [s.segments, ...s.future].slice(0, MAX_HISTORY),
        selectedId: null,
        dirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return {
        past: pushPast(s.past, s.segments),
        segments: next,
        future: rest,
        selectedId: null,
        dirty: true,
      };
    }),

  markSaved: () => set({ dirty: false }),

  reset: () =>
    set({
      taskId: null,
      segments: [],
      past: [],
      future: [],
      selectedId: null,
      activeLabel: "reach",
      inMs: 0,
      outMs: 0,
      dirty: false,
    }),
}));

export { snapToFrame };
