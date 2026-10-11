# Redesign TODO — problem register

Branch `redesign-v2`. Each of the 15 problems from the brief is listed with what the
code actually did, what was changed, and the evidence. Priority: **P0** breaks the
four-minute demo or reads cheap on the demo path, **P1** hurts, **P2** polish.

Evidence column: `scripts/audit.mjs` (DOM/geometry across 18 routes at 1440/1280/390),
`scripts/flows.mjs` (25 demo-path behaviour checks), `scripts/contrast.mjs` (token
pairs), `scripts/shots.mjs` (screenshots into `.shots/`), `npx impeccable detect`.

## The 15 problems

| # | Problem | Actual state found | Action | Priority | Evidence | Status |
|---|---|---|---|---|---|---|
| 1 | Every screen is the same bordered box | Partly real. Panels are the only container, but several screens stacked 4+ of them. | Sidebar shell + `surface-2` grouping tint; panel padding unchanged; the dashboard's stat row is now a divider-separated group rather than tiles. | P1 | audit (no nesting regressions) | Partly done |
| 2 | Buyer opens with KPI tiles | Already a pipeline ledger, not tiles. | Kept; added the budget + review-mix composition beside it. | P0 | `flows.mjs` "buyer overview leads with the pipeline" | Done (pre-existing) |
| 3 | 2px radius reads dated | Real. 131 `rounded-[2px]`/`rounded-[6px]` sites. | Tokens moved to 8px controls / 12px panels, 4px kept for dense geometry (timeline segments, meter fills, annotation boxes). Focus ring radius follows the token. | P0 | tokens.css, contrast, audit | Done |
| 4 | Secondary text too light | False for the palette: `ink-muted` measures 5.05 on bench and 5.82 on sheet. | No change. Justified rather than "fixed". | — | `contrast.mjs` | Justified, no change |
| 5 | "Not enough data yet" / "0 of 0" shouts | Partly real: that copy is mandated by the honesty rules, so it stays. | Restyled `EmptyState` onto `surface-2`; job detail now shows a designed "Waiting for first submissions" state with the next step instead of zeros. | P0 | audit | Done |
| 6 | Funding panel is a blank grey block | False: it renders a real module; the pulse is only the loading skeleton. | No change beyond the radius/edge pass. | — | `job-detail.tsx:253` | Justified, no change |
| 7 | Role list looks disabled | Already full-contrast selectable cards. | Kept. | P0 | `flows.mjs` sign-in checks | Done (pre-existing) |
| 8 | Modal over a faded page is a dead end | Real. `RoleGate` covered the screen with an overlay. | Replaced with a non-blocking inline banner: states the mismatch, offers one-click switch **and** a way back, and leaves the content readable. | P0 | `role-gate.tsx` | Done |
| 9 | Landing is a hero only; receipt perforation reads as dots | Partly stale: five sections existed. | Kept the structure; hero timeline label colours now use computed readable ink. Receipt notches kept (they are the chain-of-custody idea) but animation moved to CSS. | P1 | `contrast.mjs` label rows | Done |
| 10 | Dev chips collide with the framework indicator | Real: two fixed chips bottom-left, no collapse, no clean mode. | Collapsible demo dock pinned bottom-right, hidden under `?clean=1` or `NEXT_PUBLIC_DEMO_CLEAN=true`; `devIndicators: false`. | P0 | `dev-toolbar.tsx`, `next.config.ts` | Done |
| 11 | Buttons end in arrows | Real on 6 buttons. | Removed every trailing `ArrowRight`; verbs only. Leading "Back" arrows kept (direction, not decoration). | P0 | grep + `flows.mjs` | Done |
| 12 | Wizard shows video labels for an Images job | False: `job-wizard.tsx` branches on `modality`. | No change. | — | `job-wizard.tsx:303-369` | Justified, no change |
| 13 | Qualify reveals "You passed" before answering | False: gated by `submitted`; the green answer only renders after submit. | No change. | — | `app/work/(list)/qualify/page.tsx` | Justified, no change |
| 14 | Page widths differ between roles | One width now enforced at 1200px in the shell. | Sidebar shell owns the measure; workbenches are full-bleed by design. | P0 | `flows.mjs` "content column is capped at 1200" | Done |
| 15 | No imagery rhythm | Subjective. | Kept the live timeline and receipt as the real product surfaces; no stock imagery added. | P2 | — | Justified, no change |

## Extra findings from the pass (not in the brief)

| Finding | Severity | Action | Evidence |
|---|---|---|---|
| **Hydration mismatch for reduced-motion users.** `useReducedMotion()` returns false on the server and true in the browser, so `motion/react` rendered `opacity: 0` in SSR HTML and `opacity: 1` on hydration — a visible flash on the wizard step panel and the receipt, and a console error for every user with reduced motion enabled. | P0 | Removed `motion/react` entirely. The wizard step panel is now a plain element; the receipt print-out is a CSS keyframe the existing `prefers-reduced-motion` block collapses. | detector baseline + `scripts/shots.mjs` reports zero console errors |
| **White text on light label fills.** `grasp` measured 2.3:1 and `place` 3.4:1 against white. | P0 | `labelInk()` computes the readable ink from the fill's luminance; applied to the hero timeline, the video timeline, the class palette and the box overlay. | `contrast.mjs`: all 8 label rows now ≥4.5:1 |
| **Duplicate `#main` on client navigation into the workbench.** Page-level shells meant navigating Claim → workbench mounted two shells; the sidebar survived into the focus canvas. | P0 | Contributor list screens moved into an `(list)` route group whose layout owns the shell; the workbench keeps `AppShell bare`. The bare branch uses `id="workbench"` so a leftover shell can never be the skip-link target. | `flows.mjs` "workbench is full-bleed with no sidebar" |
| **Skipped heading level** on the landing (`h1` → `h3` "Receipt"). | P1 | Receipt heading is now `h2`. | audit "headingSkips 0" |
| **`tsc` swept the teammate's `backend/`** into the frontend check. | P1 | `backend` excluded from the root `tsconfig.json`; it keeps its own. | `tsc --noEmit` clean |
| **Duplicated `prefers-reduced-motion` block** in `globals.css`. | P2 | Removed the duplicate. | build |
| **`useSyncExternalStore` vs setState-in-effect** in the clean-mode hook. | P2 | Rewritten; lint clean. | eslint |

## Deferred, with reasons

- **Acceptance-rate area chart on the buyer dashboard.** The brief asks for "mock time
  series that is plausible". A daily accepted-tasks curve implies real momentum we do not
  have, and the non-negotiables forbid invented statistics. Not added. If you want it, the
  backend must supply a real series.
- **Command palette (Cmd+K) and keyboard hint chips.** Worth doing, but they are net-new
  interaction surface and did not fit the remaining budget safely. The workbench already
  carries its shortcut hints in-panel.
- **Font swap.** The detector still flags Instrument Sans as an overused face. Kept:
  Bricolage Grotesque carries headings and every number that matters, and swapping the UI
  face hours before a deadline would mean re-verifying 18 routes for a purely stylistic
  gain. This is the one outstanding detector finding, accepted in writing.
- **Sidebar collapse persistence.** Collapse state is per-session. Persisting it needs a
  localStorage read that is easy to get wrong at hydration; not worth it now.