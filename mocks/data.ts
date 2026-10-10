import type {
  Asset,
  AuditSample,
  AvailableTask,
  BuyerOverview,
  ChainEvent,
  EarningRow,
  Job,
  JobStats,
  Receipt,
  RoleRow,
  SignerPolicy,
  Submission,
  QuorumRequest,
  ReviewItem,
} from "@/lib/api/types";

/**
 * Seed data for mock mode. Synthetic and clearly labelled — never presented as
 * real activity (AGENTS.md A6 honesty rules). Nothing here is a real person,
 * real money, or a real transaction.
 */

const NOW = new Date("2026-10-11T14:00:00Z").getTime();
const iso = (offsetMinutes: number) => new Date(NOW + offsetMinutes * 60_000).toISOString();

export const JOBS: Job[] = [
  {
    id: "job_pickplace",
    title: "Pick and place, kitchen set",
    modality: "image",
    status: "active",
    classes: ["cup", "pen", "red_block"],
    rubric: [
      { id: "r1", text: "A box contains the whole object with at most 5 px of slack on any edge." },
      { id: "r2", text: "The class matches the object: a cup is a cup, a pen is a pen." },
      { id: "r3", text: "Boxes do not overlap each other unless the objects really overlap." },
    ],
    rewardPerTask: 0.5,
    budget: 100,
    spent: 48,
    deadline: iso(60 * 40),
    policyHash: "0x7d41b0e9c2a4f83d5a1e6b90c7f2d4a8e3b1c6f0a9d2e5b8c1f4a7d0e3b6c9f2",
    policyVersion: 3,
    chainJobId: "0x4f7a1c9e2b8d6a4f0c3e1d9b7a5c2e8f",
    createdAt: iso(-60 * 26),
  },
  {
    id: "job_penwriting",
    title: "Pen writing, kitchen set",
    modality: "video",
    status: "active",
    classes: ["reach", "grasp", "lift", "place", "write", "other"],
    rubric: [
      { id: "r1", text: "Each action gets its own segment; times are frame-accurate." },
      { id: "r2", text: "Segments follow each other with no overlap and stay inside the clip." },
      { id: "r3", text: "A failure gets outcome failure and a reason; recovery gets its own segment." },
    ],
    rewardPerTask: 2,
    budget: 60,
    spent: 22,
    deadline: iso(60 * 40),
    policyHash: "0x2b8e4a1c7d9f3b6e0a5c8d2f4b7e9a1c3d6f8b0e2a5c7d9f1b4e6a8c0d3f5b7e",
    policyVersion: 3,
    chainJobId: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d",
    createdAt: iso(-60 * 26),
  },
];

/** Synthetic demo media. Swap for permission-cleared footage before any demo (PRD §17). */
export const ASSETS: Asset[] = [
  {
    id: "asset_img_017",
    modality: "image",
    url: "/media/table-scene.svg",
    thumbUrl: "/media/table-scene.svg",
    width: 1280,
    height: 960,
    contentHash: "0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
  },
  {
    id: "asset_vid_042",
    modality: "video",
    url: "/media/pen-writing.mp4",
    thumbUrl: "/media/pen-writing-poster.svg",
    durationMs: 12_000,
    fps: 30,
    width: 1280,
    height: 720,
    contentHash: "0x9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a0",
  },
];

export const TASK_RUBRIC = JOBS[0].rubric;

export const AVAILABLE_TASKS: AvailableTask[] = [
  {
    id: "task_01Ha2",
    jobId: "job_pickplace",
    jobTitle: "Pick and place, kitchen set",
    modality: "image",
    reward: 0.5,
    estimatedMinutes: 3,
    deadline: iso(60 * 40),
    classes: JOBS[0].classes,
    rubric: JOBS[0].rubric,
    asset: ASSETS[0],
  },
  {
    id: "task_01Hb7",
    jobId: "job_pickplace",
    jobTitle: "Pick and place, kitchen set",
    modality: "image",
    reward: 0.5,
    estimatedMinutes: 4,
    deadline: iso(60 * 40),
    classes: JOBS[0].classes,
    rubric: JOBS[0].rubric,
    asset: ASSETS[0],
  },
  {
    id: "task_01Hc1",
    jobId: "job_pickplace",
    jobTitle: "Pick and place, kitchen set",
    modality: "image",
    reward: 0.5,
    estimatedMinutes: 3,
    deadline: iso(60 * 40),
    classes: JOBS[0].classes,
    rubric: JOBS[0].rubric,
    asset: ASSETS[0],
  },
  {
    id: "task_01Hd9",
    jobId: "job_penwriting",
    jobTitle: "Pen writing, kitchen set",
    modality: "video",
    reward: 2,
    estimatedMinutes: 8,
    deadline: iso(60 * 40),
    classes: JOBS[1].classes,
    rubric: JOBS[1].rubric,
    asset: ASSETS[1],
  },
  {
    id: "task_01He4",
    jobId: "job_penwriting",
    jobTitle: "Pen writing, kitchen set",
    modality: "video",
    reward: 2,
    estimatedMinutes: 7,
    deadline: iso(60 * 40),
    classes: JOBS[1].classes,
    rubric: JOBS[1].rubric,
    asset: ASSETS[1],
  },
];

