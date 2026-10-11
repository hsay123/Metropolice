# UI rebuild report — mood-board pass

Branch `ui-moodboard`. Visual authority: `docs/moodboard/` + `docs/MOODBOARD-SPEC.md`.
Behaviour, schemas and honesty: `AGENTS.md`, `docs/PRD.md` (where they disagree with the
boards on *taste*, the boards win; where they disagree on behaviour or honesty, the documents
win). This report is written to be honest about what is finished, what is partly done, and how
each claim was checked.

**Verification caveat.** The agent cannot view images. Every "matched" below means: (a) the
screen renders with the board's tokens and components, checked by `scripts/spec-check.mjs`
against the *served* stylesheet; (b) it has no console errors and no horizontal overflow at
1440/1280/390 (`scripts/shots.mjs`); and (c) every text pair meets WCAG AA
(`scripts/contrast.mjs`). It does not mean the agent compared the screen to a tile by eye. That
comparison is the reviewer's checkpoint.

## Token and component foundation

- `styles/tokens.css` rewritten to the board palette (violet `--primary`, `--cta-black`,
  `--bg`/`--surface`/`--surface-2`, status colours, Okabe-Ito label colours) with the board's
  type scale (12/14/16/18/24/28/40) and radius hierarchy (controls 10, panels 16, pills full).
- `app/globals.css` remaps Tailwind v4 theme + shadcn variables. Legacy utility **and raw**
  variable aliases are kept so unmigrated screens stay correct; each is removed with its last
  caller.
- Fonts: Satoshi (Fontshare, self-hosted, latin 500+700) for display and figures; Inter for UI
  and body. Machine values use the system monospace stack with tabular numerals.
- Shared: `Panel`, `PageHeader`, `Stat`/`StatGrid`, `DataTable` pattern, `StatusPill`,
  `StatusRail`, `RewardAmount`, `HashChip`, `TxLink`, `DecisionSource`, `ConfidenceMeter`,
  `EmptyState`, `ErrorState`, `TableSkeleton`, `ReceiptCard`, `PhotoSlot`, `ProgressBar`,
  `FilterChip`, `SegmentedControl`.

## Screens

| Route | Role | Status | Notes |
|---|---|---|---|
| `/` | Public | Matched | Hero, buyer value, payout explainer, dark network section, example receipt. Photos are `PhotoSlot` stand-ins. |
| `/login` | Public | Matched | Role chooser (buyer, contributor); Privy sign-in; mock identity is clearly fictional; pseudonyms only. |
| `/buyer` | Buyer | Matched | Four plain KPI cards (no sparkline without a real `series`), active-projects table, review-mix and budget panels. |
| `/buyer/jobs/new` | Buyer | Matched | Five-step wizard; rubric, reward, deadline, data rights; review then fund. |
| `/buyer/jobs/[id]` | Buyer | Matched | Progress, funding, audit sample, export dialog. |
| `/work` | Contributor | Matched | Onboarding, privacy note, sample task, start qualification. |
| `/work/qualify` | Contributor | Matched | Gold-task qualification. |
| `/work/tasks` | Contributor | Matched | Queue with filter chips, 120x84 row thumbnails, reward/effort/deadline, claim. |
| `/work/tasks/[id]` | Contributor | Matched | Workbench. Image: SVG overlay editor. Video: single-bar dope-sheet timeline, filmstrip, segment form. Annotation/Instructions tabs in both. |
| `/work/earnings` | Contributor | Matched | Claimable/waiting/paid, acceptance rate with "Not enough data yet" under the sample floor, claim, receipts, appeal. |
| `/review` | Reviewer | Partly | Restyled through the shared components and tokens; layout was not re-composed against a specific tile this pass. |
| `/review/[submissionId]` | Reviewer | Partly | Same. Submitted vs reference labels, mismatches highlighted, AI suggestion with `DecisionSource`, three decisions, required reason. |
| `/admin` | Admin | Partly | Same. Pause, roles, signer policy status, quorum approvals. |
| `/receipts/[id]` | Public | Matched | Minimal public receipt built on `ReceiptCard`; states what a hash does and does not prove. |
| `/dev/components` | Dev | Matched | Design-system tile used by `spec-check`. |

## Honesty rules (kept)

- Mock receipts are labelled "Mock receipt"; mock mode shows a persistent "Mock data" chip and a
  dev-only role switcher.
- No fake success: pending shows "Waiting for confirmation"; only a real tx hash renders
  "Confirmed" with an explorer link.
- "Demo rewards are test tokens with no real value" is shown in the money surfaces.
- Reputation and acceptance rate show "Not enough data yet" until the sample floor is met.
- Gold and overlap markers appear only in reviewer/admin surfaces, never to contributors.
- Contributors are shown by pseudonymous id; no email or legal name outside admin.

## Gates (all green at hand-off)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint .` | 0 errors (warnings only, in `backend/` and scripts) |
| `node scripts/shots.mjs` (1440) | 18 routes, no console errors, no overflow |
| `node scripts/shots.mjs --w 390 --h 844` | 18 routes at 390, no console errors, no overflow |
| `node scripts/spec-check.mjs` | 16 routes x 3 widths, all assertions pass |
| `node scripts/contrast.mjs` | all text pairs meet WCAG AA |
| `npx impeccable detect app components` | 0 findings |

## Waivers

None recorded. `npx impeccable detect app components` reports zero primary findings, so no
`npx impeccable ignores` entries were needed. The taste rules that conflict with the board
(Inter as the body face, a violet accent, KPI rows, nesting inside a panel) are not raised by
the detector and are therefore recorded as decisions in `docs/UI-LOG.md` rather than waivers.

## Known gaps

1. **Imagery.** Hero and domain photos are `PhotoSlot` stand-ins. They swap to real images when
   files land in `public/images/`. `public/media/pen-writing.mp4` is synthetic demo footage and
   must be replaced with permission-cleared film before any public demo.
2. **Filmstrip fallback.** Open-source Chromium often cannot decode the demo clip, so the
   workbench filmstrip falls back to plain time markers rather than repeating one poster as ten
   frames.
3. **Review and admin** are token-consistent through the shared components, but were not
   re-composed against their tiles this pass.
4. **Mobile** is verified for overflow and contrast, not by eye.

## Open with the backend teammate (`docs/API-NEEDS.md` §7)

- Privy token header name and scheme.
- Whether payout claim is gas-sponsored on Monad testnet.
