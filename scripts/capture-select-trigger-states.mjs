// Captures the four Select-trigger states in light + dark themes so
// reviewers can see resting / hover / focus-visible / open side-by-side.

import { chromium } from "@playwright/test";

const STORYBOOK_BASE = "http://localhost:6006/iframe.html";
const STORY_ID = "gallery-select-single-select--default";
const TEXTINPUT_STORY_ID = "gallery-textinput--default";

function urlFor(theme, id = STORY_ID) {
  const params = new URLSearchParams({ id, viewMode: "story" });
  if (theme === "dark") params.set("globals", "theme:dark");
  return `${STORYBOOK_BASE}?${params.toString()}`;
}

async function captureState(page, theme, state) {
  await page.goto(urlFor(theme), { waitUntil: "networkidle" });
  // Move mouse off-canvas to start cleanly
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);

  const trigger = page.getByRole("combobox").first();

  if (state === "resting") {
    // Click body to discard any incidental focus, then move mouse far away
    await page.mouse.click(10, 10);
    await page.waitForTimeout(100);
  } else if (state === "hover") {
    await trigger.hover();
    await page.waitForTimeout(120);
  } else if (state === "focus-visible") {
    // Keyboard focus — tab through until the combobox is focused. The first
    // tabbable in the label area is the title-menu "..." ellipsis, so we
    // press Tab twice to land on the combobox trigger.
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
  } else if (state === "open") {
    await trigger.click();
    await page.waitForTimeout(200);
    // Move mouse away so hover state doesn't co-exist
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
  }

  const path = `docs/audits/select-trigger-state-${state}-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  captured ${path}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const theme of ["light", "dark"]) {
  for (const state of ["resting", "hover", "focus-visible", "open"]) {
    await captureState(page, theme, state);
  }
}

// TextInput focused reference — for visual comparison with the new Select open
// state. Tab once from a blank document lands on the input.
for (const theme of ["light", "dark"]) {
  await page.goto(urlFor(theme, TEXTINPUT_STORY_ID), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  const path = `docs/audits/select-trigger-state-textinput-focus-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  captured ${path}`);
}

await browser.close();