/** One submission per result state, so the result view and earnings can be built. */
export const SUBMISSIONS: Submission[] = [
  {
    id: "sub_a2",
    taskId: "task_01Ha2",
    jobTitle: "Pick and place, kitchen set",
    contributorId: "Contributor 4F2A",
    version: 1,
    payload: {
      task_id: "task_01Ha2",
      asset_id: "asset_img_017",
      schema_version: "image-boxes-v1",
      boxes: [
        { id: "b1", x: 214, y: 168, w: 188, h: 214, class: "cup", confidence: 4 },
        { id: "b2", x: 520, y: 402, w: 176, h: 88, class: "pen", confidence: 5 },
      ],
      answers: { grasp_success: "yes" },
    },
    payloadHash: "0x2bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a3c6f9b2d5e8a",
    state: "accepted",
    submittedAt: iso(-90),
  },
  {
    id: "sub_b7",
    taskId: "task_01Hb7",
    jobTitle: "Pick and place, kitchen set",
    contributorId: "Contributor 4F2A",
    version: 1,
    payload: {
      task_id: "task_01Hb7",
      asset_id: "asset_img_017",
      schema_version: "image-boxes-v1",
      boxes: [
        { id: "b1", x: 240, y: 190, w: 150, h: 180, class: "cup", confidence: 3 },
      ],
    },
    payloadHash: "0x7a0f3d6b9e2c5a8f1b4d7e0a3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c",
    state: "needs_revision",
    submittedAt: iso(-140),
  },
  {
    id: "sub_c1",
    taskId: "task_01Hc1",
    jobTitle: "Pick and place, kitchen set",
    contributorId: "Contributor 4F2A",
    version: 2,
    payload: {
      task_id: "task_01Hc1",
      asset_id: "asset_img_017",
      schema_version: "image-boxes-v1",
      boxes: [
        { id: "b1", x: 300, y: 120, w: 120, h: 140, class: "red_block", confidence: 5 },
      ],
    },
    payloadHash: "0xd6b9e2c5a8f1b4d7e0a3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3",
    state: "rejected",
    submittedAt: iso(-200),
  },
  {
    id: "sub_91",
    taskId: "task_01Hd9",
    jobTitle: "Pen writing, kitchen set",
    contributorId: "Contributor 4F2A",
    version: 1,
    payload: {
      task_id: "task_01Hd9",
      asset_id: "asset_vid_042",
      schema_version: "action-segments-v1",
      segments: [
        { id: "s1", start_ms: 0, end_ms: 1200, action_label: "reach", object: "pen", outcome: "success", confidence: 4 },
        { id: "s2", start_ms: 1200, end_ms: 3400, action_label: "grasp", object: "pen", outcome: "success", confidence: 4 },
        { id: "s3", start_ms: 3400, end_ms: 4000, action_label: "lift", object: "pen", outcome: "success", confidence: 4 },
        { id: "s4", start_ms: 4000, end_ms: 11000, action_label: "write", object: "paper", outcome: "success", confidence: 4 },
        { id: "s5", start_ms: 11000, end_ms: 12000, action_label: "place", object: "pen", outcome: "success", confidence: 5 },
      ],
    },
    payloadHash: "0x3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a",
    state: "paid",
    submittedAt: iso(-300),
  },
  {
    id: "sub_vid2",
    taskId: "task_01He4",
    jobTitle: "Pen writing, kitchen set",
    contributorId: "Contributor 8B1C",
    version: 1,
    payload: {
      task_id: "task_01He4",
      asset_id: "asset_vid_042",
      schema_version: "action-segments-v1",
      segments: [
        { id: "s1", start_ms: 0, end_ms: 1400, action_label: "reach", object: "pen", outcome: "success", confidence: 4 },
        { id: "s2", start_ms: 1400, end_ms: 3400, action_label: "grasp", object: "pen", outcome: "success", confidence: 4 },
        { id: "s3", start_ms: 3400, end_ms: 4000, action_label: "lift", object: "pen", outcome: "success", confidence: 4 },
        { id: "s4", start_ms: 4000, end_ms: 10600, action_label: "inspect", object: "pen", outcome: "success", confidence: 3 },
        { id: "s5", start_ms: 10900, end_ms: 12000, action_label: "place", object: "pen", outcome: "success", confidence: 5 },
      ],
    },
    payloadHash: "0x8b1c4e7a0d3f6b9e2c5a8f1b4d7e0a3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d",
    state: "submitted",
    submittedAt: iso(-40),
  },
];

