/* eslint-disable no-console -- this is a CLI; the audit report is its output. */
// Screenshot harness for the Compara Jogos Discourse theme.
//
// Captures each surface in both schemes plus mobile, and audits for layout
// defects that are hard to see but easy to measure — dangling separators, double
// borders, unrounded fills inside a rounded panel, horizontal overflow, and the
// sub-11px type that Discourse's em-based font scale produces when it compounds.
//
// Playwright is deliberately not a dependency of the theme — it downloads
// browsers on install, which would slow CI for a tool only used locally:
//
//   pnpm add -D playwright && pnpm exec playwright install chromium
//   THEME_BASE_URL=http://localhost:3000 node scripts/screenshots.mjs
//
// Logging in uses the local dev impersonation route, which requires the server
// to run with DISCOURSE_DEV_ALLOW_ANON_TO_IMPERSONATE=1.
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.THEME_BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SHOTS_DIR ?? new URL("../.shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const SURFACES = [
  { name: "latest", path: "/latest", ready: ".topic-list-item" },
  { name: "topic", path: "/t/welcome-to-discourse/5", ready: ".topic-post" },
  {
    name: "categories",
    path: "/categories",
    ready: ".category-list, .categories-list",
  },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1400, scheme: "dark" },
  { name: "desktop-light", width: 1440, height: 1400, scheme: "light" },
  { name: "mobile", width: 390, height: 1200, scheme: "dark" },
];

/* Defects that are hard to see but easy to measure. */
const AUDIT = () => {
  const problems = [];
  const seen = new Set();
  const note = (msg) => {
    if (!seen.has(msg)) {
      seen.add(msg);
      problems.push(msg);
    }
  };

  // A separator that does not span its container reads as a dangling line.
  document.querySelectorAll(".topic-list-item").forEach((row) => {
    const cs = getComputedStyle(row);
    const cell = row.querySelector("td");
    if (!cell) {
      return;
    }
    const cellCs = getComputedStyle(cell);
    const rowRect = row.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    if (
      cellCs.borderBottomWidth !== "0px" &&
      Math.abs(cellRect.width - rowRect.width) > 2
    ) {
      note(
        `separator on td is narrower than its row (${Math.round(cellRect.width)} vs ${Math.round(rowRect.width)})`
      );
    }
    if (cs.borderBottomWidth !== "0px" && cellCs.borderBottomWidth !== "0px") {
      note("double separator: both the row and its cell draw a bottom border");
    }
  });

  // A hovered row inside a rounded panel must not square off its corners. The
  // resting row has no fill, so this has to inspect the corner *cells* — that is
  // where the radius has to live for hover to follow the curve.
  const list = document.querySelector(".topic-list");
  if (list) {
    const listR = parseFloat(getComputedStyle(list).borderTopLeftRadius);
    const body = list.querySelector(".topic-list-body");
    const rows = list.querySelectorAll("tr");
    const corners = [
      ["top-left", rows[0]?.firstElementChild, "borderTopLeftRadius"],
      ["top-right", rows[0]?.lastElementChild, "borderTopRightRadius"],
      [
        "bottom-left",
        body?.lastElementChild?.firstElementChild,
        "borderBottomLeftRadius",
      ],
      [
        "bottom-right",
        body?.lastElementChild?.lastElementChild,
        "borderBottomRightRadius",
      ],
    ];
    for (const [label, cell, prop] of corners) {
      if (!cell || listR <= 2) {
        continue;
      }
      const r = parseFloat(getComputedStyle(cell)[prop]) || 0;
      if (r < listR - 1) {
        note(
          `${label} cell has ${r}px radius inside a ${listR}px panel — a hovered row will square the corner`
        );
      }
    }
  }

  // Anything overflowing the viewport horizontally.
  document.querySelectorAll("body *").forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width > 40 && r.right > window.innerWidth + 1) {
      note(
        `overflows viewport: ${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]} right=${Math.round(r.right)}`
      );
    }
  });

  // Font sizes below 11px are almost always an em-compounding accident. Report
  // the ancestor that actually set the size, not the leaf that inherited it —
  // overriding the leaf is the obvious fix and the wrong one.
  document.querySelectorAll("body *").forEach((e) => {
    if (!e.textContent?.trim() || e.children.length) {
      return;
    }
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (!fs || fs >= 11) {
      return;
    }
    let culprit = e;
    while (
      culprit.parentElement &&
      culprit.parentElement.tagName !== "BODY" &&
      getComputedStyle(culprit.parentElement).fontSize ===
        getComputedStyle(culprit).fontSize
    ) {
      culprit = culprit.parentElement;
    }
    const name = (el) =>
      `${el.tagName.toLowerCase()}.${(el.className || "").toString().trim().split(/\s+/)[0]}`;
    note(
      `tiny type ${fs.toFixed(1)}px on ${name(e)} — set by ${name(culprit)}`
    );
  });

  return problems;
};

const browser = await chromium.launch();
const report = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    colorScheme: vp.scheme,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/session/renato/become`, {
    waitUntil: "domcontentloaded",
  });

  for (const s of SURFACES) {
    /* Discourse long-polls MessageBus, so networkidle never fires. Wait for the
     * surface's own content instead. */
    await page.goto(BASE + s.path, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(s.ready, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(900);
    const file = `${OUT}${s.name}-${vp.name}.png`;
    await page.screenshot({ path: file, fullPage: false });

    const problems = await page.evaluate(AUDIT);
    if (problems.length) {
      report.push(`\n## ${s.name} @ ${vp.name}`);
      report.push(...problems.map((p) => `  - ${p}`));
    }

    // Hover the second row and capture, so hover defects are visible too.
    if (s.name === "latest") {
      const row = page.locator(".topic-list-item").nth(1);
      if (await row.count()) {
        await row.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${OUT}${s.name}-${vp.name}-hover.png` });
      }
    }
  }
  await ctx.close();
}

await browser.close();
const text = report.length ? report.join("\n") : "no measured defects";
writeFileSync(`${OUT}audit.txt`, text);
console.log(text);
