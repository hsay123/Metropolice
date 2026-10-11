/**
 * Contrast audit for the moodboard pass.
 *
 *   node scripts/contrast.mjs              # every route, 1440x900
 *   node scripts/contrast.mjs --only work  # routes whose name contains "work"
 *
 * AGENTS.md A3 asks that every text pair meet WCAG AA. This walks every visible
 * text node on a route, works out the effective background behind it, and reports
 * any pair below the threshold (4.5:1 normal text, 3:1 for large text). It is a
 * gate, not a screenshot: it exits non-zero when a pair fails.
 */
import pw from "@playwright/test";

const { chromium } = pw;

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const ONLY = arg("only", "");
/** [name, path, role] */
const ROUTES = [
  ["landing", "/", "buyer"],
  ["login", "/login", "buyer"],
  ["buyer", "/buyer", "buyer"],
  ["buyer-wizard", "/buyer/jobs/new", "buyer"],
  ["buyer-job-detail", "/buyer/jobs/job_pickplace", "buyer"],
  ["work-onboarding", "/work", "contributor"],
  ["work-qualify", "/work/qualify", "contributor"],
  ["work-tasks", "/work/tasks", "contributor"],
  ["workbench-image", "/work/tasks/task_01Ha2", "contributor"],
  ["workbench-video", "/work/tasks/task_01Hb7", "contributor"],
  ["earnings", "/work/earnings", "contributor"],
  ["review-queue", "/review", "reviewer"],
  ["review-image", "/review/sub_a2", "reviewer"],
  ["admin", "/admin", "admin"],
  ["receipt", "/receipts/rcpt_91", "buyer"],
  ["gallery", "/dev/components", "buyer"],
];

const browser = await chromium.launch();
const failures = [];

for (const [name, path, role] of ROUTES.filter(([n]) => n.includes(ONLY))) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript((r) => {
      window.localStorage.setItem("pdn-dev-role", JSON.stringify({ state: { role: r }, version: 0 }));
    }, role);
    await page.goto("http://localhost:3000" + path + "?clean=1", { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1200);

    const bad = await page.evaluate(() => {
      const parse = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(",").map((x) => parseFloat(x.trim()));
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      };
      const lin = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const over = (fg, bg) => ({
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
        a: 1,
      });
      const contrast = (a, b) => {
        const la = lum(a);
        const lb = lum(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };
      const describe = (el) =>
        el.tagName.toLowerCase() + (el.className && typeof el.className === "string"
          ? "." + el.className.split(/\s+/).slice(0, 3).join(".")
          : "");

      const out = [];
      const els = document.querySelectorAll("body *");
      for (const el of els) {
        // Only elements whose own text node is visible.
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim())
          .join(" ");
        if (!own) continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;

        const fg = parse(cs.color);
        if (!fg || fg.a === 0) continue;

        /*
         * Resolve the effective background. Walk outward collecting paint layers
         * (a solid colour, or the colour stops of a gradient such as the primary
         * button's sheen), then composite outermost-inward and test the text
         * against every candidate so a gradient never reports a false pass or fail.
         */
        const layers = [];
        let node = el;
        while (node) {
          const bcs = getComputedStyle(node);
          const bg = parse(bcs.backgroundColor);
          const bi = bcs.backgroundImage;
          const stops = [];
          if (bi && bi.includes("gradient")) {
            const re = /rgba?\([^)]+\)/g;
            let m;
            while ((m = re.exec(bi))) {
              const c = parse(m[0]);
              if (c) stops.push(c);
            }
          }
          if (bg && bg.a > 0) layers.push([bg]);
          if (stops.length) {
            layers.push(stops);
            break;
          }
          if (bg && bg.a === 1) break;
          node = node.parentElement;
        }
        let candidates = [{ r: 255, g: 255, b: 255, a: 1 }];
        for (let i = layers.length - 1; i >= 0; i -= 1) {
          const next = [];
          for (const acc of candidates) {
            for (const c of layers[i]) next.push(over(c, acc));
          }
          candidates = next;
        }

        let ratio = Infinity;
        for (const bg of candidates) ratio = Math.min(ratio, contrast(fg, bg));
        if (!Number.isFinite(ratio)) continue;

        const fontSize = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        if (ratio < need) {
          out.push({
            el: describe(el),
            text: own.slice(0, 40),
            color: cs.color,
            ratio: Math.round(ratio * 100) / 100,
            need,
            fontSize,
          });
        }
      }
      return out;
    });

    for (const b of bad) {
      failures.push(`${name} @${width}: ${b.ratio}:1 (need ${b.need}) ${b.color} ${b.fontSize}px — "${b.text}" [${b.el}]`);
    }
    await page.close();
  }
}

await browser.close();

const uniq = [...new Set(failures)];
if (uniq.length) {
  console.log(`\ncontrast: ${uniq.length} pairs below WCAG AA\n`);
  for (const f of uniq) console.log("  " + f);
  process.exitCode = 1;
} else {
  console.log("contrast: all text pairs meet WCAG AA");
}
