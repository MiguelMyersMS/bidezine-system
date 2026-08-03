import { chromium } from "@playwright/test";

// Capture target list for the disabled-tokens visual evidence pass
// (Cycle 104 → Cycle 107 in sync/REVIEW.md). The legacy single-file
// Storybook layout (gallery-select--*) was split into post-Cycle-103
// Single Select / Multi-Select files; the IDs below reflect that split.
//
// Story IDs:
//   gallery-select-single-select--<story>
//   gallery-select-multi-select--<story>
//   foundations-status--<story>
//
// Theme switching uses Storybook globals:
//   ?globals=theme:dark  (handled by .storybook/preview.tsx withTheme decorator)

const STORYBOOK_BASE = "http://localhost:6006/iframe.html";
const outputSuffix = process.env.SELECT_CAPTURE_SUFFIX?.trim() ?? "";

function resolveOutputPath(filePath) {
  if (!outputSuffix) {
    return filePath;
  }
  return filePath.replace(/\.png$/i, `${outputSuffix}.png`);
}

function urlFor(item) {
  const params = new URLSearchParams({ id: item.id, viewMode: "story" });
  if (item.theme === "dark") {
    params.set("globals", "theme:dark");
  }
  return `${STORYBOOK_BASE}?${params.toString()}`;
}

const captures = [
  // ── Foundations / Status / Disabled State (light + dark) ──
  {
    id: "foundations-status--disabled-state",
    path: "docs/audits/disabled-tokens-status-foundation-light.png",
    theme: "light",
  },
  {
    id: "foundations-status--disabled-state",
    path: "docs/audits/disabled-tokens-status-foundation-dark.png",
    theme: "dark",
  },

  // ── Single Select baseline (light + dark) ──
  {
    id: "gallery-select-single-select--default",
    path: "docs/audits/disabled-tokens-single-default-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-single-select--default",
    path: "docs/audits/disabled-tokens-single-default-open-light.png",
    theme: "light",
    openMenu: true,
  },
  {
    id: "gallery-select-single-select--default",
    path: "docs/audits/disabled-tokens-single-default-open-dark.png",
    theme: "dark",
    openMenu: true,
  },
  {
    id: "gallery-select-single-select--disabled",
    path: "docs/audits/disabled-tokens-single-disabled-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-single-select--disabled",
    path: "docs/audits/disabled-tokens-single-disabled-dark.png",
    theme: "dark",
  },

  // ── Single Select DisabledStates grid (light + dark) ──
  {
    id: "gallery-select-single-select--disabled-states",
    path: "docs/audits/disabled-tokens-single-states-grid-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-single-select--disabled-states",
    path: "docs/audits/disabled-tokens-single-states-grid-dark.png",
    theme: "dark",
  },

  // ── Multi-Select baseline (light + dark) ──
  {
    id: "gallery-select-multi-select--default",
    path: "docs/audits/disabled-tokens-multi-default-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-multi-select--default",
    path: "docs/audits/disabled-tokens-multi-default-open-light.png",
    theme: "light",
    openMenu: true,
  },
  {
    id: "gallery-select-multi-select--default",
    path: "docs/audits/disabled-tokens-multi-default-open-dark.png",
    theme: "dark",
    openMenu: true,
  },
  {
    id: "gallery-select-multi-select--disabled",
    path: "docs/audits/disabled-tokens-multi-disabled-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-multi-select--disabled",
    path: "docs/audits/disabled-tokens-multi-disabled-dark.png",
    theme: "dark",
  },

  // ── Multi-Select DisabledStates grid (light + dark) ──
  {
    id: "gallery-select-multi-select--disabled-states",
    path: "docs/audits/disabled-tokens-multi-states-grid-light.png",
    theme: "light",
  },
  {
    id: "gallery-select-multi-select--disabled-states",
    path: "docs/audits/disabled-tokens-multi-states-grid-dark.png",
    theme: "dark",
  },

  // ── IconButton baseline + disabled (light + dark) ──
  {
    id: "gallery-iconbutton--default",
    path: "docs/audits/disabled-tokens-iconbutton-default-light.png",
    theme: "light",
  },
  {
    id: "gallery-iconbutton--default",
    path: "docs/audits/disabled-tokens-iconbutton-default-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-iconbutton--disabled",
    path: "docs/audits/disabled-tokens-iconbutton-disabled-light.png",
    theme: "light",
  },
  {
    id: "gallery-iconbutton--disabled",
    path: "docs/audits/disabled-tokens-iconbutton-disabled-dark.png",
    theme: "dark",
  },

  // ── TextInput baseline + disabled + read-only (light + dark) ──
  // Read-only is intentionally captured so reviewers can confirm the disabled
  // (textDisabled) vs read-only (textMuted) split applied in Cycle 109.
  {
    id: "gallery-textinput--default",
    path: "docs/audits/disabled-tokens-textinput-default-light.png",
    theme: "light",
  },
  {
    id: "gallery-textinput--default",
    path: "docs/audits/disabled-tokens-textinput-default-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-textinput--disabled",
    path: "docs/audits/disabled-tokens-textinput-disabled-light.png",
    theme: "light",
  },
  {
    id: "gallery-textinput--disabled",
    path: "docs/audits/disabled-tokens-textinput-disabled-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-textinput--read-only",
    path: "docs/audits/disabled-tokens-textinput-readonly-light.png",
    theme: "light",
  },
  {
    id: "gallery-textinput--read-only",
    path: "docs/audits/disabled-tokens-textinput-readonly-dark.png",
    theme: "dark",
  },

  // ── Button baseline + disabled-per-variant (light + dark) ──
  // Three variants (solid, outline, ghost) all swapped textSubtle → textDisabled
  // in Cycle 110; each disabled variant gets its own evidence capture.
  {
    id: "gallery-button--default",
    path: "docs/audits/disabled-tokens-button-default-light.png",
    theme: "light",
  },
  {
    id: "gallery-button--default",
    path: "docs/audits/disabled-tokens-button-default-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-button--disabled-solid",
    path: "docs/audits/disabled-tokens-button-disabled-solid-light.png",
    theme: "light",
  },
  {
    id: "gallery-button--disabled-solid",
    path: "docs/audits/disabled-tokens-button-disabled-solid-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-button--disabled-default",
    path: "docs/audits/disabled-tokens-button-disabled-outline-light.png",
    theme: "light",
  },
  {
    id: "gallery-button--disabled-default",
    path: "docs/audits/disabled-tokens-button-disabled-outline-dark.png",
    theme: "dark",
  },
  {
    id: "gallery-button--disabled-ghost",
    path: "docs/audits/disabled-tokens-button-disabled-ghost-light.png",
    theme: "light",
  },
  {
    id: "gallery-button--disabled-ghost",
    path: "docs/audits/disabled-tokens-button-disabled-ghost-dark.png",
    theme: "dark",
  },

  // ── Overlay flip-above gap regression (LAY.OVERLAY-FLIP-GAP, Cycle 113) ──
  // The Viewport Edge Overlay story places the trigger near the viewport
  // bottom so both the main dropdown and the title-menu MUST flip above.
  // After the bottom-anchored positioning fix, the menu bottom should sit
  // within SPACE[1] (4px) of the trigger top with no visible gap.
  {
    id: "gallery-select-single-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-single-dropdown-light.png",
    theme: "light",
    openMenu: true,
  },
  {
    id: "gallery-select-single-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-single-dropdown-dark.png",
    theme: "dark",
    openMenu: true,
  },
  {
    id: "gallery-select-multi-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-multi-dropdown-light.png",
    theme: "light",
    openMenu: true,
  },
  {
    id: "gallery-select-multi-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-multi-dropdown-dark.png",
    theme: "dark",
    openMenu: true,
  },
  {
    id: "gallery-select-single-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-single-title-menu-light.png",
    theme: "light",
    openTitleMenu: true,
  },
  {
    id: "gallery-select-single-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-single-title-menu-dark.png",
    theme: "dark",
    openTitleMenu: true,
  },
  {
    id: "gallery-select-multi-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-multi-title-menu-light.png",
    theme: "light",
    openTitleMenu: true,
  },
  {
    id: "gallery-select-multi-select--viewport-edge-overlay",
    path: "docs/audits/dropdown-flip-above-multi-title-menu-dark.png",
    theme: "dark",
    openTitleMenu: true,
  },
];

