# API needs — frontend ↔ backend contract

This file is the frontend's request to the backend (AGENTS.md A6). It mirrors the
illustrative endpoints in `docs/PRD.md` §13, then lists the extra endpoints and
fields the UI needs, with the exact shapes. The single source of truth for the
shapes in code is `lib/api/types.ts` (zod); the client is `lib/api/client.ts` and
`lib/api/real.ts`, and the mock implementations are in `mocks/`.

Everything below is called by the UI. In mock mode
(`NEXT_PUBLIC_USE_MOCKS=true`) `mocks/api.ts` answers the same signatures, so the
two clients stay in step.

## 1. Conventions (must match on the server)

- **Auth.** Every route checks the Privy login token, then the role. Role checks
  in the UI are for experience only; the server decides.
- **Every response is zod-parsed** before it reaches a component. Return values
  must match the schemas in `lib/api/types.ts`. An unexpected shape is treated as
  an error, not coerced.
- **Idempotency keys** are sent on every state-changing call (claim, draft,
  submit, decision, appeal, payout). Keys are stable strings, listed per endpoint
  below. Retrying with the same key must return the same result.
- **Errors.** Non-2xx responses should be JSON `{ "error": string }`. The message
  is shown to the user verbatim, so write it as a plain sentence that says what
  happened and how to fix it. Do not apologise.
- **Money.** Testnet only. Amounts are numbers in test USDC with no real value.
  Never return a server-generated "confirmed" without a real tx hash.
- **Privacy.** Never return a contributor's email or legal name outside the admin
  routes. Use the pseudonymous id. Raw media and labels travel only over signed,
  short-lived URLs.

## 2. Endpoints from PRD §13 (used by the UI)

| Method | Path | Returns | Notes |
|---|---|---|---|
| `GET` | `/api/jobs` | `Job[]` | Buyer dashboard list |
| `POST` | `/api/jobs` | `Job` | Creates a **draft**. Body: `CreateJobInput` |
| `POST` | `/api/jobs/{id}/publish` | `Job` | Funds + publishes. Locks the budget on Monad |
| `GET` | `/api/tasks/available` | `AvailableTask[]` | Contributor queue |
| `POST` | `/api/tasks/{id}/claim` | `Lease` | Key `claim_{id}` |
| `PUT` | `/api/tasks/{id}/draft` | `{ savedAt: string }` | Key `draft_{id}`. Body: `SubmissionPayload` |
| `POST` | `/api/tasks/{id}/submit` | `Submission` | Key `submit_{id}`. Body: `SubmissionPayload` |
| `POST` | `/api/reviews/{submissionId}/decision` | `Submission` | Key `decision_{submissionId}`. Body: `ReviewDecisionInput` |
| `POST` | `/api/submissions/{id}/appeal` | `Submission` | Key `appeal_{id}`. Body: `{ reason: string }` |
| `GET` | `/api/jobs/{id}/export` | `ExportManifest` | Accepted-only export + manifest |
| `GET` | `/api/receipts/{id}` | `Receipt` | Public, minimal |

### `CreateJobInput` (request body for `POST /api/jobs`)

```ts
{
  title: string;              // 4+ chars
  modality: "image" | "video";
  classes: string[];          // image: buyer's list; video: the fixed action labels
  rubric: { id: string; text: string }[];   // at least one; each 10+ chars
  rewardPerTask: number;      // > 0
  budget: number;             // > 0 and >= rewardPerTask
  deadline: string;           // ISO; must be in the future
  dataRightsAttested: boolean;// must be true
}
```

The UI blocks funding unless the rubric has at least one testable rule, the budget
covers at least one reward, the deadline is in the future, and the data-rights box
is ticked (PRD §9: "No testable rubric, no launch").

## 3. Endpoints the UI needs that are not in PRD §13

These are marked in `lib/api/real.ts`. Shapes are in `lib/api/types.ts`.

| Method | Path | Returns | Why the UI needs it |
|---|---|---|---|
| `GET` | `/api/buyer/overview` | `BuyerOverview` | Dashboard header: accepted, in review, acceptance rate, spend, budget left, AI vs human share |
| `GET` | `/api/jobs/{id}/stats` | `JobStats` | Buyer job detail progress (same shape, scoped to one job) |
| `GET` | `/api/jobs/{id}/audit` | `AuditSample` | Job detail: VRF request, public seed, selected task ids |
| `GET` | `/api/tasks/{id}` | `AvailableTask` | Workbench: load one task (schema, classes, rubric, asset) |
| `GET` | `/api/reviews/queue` | `ReviewItem[]` | Reviewer queue, sorted by risk |
| `GET` | `/api/reviews/{submissionId}` | `ReviewItem` | Review console: submission + reference + AI + checklist + flags |
| `GET` | `/api/earnings` | `EarningsSummary` | Contributor earnings, receipts, claimable/waiting/paid |
| `POST` | `/api/earnings/{taskId}/claim` | `Receipt` | Key `payout_{taskId}`. Claim a payout |
| `GET` | `/api/chain/events?jobId=` | `ChainEvent[]` | Job detail activity; omit `jobId` for the whole workspace |
| `GET` | `/api/admin/signer-policy` | `SignerPolicy` | Admin: signer status and allowed calls |
| `GET` | `/api/admin/quorum` | `QuorumRequest[]` | Admin: pending quorum actions |
| `POST` | `/api/admin/quorum/{id}/approve` | `QuorumRequest` | Admin: approve |
| `POST` | `/api/admin/quorum/{id}/reject` | `QuorumRequest` | Admin: reject |
| `GET` | `/api/admin/roles` | `RoleRow[]` | Admin: role list (the only place names/emails may appear) |
| `PATCH` | `/api/admin/roles/{id}` | `RoleRow` | Admin: change a role. Body `{ role: Role }` |
| `POST` | `/api/admin/jobs/{id}/pause` | `Job` | Admin: pause a job |

