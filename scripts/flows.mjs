/**
 * End-to-end flow checks for the demo path.
 *
 *   node scripts/flows.mjs
 *
 * Walks the flows the four-minute demo depends on: role sign-in, buyer jobs
 * table, task claim into the workbench, a review decision, payout claim and the
 * public receipt. Asserts on visible text and state, and fails on console errors.
 */
import pw from "@playwright/test";

const { chromium } = pw;
const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function open(path, role, width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.__errs = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("404")) page.__errs.push(t.slice(0, 140));
  });
  page.on("pageerror", (e) => page.__errs.push("pageerror: " + e.message.slice(0, 140)));
  await page.addInitScript((r) => {
    window.localStorage.setItem("pdn-dev-role", JSON.stringify({ state: { role: r }, version: 0 }));
  }, role);
  await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(2200);
  return page;
}

/* ---------------------------------------------------------------- 1. sign-in */
{
  const page = await open("/login", "buyer");
  const choices = await page.getByRole("button", { name: /Buyer|Contributor|Reviewer|Admin/ }).count();
  check("sign-in lists four roles", choices >= 4, `count=${choices}`);
  await page.getByRole("button", { name: /Reviewer/ }).click();
  await page.waitForTimeout(1200);
  check("choosing a role routes to its home", page.url().endsWith("/review"), page.url());
  check("sign-in had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

/* ------------------------------------------------------------------ 2. shell */
{
  const page = await open("/buyer", "buyer");
  const sidebar = await page.locator("aside").count();
  check("app shell renders the sidebar", sidebar === 1, `aside count=${sidebar}`);
  const width = await page.locator("#main").evaluate((el) => el.getBoundingClientRect().width);
  check("content column is capped at 1200", width <= 1200, `main width=${Math.round(width)}`);

  const collapse = page.getByRole("button", { name: /Collapse sidebar/ });
  await collapse.click();
  await page.waitForTimeout(300);
  const railW = await page.locator("aside").evaluate((el) => el.getBoundingClientRect().width);
  check("sidebar collapses to the icon rail", Math.round(railW) < 100, `rail width=${Math.round(railW)}`);
  await page.close();
}

/* ----------------------------------------------------------- 3. buyer table */
{
  const page = await open("/buyer", "buyer");
  const rows = await page.locator("table tbody tr").count();
  check("jobs table renders", rows >= 1, `rows=${rows}`);

  await page.getByLabel("Search jobs by name or id").fill("penwriting");
  await page.waitForTimeout(300);
  const filtered = await page.locator("table tbody tr").count();
  check("search narrows the jobs table", filtered === 1, `rows=${filtered}`);

  await page.getByRole("button", { name: "Clear" }).click();
  await page.waitForTimeout(200);
  const restored = await page.locator("table tbody tr").count();
  check("clearing restores the jobs table", restored === rows, `rows=${restored}`);

  await page.getByRole("button", { name: "Job" }).click();
  await page.waitForTimeout(200);
  const sorted = await page.locator("th[aria-sort]").count();
  check("column sorting is wired", sorted >= 5, `sortable headers=${sorted}`);

  const pipeline = await page.getByText("Submitted", { exact: true }).count();
  check("buyer overview leads with the pipeline", pipeline > 0);
  check("buyer had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

/* ------------------------------------------------------------ 4. claim task */
{
  const page = await open("/work/tasks", "contributor");
  const claim = page.getByRole("button", { name: /Claim task/ }).first();
  const present = await claim.count();
  check("task queue offers Claim task", present > 0);
  if (present) {
    await claim.click();
    await page.waitForTimeout(2600);
    check("claiming routes into the workbench", /\/work\/tasks\/[^/]+$/.test(page.url()), page.url());
    // A shell left over from a client-side transition can linger at zero size, so
    // assert on what is actually painted, not on node count.
    const visibleSidebars = await page.evaluate(
      () =>
        [...document.querySelectorAll("aside")].filter((el) => el.getBoundingClientRect().width > 0)
          .length,
    );
    const mainWidth = await page.evaluate(() => {
      const el = document.querySelector("#workbench");
      return el ? Math.round(el.getBoundingClientRect().width) : -1;
    });
    check(
      "workbench is full-bleed with no sidebar (focus mode)",
      visibleSidebars === 0 && mainWidth >= 1440,
      `visible sidebars=${visibleSidebars} workbench width=${mainWidth}`,
    );
  }
  check("claim flow had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

/* ---------------------------------------------------- 5. review a submission */
{
  const page = await open("/review/sub_b7", "reviewer");
  const accept = page.getByRole("button", { name: /^Accept/ }).first();
  const present = await accept.count();
  check("review console offers a decision", present > 0);
  if (present) {
    const reason = page.getByRole("combobox").first();
    if (await reason.count()) await reason.click();
    await page.waitForTimeout(300);
    const opts = page.getByRole("option");
    if (await opts.count()) await opts.first().click();
    await page.waitForTimeout(300);
    await accept.click();
    await page.waitForTimeout(2600);
    const decided = await page.getByText(/accepted/i).count();
    check("decision resolves and returns to the queue", decided > 0 || page.url().endsWith("/review"), page.url());
  }
  check("review flow had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

/* -------------------------------------------------- 6. payout and receipt */
{
  const page = await open("/work/earnings", "contributor");
  const note = await page.getByText(/test tokens with no real value/i).count();
  check("earnings states rewards have no real value", note > 0, `count=${note}`);

  const claim = page.getByRole("button", { name: /Claim reward/ }).first();
  if (await claim.count()) {
    await claim.click();
    await page.waitForTimeout(3200);
    const paid = await page.getByText("Paid", { exact: true }).count();
    check("claiming a reward reaches Paid", paid > 0, `paid badges=${paid}`);
  } else {
    check("claiming a reward reaches Paid", false, "no Claim reward button");
  }
  check("earnings had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

{
  const page = await open("/receipts/rcpt_91", "buyer");
  const heading = await page.getByRole("heading", { name: /Receipt/i }).count();
  check("public receipt renders", heading > 0);
  const honest = await page.getByText(/mock receipt/i).count();
  check("mock receipt is labelled as mock", honest > 0, `count=${honest}`);
  check("receipt had no console errors", page.__errs.length === 0, page.__errs[0] || "");
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length} checks, ${failed.length} failed`);
if (failed.length) {
  for (const f of failed) console.log(`  FAIL ${f.name} ${f.detail}`);
  process.exitCode = 1;
}