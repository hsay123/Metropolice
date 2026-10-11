# UI rebuild log — mood-board pass

Branch `ui-moodboard`, cut from `redesign-v2`. Start 13:47 IST, 11 Oct 2026. Budget 3h.

**Visual authority:** `docs/moodboard/` + `docs/MOODBOARD-SPEC.md`.
**Behaviour, schemas, honesty:** `AGENTS.md`, `docs/PRD.md`.

## Decisions taken without asking

1. **Impeccable taste rules are waived where they contradict the boards** (no-Inter, no-violet,
   no-KPI-rows, card-nesting). Quality rules stay on. Waivers are recorded in Phase 3 with
   `npx impeccable ignores`; none of them touch contrast, target size or focus.
2. **Paid is teal, not purple.** Violet is the brand. Recorded in the spec so the PRD UX note
   can follow.
3. **KPI cards are plain by default** (label + number). The sparkline and delta render only
   when a real `series` is supplied; mock data supplies none. The contract is now in
   `docs/API-NEEDS.md` §4.
4. **Photo slots, not photos.** `PhotoSlot` renders a captioned "Illustrative image" stand-in
   until a file lands in `public/images/`. No generated imagery is implied to be real.
5. **Legacy utility aliases.** The old colour names (`bg-bench`, `text-ink`, `border-rule`, …)
   are aliased to the new tokens in `globals.css` so the app stays rendered while screens
   migrate. Each alias is removed with its last caller.

## Bugs hit and fixed during setup

| Bug | Cause | Fix |
|---|---|---|
| Shadows invisible; `--shadow-card: var(--shadow-card)` circular | Tailwind's `--shadow-*` namespace collides with the token name | Renamed tokens to `--elev-card/-float/-btn` |
| **Violet missing everywhere** (buttons washed out, Primary swatch white) | `--primary: var(--primary)` and `--border: var(--border)` in the shadcn `:root` were circular | Removed both; `tokens.css` already defines those exact names |
| Nothing applying at all (transparent body, Times New Roman) | A circular var inside `@theme` invalidated the block | Fixed with the above |
| `next/font/local` build failure | `weight: ["500","700"]` array invalid with per-`src` weights | Removed the top-level `weight` |
| Satoshi "leaves the filesystem root" | Path was `../../public/...` from `app/` | Corrected to `../public/...` |
| Gallery overflowed 514px at 390 | Implicit grid track sized to max-content; `min-w-0` on the container does not constrain it | `grid-cols-1` plus `min-w-0` on the truncating flex item |
| spec-check reported its own passes as failures | Three inverted `near()` guards | Fixed the guards |

**Note on the violet bug:** it survived a full dev-server restart cycle before the served CSS
was inspected directly. `computedValue` said `--primary` was empty while the source looked
correct — the served stylesheet, not the file on disk, was the truth. Worth remembering.

## Elapsed

| Time | Elapsed | Phase | Note |
|---|---|---|---|
| 13:47 | 0:00 | P0 | Branch cut. Moodboard found at `moodboard/`, copied to `docs/moodboard/`. |
| 13:55 | 0:08 | P0 | Satoshi fetched (Fontshare, latin 500+700, valid WOFF2). |
| 14:03 | 0:16 | P0 | `docs/MOODBOARD-SPEC.md` transcribed from the brief. |
| 14:12 | 0:25 | P1 | `styles/tokens.css` rewritten to the spec. |
| 14:20 | 0:33 | P1 | `globals.css` remapped to Tailwind v4 theme + shadcn vars, with legacy aliases. |
| 14:28 | 0:41 | P1 | Satoshi local + Inter google; H1/H2/H3 bound to Satoshi. |
| 14:36 | 0:49 | P1 | Base components: Button, Card, StatusChip/Tag, KpiCard, ProgressBar, FilterChip, Avatar, SegmentedControl, PhotoSlot, Input. |
| 14:44 | 0:57 | P1 | `scripts/spec-check.mjs` written; three inverted assertions fixed. |
| 14:52 | 1:05 | P1 | `/dev/components` rebuilt as the design-system tile. |
| 14:58 | 1:11 | P1 | Circular `--primary` / `--border` found and fixed. |
| 15:04 | 1:17 | P1 | Contrast script rewritten for the new tokens — it had been silently testing the old palette. |

