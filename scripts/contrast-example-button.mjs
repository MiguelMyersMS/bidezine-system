// Compute the darkAtom-dark readable-content contrast for the button Example, bound to the PNG.
// Loads views/darkAtom-dark.png in chromium, samples the SELECTED "Emoji" pill: the pill fill = the
// dominant bright color, the foreground (label glyph + smiley) = the darkest pixels inside the pill box.
// Computes the WCAG 2.1 contrast ratio and writes docs/examples/button/contrast.json bound by pngSha256.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:"), "..");
const DIR = path.join(ROOT, "docs", "examples", "button");
const PNG = path.join(DIR, "views", "darkAtom-dark.png");

const buf = fs.readFileSync(PNG);
const pngSha256 = crypto.createHash("sha256").update(buf).digest("hex");
const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async (url) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
    const at = (x, y) => { const i = (y * width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    const lum255 = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // The selected pill is the bright (white) region on the RIGHT half of the card. Find the bounding
    // box of near-white pixels in the right 60% of the image.
    let minX = width, maxX = 0, minY = height, maxY = 0, whiteCount = 0;
    let wr = 0, wg = 0, wb = 0;
    for (let y = 0; y < height; y++) {
      for (let x = Math.floor(width * 0.4); x < width; x++) {
        const [r, g, b] = at(x, y);
        if (r > 210 && g > 210 && b > 210) {
          whiteCount++; wr += r; wg += g; wb += b;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const pillBg = [Math.round(wr / whiteCount), Math.round(wg / whiteCount), Math.round(wb / whiteCount)];
    // Foreground = the darkest pixels INSIDE the pill box (the smiley glyph + "Emoji" label).
    let darkest = [255, 255, 255], darkestLum = 255;
    const darkPixels = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const [r, g, b] = at(x, y);
        const L = lum255(r, g, b);
        if (L < 90) darkPixels.push([r, g, b, L]);
        if (L < darkestLum) { darkestLum = L; darkest = [r, g, b]; }
      }
    }
    // Use the median of the darkest cluster as the representative foreground (robust vs antialiasing).
    darkPixels.sort((a, b) => a[3] - b[3]);
    const rep = darkPixels.length ? darkPixels[Math.floor(darkPixels.length * 0.25)] : [...darkest, darkestLum];
    const fg = [rep[0], rep[1], rep[2]];

    const rl = (rgb) => {
      const s = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    };
    const L1 = rl(pillBg), L2 = rl(fg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { pillBg, fg, darkest, ratio: Math.round(ratio * 100) / 100, box: { minX, minY, maxX, maxY }, whiteCount, darkPixelCount: darkPixels.length };
  }, dataUrl);

  const out = {
    view: "darkAtom-dark",
    region: "selected 'Emoji' pill — foreground (label glyph + smiley) vs white pill fill",
    pillBackground: `rgb(${result.pillBg.join(", ")})`,
    foreground: `rgb(${result.fg.join(", ")})`,
    ratio: result.ratio,
    pngSha256,
    method: "sampled from darkAtom-dark.png: pill fill = dominant near-white cluster (right half); foreground = darkest-quartile pixels inside the pill box; WCAG 2.1 relative-luminance contrast",
  };
  fs.writeFileSync(path.join(DIR, "contrast.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
}
