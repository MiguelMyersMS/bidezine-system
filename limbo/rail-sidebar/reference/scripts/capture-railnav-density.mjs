import { chromium } from "@playwright/test";

const STORYBOOK_BASE = "http://localhost:6006/iframe.html";

const captures = [
  { id: "gallery-railnav--flat-navigation",  path: "docs/audits/railnav-density-flat-light.png",  theme: "light" },
  { id: "gallery-railnav--flat-navigation",  path: "docs/audits/railnav-density-flat-dark.png",   theme: "dark"  },
  { id: "gallery-railnav--one-level-nesting", path: "docs/audits/railnav-density-nested-light.png", theme: "light" },
  { id: "gallery-railnav--one-level-nesting", path: "docs/audits/railnav-density-nested-dark.png",  theme: "dark"  },
  { id: "gallery-railnav--max-depth-nesting", path: "docs/audits/railnav-density-deepnest-light.png", theme: "light" },
  { id: "gallery-railnav--max-depth-nesting", path: "docs/audits/railnav-density-deepnest-dark.png",  theme: "dark"  },
  { id: "gallery-railnav--long-panel-scroll", path: "docs/audits/railnav-density-longlist-light.png", theme: "light" },
  { id: "gallery-railnav--long-panel-scroll", path: "docs/audits/railnav-density-longlist-dark.png",  theme: "dark"  },
];

function urlFor(item) {
  const params = new URLSearchParams({ id: item.id, viewMode: "story" });
  if (item.theme === "dark") params.set("globals", "theme:dark");
  return `${STORYBOOK_BASE}?${params.toString()}`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const item of captures) {
  await page.goto(urlFor(item), { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: item.path, fullPage: true });
  console.log(`  captured ${item.path} (${item.theme})`);
}

await browser.close();
