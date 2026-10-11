# AGENTS.md — PhysicalData Network frontend rules

These rules survive every session. Read them before any work, together with `docs/PRD.md` (the authoritative product spec) and `docs/DESIGN.md` (the design source of truth). If code and either document disagree, fix one of them the same day.

## A0. Design read and dials (set once, do not drift)

**Reading this as:** an internal, trust-first **work tool** for contributors, reviewers, buyers and admins — not a marketing site and not a crypto landing page. The app language is calm and disciplined: flat panels, hairline structure, one accent, no decoration. The subject world is inspection benches, film-editor timelines with timecode, calibration targets and chain-of-custody slips.

Dials for the **product app**: `DESIGN_VARIANCE: 4` (offset, never artsy), `MOTION_INTENSITY: 3` (motion only answers an action), `VISUAL_DENSITY: 7` (data-dense tools, rules instead of cards). The **landing page** may go to `VARIANCE: 6`, `MOTION: 4`, `DENSITY: 4`, but still inside this one palette and one type system.

The anti-slop rules apply: no gradient washes, no purple/neon glow, no identical rounded cards with the same grey shadow, no centred hero with a stat block, no tracked-out ALL-CAPS eyebrows above headings, no meta strings joined by middle dots, no arrows appended to buttons, no monospace used as decoration, no one word accented in a headline, no numbered markers on things that are not a real sequence.

---

## A1. Product in one paragraph

PhysicalData Network lets a robotics team post image and video labelling jobs. Qualified contributors label them for stablecoin rewards. Only work that passes review gets paid. Monad holds the budget and one receipt per payout. Raw media and labels stay in private storage. Today is the hackathon build: laptop-first, testnet only, rewards are test tokens with no real value.

You are the frontend engineer and UI/UX designer. A teammate builds the backend (Next.js API routes, Supabase, Privy server wallet, contracts). Never edit backend or contract code. Work only in `app/`, `components/`, `lib/` (frontend parts), `styles/`, `public/`, and `mocks/`.

## A2. Who uses it and what they need (design for these people)

| Role | Mindset | What the UI must do for them |
|---|---|---|
| Contributor | Doing careful data entry for hours. Wants speed, clear rules, fast feedback, and fair pay. Fears silent rejection and late payment. | Show reward and rubric before claiming. Make labelling fast (keyboard-first, autosave). Give a plain reason for every rejection. Make "accepted" and "paid" visibly different. |
| Buyer (robotics team) | Wants trustworthy labels without doing QA. Skeptical of AI and crypto claims. | Show spend, acceptance rate, and AI-vs-human review share. Show where every accepted label came from. Export accepted work only, with a manifest. |
| Reviewer | Triaging a queue. Needs to compare and decide in seconds, with a required reason. | Submitted labels next to reference labels, mismatches highlighted, rubric checklist, three clear buttons. Never show their own submissions. |
| Admin | Guards the money. | Pause, roles, signer policy status, and quorum approvals for refund, close, pause, and policy change. |

Judges will see a four-minute demo. Every screen must read clearly in a screen recording at 1440x900.

## A3. Design direction (decided, do not drift)

**Subject world:** inspection benches, film-editor timelines, calibration targets, chain-of-custody slips. This is a calm work tool, not a crypto landing page.

**Memorable moment (spend boldness here only):** the **receipt**, designed as a chain-of-custody slip with notched edges, and the **video timeline**, designed like an editor's dope sheet with timecode. Everything else stays quiet and disciplined.

**Avoid these defaults:** cream background with terracotta accent; near-black with acid green; newspaper layouts with hairline rules and zero radius; identical rounded cards with the same grey shadow; gradient washes; tracked-out ALL-CAPS eyebrows above headings; meta strings joined by middle dots; spaced em-dash labels; arrows appended to buttons; a monospace face used as decoration; one word accented in a headline; numbered markers on things that are not a sequence.

### Tokens (put in `styles/tokens.css`, mirror in Tailwind theme and shadcn variables)

Colour (verify every text pair meets WCAG AA with a quick script):

| Token | Hex | Use |
|---|---|---|
| bench | #ECEEF3 | App background |
| sheet | #FFFFFF | Panels and forms |
| surface-2 | #F5F7FA | Second surface tint: sidebar, grouped regions |
| ink | #18202B | Text (not pure black) |
| ink-muted | #5B6676 | Secondary text |
| rule | ink at 12% | Decorative separators between zones only. **Never** a control border. |
| field-edge | #7A8493 | Borders of inputs and controls (3.8:1 on sheet, passes 3:1 for boundaries). |
| accent (cobalt) | #1F4FE0, hover #173FC0, tint #E8EEFF | The single accent: primary actions, selection, focus ring |
| stage | #161B22 (text #E6EAF0) | Dark surround for media only (images, video), because media is judged best on a dark neutral |

Status colours (fixed by the PRD; always shown with an icon and a text label, never colour alone):