/** The reviewer queue: reference labels are reviewer-only. */
export const REVIEW_QUEUE: ReviewItem[] = [
  {
    submission: {
      ...SUBMISSIONS[1],
      reference: {
        task_id: "task_01Hb7",
        asset_id: "asset_img_017",
        schema_version: "image-boxes-v1",
        boxes: [
          { id: "r1", x: 232, y: 182, w: 178, h: 206, class: "cup", confidence: 5 },
          { id: "r2", x: 516, y: 398, w: 180, h: 92, class: "pen", confidence: 5 },
        ],
        answers: { grasp_success: "yes" },
      },
    },
    asset: ASSETS[0],
    ai: {
      decision: "revise",
      reasonCode: "BOX_LOOSE",
      confidence: 0.58,
      note: "Box 1 is loose on the left and bottom edges. A pen is present but not boxed.",
    },
    checklist: [
      { id: "c1", label: "Class matches the object", passed: true },
      { id: "c2", label: "Box edges within 5 px", passed: false },
      { id: "c3", label: "Every listed object has a box", passed: false },
    ],
    flags: ["First-time contributor", "Submitted quickly"],
  },
  {
    submission: SUBMISSIONS[2],
    asset: ASSETS[0],
    ai: {
      decision: "reject",
      reasonCode: "WRONG_CLASS",
      confidence: 0.91,
      note: "The boxed object is a cup, not a red block.",
    },
    checklist: [
      { id: "c1", label: "Class matches the object", passed: false },
      { id: "c2", label: "Box edges within 5 px", passed: true },
    ],
    flags: [],
  },
  {
    submission: {
      ...SUBMISSIONS[4],
      reference: {
        task_id: "task_01He4",
        asset_id: "asset_vid_042",
        schema_version: "action-segments-v1",
        segments: [
          { id: "r1", start_ms: 0, end_ms: 1100, action_label: "reach", object: "pen", outcome: "success", confidence: 5 },
          { id: "r2", start_ms: 1100, end_ms: 3200, action_label: "grasp", object: "pen", outcome: "success", confidence: 5 },
          { id: "r3", start_ms: 3200, end_ms: 4000, action_label: "lift", object: "pen", outcome: "success", confidence: 5 },
          { id: "r4", start_ms: 4000, end_ms: 10800, action_label: "write", object: "paper", outcome: "success", confidence: 5 },
          { id: "r5", start_ms: 10800, end_ms: 12000, action_label: "place", object: "pen", outcome: "success", confidence: 5 },
        ],
      },
    },
    asset: ASSETS[1],
    ai: {
      decision: "revise",
      reasonCode: "LABEL_MISMATCH",
      confidence: 0.64,
      note: "The long stroke from 4.0 s to 10.6 s is writing, not inspecting. Times are a little wide at both ends.",
    },
    checklist: [
      { id: "c1", label: "Segments follow each other with no overlap", passed: true },
      { id: "c2", label: "Times are frame-accurate", passed: false },
      { id: "c3", label: "Every action carries the right label", passed: false },
    ],
    flags: ["First-time contributor", "Times differ from the reference"],
  },
];

export const EARNINGS: EarningRow[] = [
  {
    taskId: "task_01Ha2",
    jobTitle: "Pick and place, kitchen set",
    reward: 0.5,
    state: "accepted",
    updatedAt: iso(-80),
  },
  {
    taskId: "task_01Hb7",
    jobTitle: "Pick and place, kitchen set",
    reward: 0.5,
    state: "needs_revision",
    reasonCode: "BOX_LOOSE",
    updatedAt: iso(-130),
  },
  {
    taskId: "task_01Hc1",
    jobTitle: "Pick and place, kitchen set",
    reward: 0.5,
    state: "rejected",
    reasonCode: "WRONG_CLASS",
    updatedAt: iso(-190),
  },
  {
    taskId: "task_01Hd9",
    jobTitle: "Pen writing, kitchen set",
    reward: 2,
    state: "paid",
    receiptId: "rcpt_91",
    txHash: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e",
    txState: "confirmed",
    updatedAt: iso(-280),
  },
  {
    taskId: "task_01He4",
    jobTitle: "Pen writing, kitchen set",
    reward: 2,
    state: "submitted",
    updatedAt: iso(-38),
  },
];

