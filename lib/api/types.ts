import { z } from "zod";

/**
 * Shared API contract. Every response is parsed with these schemas before it
 * reaches a component (AGENTS.md A4/A6). Keep in step with the backend; see
 * docs/API-NEEDS.md for endpoints the UI still needs.
 */

/* ------------------------------------------------------------------ enums */

export const Role = z.enum(["buyer", "contributor", "reviewer", "admin"]);
export type Role = z.infer<typeof Role>;

export const Modality = z.enum(["image", "video"]);
export type Modality = z.infer<typeof Modality>;

/** Task states from PRD §7. Submitted/Accepted/Paid are distinct everywhere. */
export const TaskState = z.enum([
  "draft",
  "submitted",
  "needs_revision",
  "accepted",
  "rejected",
  "appealed",
  "paid",
]);
export type TaskState = z.infer<typeof TaskState>;

/** Who decided a review. PRD §9 routing rule; shown on every decision. */
export const ReviewerType = z.enum(["code", "ai", "human", "adjudicated"]);
export type ReviewerType = z.infer<typeof ReviewerType>;

export const JobStatus = z.enum(["draft", "funding", "active", "paused", "closed"]);
export type JobStatus = z.infer<typeof JobStatus>;

/** Transaction lifecycle — never fake the "confirmed" state. */
export const TxState = z.enum(["idle", "waiting_wallet", "pending", "confirmed", "failed"]);
export type TxState = z.infer<typeof TxState>;

/* ------------------------------------------------------------- annotations */

/** image-boxes-v1 (AGENTS.md A8). Boxes must stay inside the image. */
export const Box = z.object({
  id: z.string(),
  x: z.number().min(0),
  y: z.number().min(0),
  w: z.number().positive(),
  h: z.number().positive(),
  class: z.string().min(1),
  confidence: z.number().int().min(1).max(5),
});
export type Box = z.infer<typeof Box>;

export const ImagePayload = z.object({
  task_id: z.string(),
  asset_id: z.string(),
  schema_version: z.literal("image-boxes-v1"),
  boxes: z.array(Box),
  answers: z.record(z.string(), z.string()).optional(),
});
export type ImagePayload = z.infer<typeof ImagePayload>;

/** action-segments-v1 (AGENTS.md A8). end > start, in order, no overlap. */
export const ActionLabel = z.enum([
  "reach",
  "grasp",
  "lift",
  "place",
  "inspect",
  "recover",
  "write",
  "other",
]);
export type ActionLabel = z.infer<typeof ActionLabel>;

export const Outcome = z.enum(["success", "partial", "failure", "unknown"]);
export type Outcome = z.infer<typeof Outcome>;

export const Segment = z.object({
  id: z.string(),
  start_ms: z.number().int().min(0),
  end_ms: z.number().int(),
  action_label: ActionLabel,
  object: z.string(),
  outcome: Outcome,
  failure_reason: z.string().optional(), // required when outcome is failure
  confidence: z.number().int().min(1).max(5),
});
export type Segment = z.infer<typeof Segment>;

export const VideoPayload = z.object({
  task_id: z.string(),
  asset_id: z.string(),
  schema_version: z.literal("action-segments-v1"),
  segments: z.array(Segment),
});
export type VideoPayload = z.infer<typeof VideoPayload>;

/** A submission is either modality. Discriminate on schema_version. */
export const SubmissionPayload = z.discriminatedUnion("schema_version", [
  ImagePayload,
  VideoPayload,
]);
export type SubmissionPayload = z.infer<typeof SubmissionPayload>;

/* ------------------------------------------------------------------ assets */

export const Asset = z.object({
  id: z.string(),
  modality: Modality,
  /** Signed URL, expires in minutes (PRD §17). Never a permanent link. */
  url: z.string(),
  thumbUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  durationMs: z.number().optional(),
  fps: z.number().optional(),
  contentHash: z.string(),
});
export type Asset = z.infer<typeof Asset>;

/* -------------------------------------------------------------------- jobs */

export const RubricRule = z.object({
  id: z.string(),
  text: z.string(),
});
export type RubricRule = z.infer<typeof RubricRule>;

