# Redesign report — PhysicalData Network

Branch `redesign-v2`. Start 12:57 IST, 11 Oct 2026. Base commit `602779a`.

Read this with `docs/REDESIGN-TODO.md` (the problem register) and `docs/REDESIGN-LOG.md`
(decisions, gates, timings).

---

## What changed, in one paragraph

The single biggest lever was structural, not cosmetic: the app had a 48px top bar and a
hierarchy problem. It now has a 232px left sidebar (collapsible to a 68px icon rail) with
one 1200px content measure shared by every role, and workbenches that opt out of the shell
entirely into a full-bleed focus canvas. Underneath that, the token layer moved off 2px
radius to a real hierarchy (8px controls, 12px panels, 4px reserved for dense geometry),
gained a second surface tint for grouping, and softened the separator colour. Two genuine
defects surfaced and were fixed: a hydration mismatch that hit every user with reduced
motion enabled, and white label text failing contrast on half the Okabe-Ito palette.

## Screens

### Before / after

Screenshots for both states are on disk rather than inlined (this report is read in a
terminal):

```
node scripts/shots.mjs          # writes .shots/<name>-<route>-1440x900.png
```

`.shots/` is gitignored. To compare against `main`:

```bash
git stash                       # or: git worktree add ../before main
node scripts/shots.mjs --out .shots-before
```

### Per-screen notes

| Screen | Change |
|---|---|
| **Shell** (all roles) | 232px sidebar: workspace + role switcher at top, role nav with icons in the middle, network status and wallet at the bottom, collapse toggle in the footer. Active item is a raised surface with `aria-current="page"`, not a coloured bar. Below `lg` it collapses to the previous compact top bar so dense tables keep their width. |
| **Workbench** (`/work/tasks/[id]`) | Full-bleed: no sidebar, no content padding, its own `#workbench` landmark. |
| **Buyer dashboard** | Leads with the pipeline ledger; jobs table gained search, status filter, sortable columns and paging, with filter-specific empty states. |
| **Wizard** | Vertical stepper at left, form centre, sticky live summary right. Horizontal numbered boxes removed. |
| **Job detail** | Funding module unchanged (it was never a blank skeleton); progress now shows a designed "Waiting for first submissions" state instead of zeros. |
| **Role gate** | Was a modal over a faded page. Now an inline banner that states the mismatch and offers both a role switch and a way back, leaving content readable. |
| **Landing** | Structure kept; hero timeline label text now uses computed readable ink. |
| **Receipt** | Notched slip kept; animation moved from `motion/react` to a CSS keyframe that respects reduced motion. |
| **Demo chrome** | Collapsible dock bottom-right; hidden under `?clean=1`; framework dev indicator off. |

## Bugs found and fixed

1. **Hydration mismatch for reduced-motion users (P0).** `useReducedMotion()` is false on
   the server and true in the browser. Both animated surfaces branched their `initial` state
   on it, so SSR emitted `opacity: 0` while the client hydrated at `opacity: 1` — a visible
   flash on the wizard step panel and the receipt, plus a console error, for every user with
   reduced motion on. Fixed by removing `motion/react` entirely: the wizard step panel is a
   plain element, and the receipt print-out is a CSS keyframe the existing
   `prefers-reduced-motion` block collapses.
2. **Label text failing contrast (P0).** White on `grasp` measured 2.3:1 and on `place`
   3.4:1. Added `labelInk()`, which picks the readable ink from the fill's relative luminance,
   and applied it in the hero timeline, the video timeline, the class palette and the box
   overlay. All eight label pairs now pass at 4.5:1 or better.
3. **Duplicate shell on client navigation into the workbench (P0).** Contributor list pages
   each rendered their own `AppShell`, so Claim → workbench mounted two shells and the
   sidebar survived into the focus canvas. Moved the list screens into an `(list)` route
   group whose layout owns the shell; the workbench keeps `AppShell bare`.