export const RECEIPTS: Receipt[] = [
  {
    id: "rcpt_91",
    taskId: "task_01Hd9",
    jobTitle: "Pen writing, kitchen set",
    contributorPseudonym: "Contributor 4F2A",
    annotationHash: "0x3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a",
    policyHash: "0x2b8e4a1c7d9f3b6e0a5c8d2f4b7e9a1c3d6f8b0e2a5c7d9f1b4e6a8c0d3f5b7e",
    policyVersion: 3,
    reviewerType: "human",
    amount: 2,
    token: "test USDC",
    txHash: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e",
    txState: "confirmed",
    issuedAt: iso(-275),
    mock: true,
  },
];

/** Buyer dashboard aggregates. Added for the UI (docs/API-NEEDS.md). */
export const BUYER_OVERVIEW: BuyerOverview = {
  tasksAccepted: 214,
  tasksInReview: 37,
  acceptanceRate: 0.86,
  spend: 70,
  budget: 160,
  budgetLeft: 90,
  aiReviewed: 168,
  humanReviewed: 74,
  adjudicated: 9,
};

/** Per-job progress, scoped by job id. Totals match BUYER_OVERVIEW above. */
export const JOB_STATS: Record<string, JobStats> = {
  job_pickplace: {
    jobId: "job_pickplace",
    tasksTotal: 260,
    tasksSubmitted: 232,
    tasksAccepted: 198,
    tasksRejected: 19,
    tasksNeedsRevision: 15,
    inReview: 28,
    acceptanceRate: 0.85,
    spent: 48,
    budgetLeft: 52,
    aiReviewed: 150,
    humanReviewed: 62,
    adjudicated: 7,
  },
  job_penwriting: {
    jobId: "job_penwriting",
    tasksTotal: 40,
    tasksSubmitted: 31,
    tasksAccepted: 16,
    tasksRejected: 4,
    tasksNeedsRevision: 11,
    inReview: 9,
    acceptanceRate: 0.8,
    spent: 22,
    budgetLeft: 38,
    aiReviewed: 18,
    humanReviewed: 12,
    adjudicated: 2,
  },
};

export const AUDIT_SAMPLE: AuditSample = {
  id: "audit_001",
  jobId: "job_pickplace",
  vrfRequestId: "0x5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c",
  seed: "0x5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a3c6f9b2d",
  selectedTaskIds: ["task_01Ha2", "task_01Hc1", "task_01Hb7"],
  createdAt: iso(-45),
};

export const SIGNER_POLICY: SignerPolicy = {
  signer: "Privy server wallet 0x4f…a1",
  status: "active",
  allowed: "JobEscrow.markAccepted only",
  quorumSize: 2,
};

export const QUORUM_REQUESTS: QuorumRequest[] = [
  {
    id: "quorum_1",
    action: "refund",
    jobTitle: "Pen writing, kitchen set",
    requestedBy: "Buyer",
    approvals: 1,
    approvalsNeeded: 2,
    approvers: ["Buyer"],
    executed: false,
    createdAt: iso(-30),
  },
  {
    id: "quorum_2",
    action: "pause",
    jobTitle: "Pick and place, kitchen set",
    requestedBy: "Admin",
    approvals: 2,
    approvalsNeeded: 2,
    approvers: ["Admin", "Buyer"],
    executed: true,
    txHash: "0x41c5e7b0d2f4a6c8e9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1",
    createdAt: iso(-120),
  },
];

/** Only /admin shows email or legal name (AGENTS.md A6 honesty rules). */
export const ROLES: RoleRow[] = [
  { id: "u_buyer", name: "Priya N.", email: "priya@acme-robotics.example", pseudonym: "Buyer 7C31", role: "buyer" },
  { id: "u_contrib", name: "Sam O.", email: "sam.o@example.com", pseudonym: "Contributor 4F2A", role: "contributor" },
  { id: "u_reviewer", name: "Lena K.", email: "lena.k@example.com", pseudonym: "Reviewer 19", role: "reviewer" },
  { id: "u_admin", name: "Dario M.", email: "dario@physicaldata.example", pseudonym: "Admin 02", role: "admin" },
];

export const CHAIN_EVENTS: ChainEvent[] = [
  { id: "ev1", name: "JobCreated", jobId: "job_pickplace", txHash: "0x4f7a1c9e2b8d6a4f0c3e1d9b7a5c2e8f6a0c2e4b7d9f1a3c5e7b0d2f4a6c8e9", blockNumber: 8_120_441, at: iso(-60 * 26) },
  { id: "ev2", name: "TaskAccepted", jobId: "job_pickplace", taskId: "task_01Ha2", txHash: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e", blockNumber: 8_121_002, at: iso(-78) },
  { id: "ev3", name: "PayoutClaimed", jobId: "job_penwriting", taskId: "task_01Hd9", amount: 2, txHash: "0x41c5e7b0d2f4a6c8e9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1", blockNumber: 8_121_340, at: iso(-275) },
];