export const Job = z.object({
  id: z.string(),
  title: z.string(),
  modality: Modality,
  status: JobStatus,
  classes: z.array(z.string()),
  rubric: z.array(RubricRule),
  rewardPerTask: z.number(),
  budget: z.number(),
  spent: z.number(),
  deadline: z.string(), // ISO
  policyHash: z.string(),
  policyVersion: z.number(),
  chainJobId: z.string().optional(),
  createdAt: z.string(),
});
export type Job = z.infer<typeof Job>;

/* ------------------------------------------------------------ buyer views */

/**
 * Aggregate shown on the buyer dashboard. Added for the UI (see
 * docs/API-NEEDS.md). Acceptance rate is over decided tasks, 0..1.
 */
export const BuyerOverview = z.object({
  tasksAccepted: z.number(),
  tasksInReview: z.number(),
  acceptanceRate: z.number(),
  spend: z.number(),
  budget: z.number(),
  budgetLeft: z.number(),
  aiReviewed: z.number(),
  humanReviewed: z.number(),
  adjudicated: z.number(),
});
export type BuyerOverview = z.infer<typeof BuyerOverview>;

/** Per-job progress for the buyer job detail. Same fields, scoped to one job. */
export const JobStats = z.object({
  jobId: z.string(),
  tasksTotal: z.number(),
  tasksSubmitted: z.number(),
  tasksAccepted: z.number(),
  tasksRejected: z.number(),
  tasksNeedsRevision: z.number(),
  inReview: z.number(),
  acceptanceRate: z.number(),
  spent: z.number(),
  budgetLeft: z.number(),
  aiReviewed: z.number(),
  humanReviewed: z.number(),
  adjudicated: z.number(),
});
export type JobStats = z.infer<typeof JobStats>;

/* ------------------------------------------------------------- job export */

/**
 * The manifest that accompanies an accepted-work export. Raw media is never
 * included (mediaIncluded is always false); only hashes and pseudonymous ids
 * leave the system (PRD §17, AGENTS.md A2/A6).
 */
export const ExportEntry = z.object({
  taskId: z.string(),
  annotationHash: z.string(),
  contributorPseudonym: z.string(),
  txHash: z.string().optional(),
});
export type ExportEntry = z.infer<typeof ExportEntry>;

export const ExportManifest = z.object({
  jobId: z.string(),
  jobTitle: z.string(),
  generatedAt: z.string(),
  taskCount: z.number(),
  annotationHashRoot: z.string(),
  policyHash: z.string(),
  policyVersion: z.number(),
  mediaIncluded: z.literal(false),
  entries: z.array(ExportEntry),
});
export type ExportManifest = z.infer<typeof ExportManifest>;

/* ------------------------------------------------------------------- tasks */

/** What a contributor sees before claiming (PRD §4.3, §8). */
export const AvailableTask = z.object({
  id: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  modality: Modality,
  reward: z.number(),
  estimatedMinutes: z.number(),
  deadline: z.string(),
  classes: z.array(z.string()).optional(),
  rubric: z.array(RubricRule),
  asset: Asset,
  /** Never surfaced to contributors. Reviewer/admin only. */
  isGold: z.boolean().optional(),
});
export type AvailableTask = z.infer<typeof AvailableTask>;

export const Lease = z.object({
  taskId: z.string(),
  ownerId: z.string(),
  expiresAt: z.string(),
});
export type Lease = z.infer<typeof Lease>;

/* -------------------------------------------------------------- submission */

export const Submission = z.object({
  id: z.string(),
  taskId: z.string(),
  jobTitle: z.string(),
  contributorId: z.string(), // pseudonym only
  version: z.number(),
  payload: SubmissionPayload,
  payloadHash: z.string(),
  state: TaskState,
  submittedAt: z.string(),
  /** Reference labels, reviewer/admin only (gold/overlap). */
  reference: SubmissionPayload.optional(),
  isGold: z.boolean().optional(),
  isOverlapSample: z.boolean().optional(),
});
export type Submission = z.infer<typeof Submission>;

/* ----------------------------------------------------------------- review */

export const AiSuggestion = z.object({
  decision: z.enum(["accept", "revise", "reject"]),
  reasonCode: z.string(),
  confidence: z.number().min(0).max(1),
  note: z.string().optional(),
});
export type AiSuggestion = z.infer<typeof AiSuggestion>;