async function capture(page, item) {
  await page.goto(urlFor(item), { waitUntil: "networkidle" });

  if (item.openMenu) {
    // DisabledStates grid stories render multiple comboboxes; use .first()
    // so the trigger click is unambiguous regardless of story shape.
    await page.getByRole("combobox").first().click();
    await page.waitForTimeout(150);
  }

  if (item.openTitleMenu) {
    // The title-menu trigger uses an accessible name like
    // "Open multi-select actions" / "Open single-select actions".
    await page
      .getByRole("button", { name: /Open .* actions/ })
      .first()
      .click();
    await page.waitForTimeout(150);
  }

  if (item.highlightText) {
    await page.getByRole("option", { name: item.highlightText }).hover();
    await page.waitForTimeout(120);
  }

  await page.screenshot({ path: resolveOutputPath(item.path), fullPage: true });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const captureFilter = process.env.SELECT_CAPTURE_FILTER?.trim().toLowerCase();
const selectedCaptures = captureFilter
  ? captures.filter((item) => item.id.toLowerCase().includes(captureFilter) || item.path.toLowerCase().includes(captureFilter))
  : captures;

for (const item of selectedCaptures) {
  try {
    await capture(page, item);
    console.log(`  captured ${item.path} (${item.theme ?? "light"})`);
  } catch (err) {
    console.error(`  FAILED ${item.path}: ${err.message}`);
  }
}

await browser.close();
console.log(`Captured ${selectedCaptures.length} disabled-tokens evidence artifacts.`);
