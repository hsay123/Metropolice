/**
 * Token contrast audit.
 *
 *   node scripts/contrast.mjs
 *
 * Checks every text/background pair in styles/tokens.css against its WCAG target:
 * 4.5:1 for body text, 3:1 for large text and control boundaries. A pair that fails
 * is a token bug, so it is fixed in the token rather than overridden at the call
 * site. Values here are the mood-board tokens (docs/MOODBOARD-SPEC.md §2).
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
  bg: "#f8fafc",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  border: "#e6ebf2",
  borderField: "#7c8aa0",
  fg: "#0f172a",
  fgMuted: "#5b6b80",
  fgSubtle: "#64748b",
  primary: "#6a3df8",
  primaryHover: "#5b2de8",
  primaryTint: "#f1ebff",
  ctaBlack: "#0b1020",
  dark: "#080b14",
  darkFg: "#e6eaf5",
  darkMuted: "#9aa4b8",
  primaryOnDark: "#8f6bff",
};

/** [foreground, background, target, description] */
const PAIRS = [
  [T.fg, T.bg, 4.5, "fg on bg (body)"],
  [T.fg, T.surface, 4.5, "fg on surface (body)"],
  [T.fg, T.surface2, 4.5, "fg on surface-2 (body)"],
  [T.fgMuted, T.bg, 4.5, "fg-muted on bg (secondary)"],
  [T.fgMuted, T.surface, 4.5, "fg-muted on surface (secondary)"],
  [T.fgMuted, T.surface2, 4.5, "fg-muted on surface-2 (secondary)"],
  [T.fgSubtle, T.surface, 4.5, "fg-subtle on surface (14px+)"],
  [T.fgSubtle, T.bg, 4.5, "fg-subtle on bg (14px+)"],
  ["#ffffff", T.primary, 4.5, "white on primary (button)"],
  ["#ffffff", T.primaryHover, 4.5, "white on primary-hover"],
  ["#ffffff", T.ctaBlack, 4.5, "white on cta-black (marketing CTA)"],
  [T.primaryHover, T.primaryTint, 4.5, "primary-hover on primary-tint (tag, active nav)"],
  [T.primary, T.surface, 3, "primary on surface (3:1 graphical)"],
  [T.borderField, T.surface, 3, "border-field on surface (control border)"],
  [T.borderField, T.bg, 3, "border-field on bg (control border)"],
  [T.darkFg, T.dark, 4.5, "dark-fg on dark"],
  [T.darkMuted, T.dark, 4.5, "dark-muted on dark"],
  [T.primaryOnDark, T.dark, 3, "primary-on-dark on dark (3:1 graphical)"],
  // status chips
  ["#2f5fd0", "#e8f0ff", 4.5, "status: progress"],
  ["#965300", "#fff3dc", 4.5, "status: review"],
  ["#147a52", "#e3f7ee", 4.5, "status: accepted"],
  ["#b93815", "#fdebe6", 4.5, "status: rejected"],
  ["#0f766e", "#ddf5f2", 4.5, "status: paid"],
  ["#475569", "#eef1f5", 4.5, "status: pending"],
  [T.fgMuted, T.surface, 4.5, "status: appealed (fg-muted on white)"],
];

/** Timeline/label fills carry a 12px text label, so each needs 4.5:1 against it. */
const LABELS = {
  reach: "#6a3df8",
  grasp: "#f0605d",
  lift: "#f5b83d",
  move: "#2dbe8d",
  place: "#2fb67d",
  inspect: "#3b82f6",
  recover: "#0ea5e9",
  write: "#ec4899",
  other: "#94a3b8",
};

/** Picks white or near-black for text on a coloured fill, by measured luminance. */
const inkOn = (fill) => {
  const l = lum(fill);
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
for (const [name, fill] of Object.entries(LABELS)) run(inkOn(fill), fill, 4.5, `label "${name}" text on its fill`);

console.log(failed ? `\n${failed} pair(s) below target` : "\nAll token pairs pass their target.");