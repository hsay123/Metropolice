# DESIGN.md: PhysicalData Network

Put this file at `docs/DESIGN.md`. It is the design source of truth for the frontend. If code and this file disagree, fix one of them the same day.

Version 2, Oct 11, 2026. Based on PRD v2. Supersedes v1: radius hierarchy, surface tints, and the app shell were reworked on branch `redesign-v2`. See docs/REDESIGN-LOG.md.

---

## 1. Design intent

**Product:** a work tool where robotics teams post image and video labelling jobs, contributors label them, reviewers check them, and accepted work is paid with a receipt on Monad.

**Audience, in order of screen time:** contributors (hours of careful data entry), reviewers (fast triage), buyers (skeptical, checking trust), admins (guarding money). Judges see a four-minute recording at 1440x900.

**Primary job of the interface:** make labelling fast and unambiguous, and make every claim about trust inspectable. A visitor should be able to see who did the work, which rules applied, who checked it, and what was paid.

**Subject world we borrow from:** inspection benches, editor timelines with timecode, calibration targets, chain-of-custody slips.

**Where we spend boldness (only here):**
1. The **receipt**: a chain-of-custody slip with notched edges.
2. The **video timeline**: a dope sheet with timecode, one track per label.

Everything else is quiet: flat panels, hairline structure, one accent, no decoration.

**Voice:** plain, specific, sentence case. Errors say what happened and how to fix it. Nothing is sold; things are described.

---

## 2. Tokens

### 2.1 Colour (all text pairs checked, ratios below)

```css
/* styles/tokens.css */
:root {
  /* surfaces */
  --bench: #ECEEF3;          /* app background */
  --sheet: #FFFFFF;          /* panels, forms */
  --surface-2: #F5F7FA;      /* second tint: sidebar, grouped regions */
  --wash: #E2E7ED;           /* muted fills, table header, hover rows */
  --stage: #161B22;          /* dark surround for media only */
  --stage-raised: #202733;   /* controls sitting on the stage */

  /* text */
  --ink: #18202B;
  --ink-muted: #5B6676;
  --stage-ink: #E6EAF0;

  /* structure */
  --rule: #D5DBE2;           /* decorative separators between zones */
  --field-edge: #7A8493;     /* borders of inputs and controls (3:1 required) */

  /* the one accent */
  --accent: #1F4FE0;
  --accent-hover: #173FC0;
  --accent-tint: #E8EEFF;
  --accent-on-stage: #6F8CFF; /* cobalt is too dark on the stage */

  /* status: always paired with an icon and a text label */
  --pending-ink: #5B6676;   --pending-bg: #EEF0F3;
  --revision-ink: #9A6200;  --revision-bg: #FFF1D6;
  --accepted-ink: #17754A;  --accepted-bg: #E2F4EA;
  --rejected-ink: #B3261E;  --rejected-bg: #FCE6E4;
  --paid-ink: #7A35C8;      --paid-bg: #F1E7FB;
  /* appealed: ink text, white bg, dashed --ink border (no colour of its own) */

  /* video label colours: Okabe-Ito (colour-blind safe). Segments always carry a text label. */
  --label-reach: #0072B2;
  --label-grasp: #E69F00;
  --label-lift: #56B4E9;
  --label-place: #009E73;
  --label-inspect: #CC79A7;
  --label-recover: #D55E00;
  --label-write: #5F4BB6;
  --label-other: #8A94A3;
  /* failure: diagonal hatch over the label colour + 2px --rejected-ink outline */
}
```

**Contrast results (WCAG 2.x, computed):**

| Pair | Ratio | Result |
|---|---|---|
| ink on bench | 14.3 | pass |
| ink on sheet | 16.4 | pass |
| ink-muted on sheet / bench | 5.8 / 5.1 | pass AA |
| white on accent / accent-hover | 6.5 / 8.4 | pass |
| accent on sheet / on accent-tint | 6.5 / 5.6 | pass |
| pending, revision, accepted, rejected, paid (text on own bg) | 5.1, 4.6, 5.0, 5.5, 5.5 | pass AA (revision is closest to the limit, do not lighten it) |
| stage-ink on stage | 14.3 | pass |
| accent-on-stage on stage | 5.7 | pass |
| field-edge on sheet / on bench | 3.8 / 3.3 | pass 3:1 for control boundaries |
| rule on bench | 1.2 | decorative only; never use for control edges |

