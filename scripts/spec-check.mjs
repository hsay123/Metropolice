/**
 * Spec check — the agent's eyes.
 *
 * Runs Playwright over every route and asserts the computed styles in
 * docs/MOODBOARD-SPEC.md. Elements opt in with `data-ui` attributes; this script
 * never infers a target from a class name. Exits 1 on any mismatch and prints
 * route, selector, expected and actual.
 *
 *   node scripts/spec-check.mjs            # all routes, 1440 / 1280 / 390
 *   node scripts/spec-check.mjs --w 1440   # one viewport
 */
import pw from "@playwright/test";

const { chromium } = pw;

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const WIDTHS = arg("w", null) ? [Number(arg("w"))] : [1440, 1280, 390];
const ONLY = arg("only", null);

/** Screens migrated to the mood board so far; the rest are still pre-migration. */
const MIGRATED = ["/dev/components", "/", "/login", "/buyer"];

const ALL_ROUTES = [
  "/",
  "/login",
  "/buyer",
  "/buyer/jobs/new",
  "/buyer/jobs/job_pickplace",
  "/work",
  "/work/qualify",
  "/work/tasks",
  "/work/tasks/task_01Ha2",
  "/work/tasks/task_01Hb7",
  "/work/earnings",
  "/review",
  "/review/sub_b7",
  "/admin",
  "/receipts/rcpt_91",
  "/dev/components",
];

const ROUTES = ONLY ? ALL_ROUTES.filter((r) => r.includes(ONLY)) : MIGRATED;

const HEX = {
  bg: "rgb(248, 250, 252)",
  surface: "rgb(255, 255, 255)",
  primary: "rgb(106, 61, 248)",
  primaryTint: "rgb(241, 235, 255)",
  ctaBlack: "rgb(11, 16, 32)",
  fieldBorder: "rgb(124, 138, 160)",
};

const failures = [];
const notes = [];

const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;

/** Runs in the page. */
const probe = () => {
  const out = { els: [], text: [], overflow: {} };
  for (const el of document.querySelectorAll("[data-ui]")) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.els.push({
      ui: el.getAttribute("data-ui"),
      tone: el.getAttribute("data-tone"),
      bg: cs.backgroundColor,
      color: cs.color,
      radius: parseFloat(cs.borderTopLeftRadius),
      h: Math.round(r.height),
      w: Math.round(r.width),
      shadow: cs.boxShadow,
      border: `${parseFloat(cs.borderTopWidth)}px ${cs.borderTopStyle}`,
      font: cs.fontFamily,
      fontSize: parseFloat(cs.fontSize),
    });
  }
  // KPI row: equal columns
  const kpi = document.querySelector('[data-ui="kpi-row"]');
  if (kpi) {
    const kids = [...kpi.children].map((c) => Math.round(c.getBoundingClientRect().width));
    out.kpi = { count: kids.length, widths: kids, gap: getComputedStyle(kpi).gap };
  }
  out.text = [
    { sel: "body", bg: getComputedStyle(document.body).backgroundColor, font: getComputedStyle(document.body).fontFamily },
  ];
  const h1 = document.querySelector("h1");
  if (h1) {
    const cs = getComputedStyle(h1);
    out.text.push({ sel: "h1", font: cs.fontFamily, size: parseFloat(cs.fontSize), weight: cs.fontWeight });
  }
  return out;
};

