// Reports the rendered pixel height of every nav-item button in the Max Depth
// Nesting story so we can confirm (or refute) a height drift between depths.

import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(
  "http://localhost:6006/iframe.html?id=gallery-railnav--max-depth-nesting&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(200);

const rows = await page.evaluate(() => {
  const panel = document.querySelector('nav[aria-label$="items"]');
  if (!panel) return null;
  const buttons = Array.from(panel.querySelectorAll("button"));
  return buttons.map((b) => {
    const rect = b.getBoundingClientRect();
    return {
      label: (b.textContent ?? "").trim().slice(0, 40),
      height: Math.round(rect.height),
      depthPad: Number.parseFloat(getComputedStyle(b).paddingLeft),
      ariaExpanded: b.getAttribute("aria-expanded"),
    };
  });
});

console.log("label,height,paddingLeft,aria-expanded");
for (const r of rows ?? []) {
  console.log(`${r.label},${r.height},${r.depthPad},${r.ariaExpanded ?? ""}`);
}

await browser.close();