Note: the first draft of AGENTS.md used `rule` for input borders. That fails the 3:1 rule for control boundaries, so inputs use `--field-edge`. Update AGENTS.md section A3 to match.

### 2.2 Type

Two families via `next/font/google`:

- **Bricolage Grotesque** (variable): page titles, panel titles, reward amounts, receipt heading.
- **Instrument Sans**: UI and body.
- Machine values (hashes, tx hashes, timecodes, IDs): system monospace stack, `font-variant-numeric: tabular-nums`. No third webfont.

| Step | Size / line | Weight | Use |
|---|---|---|---|
| xs | 12 / 16 | 500 | captions, table meta |
| sm | 14 / 20 | 400, 500 | default UI text in tools |
| md | 16 / 24 | 400 | reading text (landing, rubric, rejection reasons) |
| lg | 20 / 28 | Bricolage 600 | panel titles |
| xl | 28 / 34 | Bricolage 600 | page titles |
| 2xl | 40 / 44 | Bricolage 700 | landing headline only |

Rules: line length under 80 characters. Sentence case everywhere. Numbers in tables are right-aligned and tabular. No all-caps labels. No tracked-out eyebrows.

### 2.3 Space, shape, elevation, motion

- Spacing: 4 px base. Panel padding 16 (tools) or 20 (reading). Page gutter 24. Page max width 1200 for every screen, so the measure never changes between roles; workbenches are full-bleed.
- Radius: 8 px controls, inputs, chips and focus rings; 12 px panels, dialogs and cards; 4 px only for dense geometry (timeline segments, meter fills, annotation boxes); full only on status pills.
- Radius is a hierarchy: **2 px** timeline segments, boxes, inputs, small buttons; **6 px** panels, dialogs, menus; **full** only for status pills.
- Elevation: none on panels (they are separated by 1 px `--rule` lines). Shadow only on floating layers: menus, popovers, dialogs, toasts.
- Focus: 2 px `--accent` ring with 2 px offset on every interactive element (on stage surfaces use `--accent-on-stage`).
- Motion (all gated by `prefers-reduced-motion`):
  - Answers an action only. 120 ms for toggles, 200 ms for panels and dialogs.
  - **One orchestrated moment:** after a claim confirms, the status rail fills Accepted to Paid (300 ms), then the receipt slides out of a slot like a printed slip (`clip-path` reveal plus `translateY`, 400 ms, ease-out, plays once per receipt per session).
  - No entrance animations on sections. No hover animations on cards.

### 2.4 Tailwind and shadcn mapping