## 4. Response shapes the backend must provide

### `BuyerOverview`

```ts
{
  tasksAccepted: number; tasksInReview: number; acceptanceRate: number; // 0..1
  spend: number; budget: number; budgetLeft: number;
  aiReviewed: number; humanReviewed: number; adjudicated: number;
}
```

### `JobStats`

Same fields as `BuyerOverview`, plus `jobId`, `tasksTotal`, `tasksSubmitted`,
`tasksRejected`, `tasksNeedsRevision`, `inReview`. Scoped to one job.

### `ExportManifest` (returned by `GET /api/jobs/{id}/export`)

```ts
{
  jobId: string; jobTitle: string; generatedAt: string; taskCount: number;
  annotationHashRoot: string; policyHash: string; policyVersion: number;
  mediaIncluded: false;                    // raw media is never in an export
  entries: { taskId: string; annotationHash: string;
             contributorPseudonym: string; txHash?: string }[];
}
```

### `ReviewItem` (returned by the review queue and console)

```ts
{
  submission: Submission;
  asset: Asset;
  ai?: { decision: "accept"|"revise"|"reject"; reasonCode: string; confidence: number; note?: string };
  reference?: SubmissionPayload;   // the gold/reference labels for comparison
  checklist: { id: string; label: string; passed: boolean | null }[];
  flags: string[];                 // why it is in the queue (risk)
}
```

### `ChainEvent` — one field added

`ChainEvent` now carries an optional `jobId` so the job detail can show only that
job's activity:

```ts
{ id, name, jobId?, taskId?, amount?, txHash, blockNumber?, at }
```

### `Asset` and signed media URLs

`GET /api/assets/{id}` returns `Asset` including a short-lived signed `url` for the
private object. The UI loads images and video directly from it. Signed URLs should
expire in minutes, not hours.

### Annotation payloads the server must accept

`SubmissionPayload` is a discriminated union on `schema_version`. The UI validates
both shapes with the same rules before it calls draft or submit (AGENTS.md A8), so
the server must accept exactly what the UI allows and reject the rest with a plain
message.

```ts
// image-boxes-v1
{ task_id, asset_id, schema_version: "image-boxes-v1",
  boxes: { id?, x, y, w, h, class, confidence: 1..5 }[],
  answers?: Record<string, string> }
// each box must stay inside the image; w and h are positive

// action-segments-v1
{ task_id, asset_id, schema_version: "action-segments-v1",
  segments: { id, start_ms, end_ms,
              action_label: "reach"|"grasp"|"lift"|"place"|"inspect"|"recover"|"write"|"other",
              object, outcome: "success"|"partial"|"failure"|"unknown",
              failure_reason?, confidence: 1..5 }[] }
// end_ms > start_ms, both inside the clip; segments in order, no overlap;
// failure_reason is required when outcome is "failure"
```

Video tasks also need the asset to carry `durationMs` and `fps` (the UI snaps all
times to `fps`) and to support HTTP range requests so frame stepping and scrubbing
are fast.

## 5. Auth and real mode

- **Login.** The frontend signs in with Privy when `NEXT_PUBLIC_PRIVY_APP_ID` is
  set. The signed-in user's role comes from their Privy custom metadata
  (`customMetadata.role`, one of `buyer|contributor|reviewer|admin`); anything
  else falls back to contributor. The server must still check the role on every
  request. With no app id, mock mode shows the role picker instead.
- **Switching to real mode.** Set `NEXT_PUBLIC_USE_MOCKS=false` and
  `NEXT_PUBLIC_PRIVY_APP_ID=<id>`. With mock mode off, the client calls the real
  routes in `lib/api/real.ts`; they must exist and match this document or the
  screens will show their error state.
- **Token.** Send the Privy access token on every request (please confirm the
  header name and scheme; see §6).

## 6. Honesty rules the API must not break

- A pending payout returns a state such as `pending`; the UI shows "Waiting for
  confirmation" and only shows "Confirmed" with a real tx hash.
- A failed payout returns an error plus the tx hash; the UI shows the error and a
  retry.
- No reputation/acceptance rate should be treated as meaningful under the sample
  size in `lib/config.ts` (`MIN_SAMPLE_FOR_RATE`). The UI shows "Not enough data
  yet" below it and expects the same restraint server-side.
- Contributors never see gold/overlap markers. `ReviewItem` (which carries
  `isGold`/`isOverlapSample` on the submission) is reviewer/admin only.

## 7. Open questions for the backend

1. Auth token format on each request (Privy JWT in `Authorization`?).
2. Exact `Asset` signed-URL lifetime and whether video supports range requests.
3. `GET /api/earnings` — does `claimable` include tasks still inside the review
   window, or only post-window accepted tasks?
4. Statement/receipt id format (we currently use `sub_…` for receipts).
5. Monad gas sponsorship: does the Privy server wallet sponsor the payout claim,
   or does the contributor need testnet gas?