| State | Text / background | Icon |
|---|---|---|
| Pending (draft, submitted) | #5B6676 / #EEF0F3 | clock |
| Needs revision | #9A6200 / #FFF1D6 | pencil |
| Accepted | #17754A / #E2F4EA | check |
| Rejected | #B3261E / #FCE6E4 | x |
| Appealed | ink on white, dashed border | flag |
| Paid | #7A35C8 / #F1E7FB | coin |

Video label colours: use the Okabe-Ito colour-blind-safe palette for reach, grasp, lift, place, inspect, recover, write, other. Every segment also shows its text label. Failure segments add a diagonal hatch and a red outline.

Type (load with `next/font/google`, two families only):

- **Headings and numbers that matter:** Bricolage Grotesque (variable). Used for page titles, panel titles, reward amounts, and the receipt heading.
- **UI and body:** Instrument Sans.
- Machine values (hashes, tx links, timecodes) use the system monospace stack with `font-variant-numeric: tabular-nums`. Do not load a third family.
- Scale: 12 / 14 / 16 / 20 / 28 / 40. Body 14 in tools, 16 in reading text. Line length under 80 characters. Sentence case everywhere.

Shape: radius is a hierarchy, not one value. 8px for controls, inputs, chips and focus rings. 12px for panels, dialogs and cards. 4px for dense geometry only (timeline segments, meter fills, annotation boxes). Full radius only for status pills. Shadow only on floating layers (menus, dialogs). Panels are separated by 1px `rule` lines.

Shell: a 232px left sidebar (collapsible to a 68px icon rail) carries the workspace, role nav, network state and wallet. Content is capped at 1200px on every screen. Workbenches use `AppShell bare`: full-bleed focus canvas, no sidebar, no content padding. Below the sidebar breakpoint the shell collapses to a compact top bar.

Motion: respect `prefers-reduced-motion`. Motion only answers an action. One orchestrated moment: when a claim confirms, the status rail advances Accepted to Paid and the receipt slides out like a printed slip (about 400 ms, once). No fade-and-slide on every section, no hover animations on every card.

> **Token naming (do this in the first scaffold step).** shadcn redefines `--accent` to mean its subtle hover surface, which collides with our brand cobalt. In `styles/tokens.css` name the brand colour `--brand`, `--brand-hover`, `--brand-tint`, `--brand-on-stage`, then map shadcn `--primary: var(--brand)`. Reserve `--accent*` for the shadcn meaning. See `docs/DESIGN.md` §2.4.

### Voice and copy rules

- Plain words, active voice, sentence case. The button names the result: "Fund job", "Claim task", "Submit labels", "Claim reward", "Request revision". The toast after uses the same verb: "Job funded", "Task claimed".
- Errors say what happened and how to fix it. They do not apologise. Example: "End time is before start time on segment 3. Move the end to 4.0 s or later."
- Empty states invite action. Example: "No tasks match your filters. Clear filters or check back after the next job is published."
- Always show: "Demo rewards are test tokens with no real value."
- Name things by what users understand: "Review result", not "Settlement status".

## A4. Libraries (use these, nothing heavier)

- **Framework:** Next.js App Router, React, TypeScript strict, Tailwind CSS (v4 if the scaffold provides it).
- **Components:** shadcn/ui (Radix primitives) as the base. For anything missing (data table patterns, stepper, dropzone, command palette, empty states, timeline pieces), **browse 21st.dev** and other shadcn-compatible libraries, copy the source into `components/ui/`, and **restyle to our tokens**. Do not invent registry URLs; open the site and use what exists. Do not ship a component that still looks like its source.
- **Icons:** lucide-react. **Toasts:** sonner. **Motion:** `motion/react`, sparingly.
- **Data:** @tanstack/react-query, @tanstack/react-table. **Forms:** react-hook-form + zod. **Local state:** zustand (workbench state with undo/redo). **Shortcuts:** react-hotkeys-hook. **Charts:** shadcn charts (recharts). **Dates:** date-fns.
- **Auth and chain:** @privy-io/react-auth, wagmi, viem (use the `monadTestnet` chain from `viem/chains` if present; otherwise define it from the Monad docs and verify chain ID and explorer URL there). Use the Privy-wagmi integration package if the docs recommend it.
- **Image boxes:** an SVG overlay on the image with pointer events. No canvas library. **Video:** HTML5 `<video>` with a custom timeline built from divs. No wavesurfer.
- **Testing and critique:** Playwright for screenshots and a smoke test per flow.
- Do not add Material UI, Chakra, Ant, Konva, or any CSS-in-JS runtime.

### React practices (from react.dev, enforce in review)

- Derive values during render instead of syncing state with effects. Use an effect only to talk to an outside system (video element, event listeners, Privy).
- Server Components by default. Mark workbenches and anything with pointer or video state as client components, as small as possible.
- Use `Suspense` with skeletons for lists. Use error boundaries with a retry button.
- Use `useTransition` for submit and `useOptimistic` for claim buttons. Keep stable `key`s. Controlled inputs only.
- No `any`. Parse every API response with zod before it reaches a component.

## A5. Screens and routes