Tailwind v4 (`app/globals.css`):

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme inline {
  --color-bench: var(--bench);
  --color-sheet: var(--sheet);
  --color-wash: var(--wash);
  --color-stage: var(--stage);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-rule: var(--rule);
  --color-field-edge: var(--field-edge);
  --color-accent-brand: var(--accent);
  --font-display: var(--font-bricolage);
  --font-sans: var(--font-instrument);
  --radius-sm: 2px;
  --radius-md: 6px;
}
```

shadcn variables. Careful: in shadcn, `--accent` means the subtle hover surface, not the brand colour. The brand colour is `--primary`.

```css
:root {
  --background: var(--bench);
  --foreground: var(--ink);
  --card: var(--sheet);           --card-foreground: var(--ink);
  --popover: var(--sheet);        --popover-foreground: var(--ink);
  --primary: var(--accent);       --primary-foreground: #FFFFFF;
  --secondary: var(--wash);       --secondary-foreground: var(--ink);
  --muted: var(--wash);           --muted-foreground: var(--ink-muted);
  --accent: var(--accent-tint);   --accent-foreground: var(--accent-hover); /* shadcn meaning */
  --destructive: var(--rejected-ink);
  --border: var(--rule);
  --input: var(--field-edge);
  --ring: var(--accent);
  --radius: 6px;
}
```

Naming conflict to avoid: the token file defines `--accent` as the brand cobalt, and shadcn redefines `--accent` as the tint. Rename the token-file variable to `--brand` and `--brand-hover`, `--brand-tint`, `--brand-on-stage` in code, then map `--primary: var(--brand)`. Do this in the first scaffold step.

No dark theme in the MVP. The only dark surface is the media stage.

---

## 3. Layout system

**Shell (all roles except workbenches):** a 232 px left sidebar, collapsible to a 68 px icon rail.

```
┌───────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│ ◧ PhysicalData│  page title                                            [primary action]        │
│ ───────────── │  ────────────────────────────────────────────────────────────────────────── │
│ ⬢ Buyer    ▾ │  content, left-aligned, max width 1200, shared by every screen                   │
│ ───────────── │                                                                                   │
│  ▸ Jobs       │                                                                                   │
│ ───────────── │                                                                                   │
│ ◉ testnet 0x… │                                                                                   │
└───────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

- The sidebar carries the workspace and role switcher at the top, role-based nav in the middle, and network state plus wallet at the bottom. Nav depends on the role (buyer: Jobs; contributor: Tasks, Earnings; reviewer: Queue; admin: Admin).
- Below the sidebar breakpoint the shell collapses to a compact top bar so dense tables keep their full width.
- "Monad testnet" explains on hover: "Rewards are test tokens with no real value." The same sentence also appears inline on funding, earnings, receipt, and the landing page.
- Dev builds add a collapsible demo dock pinned bottom-right (mock data, role switcher, reset). It is hidden entirely when the URL carries `?clean=1` or `NEXT_PUBLIC_DEMO_CLEAN=true`, which is how demo recordings are captured; the framework dev indicator is off.
- **Workbenches are focus mode:** they render through `AppShell` with its `bare` variant — no sidebar and no content padding — so the dark stage fills the viewport under a 40 px task bar (back, task, reward, lease timer, autosave state, Submit). No site navigation.

**Alignment:** left-aligned everywhere (headings, body, hero). Numbers right-aligned in tables. No centred paragraphs. Only the receipt amount is right-aligned outside tables.

**Grid:** 12 columns on dashboards. Panels differ in treatment by job (a bar, a table, a list, a stream), not in identical cards.

**Responsive:** primary 1440x900. Supported down to 1024. Below 1024, workbenches show "Open this task on a laptop to label it" with a link back. All other pages work down to 375 px.

---

## 4. Screen wireframes

Each screen lists the main action and its states: **L** loading skeleton, **E** empty, **X** error with retry.

### 4.1 Landing `/`

Hero shows the real thing (a timeline and a receipt) instead of a stat block.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ PhysicalData Network        For buyers   For contributors   How checks work         [Sign in]  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Labelled robot footage you only        ┌─ pen_writing_012 ────────────────────── 00:04:12 ┐ │
│  pay for once it passes review.         │ ┌──────────── dark stage / frame ─────────────┐ │ │
│                                         │ │                                              │ │ │
│  Qualified contributors label your      │ └──────────────────────────────────────────────┘ │ │
│  clips, reviewers check them, and       │ reach │ grasp │lift│        write         │place │ │
│  every payout comes with a receipt      │ 0.0s    1.2s    3.4s 4.0s                11.0 12.0 │ │
│  you can verify on Monad.               └────────────────────────────────────────────────────┘ │
│                                              ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌┐          │
│  [Post a labelling job]  [Join the           │ Receipt  task_01H…  Human-reviewed          │    │
│   contributor cohort]                        │ Paid 2.00 test USDC  tx 0x9c…e2 · Verify    │    │
│                                              └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘ └┘          │
│  Footage and labels stay in private storage. Only hashes and amounts go onchain.             │
│  Demo rewards are test tokens with no real value.                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  How a label gets paid  (a real sequence, so a numbered rail is correct here)                │
│  ①Funded → ②Labelled → ③Checked → ④Receipted → ⑤Paid                                         │
│  one sentence under each station                                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  How checks work: six layers, in order (automatic checks, gold tasks, overlap sampling,      │
│  Kimi first pass for images, human review, random audits). Left column list, right column    │
│  a small table "Onchain / Private" from PRD section 5.                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  What this does not prove: a hash shows a record was not changed, not that a label is        │
│  correct. Wallets are not unique people. Acceptance is signed by our QA service, limited     │
│  by policy and quorum. AI review reduces human work and is not a perfect judge.              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

