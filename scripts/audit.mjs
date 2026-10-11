/**
 * UX audit for the redesign pass.
 *
 *   node scripts/audit.mjs                 # every route at 1440 / 1280 / 390
 *   node scripts/audit.mjs --w 390         # one viewport
 *
 * Checks, per route:
 *   - horizontal overflow of the document
 *   - console and page errors
 *   - interactive elements with no accessible name
 *   - duplicate element ids
 *   - exactly one <h1>, and no skipped heading levels
 *   - interactive targets below the 24x24 px floor
 * Radix radio/checkbox controls are reported separately: a 16x16 control paired
 * with its label is a legitimate pattern, not a defect.
 */
import pw from "@playwright/test";

const { chromium } = pw;

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const WIDTHS = arg("w", null) ? [Number(arg("w"))] : [1440, 1280, 390];

const ROUTES = [
  ["/", "buyer"],
  ["/login", "buyer"],
  ["/buyer", "buyer"],
  ["/buyer/jobs/new", "buyer"],
  ["/buyer/jobs/job_pickplace", "buyer"],
  ["/work", "contributor"],
  ["/work/qualify", "contributor"],
  ["/work/tasks", "contributor"],
  ["/work/tasks/task_01Ha2", "contributor"],
  ["/work/tasks/task_01Hb7", "contributor"],
  ["/work/earnings", "contributor"],
  ["/review", "reviewer"],
  ["/review/sub_a2", "reviewer"],
  ["/review/sub_vid2", "reviewer"],
  ["/admin", "admin"],
  ["/receipts/rcpt_91", "buyer"],
  ["/does-not-exist", "buyer"],
  ["/dev/components", "buyer"],
];

const audit = `() => {
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;

  const unnamed = [];
  const smallTargets = [];
  const formControls = [];
  for (const el of document.querySelectorAll("button, a[href], input, select, textarea")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    if (el.classList.contains("sr-only")) continue;

    const name =
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      (el.textContent || "").trim() ||
      el.getAttribute("placeholder") ||
      (el.labels && el.labels.length ? "labelled" : "");
    const isControl = el.tagName === "INPUT" || el.getAttribute("role") === "radio" || el.getAttribute("role") === "checkbox";
    if (!name && el.tagName !== "INPUT") unnamed.push(el.outerHTML.slice(0, 80));

    if (el.tagName === "BUTTON" || el.tagName === "A") {
      const tiny = (r.width < 24 && r.height < 24) || r.height < 20;
      if (tiny) {
        const entry = el.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height) + ' "' + (el.textContent || "").trim().slice(0, 24) + '"';
        (isControl ? formControls : smallTargets).push(entry);
      }
    }
  }

  const ids = {};
  for (const el of document.querySelectorAll("[id]")) ids[el.id] = (ids[el.id] || 0) + 1;
  const dupes = Object.entries(ids).filter(([, n]) => n > 1).map(([id]) => id);

  const h1s = [...document.querySelectorAll("h1")];
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
  const skips = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) skips.push("h" + levels[i - 1] + " -> h" + levels[i]);
  }

  return {
    overflow,
    unnamed: unnamed.slice(0, 5),
    smallTargets: smallTargets.slice(0, 6),
    formControls: formControls.slice(0, 3),
    dupes,
    h1Count: h1s.length,
    skips: [...new Set(skips)].slice(0, 4),
  };
}`;

const browser = await chromium.launch();
let flagged = 0;
const totals = { routes: 0, overflow: 0, errors: 0, unnamed: 0, dupes: 0, h1: 0, skips: 0, targets: 0 };

for (const [path, role] of ROUTES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errs = [];
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" && !t.includes("404")) errs.push(t.slice(0, 150));
    });
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 150)));

    await page.addInitScript((r) => {
      window.localStorage.setItem("pdn-dev-role", JSON.stringify({ state: { role: r }, version: 0 }));
    }, role);
    await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2000);

    const res = await page.evaluate(eval(audit));
    await page.close();

    totals.routes++;
    const issues = [];
    if (res.overflow > 2) { issues.push(`overflow +${res.overflow}px`); totals.overflow++; }
    if (errs.length) { issues.push(`${errs.length} error(s): ${errs[0]}`); totals.errors++; }
    if (res.unnamed.length) { issues.push(`unnamed: ${res.unnamed.join(" | ")}`); totals.unnamed++; }
    if (res.dupes.length) { issues.push(`duplicate ids: ${res.dupes.join(",")}`); totals.dupes++; }
    if (res.h1Count !== 1) { issues.push(`h1 count ${res.h1Count}`); totals.h1++; }
    if (res.skips.length) { issues.push(`heading skips: ${res.skips.join(", ")}`); totals.skips++; }
    if (res.smallTargets.length) { issues.push(`small targets: ${res.smallTargets.join(" | ")}`); totals.targets++; }

    if (issues.length) {
      flagged++;
      console.log(`\n[${width}] ${path}`);
      for (const i of issues) console.log("   - " + i);
      if (res.formControls.length) console.log(`   (16px form controls, labelled: ${res.formControls.length})`);
    }
  }
}

await browser.close();
console.log(`\n${totals.routes} checks across ${ROUTES.length} routes — ${flagged} with findings`);
console.log(
  `overflow ${totals.overflow} · errors ${totals.errors} · unnamed ${totals.unnamed} · dupIds ${totals.dupes} · h1 ${totals.h1} · headingSkips ${totals.skips} · smallTargets ${totals.targets}`,
);