## Checkpoint 1

- `node scripts/spec-check.mjs --only dev/components` → **all assertions pass**, 1 route x 3 widths.
- Screenshot: `.shots/gallery-dev-components-1440x900.png`
- `tsc`, `eslint`, `build` (18 routes) clean.
- `node scripts/contrast.mjs` → **36/36 pairs pass**.

## Elapsed (continued — timestamps after checkpoint 1 are order-accurate, clock times approximate)

| Time | Phase | Note |
|---|---|---|
| 16:05 | P2 | `AppShell` rebuilt: 240/68 sidebar, 64px top bar, `bare` focus mode, mock badge, Cmd-K palette. |
| 16:20 | P2 | Buyer dashboard `/buyer`: four plain KPI cards, active-projects table, review-mix + budget panels. `5a90000`. |
| 16:40 | P2 | Landing `/` + `/login` role chooser. Checkpoint 2. `3c617a2`. |
| 17:00 | P2 | Job wizard `/buyer/jobs/new` + 28px Satoshi `PageHeader`. |
| 17:25 | P2 | Job detail `/buyer/jobs/[id]` + export dialog; `Stat` rebuilt (28px value, flat `StatGrid`). `99b0e3e`. |
| 17:55 | P2 | Contributor onboarding, qualification, task queue. Legacy raw-var aliases added (35 call sites). `spec-check` now sets the owning role per route. `4584c39`. |
| 18:40 | P2 | Workbench: single-bar timeline, filmstrip, Annotation/Instructions tabs; marketplace thumbs to 120x84. `8f6f782`. |
| 19:05 | P3 | `scripts/contrast.mjs` written; 18 failures found and fixed (photo-slot caption, chip labels). `6b82034`. |

## Bugs hit and fixed during phase 2–3

| Bug | Cause | Fix |
|---|---|---|
| 35 raw `var(--rejected-ink)`-style call sites painted nothing | The token rename removed the old names but the raw `var()` uses were not aliased | Legacy **raw** var aliases added to `tokens.css` (not just the Tailwind utilities) |
| `.photo-slot` caption failed AA (4.09:1) | `--fg-subtle` on `--primary-tint` at 12px | Caption uses `--fg`; chip labels on the tint use `--fg-muted` |
| Chip labels on `--primary-tint` failed AA (4.09:1) | `--fg-subtle` at 12px | Switched to `--fg-muted` (4.72:1) |
| **CSS edits stopped applying** (photo-slot still old after edit *and* after restart) | Turbopack's file watcher stopped invalidating `app/globals.css`; the chunk on disk kept a pre-edit mtime | Deleted `.next/dev` and `.next/cache`, restarted `pnpm dev`. Verified by grepping the **served** chunk, not the source |

The contrast script itself needed a fix: the primary button's background is a gradient, so
`backgroundColor` is transparent and the first version reported white-on-white (1.05:1). It now
collects gradient colour stops and tests the text against every stop, taking the worst case.

## Checkpoint 2

- Routes: `/`, `/login`, `/buyer`, `/buyer/jobs/new`, `/buyer/jobs/job_pickplace`.
- `spec-check` and `shots` pass at 1440/1280/390; no console errors, no horizontal overflow.

## Checkpoint 3

- Workbench rebuilt to `MOODBOARD-SPEC.md` §3–4: one 12px multi-colour bar with a violet
  playhead and a 10px handle, 5s ruler ticks, label chips under the bar; a filmstrip of real
  decoded frames (72x56) with a dark-stage fallback; Annotation/Instructions tabs.
- `spec-check` now asserts `timeline-bar`, `thumb-row` and `video-frame` on the workbench.

## Phase 3 gates (all green)

- `npx tsc --noEmit` clean; `npx eslint .` 0 errors (warnings only, all in `backend/` or scripts).
- `node scripts/shots.mjs` → 18 routes at 1440x900, no console errors, no overflow.
- `node scripts/shots.mjs --w 390 --h 844` → 18 routes at 390, no console errors, no overflow.
- `node scripts/spec-check.mjs` → 16 routes x 3 widths, all assertions pass.
- `node scripts/contrast.mjs` → **all text pairs meet WCAG AA** (was 18 failures before the fix).
- `npx impeccable detect app components` → **0 findings**; no taste waivers were needed.