The timeline in the hero is interactive: hovering a segment shows its label and times; the receipt is the real `Receipt` component with mock data labelled "Example".

### 4.2 Buyer job wizard `/buyer/jobs/new` (rubric step shown)

The stepper is a vertical list because the steps are a real sequence.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ New labelling job                                                                            │
│                                                                                              │
│  ✓ Data type          Rubric                                       ┌─ Job summary ─────────┐ │
│  ✓ Classes            ─────────────────────────────────────────    │ Image boxes           │ │
│  ● Rubric             What counts as correct?                       │ 3 classes             │ │
│  ○ Budget and reward  ┌───────────────────────────────────────┐    │ Reward 0.50 per task  │ │
│  ○ Deadline           │ A box must contain the whole object…  │    │ 200 tasks             │ │
│  ○ Data rights        └───────────────────────────────────────┘    │ Budget 100.00         │ │
│  ○ Review and fund    Testable rules (at least one is required)     │ Contributors paid     │ │
│                       ☐ Box edges within 5 px of the object        │ only for accepted     │ │
│                       ☐ Class matches the object                    │ work                  │ │
│                       [+ Add rule]                                  │ Demo rewards are test │ │
│                       Examples: [Good example] [Bad example] [+]    │ tokens with no real   │ │
│                                                                    │ value.                │ │
│                       [Back]                          [Continue]    └───────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- No testable rule means Continue is disabled, with the reason beside it: "Add at least one testable rule to launch."
- The last step shows a funding sequence with real states: Waiting for wallet, Waiting for confirmation, Funded (TxLink), Failed (error and Retry).
- Assumption: assets come from a seeded project. Upload is out of scope ("no open public uploads").

### 4.3 Buyer dashboard `/buyer`

Leads with the pipeline (where the money and work are), not four KPI tiles.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Pick and place, kitchen set          Active    [Export accepted] [Close job]                 │
│                                                                                              │
│  Pipeline    Submitted 42 ──▶ In review 18 ──▶ Accepted 120 ──▶ Paid 96                      │
│              ▓▓▓▓▓▓░░░░░░░░░░ proportional bar across the four stations ▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
│                                                                                              │
│  Budget      Paid 48.00 │ Owed 12.00 │ Left 40.00      (one horizontal bar, three segments)  │
│  ────────────────────────────────────────────────────────────────────────────────────────── │
│  Recent decisions                                   │ Review mix                             │
│  Task      Result     Decided by        Reason      │ AI-suggested   ▓▓▓▓▓▓▓▓░░  71%        │
│  01H…a2    Accepted   Human-reviewed    —           │ Human-reviewed ▓▓▓▓░░░░░░  29%        │
│  01H…b7    Revision   AI-suggested      Box loose   │ Humans disagreed with AI on audited   │
│  01H…c1    Rejected   Human-reviewed    Wrong class │ samples: 6% (n=50)                    │
│  ...                                                │ ───────────────────────────────────── │
│  Random audit  seed 0x5e…  picked 12 tasks  [Verify]│ Onchain events (live)                 │
│                                                     │ TaskAccepted  01H…a2   tx 0x9c…       │
│                                                     │ PayoutClaimed 01H…91   tx 0x41…       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