export const ReviewChecklistItem = z.object({
  id: z.string(),
  label: z.string(),
  passed: z.boolean().nullable(),
});
export type ReviewChecklistItem = z.infer<typeof ReviewChecklistItem>;

export const ReviewItem = z.object({
  submission: Submission,
  asset: Asset,
  ai: AiSuggestion.optional(),
  reference: SubmissionPayload.optional(),
  checklist: z.array(ReviewChecklistItem),
  /** Why this item is in the queue (risk flags). */
  flags: z.array(z.string()),
});
export type ReviewItem = z.infer<typeof ReviewItem>;

export const ReviewDecisionInput = z.object({
  submissionId: z.string(),
  decision: z.enum(["accept", "revise", "reject"]),
  reasonCode: z.string().optional(), // required unless accept
  note: z.string().optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
});
export type ReviewDecisionInput = z.infer<typeof ReviewDecisionInput>;

/* ---------------------------------------------------------------- earnings */

export const EarningRow = z.object({
  taskId: z.string(),
  jobTitle: z.string(),
  reward: z.number(),
  state: TaskState,
  reasonCode: z.string().optional(),
  receiptId: z.string().optional(),
  txHash: z.string().optional(),
  /** Set when the payout transaction is in flight or failed. */
  txState: TxState.optional(),
  updatedAt: z.string(),
});
export type EarningRow = z.infer<typeof EarningRow>;

export const EarningsSummary = z.object({
  claimable: z.number(),
  waiting: z.number(),
  paid: z.number(),
  rejected: z.number(),
  rows: z.array(EarningRow),
});
export type EarningsSummary = z.infer<typeof EarningsSummary>;

/* ---------------------------------------------------------------- receipts */

export const Receipt = z.object({
  id: z.string(),
  taskId: z.string(),
  jobTitle: z.string(),
  contributorPseudonym: z.string(),
  annotationHash: z.string(),
  policyHash: z.string(),
  policyVersion: z.number(),
  reviewerType: ReviewerType,
  amount: z.number(),
  token: z.string(),
  txHash: z.string().optional(),
  txState: TxState,
  issuedAt: z.string(),
  mock: z.boolean().optional(),
});
export type Receipt = z.infer<typeof Receipt>;

/* ------------------------------------------------------------------ audits */

export const AuditSample = z.object({
  id: z.string(),
  jobId: z.string(),
  vrfRequestId: z.string(),
  seed: z.string(),
  selectedTaskIds: z.array(z.string()),
  createdAt: z.string(),
});
export type AuditSample = z.infer<typeof AuditSample>;

/* ------------------------------------------------------------------- admin */

export const SignerPolicy = z.object({
  signer: z.string(),
  status: z.enum(["active", "paused"]),
  allowed: z.string(), // e.g. "JobEscrow.markAccepted only"
  quorumSize: z.number(),
});
export type SignerPolicy = z.infer<typeof SignerPolicy>;

export const QuorumAction = z.enum(["refund", "close", "pause", "policy_change"]);
export type QuorumAction = z.infer<typeof QuorumAction>;

export const QuorumRequest = z.object({
  id: z.string(),
  action: QuorumAction,
  jobTitle: z.string(),
  requestedBy: z.string(),
  approvals: z.number(),
  approvalsNeeded: z.number(),
  approvers: z.array(z.string()),
  executed: z.boolean(),
  txHash: z.string().optional(),
  createdAt: z.string(),
});
export type QuorumRequest = z.infer<typeof QuorumRequest>;

export const RoleRow = z.object({
  id: z.string(),
  name: z.string(), // shown only on /admin (PRD §15)
  email: z.string(),
  pseudonym: z.string(),
  role: Role,
});
export type RoleRow = z.infer<typeof RoleRow>;

/* -------------------------------------------------------------- chain feed */

export const ChainEvent = z.object({
  id: z.string(),
  name: z.enum([
    "JobCreated",
    "JobFunded",
    "TaskAccepted",
    "PayoutClaimable",
    "PayoutClaimed",
    "JobPaused",
  ]),
  jobId: z.string().optional(),
  taskId: z.string().optional(),
  amount: z.number().optional(),
  txHash: z.string(),
  blockNumber: z.number().optional(),
  at: z.string(),
});
export type ChainEvent = z.infer<typeof ChainEvent>;

/* --------------------------------------------------------------- api errors */

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiError>;
