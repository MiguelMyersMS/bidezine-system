// Captures Menu states for the Cycle 118 audit evidence (carry-in from
// the Cycle 117 REVIEW Open Question O4). The Menu component absorbed the
// full Select-menu enhancement set (density, search, groups, checkable,
// flip, scrollable) and adopted the two-layer scrollbar gutter contract
// shared with the sidebar and Select dropdown. These shots provide the
// visual evidence the Governor needs to verify that contract holds and
// that the sticky-search-header divider treatment renders correctly.
//
// Captured surfaces (each in light + dark):
//   - default: small action-menu open (3 items, no scroll, no search)
//   - long-list-scrollable: many items, conditional paddingRight scrollbar gutter
//   - with-search: sticky search header + edge-to-edge divider + list below
//   - with-groups: collapsible group headers
//   - checkable: menuitemcheckbox with check glyph slot
//   - compact-density / comfortable-density: density tier comparison
//   - flips-above: trigger near viewport bottom, menu anchors above
//   - with-icons: icon slot rendering

import { chromium } from "@playwright/test";

const STORYBOOK_BASE = "http://localhost:6006/iframe.html";

function urlFor(id, theme) {
  const params = new URLSearchParams({ id, viewMode: "story" });
  if (theme === "dark") params.set("globals", "theme:dark");
  return `${STORYBOOK_BASE}?${params.toString()}`;
}

async function openMenu(page) {
  // Trigger button is the first interactive in the story canvas. Click to
  // open; move the mouse off-canvas afterwards so highlight state doesn't
  // co-exist with the resting visual.
  const trigger = page.getByRole("button").first();
  await trigger.click();
  await page.waitForTimeout(220);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(120);
}

async function captureOpen(page, id, theme, slug) {
  await page.goto(urlFor(id, theme), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  await openMenu(page);
  const path = `docs/audits/menu-audit-${slug}-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  captured ${path}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const captures = [
  { id: "gallery-menu--default", slug: "default" },
  { id: "gallery-menu--long-list-scrollable", slug: "long-list-scrollable" },
  { id: "gallery-menu--with-search", slug: "with-search" },
  { id: "gallery-menu--search-auto", slug: "search-auto" },
  { id: "gallery-menu--with-groups", slug: "with-groups" },
  { id: "gallery-menu--checkable", slug: "checkable" },
  { id: "gallery-menu--compact", slug: "compact-density" },
  { id: "gallery-menu--comfortable", slug: "comfortable-density" },
  { id: "gallery-menu--with-icons", slug: "with-icons" },
  { id: "gallery-menu--flips-above", slug: "flips-above" },
  { id: "gallery-menu--with-description-and-shortcut", slug: "with-description-and-shortcut" },
];

for (const { id, slug } of captures) {
  for (const theme of ["light", "dark"]) {
    await captureOpen(page, id, theme, slug);
  }
}

await browser.close();
