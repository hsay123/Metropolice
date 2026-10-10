import type { Box, Segment } from "@/lib/api/types";
import { formatSeconds } from "@/lib/timecode";

/**
 * Intersection over Union for two boxes. Used to line submitted boxes up with
 * their reference boxes so the review console can point at what differs. This is
 * a display aid for the reviewer — the server makes the decision.
 */
export function iou(a: Box, b: Box): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const intersection = ix * iy;
  const union = a.w * a.h + b.w * b.h - intersection;
  return union <= 0 ? 0 : intersection / union;
}

export type BoxMatch = {
  submitted: Box;
  reference: Box;
  iou: number;
  sameClass: boolean;
};

export type BoxComparison = {
  matches: BoxMatch[];
  submittedOnly: Box[];
  referenceOnly: Box[];
  /** Overlapping boxes whose class differs — the clearest kind of mistake. */
  wrongClass: BoxMatch[];
};

const MATCH_IOU = 0.3;
const CLASS_IOU = 0.5;

/**
 * Greedy best-IoU matching. A pair with the same class and IoU ≥ 0.5 is a match;
 * a pair with IoU ≥ 0.5 and a different class is a wrong-class error. Whatever is
 * left over is flagged on the side it came from.
 */
export function compareBoxes(submitted: Box[], reference: Box[]): BoxComparison {
  const pairs: BoxMatch[] = [];
  for (const s of submitted) {
    for (const r of reference) {
      const value = iou(s, r);
      if (value >= MATCH_IOU) pairs.push({ submitted: s, reference: r, iou: value, sameClass: s.class === r.class });
    }
  }
  pairs.sort((a, b) => b.iou - a.iou);

  const usedS = new Set<string>();
  const usedR = new Set<string>();
  const matches: BoxMatch[] = [];
  const wrongClass: BoxMatch[] = [];

  for (const p of pairs) {
    if (usedS.has(p.submitted.id) || usedR.has(p.reference.id)) continue;
    if (p.sameClass && p.iou >= CLASS_IOU) {
      matches.push(p);
      usedS.add(p.submitted.id);
      usedR.add(p.reference.id);
    } else if (!p.sameClass) {
      wrongClass.push(p);
      usedS.add(p.submitted.id);
      usedR.add(p.reference.id);
    }
  }

  return {
    matches,
    submittedOnly: submitted.filter((b) => !usedS.has(b.id)),
    referenceOnly: reference.filter((b) => !usedR.has(b.id)),
    wrongClass,
  };
}

/* ------------------------------------------------------------------ segments */

/**
 * A validation problem on the video timeline. The message is plain language and
 * names the segment and the fix (AGENTS.md A3 voice rules); the segmentId lets
 * the timeline mark the exact segment in red.
 */
export type SegmentProblem = {
  segmentId: string;
  index: number;
  message: string;
};

/**
 * Validate action-segments-v1 in the UI exactly as the server will (AGENTS.md
 * A8): end after start, inside the clip, in order with no overlap, and a failure
 * always carries a reason. `index` is the 1-based position shown to the person.
 */