States: L skeletons per region; E "No jobs yet. Post a job to start." with the primary button; X per-region retry. If an audit disagreement rate has fewer than 20 samples, show "Not enough audits yet" instead of a percentage.

### 4.4 Contributor task queue `/work/tasks`

A table, not a grid of cards.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Tasks                                       Accepted 14 │ Waiting 3 │ Paid 11 (test tokens)   │
│ [Type ▾ All] [Reward ▾] [Deadline ▾]  [Search]                                               │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│  Task                    Type    Effort     Reward   Deadline         Rules                   │
│  [thumb] Pick and place  Image   ~3 min     0.50     Oct 13, 18:00    Read rules   [Claim]    │
│  [thumb] Pen writing     Video   ~8 min     2.00     Oct 13, 18:00    Read rules   [Claim]    │
│  ...                                                                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- "Read rules" opens the rubric in a side sheet **before** claiming. Claim opens a lease (optimistic), then goes to the workbench.
- Contributors see no gold or overlap markers.
- E: "No tasks match your filters. Clear filters or check back after the next job is published." L: table skeleton. X: retry.

### 4.5 Image workbench `/work/tasks/[id]`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Tasks   Pick and place #14   0.50 reward   Lease 08:42   Saved 12:03     [Save] [Submit]   │
├────┬───────────────────────────────────────────────────────────────┬─────────────────────────┤
│ V  │ ░░░░░░░░░░░░░░░░░░░░░░░░ dark stage ░░░░░░░░░░░░░░░░░░░░░░░░░░ │ Class                   │
│ B  │ ░░░░░░  ┌──────┐ cup                                           │ 1 cup  2 pen  3 red blk │
│    │ ░░░░░░  │      │                                               │ ───────────────────────  │
│ ↶  │ ░░░░░░  └──────┘      ┌──┐ pen                                │ Boxes (2)               │
│ ↷  │ ░░░░░░░░░░░░░░░░░░░░░░ └──┘                                    │  1 cup       conf 4     │
│    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  2 pen       conf 5     │
│    │ zoom −  100%  +                                               │ ───────────────────────  │
│    │                                                               │ Question                │
│    │                                                               │ Did the grasp succeed?  │
│    │                                                               │ (•) Yes ( ) No ( ) Unsure│
│    │                                                               │ ───────────────────────  │
│    │                                                               │ Rules │ Examples        │
└────┴───────────────────────────────────────────────────────────────┴─────────────────────────┘
```

- Tool rail on the left (select V, box B, undo, redo). Right panel: class palette (keys 1 to 9), box list with confidence, question, and a Rules and Examples tab.
- Boxes are SVG: drag to draw, 8 resize handles, arrow keys nudge, Tab moves between boxes, visible focus. Boxes clamp to the image.
- Validation inline: "Box 2 extends outside the image. Drag it back inside." Submit blocks with a summary linking to each problem.
- Lease expiry: autosave the draft, then a dialog "Your lease ended. Your draft is saved. Claim the task again to continue."
- After Submit: result view with the status rail (Submitted, Accepted, Paid).

### 4.6 Video workbench `/work/tasks/[id]`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Tasks   Pen writing #7   2.00 reward   Lease 21:10   Saved 12:03          [Save] [Submit]  │
├─────────────────────────────────────────────────────────────┬────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░ dark stage: video ░░░░░░░░░░░░░░░░░ │ New segment                    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ Action                         │
│  ▶  ◀|  |▶   0.5x ▾    00:00:04:12 / 00:00:12:00            │ [reach][grasp][lift][place]    │
│ ──────────────────────────────────────────────────────────  │ [inspect][recover][write][other]│
│  reach    ▓▓▓                                                │ In 00:00:04:00  Out 00:00:11:00│
│  grasp       ▓▓▓▓                                            │ Object  [pen            ▾]     │
│  lift             ▓▓                                         │ Outcome ( )success ( )partial  │
│  place                                      ▓▓              │         ( )failure (•)unknown  │
│  write              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                          │ Failure reason (if failure)    │
│  ruler  |0s       |3s       |6s       |9s       |12s  ▲ head │ Confidence  1 2 3 [4] 5        │
│                                                              │ [Add segment  Enter]           │
│  Segments (5)  1 reach 0.0–1.2  ✓   2 grasp 1.2–3.4  ✓  …    │ Rules │ Examples              │
└─────────────────────────────────────────────────────────────┴────────────────────────────────┘
```