| Route | Role | Purpose |
|---|---|---|
| `/` | Public | Landing: what buyers get, how contributors are paid, privacy stance. Actions: "Post a labelling job", "Join the contributor cohort" |
| `/login` | Public | Privy sign-in (email or wallet) and role landing |
| `/buyer` | Buyer | Dashboard: tasks done, review queue, acceptance rate, spend, budget left, AI vs human review share |
| `/buyer/jobs/new` | Buyer | Wizard: data type, schema, rubric, budget and reward, deadline, data rights, review and fund |
| `/buyer/jobs/[id]` | Buyer | Job detail: progress, funding, audit sample, export |
| `/work` | Contributor | Onboarding, privacy note, sample task, start qualification |
| `/work/qualify` | Contributor | Gold-task qualification |
| `/work/tasks` | Contributor | Task queue: reward, effort, deadline, data type; claim |
| `/work/tasks/[id]` | Contributor | Workbench (image or video by modality) |
| `/work/earnings` | Contributor | Accepted, pending, rejected, appealed; claim payout; receipts |
| `/review` | Reviewer | Queue, sorted by risk |
| `/review/[submissionId]` | Reviewer | Review console |
| `/admin` | Admin | Pause, roles, signer policy status, quorum approvals |
| `/receipts/[id]` | Public | Minimal public receipt, verifiable |

Route guards in the UI are for experience only. The server checks every role. Never rely on a hidden button for security.

## A6. Backend contract (agree with your teammate in hour one)

Create `lib/api/types.ts` (zod schemas) and `lib/api/client.ts` (typed fetch wrappers). Mirror PRD section 13 endpoints:

- `POST /api/jobs`, `POST /api/jobs/{id}/publish`
- `GET /api/tasks/available`, `POST /api/tasks/{id}/claim` (idempotent)
- `PUT /api/tasks/{id}/draft`, `POST /api/tasks/{id}/submit`
- `POST /api/reviews/{submissionId}/decision`, `POST /api/submissions/{id}/appeal`
- `GET /api/jobs/{id}/export`, `GET /api/receipts/{id}`

Add what the UI needs and write it down in `docs/API-NEEDS.md` for your teammate: list endpoints for jobs, the review queue, earnings, audit samples, admin quorum actions, and signed media URLs. Send idempotency keys on claim, submit, and settlement actions.

**Mock mode:** `NEXT_PUBLIC_USE_MOCKS=true` switches the client to in-repo mock handlers (`mocks/`) with realistic data, simulated latency, and simulated errors. In mock mode, show a small persistent "Mock data" badge and a dev-only role switcher (buyer, contributor, reviewer, admin) so the demo flow can be rehearsed without a backend. The badge disappears in real mode.

**Honesty rules (from the PRD):**
- Never fake success. A pending transaction shows "Waiting for confirmation". A failed one shows the error and a retry. Only show "Confirmed" with a real tx hash and explorer link. In mock mode, label the receipt "Mock receipt".
- Never show a reputation score without enough data. Show "Not enough data yet".
- Contributors never see which tasks are gold or overlap-sampled. Gold markers appear only for reviewers and admins.
- Never display contributor email or legal name outside the admin screen. Use pseudonymous IDs.

## A7. Shared components to build once

- `StatusPill` (state plus icon plus text), `DecisionSource` badge (human-made, AI-suggested, human-reviewed, adjudicated), `RewardAmount`, `HashChip` (shortened, copy button, full value on focus), `TxLink` (explorer link, pending and failed states), `LeaseTimer`, `ReasonCode` (code plus plain-language text from `lib/reasonCodes.ts`), `EmptyState`, `ErrorState` with retry, `TableSkeleton`.
- `Receipt` (the memorable component): notched edges via CSS mask. Contents: task ID, job, contributor pseudonym, annotation hash, policy hash and version, reviewer type, payout amount, tx link, "Verify" action. A "Print" slide-out animation plays once on first reveal.
- `StatusRail`: Submitted, Accepted, Paid. The three states are always visible as separate stations.
- `ConfidenceMeter`: Kimi confidence as a bar plus number. Below the threshold (a constant in `lib/config.ts`), show "Sent to human review".

## A8. Annotation schemas (validate in the UI exactly like the server will)

```ts
// image-boxes-v1
const Box = z.object({
  x: z.number().min(0), y: z.number().min(0),
  w: z.number().positive(), h: z.number().positive(),
  class: z.string().min(1),
  confidence: z.number().int().min(1).max(5),
});
const ImageSubmission = z.object({
  task_id: z.string(), asset_id: z.string(),
  schema_version: z.literal("image-boxes-v1"),
  boxes: z.array(Box),
  answers: z.record(z.string()).optional(),
}); // each box must stay inside the image

// action-segments-v1
const Segment = z.object({
  start_ms: z.number().int().min(0),
  end_ms: z.number().int(),
  action_label: z.enum(["reach","grasp","lift","place","inspect","recover","write","other"]),
  object: z.string(),
  outcome: z.enum(["success","partial","failure","unknown"]),
  failure_reason: z.string().optional(), // required when outcome is failure
  confidence: z.number().int().min(1).max(5),
});
// rules: end_ms > start_ms and inside the clip; segments in order, no overlap
```

Show validation errors inline as the person works, in plain words, and block submit with a summary that links to each problem.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