export function validateSegments(segments: Segment[], durationMs: number): SegmentProblem[] {
  const problems: SegmentProblem[] = [];
  const clip = durationMs > 0 ? durationMs : Number.POSITIVE_INFINITY;

  segments.forEach((s, i) => {
    const n = i + 1;
    if (s.end_ms > clip) {
      problems.push({
        segmentId: s.id,
        index: n,
        message: `Segment ${n} runs past the end of the clip. Move the end to ${formatSeconds(clip)} or earlier.`,
      });
    }
    if (s.start_ms < 0) {
      problems.push({
        segmentId: s.id,
        index: n,
        message: `Segment ${n} starts before the clip. Move the start to 0.0 s or later.`,
      });
    }
    if (s.end_ms <= s.start_ms) {
      problems.push({
        segmentId: s.id,
        index: n,
        message: `Segment ${n} ends at ${formatSeconds(s.end_ms)} but starts at ${formatSeconds(s.start_ms)}. The end must be later than the start.`,
      });
    }
    if (!s.object.trim()) {
      problems.push({
        segmentId: s.id,
        index: n,
        message: `Segment ${n} has no object. Name the object the action works on.`,
      });
    }
    if (s.outcome === "failure" && !(s.failure_reason ?? "").trim()) {
      problems.push({
        segmentId: s.id,
        index: n,
        message: `Segment ${n} is marked as a failure but has no reason. Add a short reason.`,
      });
    }
  });

  // Overlap scan over the time order. Report on the later segment so the fix is
  // unambiguous: move this segment's start to the earlier one's end.
  const ordered = segments
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.start_ms - b.s.start_ms);
  for (let k = 1; k < ordered.length; k += 1) {
    const prev = ordered[k - 1];
    const cur = ordered[k];
    if (cur.s.start_ms < prev.s.end_ms) {
      problems.push({
        segmentId: cur.s.id,
        index: cur.i + 1,
        message: `Segment ${cur.i + 1} overlaps segment ${prev.i + 1} between ${formatSeconds(cur.s.start_ms)} and ${formatSeconds(prev.s.end_ms)}. Move the start to ${formatSeconds(prev.s.end_ms)} or later.`,
      });
    }
  }

  return problems;
}

export type SegmentMatch = {
  submitted: Segment;
  reference: Segment;
  /** Temporal overlap over union, 0..1. */
  overlap: number;
  startDeltaMs: number;
  endDeltaMs: number;
  /** How far the worse boundary is from the reference, for the reviewer's note. */
  worstDeltaMs: number;
  sameLabel: boolean;
};

export type SegmentComparison = {
  matches: SegmentMatch[];
  labelMismatch: SegmentMatch[];
  submittedOnly: Segment[];
  referenceOnly: Segment[];
};

const SEGMENT_OVERLAP_MIN = 0.3;

/**
 * Line submitted segments up with the reference by temporal overlap so the review
 * console can point at what differs. A pair overlapping by at least 0.3 is paired;
 * the same label makes it a match, a different label is flagged. The server still
 * makes the decision (mirrors compareBoxes).
 */
export function compareSegments(submitted: Segment[], reference: Segment[]): SegmentComparison {
  const pairs: SegmentMatch[] = [];
  for (const s of submitted) {
    for (const r of reference) {
      const inter = Math.max(0, Math.min(s.end_ms, r.end_ms) - Math.max(s.start_ms, r.start_ms));
      const union = (s.end_ms - s.start_ms) + (r.end_ms - r.start_ms) - inter;
      const overlap = union <= 0 ? 0 : inter / union;
      if (overlap < SEGMENT_OVERLAP_MIN) continue;
      const startDeltaMs = Math.abs(s.start_ms - r.start_ms);
      const endDeltaMs = Math.abs(s.end_ms - r.end_ms);
      pairs.push({
        submitted: s,
        reference: r,
        overlap,
        startDeltaMs,
        endDeltaMs,
        worstDeltaMs: Math.max(startDeltaMs, endDeltaMs),
        sameLabel: s.action_label === r.action_label,
      });
    }
  }
  pairs.sort((a, b) => b.overlap - a.overlap);

  const usedS = new Set<string>();
  const usedR = new Set<string>();
  const matches: SegmentMatch[] = [];
  const labelMismatch: SegmentMatch[] = [];

  for (const p of pairs) {
    if (usedS.has(p.submitted.id) || usedR.has(p.reference.id)) continue;
    usedS.add(p.submitted.id);
    usedR.add(p.reference.id);
    if (p.sameLabel) matches.push(p);
    else labelMismatch.push(p);
  }

  return {
    matches,
    labelMismatch,
    submittedOnly: submitted.filter((s) => !usedS.has(s.id)),
    referenceOnly: reference.filter((r) => !usedR.has(r.id)),
  };
}
