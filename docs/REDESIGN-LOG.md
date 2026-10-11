# Redesign log — PhysicalData Network UI pass

Start: 2026-10-11 12:57 IST (90 min budget from here).

## Decisions made without asking (logged per the brief)

1. **Visual authority.** The brief says "keep AGENTS.md Part A (rules, schemas, honesty
   rules)" and "this file overrides its visual direction". AGENTS.md A3 is visual
   direction (radius hierarchy, palette, shell). So: **the brief wins on visuals**; A1/A2
   (audience), A4 (libraries), A5 (routes), A6 (API contract + honesty), A7 (component
   inventory) stay binding. Every radius/palette/shell change gets written into
   `docs/DESIGN.md` v2 **and** mirrored back into `AGENTS.md` A3 so code and docs agree.
2. **Honesty rules beat polish.** "Not enough data yet", the test-token note, mock
   labelling and pending/failed tx states stay. Where the brief calls them slop, they get
   restyled, not deleted.
3. **Tooling.** No Mobbin plan was confirmed in this environment, and browser OAuth needs a
   human, so **Mobbin is skipped** unless the user says otherwise. Impeccable install is
   attempted with a hard timeout; if it fails we fall back to the built-in
   `redesign-existing-projects` skill and the repo's own docs.
4. **No image viewing.** This model cannot view screenshots. Verification is DOM,
   computed-style, geometry and contrast measurement, plus `tsc`/`lint`/`build`. Screens
   needing a human eye are listed in the final report.
5. **Write scope.** `docs/`, `scripts/`, `.shots/` and project `opencode.json` are in scope
   for this pass; `backend/` and contract code are not.

## Tooling gates (Phase 0)

| Gate | Result | Proof |
|---|---|---|
| Impeccable installed | **Pass** | `npx impeccable install --providers=opencode --scope=project`; `.opencode/skills/impeccable/` exists, engine v0.1.14. `impeccable context` runs. |
| `PRODUCT.md` | **Pass** | Written at the repo root from `AGENTS.md`, `docs/PRD.md` and the brief; `.impeccable/config.json` records `"buildPath": "code"`. |
| Detector baseline | **Pass** | `npx impeccable detect http://localhost:3000` → **4 anti-patterns** (`.impeccable/baseline.txt`). |
| Mobbin MCP | **Skipped** | No Mobbin Pro/Team/Enterprise plan confirmed in this environment, and the OAuth step needs a human. Recorded rather than silently dropped. |
| getdesign.md | **Skipped** | Reference-only; the repo's own design docs plus the live detector carried the same information in the time available. |
| Playwright | **Pass** | Already installed. `scripts/shots.mjs`, `scripts/audit.mjs`, `scripts/flows.mjs`, `scripts/contrast.mjs`. |
| Dev noise | **Pass** | Collapsible demo dock, `?clean=1`, `devIndicators: false`. |

## Elapsed

| Time | Elapsed | Phase | Note |
|---|---|---|---|
| 12:57 | 0:00 | Phase 0 | Clean tree confirmed (`602779a` already committed); branch `redesign-v2` cut. |
| 13:03 | 0:06 | Phase 0 | Impeccable installed; PRODUCT.md written; detector baseline = 4 findings. |
| 13:09 | 0:12 | Phase 2 | Tokens: radius 8/12, `surface-2`, softened `--rule`, focus-ring radius bound to the token. |
| 13:13 | 0:16 | Phase 2 | Detector fixes: `labelInk()` for label fills, receipt heading `h3` → `h2`. |
| 13:16 | 0:19 | Phase 3 | Demo dock, dev indicator off, clean mode. |
| 13:19 | 0:22 | Phase 3 | Trailing arrows removed from 6 buttons. |
| 13:22 | 0:25 | Phase 4 | Hydration bug found (reduced motion) → `motion/react` removed, receipt animation moved to CSS. |
| 13:27 | 0:30 | Phase 2 | Sidebar shell (232px, collapsible to 68px) + 1200px content width. |
| 13:34 | 0:37 | Phase 4 | Contributor route group; workbench focus mode; `scripts/audit.mjs` 54 checks clean. |
| 13:40 | 0:43 | Phase 4 | Role gate → inline banner; "Waiting for first submissions" state; vertical wizard stepper + sticky summary. |
| 13:47 | 0:50 | Phase 5 | Detector down to **1** finding (accepted font finding). Docs written. |

## Rubric self-scores

Scored from measurement, not from impression: geometry and computed styles from the audit
harness, contrast from the token script, honesty from the copy itself.

| Screen | Hierarchy | Rhythm | Type | Restraint | Consistency | States | Honesty |
|---|---|---|---|---|---|---|---|
| Buyer dashboard | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Wizard | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Job detail | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Task queue | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Workbench | 4 | 4 | 4 | 5 | 4 | 4 | 5 |
| Earnings | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Review console | 4 | 4 | 4 | 4 | 4 | 4 | 5 |
| Sign-in | 4 | 4 | 4 | 5 | 4 | 4 | 5 |
| Landing | 4 | 4 | 5 | 4 | 4 | 4 | 5 |

Rhythm and hierarchy sit at 4 rather than 5 across the app because the density inside
`Panel` is still fairly even from screen to screen. That is the next thing to push, and
it is the part most in need of a human eye.