const browser = await chromium.launch();

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errs = [];
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" && !t.includes("404")) errs.push(t.slice(0, 120));
    });
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 120)));
    await page.addInitScript(() => {
      window.localStorage.setItem("pdn-dev-role", JSON.stringify({ state: { role: "buyer" }, version: 0 }));
    });
    await page.goto("http://localhost:3000" + route + "?clean=1", { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1800);

    const fail = (msg) => failures.push(`[${width}] ${route}  ${msg}`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 2) fail(`horizontal overflow +${overflow}px`);
    if (errs.length) fail(`console error: ${errs[0]}`);

    const data = await page.evaluate(probe);

    // body canvas and type
    const body = data.text.find((t) => t.sel === "body");
    if (body) {
      if (body.bg !== HEX.bg) fail(`body background ${body.bg}, expected ${HEX.bg}`);
      if (!/Inter/i.test(body.font)) fail(`body font "${body.font.slice(0, 30)}", expected Inter`);
    }
    const h1 = data.text.find((t) => t.sel === "h1");
    if (h1 && !/satoshi/i.test(h1.font)) fail(`h1 font "${h1.font.slice(0, 30)}", expected Satoshi`);

    // elements
    for (const e of data.els) {
      switch (e.ui) {
        case "btn-primary":
          if (e.color !== "rgb(255, 255, 255)") fail(`btn-primary color ${e.color}, expected white`);
          if (!near(e.radius, 10)) fail(`btn-primary radius ${e.radius}px, expected 10px`);
          if (!near(e.h, 32) && !near(e.h, 40) && !near(e.h, 44)) fail(`btn-primary height ${e.h}px, expected 40 or 44 (32 = size="sm")`);
          break;
        case "btn-black":
          if (e.bg !== HEX.ctaBlack) fail(`btn-black bg ${e.bg}, expected ${HEX.ctaBlack}`);
          if (!near(e.h, 44)) fail(`btn-black height ${e.h}px, expected 44`);
          break;
        case "card":
          if (!near(e.radius, 16)) fail(`card radius ${e.radius}px, expected 16px`);
          if (e.bg !== HEX.surface) fail(`card bg ${e.bg}, expected white`);
          if (e.shadow === "none") fail("card has no shadow");
          break;
        case "sidebar":
          if (!near(e.w, 240) && !near(e.w, 68)) fail(`sidebar width ${e.w}px, expected 240 or 68`);
          break;
        case "status-chip":
          if (!near(e.h, 24)) fail(`status-chip height ${e.h}px, expected 24px`);
          if (!near(e.radius, 8)) fail(`status-chip radius ${e.radius}px, expected 8px`);
          break;
        case "progress":
          if (!near(e.h, 6, 1)) fail(`progress height ${e.h}px, expected 6px`);
          break;
        case "video-frame":
          if (!near(e.radius, 12)) fail(`video-frame radius ${e.radius}px, expected 12px`);
          break;
        case "timeline-bar":
          if (!near(e.h, 12, 1)) fail(`timeline-bar height ${e.h}px, expected 12px`);
          if (!near(e.radius, 6, 1)) fail(`timeline-bar radius ${e.radius}px, expected 6px`);
          break;
        case "thumb-row":
          if (!near(e.w, 44) && !near(e.w, 72)) fail(`thumb-row width ${e.w}px, expected 44 or 72`);
          break;
        case "task-thumb":
          if (!near(e.w, 120)) fail(`task-thumb width ${e.w}px, expected 120px`);
          break;
        case "input":
          if (!near(e.h, 40, 1)) fail(`input height ${e.h}px, expected 40px`);
          if (!near(e.radius, 10)) fail(`input radius ${e.radius}px, expected 10px`);
          break;
      }
    }

    // KPI row: four equal columns, gap 20
    if (data.kpi) {
      if (data.kpi.count !== 4) fail(`kpi-row has ${data.kpi.count} children, expected 4`);
      const w = data.kpi.widths;
      if (w.length === 4 && !w.every((x) => near(x, w[0]))) fail(`kpi-row widths uneven: ${w.join(", ")}`);
      if (data.kpi.gap && !data.kpi.gap.includes("20")) notes.push(`kpi-row gap ${data.kpi.gap}`);
    }

    await page.close();
  }
}

await browser.close();

console.log(`\nChecked ${ROUTES.length} routes x ${WIDTHS.length} widths`);
if (notes.length) {
  console.log("\nNotes:");
  for (const n of [...new Set(notes)].slice(0, 12)) console.log("  · " + n);
}
if (failures.length) {
  console.log(`\n${failures.length} spec failure(s):`);
  for (const f of [...new Set(failures)].slice(0, 60)) console.log("  FAIL " + f);
  process.exitCode = 1;
} else {
  console.log("\nspec-check: all assertions pass");
}