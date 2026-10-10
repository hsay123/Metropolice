import { z } from "zod";
import { http } from "@/lib/api/http";
import {
  Asset,
  AuditSample,
  AvailableTask,
  BuyerOverview,
  ChainEvent,
  EarningsSummary,
  ExportManifest,
  Job,
  JobStats,
  Lease,
  Receipt,
  RoleRow,
  SignerPolicy,
  Submission,
  SubmissionPayload,
  type ReviewDecisionInput,
  QuorumRequest,
  Role,
  Modality,
  ReviewItem,
  RubricRule,
} from "@/lib/api/types";

/**
 * Real backend client. Mirrors PRD §13 endpoints plus the endpoints the UI still
 * needs (see docs/API-NEEDS.md). Every response is zod-parsed in http().
 */

export type CreateJobInput = {
  title: string;
  modality: Modality;
  classes: string[];
  rubric: RubricRule[];
  rewardPerTask: number;
  budget: number;
  deadline: string;
  dataRightsAttested: boolean;
};

export const realApi = {
  /* ---- jobs ---- */
  listJobs: () => http("/api/jobs", z.array(Job)),
  getJob: (id: string) => http(`/api/jobs/${id}`, Job),
  createJob: (input: CreateJobInput) =>
    http("/api/jobs", Job, { method: "POST", body: input }),
  publishJob: (id: string) =>
    http(`/api/jobs/${id}/publish`, Job, { method: "POST" }),

  /* ---- buyer views (added for the UI; see docs/API-NEEDS.md) ---- */
  buyerOverview: () => http("/api/buyer/overview", BuyerOverview),
  jobStats: (id: string) => http(`/api/jobs/${id}/stats`, JobStats),
  jobExport: (id: string) => http(`/api/jobs/${id}/export`, ExportManifest),

  /* ---- tasks ---- */
  availableTasks: () => http("/api/tasks/available", z.array(AvailableTask)),
  getTask: (id: string) => http(`/api/tasks/${id}`, AvailableTask),
  claimTask: (id: string) =>
    http(`/api/tasks/${id}/claim`, Lease, {
      method: "POST",
      idempotencyKey: `claim_${id}`,
    }),
  saveDraft: (id: string, payload: SubmissionPayload) =>
    http(`/api/tasks/${id}/draft`, z.object({ savedAt: z.string() }), {
      method: "PUT",
      body: payload,
      idempotencyKey: `draft_${id}`,
    }),
  submitTask: (id: string, payload: SubmissionPayload) =>
    http(`/api/tasks/${id}/submit`, Submission, {
      method: "POST",
      body: payload,
      idempotencyKey: `submit_${id}`,
    }),

  /* ---- review ---- */
  reviewQueue: () => http("/api/reviews/queue", z.array(ReviewItem)),
  getReview: (submissionId: string) => http(`/api/reviews/${submissionId}`, ReviewItem),
  decide: (input: ReviewDecisionInput) =>
    http(`/api/reviews/${input.submissionId}/decision`, Submission, {
      method: "POST",
      body: input,
      idempotencyKey: `decision_${input.submissionId}`,
    }),

  /* ---- appeal ---- */
  appeal: (submissionId: string, reason: string) =>
    http(`/api/submissions/${submissionId}/appeal`, Submission, {
      method: "POST",
      body: { reason },
      idempotencyKey: `appeal_${submissionId}`,
    }),

  /* ---- earnings ---- */
  earnings: () => http("/api/earnings", EarningsSummary),
  claimReward: (taskId: string) =>
    http(`/api/earnings/${taskId}/claim`, Receipt, {
      method: "POST",
      idempotencyKey: `payout_${taskId}`,
    }),

  /* ---- receipts ---- */
  receipt: (id: string) => http(`/api/receipts/${id}`, Receipt),

  /* ---- assets ---- */
  asset: (id: string) => http(`/api/assets/${id}`, Asset),

  /* ---- audit ---- */
  auditSample: (jobId: string) => http(`/api/jobs/${jobId}/audit`, AuditSample),

  /* ---- admin ---- */
  signerPolicy: () => http("/api/admin/signer-policy", SignerPolicy),
  quorumRequests: () => http("/api/admin/quorum", z.array(QuorumRequest)),
  quorumApprove: (id: string) =>
    http(`/api/admin/quorum/${id}/approve`, QuorumRequest, { method: "POST" }),
  quorumReject: (id: string) =>
    http(`/api/admin/quorum/${id}/reject`, QuorumRequest, { method: "POST" }),
  roles: () => http("/api/admin/roles", z.array(RoleRow)),
  setRole: (id: string, role: Role) =>
    http(`/api/admin/roles/${id}`, RoleRow, { method: "PATCH", body: { role } }),
  pauseJob: (id: string) => http(`/api/admin/jobs/${id}/pause`, Job, { method: "POST" }),

  /* ---- chain feed ---- */
  chainEvents: (jobId?: string) =>
    http(jobId ? `/api/chain/events?jobId=${jobId}` : "/api/chain/events", z.array(ChainEvent)),
};
