/**
 * Screenshot harness for the redesign pass.
 *
 *   node scripts/shots.mjs                     # every route, 1440x900
 *   node scripts/shots.mjs --w 1280 --h 800    # one viewport
 *   node scripts/shots.mjs --clean             # hide the demo dock
 *
 * Roles are set through the same store the demo uses (`pdn-dev-role`) before each
 * navigation, so every role's screens are captured with the right permissions.
 */
import pw from "@playwright/test";
import { mkdirSync } from "node:fs";

const { chromium } = pw;

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const W = Number(arg("w", 1440));
const H = Number(arg("h", 900));
const CLEAN = argv.includes("--clean");
const ONLY = arg("only", "");
const OUT = arg("out", ".shots");

/** [name, path, role, p0] */
const ROUTES = [
  ["landing", "/", "buyer", true],
  ["login", "/login", "buyer", true],
  ["buyer", "/buyer", "buyer", true],
  ["buyer-wizard", "/buyer/jobs/new", "buyer", true],
  ["buyer-job-detail", "/buyer/jobs/job_pickplace", "buyer", true],
  ["work-onboarding", "/work", "contributor", true],
  ["work-qualify", "/work/qualify", "contributor", true],
  ["work-tasks", "/work/tasks", "contributor", true],
  ["workbench-image", "/work/tasks/task_01Ha2", "contributor", true],
  ["workbench-video", "/work/tasks/task_01Hb7", "contributor", false],
  ["earnings", "/work/earnings", "contributor", true],
  ["review-queue", "/review", "reviewer", false],
  ["review-image", "/review/sub_a2", "reviewer", true],
  ["review-video", "/review/sub_vid2", "reviewer", false],
  ["admin", "/admin", "admin", false],
  ["receipt", "/receipts/rcpt_91", "buyer", true],
  ["not-found", "/does-not-exist", "buyer", false],
  ["gallery", "/dev/components", "buyer", false],
];

const slug = (path) =>
  path === "/" ? "root" : path.replace(/^\//, "").replace(/\//g, "-").replace(/\?.*/, "");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});

const problems = [];

for (const [name, path, role] of ROUTES) {
  if (ONLY && !name.includes(ONLY)) continue;

  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404")) problems.push(`${name}: ${m.text().slice(0, 140)}`);
  });
  page.on("pageerror", (e) => problems.push(`${name}: ${e.message.slice(0, 140)}`));

  await page.addInitScript(
    ([r, clean]) => {
      window.localStorage.setItem("pdn-dev-role", JSON.stringify({ state: { role: r }, version: 0 }));
      if (clean) {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("clean")) url.searchParams.set("clean", "1");
        window.history.replaceState({}, "", url);
      }
    },
    [role, CLEAN],
  );

  const url = "http://localhost:3000" + path + (CLEAN ? "?clean=1" : "");
  await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1800);

  const target = `${OUT}/${name}-${slug(path)}-${W}x${H}.png`;
  await page.screenshot({ path: target, fullPage: false });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 2) problems.push(`${name}: horizontal overflow +${overflow}px`);

  console.log(`${name.padEnd(18)} ${String(path).padEnd(30)} -> ${target}`);
  await page.close();
}

await browser.close();

if (problems.length) {
  console.log("\n--- problems ---");
  for (const p of problems) console.log(p);
  process.exitCode = 1;
} else {
  console.log("\nNo console errors and no horizontal overflow.");
}