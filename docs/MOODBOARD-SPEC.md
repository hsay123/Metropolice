# MOODBOARD-SPEC.md

Visual authority for the `ui-moodboard` pass. Transcribed from the redesign brief
(sections 2 to 8), 11 Oct 2026. Code and this file must agree; if they diverge, fix one
the same day.

**Authority order.** 1) This spec and the mood boards (visual). 2) `AGENTS.md` and
`docs/PRD.md` (behaviour and honesty). 3) Impeccable quality rules (contrast, target
size, focus, overflow) still apply. Impeccable *taste* rules that contradict this spec
are waived, and each waiver is recorded with
`npx impeccable ignores add-value <rule> <value> --reason "Mood board spec"`.

---

## 1. Mood

Bright, airy, premium AI-infrastructure product. Soft lilac-grey canvas, white rounded
cards with very light borders, one violet accent, black pill CTAs on marketing,
photography of robot arms as the hero, dark photo sections for contrast.

Primary violet: `#6A3DF8`.

## 2. Tokens

```css
:root {
  /* canvas and surfaces */
  --bg: #F8FAFC;            --surface: #FFFFFF;        --surface-2: #F1F5F9;
  --border: #E6EBF2;        /* cards, dividers (decorative) */
  --border-field: #7C8AA0;  /* inputs and controls */

  /* text */
  --fg: #0F172A;            --fg-muted: #5B6B80;       --fg-subtle: #64748B;

  /* brand */
  --primary: #6A3DF8;       --primary-hover: #5B2DE8;  --primary-active: #4F22D6;
  --primary-tint: #F1EBFF;  --primary-tint-2: #E7DEFF; --primary-ring: rgba(106,61,248,.35);
  --cta-black: #0B1020;

  /* dark sections */
  --dark: #080B14;          --dark-surface: #0F1424;   --dark-border: rgba(255,255,255,.10);
  --dark-fg: #E6EAF5;       --dark-muted: #9AA4B8;     --primary-on-dark: #8F6BFF;

  /* status: chip bg / chip text */
  --s-progress-bg: #E8F0FF; --s-progress-fg: #2F5FD0;
  --s-review-bg:   #FFF3DC; --s-review-fg:   #965300;
  --s-accepted-bg: #E3F7EE; --s-accepted-fg: #147A52;
  --s-rejected-bg: #FDEBE6; --s-rejected-fg: #B93815;
  --s-paid-bg:     #DDF5F2; --s-paid-fg:     #0F766E;
  --s-pending-bg:  #EEF1F5; --s-pending-fg:  #475569;
  /* appealed: white bg, dashed --fg-muted border */

  /* timeline / label colours (always with text label; failure adds hatch + red outline) */
  --l-reach: #6A3DF8; --l-grasp: #F0605D; --l-lift: #F5B83D; --l-move: #2DBE8D;
  --l-place: #2FB67D; --l-inspect: #3B82F6; --l-recover: #0EA5E9; --l-write: #EC4899; --l-other: #94A3B8;

  /* shape */
  --r-btn: 10px; --r-input: 10px; --r-chip: 8px; --r-card: 16px; --r-panel: 20px; --r-media: 12px;

  /* shadow */
  --shadow-card:  0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.05);
  --shadow-float: 0 12px 40px rgba(15,23,42,.12);
  --shadow-btn:   0 1px 2px rgba(15,23,42,.08);
}
```

Stated contrast figures: white on `--primary` 5.8:1, `--primary-hover` 7.0:1, `--fg` on
`--bg` 17:1, `--fg-muted` on `--bg` 5.2:1, status chip pairs 4.8 to 6.7:1. Use the listed
status *text* colours, not the lighter ones sampled from the board. **Any changed value
is re-checked by `scripts/contrast.mjs`.**

### Type

Satoshi (headings, big numbers) and Inter (UI and body), self-hosted via
`next/font/local` and `next/font/google`.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Hero H1 | `clamp(40px, 4.2vw, 60px)` / 1.05 | 700 | -0.025em |
| H2 | 40 / 44 | 700 | -0.02em |
| H3 | 24 / 32 | 700 | -0.015em |
| Large body | 18 / 28 | 400 | 0 |
| Body | 16 / 24 | 400 | 0 |
| UI | 14 / 20 | 400–600 | 0 |
| Caption | 12 / 16 | 400–600 | 0 |

Tabular numerals for money, times and counts. Body text `--fg`; supporting `--fg-muted`.

### Spacing

4 px base. Card padding 20 or 24. Page padding 32. Grid gap 20 or 24. Landing sections 96
to 120 vertical. App content max width 1280.

### Motion

150 to 200 ms ease-out, CSS only (no motion library). Hover lifts buttons by -1 px and
deepens the shadow. Tabs and segmented controls slide their indicator. Reduced motion
removes transforms.

## 3. Components

- **Primary button:** bg `--primary`, white text 14/600, height 40 (44 on landing), radius
  10, padding 0 18px, shadow `--shadow-btn`, hover `--primary-hover`, focus ring 3px
  `--primary-ring`. A top-to-bottom sheen `linear-gradient(180deg,#7A52FA,#6A3DF8)` is
  allowed.
- **Black CTA:** bg `--cta-black`, white, radius 10, height 44. Trailing arrow only on the
  nav "Get started".
- **Secondary button:** white, 1px `--border-field`, `--fg`, radius 10, height 40.
  **Ghost "Sign in":** white with 1px `--border`, radius 10.