4. **Duplicate `id="main"` (P1).** Follow-on from the above. The bare branch now uses
   `id="workbench"`, so a leftover shell can never be the skip-link target.
5. **Skipped heading level (P1).** Landing went `h1` → `h3` ("Receipt"). Now `h2`.
6. **`tsc` sweeping the teammate's `backend/` (P1).** Excluded from the root `tsconfig.json`;
   `backend` has its own.

## Verification

```
node scripts/audit.mjs      # 54 checks: 18 routes x 1440/1280/390
node scripts/flows.mjs      # 25 demo-path behaviour checks
node scripts/contrast.mjs   # 27 token contrast pairs
node scripts/shots.mjs      # screenshots
npx tsc --noEmit && npx eslint app components lib mocks scripts && pnpm build
npx impeccable detect http://localhost:3000
```

| Check | Result |
|---|---|
| DOM audit (18 routes x 3 widths) | 0 findings: no overflow, no console errors, no unnamed controls, no duplicate ids, exactly one `h1`, no skipped headings, no undersized targets |
| Demo-path flows | 25/25 pass, including claim → workbench focus mode, review decision, payout → Paid, public receipt |
| Contrast | 27/27 pairs pass |
| `tsc` / `eslint` / `build` | all pass, 18 routes |
| Impeccable detector | **4 → 1** |

### Screens needing your eyes

This model cannot view images, so these were verified by measurement, not by looking:

1. **Every screen's density and rhythm.** Scores sit at 4/5 across the board; whether the
   new 12px panels feel right at 1440 is a judgement I could not make.
2. **The sidebar against dense tables.** The jobs table now sits in a 1200px measure beside
   232px of chrome. Check the truncation and the row hover on the longest job title.
3. **The vertical wizard stepper.** 184px is tight for the longest step title ("Review and
   fund"). Check wrapping at 1024 and at 1440.
4. **The collapse-to-68px rail.** Icon-only navigation relies on tooltips; check the active
   state reads without a label.
5. **Receipt notches at the new 12px radius.** The perforation is a mask; confirm it still
   reads as a slip and not as dots.

## Known issues and accepted trade-offs

- **One detector finding stands: Instrument Sans is flagged as overused.** Kept on purpose.
  Bricolage Grotesque carries headings and every number that matters; swapping the UI face
  hours before a deadline means re-verifying 18 routes for a stylistic gain. Accepted in
  writing.
- **No acceptance-rate chart on the buyer dashboard.** The brief asks for a "plausible mock
  time series". A daily accepted-tasks curve implies real momentum that does not exist, and
  the brief's own non-negotiables forbid invented statistics. Deliberately not added; it
  needs a real series from the backend.
- **A zero-size shell node can linger after navigating into the workbench.** It is not
  visible and no longer carries a duplicate id, but it is in the DOM. Left as-is rather than
  papered over.
- **Sidebar collapse is per-session**, not persisted.
- **Command palette (Cmd+K) and keyboard hint chips** were not built. Net-new interaction
  surface that did not fit the budget; the workbench already shows its shortcuts in-panel.
- **Mobbin MCP and getdesign.md were skipped** — no Mobbin plan available here, and the OAuth
  step requires a human.

## Demo commands

```bash
pnpm dev                      # mock mode, no backend needed

# Clean capture: hides the demo dock and the framework dev indicator
open "http://localhost:3000/?clean=1"

# Set the demo role directly (bypasses the sign-in screen)
node -e "localStorage.setItem('pdn-dev-role', JSON.stringify({state:{role:'contributor'},version:0}))"
```

Demo path: landing → `/login` (pick a role) → buyer dashboard → post a job → job detail →
switch to contributor → claim a task → workbench → submit → switch to reviewer → accept →
switch to contributor → earnings → claim reward → receipt. Every screen that shows money
prints "Demo rewards are test tokens with no real value."