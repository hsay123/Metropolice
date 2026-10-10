/**
 * Timecode helpers for the video workbench. Times are stored in milliseconds
 * (the API contract); the UI shows film-style timecode `HH:MM:SS:FF` and plain
 * seconds `1.2 s` (PRD §8, DESIGN.md §4.6). Frame maths always uses the asset's
 * frame rate, defaulting to DEFAULT_FPS.
 */

import { DEFAULT_FPS } from "@/lib/config";

/** Clamp an ms value to a frame boundary so segments never land mid-frame. */
export function snapToFrame(ms: number, fps = DEFAULT_FPS): number {
  const safeFps = fps > 0 ? fps : DEFAULT_FPS;
  return Math.round((ms / 1000) * safeFps) * (1000 / safeFps);
}

export function msToFrames(ms: number, fps = DEFAULT_FPS): number {
  const safeFps = fps > 0 ? fps : DEFAULT_FPS;
  return Math.round((ms / 1000) * safeFps);
}

export function framesToMs(frames: number, fps = DEFAULT_FPS): number {
  const safeFps = fps > 0 ? fps : DEFAULT_FPS;
  return (frames / safeFps) * 1000;
}

const pad = (n: number, len = 2) => String(Math.max(0, Math.floor(n))).padStart(len, "0");

/** `HH:MM:SS:FF` — the timecode shown in the workbench header and on the ruler. */
export function formatTimecode(ms: number, fps = DEFAULT_FPS): string {
  const safeFps = fps > 0 ? fps : DEFAULT_FPS;
  const total = Math.max(0, ms);
  const totalFrames = Math.round((total / 1000) * safeFps);
  const frames = totalFrames % Math.round(safeFps);
  const totalSeconds = Math.floor(totalFrames / safeFps);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/** `12.0 s` — the plain-seconds reading used in messages and lists. */
export function formatSeconds(ms: number, decimals = 1): string {
  return `${(Math.max(0, ms) / 1000).toFixed(decimals)} s`;
}

/** Short ruler tick label: `0s`, `3s`, `9s`. */
export function formatRulerLabel(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

/**
 * Parse what a person types into a field: plain seconds (`4`, `4.5`, `4.5s`) or
 * film timecode (`00:00:04:12`). Returns milliseconds, or null when unreadable.
 */
export function parseTimecode(input: string, fps = DEFAULT_FPS): number | null {
  const text = input.trim().replace(/s$/i, "");
  if (!text) return null;
  if (text.includes(":")) {
    const parts = text.split(":").map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n))) return null;
    let h = 0;
    let m = 0;
    let s = 0;
    let f = 0;
    if (parts.length === 4) [h, m, s, f] = parts;
    else if (parts.length === 3) [m, s, f] = parts;
    else if (parts.length === 2) [s, f] = parts;
    else return null;
    return h * 3_600_000 + m * 60_000 + s * 1000 + framesToMs(f, fps);
  }
  const seconds = Number(text);
  if (Number.isNaN(seconds)) return null;
  return seconds * 1000;
}

/** A tick list for the ruler: about `count` evenly spaced marks across the clip. */
export function rulerTicks(durationMs: number, count = 5): number[] {
  if (durationMs <= 0) return [0];
  const step = durationMs / count;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}
