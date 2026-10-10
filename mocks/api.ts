import type {
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
  Role,
  RoleRow,
  SignerPolicy,
  Submission,
  SubmissionPayload,
  QuorumRequest,
} from "@/lib/api/types";
import type { CreateJobInput } from "@/lib/api/real";
import type { ReviewDecisionInput, ReviewItem } from "@/lib/api/types";
import * as seed from "@/mocks/data";

/**
 * Mock API. Mirrors the realApi surface so screens never know which is in use.
 * Simulated latency, mutable in-memory state, and an optional simulated error
 * so error/retry states can be rehearsed. Nothing here is real activity.
 */

const FAILURE_RATE = Number(process.env.NEXT_PUBLIC_MOCK_FAILURE_RATE ?? "0");

let state = cloneSeed();

function cloneSeed() {
  return {
    jobs: structuredClone(seed.JOBS),
    tasks: structuredClone(seed.AVAILABLE_TASKS),
    submissions: structuredClone(seed.SUBMISSIONS),
    queue: structuredClone(seed.REVIEW_QUEUE),
    earnings: structuredClone(seed.EARNINGS),
    receipts: structuredClone(seed.RECEIPTS),
    quorum: structuredClone(seed.QUORUM_REQUESTS),
    roles: structuredClone(seed.ROLES),
    leases: new Map<string, Lease>(),
    drafts: new Map<string, SubmissionPayload>(),
  };
}

/** Reset the mock world. Called by the dev toolbar "Reset demo" action. */
export function resetDemo() {
  state = cloneSeed();
}

function latency(min = 220, max = 560) {
  const ms = min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}