- One track per label; each segment shows its text label inside when wide enough, and a tooltip when narrow.
- Keyboard: Space play and pause; Left and Right one frame; Shift with arrows ten frames; I and O set in and out; Enter adds the segment; 1 to 8 pick a label; Ctrl or Cmd with Z undo; Ctrl or Cmd with S save draft.
- Overlap or out-of-range segments show a red marker on the timeline and an inline message: "Segment 3 overlaps segment 2 between 3.2 s and 3.4 s. Move the start to 3.4 s or later."
- Failure segments are hatched with a red outline and prompt for reason and recovery. "unknown" and "other" are always offered, so nobody has to guess.
- Frame rate comes from asset metadata (default 30).

### 4.7 Review console `/review/[submissionId]`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Queue   Submission 01H…c1   Prev ▸ Next    Flags: first-time contributor, fast submission  │
├──────────────────────────────────────────────────────────────────┬───────────────────────────┤
│  [Submitted] [Reference] [Overlay]                               │ AI suggestion             │
│  ░░░░░░░░░░░░░░ dark stage with both box sets ░░░░░░░░░░░░░░░░░░ │ Revise  ▓▓▓▓░░ 0.58       │
│  submitted = solid line, reference = dashed line                 │ Sent to human review      │
│  mismatches highlighted with --revision colour                   │ "Box 2 is loose on the    │
│                                                                  │  left edge."              │
│  Differences                                                     │ ────────────────────────  │
│  Box 2  cup  overlap with reference 0.61 (needs 0.75)            │ Rubric checklist          │
│  Box 3  missing                                                  │ ☑ Class matches           │
│                                                                  │ ☐ Box edges within 5 px   │
│                                                                  │ Reason code  [Select ▾]   │
│                                                                  │ [Accept] [Request revision]│
│                                                                  │ [Reject]                  │
└──────────────────────────────────────────────────────────────────┴───────────────────────────┘
```

- Reviewers see a pseudonymous contributor ID, never email or name. Gold and audit flags are visible to reviewers only.
- Request revision and Reject are disabled until a reason code is chosen. Every decision shows its source (human-made, AI-suggested, human-reviewed, adjudicated).
- A reviewer never sees their own submissions in the queue.
- Video version: the player on the left jumps to each segment on click, reference segments are overlaid on the same timeline, mismatches are highlighted.

### 4.8 Contributor earnings `/work/earnings`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Earnings        Demo rewards are test tokens with no real value.                             │
│  Accepted, ready to claim  8.50   │  Waiting for review  3.00  │  Paid  22.00                │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│  Task        Rail                              Reward   Status          Action               │
│  01H…a2      Submitted ─ Accepted ─ Paid       0.50     Accepted        [Claim reward]       │
│  01H…b7      Submitted ─ Needs revision        0.50     Needs revision  [Revise]             │
│  01H…c1      Submitted ─ Rejected              0.50     Rejected        [Appeal] Why?        │
│  01H…91      Submitted ─ Accepted ─ Paid       2.00     Paid            [View receipt]       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- "Claim reward" is optimistic. The row shows "Waiting for confirmation" until the tx is confirmed, then the status rail fills and the receipt slides out in a side sheet.
- "Why?" opens the plain-language reason and the rubric rule that applied.
- If gas sponsorship is unavailable, the button says "Request payout" and the confirmed state says "Payout sent to your wallet".

### 4.9 Receipt (component and `/receipts/[id]`)

The memorable object. A white slip with notched top and bottom edges (CSS `mask`), tabular details, and a dashed perforation line above the verification block.

```
 ╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮╭╮
 │ Receipt                                         Paid       │
 │ Task 01H…a2                                     2.00 test USDC
 │ Job: Pen writing, kitchen set                              │
 │ ────────────────────────────────────────────────────────── │
 │ Contributor        Contributor 4F2A (pseudonym)            │
 │ Decided by         Human-reviewed (Reviewer 19)            │
 │ Review policy      v3  hash 0x7d…41  [copy]                │
 │ Annotation hash    0x2b…c8  [copy]                         │
 │ Transaction        0x9c…e2  View on explorer               │
 │ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - │
 │ [Verify hashes]                                            │
 │ A hash shows this record was not changed. It does not      │
 │ show the label is correct.                                 │
 ╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯╰╯
