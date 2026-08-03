import { chromium } from "@playwright/test";

const base = "http://localhost:6006/iframe.html?id=";

const captures = [
  {
    id: "gallery-dialog--interactive",
    path: "docs/audits/dialog-wave-b-closed-entry.png",
  },
  {
    id: "gallery-dialog--default",
    path: "docs/audits/dialog-wave-b-open-default.png",
  },
  {
    id: "gallery-dialog--with-footer",
    path: "docs/audits/dialog-wave-b-with-footer.png",
  },
  {
    id: "gallery-dialog--focus-trap",
    path: "docs/audits/dialog-wave-b-focus-trap.png",
  },
  {
    id: "gallery-dialog--escape-closes",
    path: "docs/audits/dialog-wave-b-escape-close.png",
  },
  {
    id: "gallery-dialog--backdrop-close-disabled",
    path: "docs/audits/dialog-wave-b-backdrop-locked.png",
  },
  {
    id: "gallery-dialog--small-viewport",
    path: "docs/audits/dialog-wave-b-small-viewport.png",
    viewport: { width: 390, height: 740 },
  },
];

async function capture(page, item) {
  if (item.viewport) {
    await page.setViewportSize(item.viewport);
  } else {
    await page.setViewportSize({ width: 1280, height: 900 });
  }

  await page.goto(`${base}${item.id}&viewMode=story`, { waitUntil: "networkidle" });

  if (item.id === "gallery-dialog--interactive") {
    await page.getByRole("button", { name: "Open Dialog" }).waitFor({ state: "visible" });
  } else {
    await page.getByRole("dialog").waitFor({ state: "visible" });
  }

  await page.waitForTimeout(120);

  await page.screenshot({ path: item.path, fullPage: true });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

for (const item of captures) {
  await capture(page, item);
  console.log(`Captured ${item.path}`);
}

await browser.close();