async function respond<T>(produce: () => T, opts?: { maybeFail?: boolean }): Promise<T> {
  await latency();
  if ((opts?.maybeFail ?? true) && FAILURE_RATE > 0 && Math.random() < FAILURE_RATE) {
    throw new Error("Mock server error. This is a simulated failure for rehearsal.");
  }
  return produce();
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const mockApi = {
  /* ---- jobs ---- */
  listJobs: () => respond(() => state.jobs),

  getJob: (id: string) =>
    respond(() => {
      const job = state.jobs.find((j) => j.id === id);
      if (!job) throw new Error("That job no longer exists. Go back to the dashboard.");
      return job;
    }),

  createJob: (input: CreateJobInput) =>
    respond<Job>(() => {
      const job: Job = {
        id: uid("job"),
        title: input.title,
        modality: input.modality,
        status: "draft",
        classes: input.classes,
        rubric: input.rubric,
        rewardPerTask: input.rewardPerTask,
        budget: input.budget,
        spent: 0,
        deadline: input.deadline,
        policyHash: `0x${uid("policy")}`,
        policyVersion: 1,
        createdAt: new Date().toISOString(),
      };
      state.jobs.unshift(job);
      return job;
    }),

  publishJob: (id: string) =>
    respond<Job>(() => {
      const job = state.jobs.find((j) => j.id === id);
      if (!job) throw new Error("That job no longer exists. Go back to the dashboard.");
      job.status = "active";
      job.chainJobId = `0x${uid("chain")}`;
      return job;
    }),

  /* ---- buyer views ---- */
  buyerOverview: () =>
    respond<BuyerOverview>(() => {
      const spend = state.jobs.reduce((n, j) => n + j.spent, 0);
      const budget = state.jobs.reduce((n, j) => n + j.budget, 0);
      return {
        ...seed.BUYER_OVERVIEW,
        spend,
        budget,
        budgetLeft: Math.max(0, budget - spend),
      };
    }),

  jobStats: (id: string) =>
    respond<JobStats>(() => {
      const known = seed.JOB_STATS[id];
      if (known) return known;
      const job = state.jobs.find((j) => j.id === id);
      return {
        jobId: id,
        tasksTotal: 0,
        tasksSubmitted: 0,
        tasksAccepted: 0,
        tasksRejected: 0,
        tasksNeedsRevision: 0,
        inReview: 0,
        acceptanceRate: 0,
        spent: job?.spent ?? 0,
        budgetLeft: Math.max(0, (job?.budget ?? 0) - (job?.spent ?? 0)),
        aiReviewed: 0,
        humanReviewed: 0,
        adjudicated: 0,
      };
    }),

  jobExport: (id: string) =>
    respond<ExportManifest>(() => {
      const job = state.jobs.find((j) => j.id === id);
      if (!job) throw new Error("That job no longer exists. Go back to the dashboard.");
      const stats = seed.JOB_STATS[id];
      const accepted = state.earnings.filter(
        (e) => e.state === "accepted" || e.state === "paid",
      );
      const entries = accepted.slice(0, 8).map((e, i) => ({
        taskId: e.taskId,
        annotationHash: `0x${(i + 1).toString(16).padStart(4, "0")}${"a1c3e5b7d9f2".repeat(4)}`,
        contributorPseudonym: "Contributor 4F2A",
        txHash: e.txHash,
      }));
      return {
        jobId: job.id,
        jobTitle: job.title,
        generatedAt: new Date().toISOString(),
        taskCount: stats?.tasksAccepted ?? entries.length,
        annotationHashRoot: `0x${uid("root")}${uid("root")}`,
        policyHash: job.policyHash,
        policyVersion: job.policyVersion,
        mediaIncluded: false,
        entries,
      };
    }),

  /* ---- tasks ---- */
  availableTasks: () => respond(() => state.tasks),

  getTask: (id: string) =>
    respond<AvailableTask>(() => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) throw new Error("That task is no longer available. Go back to the queue.");
      return task;
    }),

  claimTask: (id: string) =>
    respond<Lease>(() => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) throw new Error("That task was claimed by someone else. Pick another.");
      const lease: Lease = {
        taskId: id,
        ownerId: "Contributor 4F2A",
        expiresAt: new Date(Date.now() + 90 * 60_000).toISOString(),
      };
      state.leases.set(id, lease);
      return lease;
    }),

  saveDraft: (id: string, payload: SubmissionPayload) =>
    respond(() => {
      state.drafts.set(id, payload);
      return { savedAt: new Date().toISOString() };
    }),

  submitTask: (id: string, payload: SubmissionPayload) =>
    respond<Submission>(() => {
      const task = state.tasks.find((t) => t.id === id);
      const sub: Submission = {
        id: uid("sub"),
        taskId: id,
        jobTitle: task?.jobTitle ?? "Job",
        contributorId: "Contributor 4F2A",
        version: 1,
        payload,
        payloadHash: `0x${uid("hash")}`,
        state: "submitted",
        submittedAt: new Date().toISOString(),
      };
      state.submissions.unshift(sub);
      // Upsert the earning by task so re-submitting never leaves two rows.
      const existing = state.earnings.find((e) => e.taskId === id);
      const row = {
        taskId: id,
        jobTitle: sub.jobTitle,
        reward: task?.reward ?? 0,
        state: "submitted" as const,
        updatedAt: sub.submittedAt,
      };
      if (existing) state.earnings = state.earnings.map((e) => (e.taskId === id ? row : e));
      else state.earnings.unshift(row);
      return sub;
    }),

  /* ---- review ---- */
  reviewQueue: () => respond(() => state.queue),

  getReview: (submissionId: string) =>
    respond<ReviewItem>(() => {
      const item = state.queue.find((q) => q.submission.id === submissionId);
      if (!item) throw new Error("That submission is not in the queue. It may be decided already.");
      return item;
    }),

  decide: (input: ReviewDecisionInput) =>
    respond<Submission>(() => {
      const item = state.queue.find((q) => q.submission.id === input.submissionId);
      if (!item) throw new Error("That submission was already decided.");
      const nextState =
        input.decision === "accept"
          ? "accepted"
          : input.decision === "revise"
            ? "needs_revision"
            : "rejected";
      item.submission.state = nextState;
      item.submission.version += 1;
      state.queue = state.queue.filter((q) => q.submission.id !== input.submissionId);
      const earning = state.earnings.find((e) => e.taskId === item.submission.taskId);
      if (earning) {
        earning.state = nextState;
        if (input.reasonCode) earning.reasonCode = input.reasonCode;
        earning.updatedAt = new Date().toISOString();
        if (nextState === "accepted") {
          const receipt = makeReceipt(item.submission);
          state.receipts.unshift(receipt);
          earning.receiptId = receipt.id;
          earning.state = "accepted";
        }
      }
      return item.submission;
    }),

  appeal: (submissionId: string, _reason: string) =>
    respond<Submission>(() => {
      const sub =
        state.submissions.find((s) => s.id === submissionId) ??
        state.queue.find((q) => q.submission.id === submissionId)?.submission;
      if (!sub) throw new Error("That submission no longer exists.");
      sub.state = "appealed";
      const earning = state.earnings.find((e) => e.taskId === sub.taskId);
      if (earning) earning.state = "appealed";
      return sub;
    }),

  /* ---- earnings ---- */
  earnings: () =>
    respond<EarningsSummary>(() => {
      const rows = state.earnings;
      const sum = (pred: (s: string) => boolean) =>
        rows.filter((r) => pred(r.state)).reduce((a, r) => a + r.reward, 0);
      return {
        claimable: sum((s) => s === "accepted"),
        waiting: sum((s) => s === "submitted" || s === "needs_revision"),
        paid: sum((s) => s === "paid"),
        rejected: sum((s) => s === "rejected" || s === "appealed"),
        rows,
      };
    }),

  claimReward: (taskId: string) =>
    respond<Receipt>(() => {
      const earning = state.earnings.find((e) => e.taskId === taskId);
      if (!earning || earning.state !== "accepted") {
        throw new Error("That reward is not ready to claim yet.");
      }
      const existing = earning.receiptId
        ? state.receipts.find((r) => r.id === earning.receiptId)
        : undefined;
      const receipt =
        existing ??
        makeReceipt({
          id: uid("sub"),
          taskId,
          jobTitle: earning.jobTitle,
          contributorId: "Contributor 4F2A",
          version: 1,
          payload: { schema_version: "image-boxes-v1", task_id: taskId, asset_id: "a", boxes: [] },
          payloadHash: `0x${uid("hash")}`,
          state: "accepted",
          submittedAt: new Date().toISOString(),
        });
      receipt.txState = "confirmed";
      receipt.txHash = `0x${uid("tx")}`;
      receipt.issuedAt = new Date().toISOString();
      state.receipts.unshift(receipt);
      earning.state = "paid";
      earning.receiptId = receipt.id;
      earning.txHash = receipt.txHash;
      earning.txState = "confirmed";
      earning.updatedAt = receipt.issuedAt;
      return receipt;
    }),

  /* ---- receipts ---- */
  receipt: (id: string) =>
    respond<Receipt>(() => {
      const r = state.receipts.find((x) => x.id === id);
      if (!r) throw new Error("No receipt with that id.");
      return r;
    }),

  /* ---- assets ---- */
  asset: (id: string) =>
    respond<Asset>(() => {
      const a = seed.ASSETS.find((x) => x.id === id);
      if (!a) throw new Error("That asset could not be loaded.");
      return a;
    }),

  /* ---- audit ---- */
  auditSample: (_jobId: string) => respond<AuditSample>(() => seed.AUDIT_SAMPLE),

  /* ---- admin ---- */
  signerPolicy: () => respond<SignerPolicy>(() => seed.SIGNER_POLICY),
  quorumRequests: () => respond<QuorumRequest[]>(() => state.quorum),
  quorumApprove: (id: string) =>
    respond<QuorumRequest>(() => {
      const q = state.quorum.find((x) => x.id === id);
      if (!q) throw new Error("That request no longer exists.");
      if (q.executed) return q;
      q.approvals = Math.min(q.approvalsNeeded, q.approvals + 1);
      q.approvers.push("Admin 02");
      if (q.approvals >= q.approvalsNeeded) {
        q.executed = true;
        q.txHash = `0x${uid("tx")}`;
      }
      return q;
    }),
  quorumReject: (id: string) =>
    respond<QuorumRequest>(() => {
      state.quorum = state.quorum.filter((x) => x.id !== id);
      return seed.QUORUM_REQUESTS.find((x) => x.id === id)!;
    }),
  roles: () => respond<RoleRow[]>(() => state.roles),
  setRole: (id: string, role: Role) =>
    respond<RoleRow>(() => {
      const row = state.roles.find((r) => r.id === id);
      if (!row) throw new Error("That user no longer exists.");
      row.role = role;
      return row;
    }),
  pauseJob: (id: string) =>
    respond<Job>(() => {
      const job = state.jobs.find((j) => j.id === id);
      if (!job) throw new Error("That job no longer exists.");
      job.status = job.status === "paused" ? "active" : "paused";
      return job;
    }),

  /* ---- chain feed ---- */
  chainEvents: (jobId?: string) =>
    respond<ChainEvent[]>(() =>
      jobId ? seed.CHAIN_EVENTS.filter((e) => e.jobId === jobId) : seed.CHAIN_EVENTS,
    ),
};

function makeReceipt(sub: Submission): Receipt {
  return {
    id: uid("rcpt"),
    taskId: sub.taskId,
    jobTitle: sub.jobTitle,
    contributorPseudonym: sub.contributorId,
    annotationHash: sub.payloadHash,
    policyHash: `0x${uid("policy")}`,
    policyVersion: 3,
    reviewerType: "human",
    amount: 0.5,
    token: "test USDC",
    txState: "confirmed",
    txHash: `0x${uid("tx")}`,
    issuedAt: new Date().toISOString(),
    mock: true,
  };
}
