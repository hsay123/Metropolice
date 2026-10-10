import { VIDEO_LABELS, type VideoLabel } from "@/lib/config";
import type { ActionLabel, Outcome, QuorumAction } from "@/lib/api/types";

/** Quorum action names in plain words. The label names what happens, not the code. */
export const QUORUM_ACTION_LABEL: Record<QuorumAction, string> = {
  refund: "Refund remaining budget",
  close: "Close the job",
  pause: "Pause the job",
  policy_change: "Change the signer policy",
};

export const QUORUM_ACTION_DESCRIPTION: Record<QuorumAction, string> = {
  refund: "Return unspent escrow to the buyer. Contributors keep what they earned.",
  close: "Stop accepting new work. Submitted and accepted tasks still resolve.",
  pause: "Hold all payouts for the job until an admin resumes it.",
  policy_change: "Change what the signer wallet is allowed to sign.",
};

/**
 * Label colours for annotation UI. Video labels use the Okabe-Ito colour-blind-safe
 * palette (PRD §14, AGENTS.md A3). Image classes reuse the same palette so the two
 * modalities read the same way. Every swatch is always paired with its text label.
 *
 * The hex values mirror styles/tokens.css (`--label-*`). Canvas and SVG cannot read
 * CSS variables cheaply, so they are duplicated here; keep both in step.
 */
export const LABEL_HEX: Record<VideoLabel, string> = {
  reach: "#0072b2",
  grasp: "#e69f00",
  lift: "#56b4e9",
  place: "#009e73",
  inspect: "#cc79a7",
  recover: "#d55e00",
  write: "#5f4bb6",
  other: "#8a94a3",
};

/** Palette in canonical order, for classes that are not one of the video labels. */
const PALETTE = VIDEO_LABELS.map((l) => LABEL_HEX[l]);

/**
 * A stable colour for any label or class name. Unknown names fall back to the
 * palette by position in the list they came from, so a class always keeps its
 * colour while the page is open.
 */
export function labelColor(name: string, index = 0): string {
  if ((VIDEO_LABELS as readonly string[]).includes(name)) {
    return LABEL_HEX[name as VideoLabel];
  }
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/** Colour for a video action label. */
export function videoLabelColor(label: VideoLabel): string {
  return LABEL_HEX[label];
}

/** Action labels in canonical order, for the segment form and keyboard 1–8. */
export const ACTION_LABELS: ActionLabel[] = [...VIDEO_LABELS] as ActionLabel[];

/**
 * Outcome choices. `unknown` and `other` are always offered so nobody has to
 * guess (DESIGN.md §4.6).
 */
export const OUTCOME_OPTIONS: Outcome[] = ["success", "partial", "failure", "unknown"];

