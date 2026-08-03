import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? "http://localhost:6006";
const OUT_DIR = path.resolve("test-results", "dark-atoms-visual");
const REPORT_PATH = path.resolve("docs", "audits", "dark-atoms-visual-latest.md");

const TARGETS = [
  "atoms-divider",
  "atoms-clearbutton",
  "atoms-ellipsisbutton",
  "atoms-expandbutton",
  "atoms-chevroncarousel",
  "atoms-carouselmark",
  "atoms-navindentline",
  "atoms-selectionindicator",
  "atoms-chevrontrigger",
  "atoms-infoicon",
  "atoms-iconslot",
  "atoms-scrollbar",
  "atoms-badge",
  "atoms-tag",
];

const STORY_NAMES = ["example", "variants"];
const THEMES = ["light", "dark"];

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function storyUrl(id, storyName, theme, atomSurface) {
  return `${STORYBOOK_URL}/iframe.html?id=${id}--${storyName}&viewMode=story&globals=theme:${theme};atomSurface:${atomSurface}`;
}

async function loadAndShot(page, id, storyName, theme, atomSurface) {
  const url = storyUrl(id, storyName, theme, atomSurface);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#storybook-root", { timeout: 15000 });
  await page.waitForTimeout(450);

  const text = await page.textContent("body");
  if (text && text.includes("Couldn't find story matching")) {
    return { missing: true, url };
  }

  const png = await page.screenshot({ fullPage: true });
  const fileName = `${id}--${storyName}-${theme}-${atomSurface}.png`;
  const filePath = path.join(OUT_DIR, fileName);
  await writeFile(filePath, png);

  return {
    missing: false,
    url,
    filePath,
    hash: hashBuffer(png),
    size: png.length,
  };
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  const rows = [];
  let hardFails = 0;

  try {
    for (const id of TARGETS) {
      for (const storyName of STORY_NAMES) {
        const darkByTheme = {};
        for (const theme of THEMES) {
          console.log(`Checking ${id}--${storyName} (${theme})`);
          const atom = await loadAndShot(page, id, storyName, theme, "atom");
          const dark = await loadAndShot(page, id, storyName, theme, "darkAtom");

          if (atom.missing || dark.missing) {
            rows.push({
              id,
              storyName,
              theme,
              status: "SKIP",
              detail: "Story not found",
              atomPath: atom.url,
              darkPath: dark.url,
            });
            continue;
          }

          darkByTheme[theme] = dark;
          const changed = atom.hash !== dark.hash;
          if (!changed) {
            hardFails += 1;
          }

          rows.push({
            id,
            storyName,
            theme,
            status: changed ? "PASS" : "FAIL",
            detail: changed ? "Visual delta detected" : "No visual delta between Atom and Dark Atom",
            atomPath: path.relative(process.cwd(), atom.filePath).replaceAll("\\", "/"),
            darkPath: path.relative(process.cwd(), dark.filePath).replaceAll("\\", "/"),
          });
        }

        if (!darkByTheme.light || !darkByTheme.dark) {
          rows.push({
            id,
            storyName,
            theme: "cross-theme",
            status: "SKIP",
            detail: "DarkAtom comparison across themes unavailable",
            atomPath: "-",
            darkPath: "-",
          });
          continue;
        }

        const darkChangesByTheme = darkByTheme.light.hash !== darkByTheme.dark.hash;
        if (!darkChangesByTheme) {
          hardFails += 1;
        }

        rows.push({
          id,
          storyName,
          theme: "cross-theme",
          status: darkChangesByTheme ? "PASS" : "FAIL",
          detail: darkChangesByTheme
            ? "DarkAtom changes between Theme=light and Theme=dark"
            : "DarkAtom is identical in Theme=light and Theme=dark",
          atomPath: path.relative(process.cwd(), darkByTheme.light.filePath).replaceAll("\\", "/"),
          darkPath: path.relative(process.cwd(), darkByTheme.dark.filePath).replaceAll("\\", "/"),
        });
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const header = [
    "# Dark Atoms Visual Audit (Storybook)",
    "",
    `- Storybook URL: ${STORYBOOK_URL}`,
    "- Mode A: per-theme compare atomSurface=atom vs atomSurface=darkAtom",
    "- Mode B: compare darkAtom between Theme=light and Theme=dark",
    `- Result: ${hardFails === 0 ? "PASS" : "FAIL"}`,
    `- Hard fails: ${hardFails}`,
    "",
    "| Atom Story | Theme Scope | Status | Detail | Capture A | Capture B |",
    "|---|---|---|---|---|---|",
  ];

  const table = rows.map((r) => `| ${r.id}--${r.storyName} | ${r.theme} | ${r.status} | ${r.detail} | ${r.atomPath} | ${r.darkPath} |`);
  await writeFile(REPORT_PATH, [...header, ...table, ""].join("\n"), "utf8");

  if (hardFails > 0) {
    console.error(`Dark atoms visual audit failed: ${hardFails} story(s) had no Atom->DarkAtom delta.`);
    process.exit(1);
  }

  console.log("Dark atoms visual audit passed.");
}

run().catch((error) => {
  console.error("Failed to run dark atoms visual audit.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
