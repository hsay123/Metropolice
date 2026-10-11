/**
 * Token contrast audit.
 *
 *   node scripts/contrast.mjs
 *
 * Checks every text/background pair defined in styles/tokens.css against its WCAG
 * target: 4.5:1 for body text, 3:1 for large text and control boundaries.
 * A pair that fails is a token bug, not a per-screen bug, so it is fixed in the
 * token rather than overridden at the call site.
 */

const hex = (h) => {
  const c = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const T = {
  bench: "#eceff3",
  sheet: "#ffffff",
  surface2: "#f5f7fa",
  wash: "#e2e7ed",
  ink: "#18202b",
  inkMuted: "#5b6676",
  stage: "#161b22",
  stageInk: "#e6eaf0",
  brand: "#1f4fe0",
  brandHover: "#173fc0",
  brandTint: "#e8eeff",
  fieldEdge: "#7a8493",
  pending: "#5b6676",
  revision: "#9a6200",
  accepted: "#17754a",
  rejected: "#b3261e",
  paid: "#7a35c8",
};

/** [foreground, background, target, description] */
const PAIRS = [
  [T.ink, T.bench, 4.5, "ink on bench (body)"],
  [T.ink, T.sheet, 4.5, "ink on sheet (body)"],
  [T.ink, T.surface2, 4.5, "ink on surface-2 (body)"],
  [T.ink, T.wash, 4.5, "ink on wash (body)"],
  [T.inkMuted, T.bench, 4.5, "ink-muted on bench (secondary)"],
  [T.inkMuted, T.sheet, 4.5, "ink-muted on sheet (secondary)"],
  [T.inkMuted, T.surface2, 4.5, "ink-muted on surface-2 (secondary)"],
  [T.inkMuted, T.wash, 4.5, "ink-muted on wash (secondary)"],
  ["#ffffff", T.brand, 4.5, "white on brand (button)"],
  ["#ffffff", T.brandHover, 4.5, "white on brand-hover (button)"],
  [T.brandHover, T.brandTint, 4.5, "brand on brand-tint (active nav)"],
  [T.fieldEdge, T.sheet, 3, "field-edge on sheet (control border)"],
  [T.fieldEdge, T.bench, 3, "field-edge on bench (control border)"],
  [T.stageInk, T.stage, 4.5, "stage-ink on stage (media caption)"],
  [T.pending, "#eef0f3", 4.5, "pending"],
  [T.revision, "#fff1d6", 4.5, "revision"],
  [T.accepted, "#e2f4ea", 4.5, "accepted"],
  [T.rejected, "#fce6e4", 4.5, "rejected"],
  [T.paid, "#f1e7fb", 4.5, "paid"],
];

/** Label fills carry text at 12px, so each needs 4.5:1 against its computed ink. */
const LABELS = {
  reach: "#0072b2",
  grasp: "#e69f00",
  lift: "#56b4e9",
  place: "#009e73",
  inspect: "#cc79a7",
  recover: "#d55e00",
  write: "#5f4bb6",
  other: "#8a94a3",
};

const labelInk = (h) => {
  const l = lum(h);
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.05) ? "#ffffff" : "#0b1220";
};

let failed = 0;
const run = (fg, bg, target, label) => {
  const r = ratio(fg, bg);
  const ok = r >= target;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(6)}  (need ${target})  ${label}`);
};

for (const [fg, bg, target, label] of PAIRS) run(fg, bg, target, label);
for (const [name, fill] of Object.entries(LABELS)) {
  run(labelInk(fill), fill, 4.5, `${name} label text on its fill`);
}

console.log(failed ? `\n${failed} pair(s) below target` : "\nAll token pairs pass their target.");