```

- Heading and amount in Bricolage Grotesque; values in tabular mono. Mock receipts say "Mock receipt" in the heading. Failed or pending states replace the transaction row with the real state; they never fake a hash.
- "Verify hashes" recomputes keccak256 over the canonical JSON in the browser and shows match or mismatch.
- The public page `/receipts/[id]` shows only the minimal receipt (no names, no label content).

### 4.10 Admin `/admin`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Admin                                                                                        │
│ ┌─ Signer policy ────────────────────────────────┐ ┌─ Job control ──────────────────────────┐│
│ │ Signer: Privy server wallet     Active         │ │ Pen writing   Active   [Pause job]     ││
│ │ Allowed: JobEscrow.markAccepted only           │ │ Pick and place Active  [Pause job]     ││
│ │ Routine accepts run automatically under policy │ └────────────────────────────────────────┘│
│ └────────────────────────────────────────────────┘                                           │
│ Needs approval (key quorum)                                                                  │
│  Action          Job            Requested by   Approvals   Actions                           │
│  Refund 40.00    Pen writing    Buyer          1 of 2      [Approve] [Reject]                │
│  Pause           Pick and place Admin          2 of 2      Executed  tx 0x41…                │
│ ──────────────────────────────────────────────────────────────────────────────────────────── │
│ Roles   Name        Pseudonym   Role           [Change]     (only screen that shows email)   │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Refund, close, pause, and policy change always show the approvers so far and who is still needed.

---

## 5. Status and content system

**Task states:** Draft, Submitted, Needs revision, Accepted, Rejected, Appealed, Paid. Submitted, Accepted, and Paid are separate stations in `StatusRail`, never collapsed.

**Decision source badge:** human-made (contributor work), AI-suggested, human-reviewed, adjudicated.

**Reason codes** (`lib/reasonCodes.ts`; confirm the final list with the backend):

| Code | Shown to the contributor as |
|---|---|
| BOX_LOOSE | A box edge is more than the allowed distance from the object. Tighten it. |
| BOX_MISSING | An object listed in the rubric has no box. Add one. |
| WRONG_CLASS | The class does not match the object. Check the class list. |
| TIME_OFFSET | A segment starts or ends too far from the action. Step frame by frame to find the exact time. |
| SEGMENT_OVERLAP | Two segments overlap. Move the start or end so they follow each other. |
| LABEL_MISMATCH | The action label does not match what happens. Check the label definitions. |
| FAILURE_UNMARKED | A failure happens here but is not marked. Add a failure segment with a reason. |
| DUPLICATE | This work matches another submission. Label the clip yourself. |
| UNCLEAR_MEDIA | The item cannot be labelled reliably. Pick "unknown" instead of guessing. |

**Key strings:**

- Funding note: "Rewards are test tokens with no real value."
- Claim: "Claim task", toast "Task claimed". Submit: "Submit labels", toast "Labels submitted".
- Waiting: "Waiting for confirmation". Done: "Confirmed". Failed: "Transaction failed. Nothing was paid. Try again."
- Empty reputation: "Not enough data yet."
- Rejection header: "Rejected: [plain reason]". Never "Error 403".

---

## 6. Component inventory

**From shadcn/ui (restyled to tokens):** Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Tabs, Dialog, Sheet, DropdownMenu, Popover, Tooltip, Table, Progress, Skeleton, ScrollArea, Separator, Accordion, Alert, Command, Form, Sonner.

**Source from 21st.dev or other shadcn-compatible libraries, then restyle:** vertical stepper (wizard), data-table patterns with sticky header and row actions, empty-state layouts, command palette (optional), copy-to-clipboard button. Confirm availability by browsing the site; if nothing fits, build it.

**Build ourselves:**

| Component | Notes |
|---|---|
| `StatusPill`, `StatusRail`, `DecisionSource` | icon, label, colour from tokens; rail has three stations |
| `Receipt` | notched mask, print-out animation, verify action |
| `HashChip`, `TxLink` | shortened with copy; TxLink has pending, confirmed, failed |
| `LeaseTimer`, `AutosaveIndicator` | live region announces "Lease ends in 1 minute" |
| `ImageBoxLayer` | SVG overlay with draw, resize, nudge, focus order |
| `VideoTimeline`, `SegmentForm`, `FrameStepper` | dope-sheet tracks, timecode, shortcuts |
| `DiffOverlay` | submitted vs reference, mismatch highlight |
| `ConfidenceMeter` | bar plus number, "Sent to human review" below the threshold |
| `PipelineLedger`, `BudgetBar` | buyer dashboard, proportional bars |
| `TableToolbar`, `SortHeader`, `TablePagination` | search, status filter, sortable columns, paging for data tables |
| `QuorumRow` | approvers so far, approve and reject |
| `DevToolbar` | mock badge, role switcher, reset demo |

---

## 7. Accessibility and quality floor

- Visible focus on everything; dialogs trap focus and return it.
- Targets at least 24x24 px (workbench handles 12 px with a 24 px hit area).
- Status is never colour alone: always icon plus text.
- Timeline: playhead is `role="slider"` with value text in timecode; each segment is a focusable button with its label and times.
- Live regions for autosave, lease warnings, and tx state changes.
- `prefers-reduced-motion` removes the receipt slide and rail fill (state changes appear instantly).
- Never fake success. Pending and failed transactions show their real state.

---

## 8. Critique of the first plan (what still looked generic, and what changed)

1. **Dashboard as a row of four KPI tiles above a table.** This is the stock SaaS dashboard and says nothing about this product. Changed to a pipeline ledger (Submitted, In review, Accepted, Paid as a proportional bar) and a three-segment budget bar, because those show where work and money actually are.
2. **Cobalt accent plus default shadcn components.** On its own this reads as any 2024 SaaS app. Changed: radius is a hierarchy (2 px on data controls, 6 px on panels, full only on status pills), panels are separated by rules instead of shadows, inputs use a stronger edge, numbers are tabular and right-aligned, and the only dark surface is the media stage.
3. **Landing hero with a headline and a stat block.** Replaced with a live 12-second timeline and a real receipt, because they are the most characteristic things in this subject's world.
4. **Status chips on every row would become visual noise.** Chips are reserved for state; the decision source is a quiet text badge, and the rail is used only where the three stations matter (results and earnings).
5. **Receipt notches could become a gimmick.** They are used on the receipt only, nowhere else, and the receipt carries real information (hashes, reviewer type, policy version), so the form earns its place.
6. **Risk that remains:** the workbenches are dense by necessity and will look like any annotation tool at a glance. The differentiator there is the timecode dope sheet, the keyboard-first flow, and plain-language errors. If a screenshot at 1440x900 still looks like a template, change layout first, not colour.

---

## 9. Open items

1. Rename token variables to `--brand*` before scaffolding (shadcn `--accent` conflict).
2. Update AGENTS.md A3: use `--field-edge` for control borders.
3. Confirm reason-code list, Kimi confidence threshold, and audit-sample formula with the backend.
4. Confirm Privy gas sponsorship on Monad testnet (decides the claim wording).
5. Supply synthetic or permission-cleared demo media (one image set, one 12-second clip).
