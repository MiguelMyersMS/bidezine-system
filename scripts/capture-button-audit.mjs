// Captures Button variants in their resting + hover + pressed + focus-visible
// states for the Cycle 114 audit evidence (Findings 1a-1c).
//
// The "default" story renders 3 outline buttons (sm/md/lg) side-by-side, so
// the sizes-comparison capture doubles as the visual proof that Finding 1b
// (removed fontWeight: 500 hardcode) actually changed the rendered weight on
// the `sm` button.

import { chromium } from "@playwright/test";

const STORYBOOK_BASE = "http://localhost:6006/iframe.html";

function urlFor(id, theme) {
  const params = new URLSearchParams({ id, viewMode: "story" });
  if (theme === "dark") params.set("globals", "theme:dark");
  return `${STORYBOOK_BASE}?${params.toString()}`;
}

async function captureState(page, id, state, path) {
  await page.goto(urlFor(id, "light"), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);

  if (state === "resting") {
    // Move mouse far away to ensure no incidental hover
    await page.mouse.move(0, 0);
    await page.waitForTimeout(80);
  } else if (state === "hover") {
    // Hover the middle (md) button
    const buttons = page.getByRole("button");
    await buttons.nth(1).hover();
    await page.waitForTimeout(150);
  } else if (state === "pressed") {
    const buttons = page.getByRole("button");
    const box = await buttons.nth(1).boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(150);
    }
  } else if (state === "focus-visible") {
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
  }

  await page.screenshot({ path, fullPage: true });
  if (state === "pressed") {
    await page.mouse.up();
  }
  console.log(`  captured ${path}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Default story = outline variant in 3 sizes — the primary audit fixture.
// Captures the four interaction states for the same button surface.
for (const state of ["resting", "hover", "pressed", "focus-visible"]) {
  await captureState(
    page,
    "gallery-button--default",
    state,
    `docs/audits/button-audit-default-${state}-light.png`,
  );
}

// Dark theme — resting only (the other states would just confirm parity)
await page.goto(urlFor("gallery-button--default", "dark"), { waitUntil: "networkidle" });
await page.mouse.move(0, 0);
await page.waitForTimeout(150);
await page.screenshot({ path: "docs/audits/button-audit-default-dark.png", fullPage: true });
console.log("  captured docs/audits/button-audit-default-dark.png");

// Solid + ghost variant resting baselines (no regression check)
for (const id of ["gallery-button--solid", "gallery-button--ghost"]) {
  const slug = id.replace("gallery-button--", "");
  await page.goto(urlFor(id, "light"), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `docs/audits/button-audit-${slug}-light.png`, fullPage: true });
  console.log(`  captured docs/audits/button-audit-${slug}-light.png`);
}

// ─── Cycle 115 additions ──────────────────────────────────────────────
// StateMatrix story: 3 variants × 3 prop-achievable states. Captured in
// light + dark so the visual hierarchy is documented end-to-end.
for (const theme of ["light", "dark"]) {
  await page.goto(urlFor("gallery-button--state-matrix", theme), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  const path = `docs/audits/button-state-matrix-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  captured ${path}`);
}

// SolidPressedComparison entries removed in Cycle 117 — the story was a
// Cycle 115 decision artifact for Finding 1d and the user picked Option A,
// adding the accentPressed token. The committed PNGs under
// docs/audits/button-solid-pressed-comparison-* remain as historical
// reference for the decision but the script no longer regenerates them.

// Cycle 117 addition: solid variant pressed-state capture so the new
// accentPressed token has its own evidence shot. Drives mousedown on the
// middle (md) solid button — siblings stay at their resting/accent state
// for contrast.
for (const theme of ["light", "dark"]) {
  await page.goto(urlFor("gallery-button--solid", theme), { waitUntil: "networkidle" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  const buttons = page.getByRole("button");
  const box = await buttons.nth(1).boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150);
  }
  const path = `docs/audits/button-audit-solid-pressed-${theme}.png`;
  await page.screenshot({ path, fullPage: true });
  await page.mouse.up();
  console.log(`  captured ${path}`);
}

// ─── Cycle 116 additions ──────────────────────────────────────────────
// Selected (aria-pressed) stories — one per variant, light + dark each.
// SelectedSolid is included so reviewers can see that the DOM attribute
// is emitted but the visual is intentionally identical to non-toggle
// solid (visual deferred to Cycle 117 pending user direction on the
// solid-selected ambiguity).
for (const variant of ["outline", "ghost", "solid"]) {
  const storyId = `gallery-button--selected-${variant}`;
  for (const theme of ["light", "dark"]) {
    await page.goto(urlFor(storyId, theme), { waitUntil: "networkidle" });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    const path = `docs/audits/button-selected-${variant}-${theme}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`  captured ${path}`);
  }
}

await browser.close();
