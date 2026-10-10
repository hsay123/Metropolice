/**
 * Reason codes shared between the review console and the contributor's result view.
 * The reviewer picks a code; the contributor always reads the plain-language line.
 * Confirm the final list with the backend (docs/DESIGN.md §5).
 */

export const REASON_CODES = {
  BOX_LOOSE: "A box edge is more than the allowed distance from the object. Tighten it.",
  BOX_MISSING: "An object listed in the rubric has no box. Add one.",
  WRONG_CLASS: "The class does not match the object. Check the class list.",
  TIME_OFFSET:
    "A segment starts or ends too far from the action. Step frame by frame to find the exact time.",
  SEGMENT_OVERLAP: "Two segments overlap. Move the start or end so they follow each other.",
  LABEL_MISMATCH: "The action label does not match what happens. Check the label definitions.",
  FAILURE_UNMARKED: "A failure happens here but is not marked. Add a failure segment with a reason.",
  DUPLICATE: "This work matches another submission. Label the clip yourself.",
  UNCLEAR_MEDIA: "The item cannot be labelled reliably. Pick unknown instead of guessing.",
} as const;

export type ReasonCode = keyof typeof REASON_CODES;

export const REASON_CODE_LIST = Object.keys(REASON_CODES) as ReasonCode[];

/** Short labels for the reviewer's select list. */
export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  BOX_LOOSE: "Box is loose",
  BOX_MISSING: "Object has no box",
  WRONG_CLASS: "Wrong class",
  TIME_OFFSET: "Times are off",
  SEGMENT_OVERLAP: "Segments overlap",
  LABEL_MISMATCH: "Wrong action label",
  FAILURE_UNMARKED: "Failure not marked",
  DUPLICATE: "Duplicate work",
  UNCLEAR_MEDIA: "Media is unclear",
};

/** Plain-language explanation for a contributor, given a code. */
export function explainReason(code: string): string {
  return (REASON_CODES as Record<string, string>)[code] ?? "See the rubric for what to fix.";
}