- **Inputs and selects:** height 40, radius 10, 1px `--border-field`, white; focus
  `--primary-ring`; placeholder `--fg-subtle`.
- **Card:** `--surface`, 1px `--border`, radius 16, `--shadow-card`, padding 20 to 24, on
  `--bg`.
- **Status chip:** height 24, padding 0 10, radius 8, text 12/600, 14px icon, colours from
  the status tokens. **Tag:** `--primary-tint` bg, violet text, radius 8.
- **Sidebar:** width 240 (68 collapsed), white, right border `--border`. Top: workspace
  switcher (28px avatar tile, violet initials, name 14/600, chevron). Nav item height 40,
  radius 10, icon 18, gap 12, text 14/500. Active: bg `--primary-tint`, text and icon
  `--primary-hover`, weight 600. Bottom: Monad testnet card and wallet chip.
- **Top bar:** height 64 on `--bg`; breadcrumb left; search (max 320) opening the command
  palette; bell; 32px avatar.
- **KPI card:** label 13 `--fg-muted`, value 32/700 Satoshi, delta chip 12, optional
  56x24 sparkline in violet. Four equal columns, gap 20.
- **Progress bar:** 6px, radius 999, track `#EEF2F7`, fill `--primary` (green when complete).
- **Table row:** height 64 to 72; thumbnail 44x44 radius 10; hover bg `--bg`; dividers
  `--border`; no zebra.
- **Tabs:** text tabs with a 2px violet underline, or a segmented control (white pill on
  `--surface-2`).
- **Floating annotation chip:** white 92%, backdrop blur 8, radius 10, `--shadow-float`,
  12/600, small violet diamond.
- **Video frame:** radius 12, overflow hidden. **Filmstrip thumb:** 72x56 radius 8; active
  has a 2px `--primary` ring and `--primary-tint` bg.
- **Timeline:** one multi-colour bar 12px high radius 6; violet playhead with a 10px circle
  handle; ruler ticks every 5s in 11/`--fg-subtle` tabular; label chips under the bar
  (selected = violet fill, white text).
- **Dark section:** `--dark` bg, radius 24 inset container, dot-matrix or grid pattern in
  `--dark-border`, white headings, `--dark-muted` body, photo tiles radius 12 with a
  bottom-left caption.

## 4. Screens

| Board tile | Route |
|---|---|
| Landing hero | `/` — nav, tagline pill, H1, two buttons, four stats with dividers, built-with row, hero photo with five floating annotation chips |
| Get-started chooser | `/login` — centred radius-20 card on a lilac gradient, 4-step progress, two option cards, "How it works" row |
| Dark network section | `/` section 2 — "Built for the data robots learn from.", dot matrix, 2x2 photo grid |
| Company dashboard | `/buyer` — sidebar, welcome header, four KPI cards, active projects list, review mix and budget cards |
| Annotation workbench | `/work/tasks/[id]` — top bar, left filmstrip, centre stage, timeline with chips, right panel with Annotation/Instructions tabs and segment details |
| Task marketplace | `/work/tasks` — filter chips, task rows 120x84 thumbs, rubric and reward before claim |
| Review queue | `/review` — To review / Disputed / Completed tabs, priority chips from risk flags |
| Dataset delivery | `/buyer/jobs/[id]/export` — vertical tabs, green check, meta grid, black download |
| Mobile screens | all routes below 640px |
| Design system | `/dev/components` |

Not on the board, same system: wizard, job detail, onboarding and qualification,
earnings, receipt, admin.

## 5. Content rules (no fabricated claims)

| Board content | Replacement |
|---|---|
| 120K+ contributors, 40+ partners, 2.5M+ clips, 99.2% acceptance | "6 review layers", "1 receipt per payout", "0 raw files onchain", "Test tokens only" |
| "Trusted by" customer logos | "Built with" text wordmarks for integrations actually implemented, driven by `lib/integrations.ts` flags. **No customer logos, ever.** |
| Dashboard values (12 projects, 248,300 tasks, $12,480) | Computed from mock or real data. Delta chip and sparkline render **only** when a real series exists. |
| "Welcome back, Acme Robotics" | Workspace name from the logged-in user; clearly fictional demo workspace in mock mode, with the Mock badge. |
| "$1.20 / task", "$124.50" | "0.50 test USDC" everywhere, with the test-token note. |
| Task levels (Beginner/Intermediate/Advanced) | Omit unless the API provides them. |
| "Quality Score 98.2%" | Only when computed from audited results, otherwise "Not enough data yet". |

Every generated image is captioned "Illustrative image". No real company logos, no real
people, no branded robots.

## 6. Imagery

`public/images/` as WebP: 1600px wide for heroes, 800px for tiles.

`hero-robot-arm.webp`, `domain-manipulation.webp`, `domain-warehouse.webp`,
`domain-kitchen.webp`, `domain-inspection.webp`, `task-01.webp`..`task-08.webp`,
`network-dots.svg` (generated in code), plus the existing
`public/media/clip-pen-writing.mp4`.

## 7. Delete and keep

**Delete and rebuild:** `styles/tokens.css`, shell components, page layouts, all visual
components, `/dev/components`.

**Keep:** `lib/api/*`, zod schemas, `mocks/`, stores and hooks, validators,
`lib/reasonCodes.ts`, `lib/audit.ts`, tx and lease state, role guards, Privy and wagmi
wiring, tests, `scripts/` harnesses, docs.