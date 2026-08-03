#!/usr/bin/env node
/**
 * audit-export-parity — every gallery component must be reachable from the package root.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/index.ts` is the package barrel, and `src/umd-entry.ts` does `export * from "./index"` — so the
 * browser bundle's `window.DS` surface IS this barrel. For a long time the gallery re-export was two
 * hand-maintained name lists, and they drifted twice:
 *
 *   - CD1.2 — the rail sub-atoms (RailButton / RailButtonDark / LogoSlot / LogoSlotDark) were missing,
 *     so a browser-only consumer could not consume them and re-authored them instead (fork then drift).
 *   - DS-2  — after CD1.2 was "fixed" by appending the two missing names, the list drifted again to 46
 *     of 103 components, leaving PageHeaderTitle, InfoPill and the whole calendar sub-family unreachable.
 *
 * Appending names treats the symptom. The invariant is what matters: anything exported from
 * `src/gallery/index.ts` must be reachable from `src/index.ts`. `export * from "./gallery"` satisfies it
 * structurally; this audit is the mechanical proof that it still does, so a future edit that reintroduces
 * a hand-listed subset fails CI instead of silently shrinking `window.DS`.
 *
 * Exit 0 = parity holds. Exit 1 = a gallery export is unreachable from the root barrel.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GALLERY = path.join(ROOT, "src", "gallery", "index.ts");
const BARREL = path.join(ROOT, "src", "index.ts");

/** Names exported by src/gallery/index.ts (values + types). */
function galleryExports(src) {
  const names = new Set();
  // `export { default as Foo } from "./Foo";`
  for (const m of src.matchAll(/export\s*\{\s*default\s+as\s+(\w+)/g)) names.add(m[1]);
  // `export { A, B } from "./x";` and `export type { AProps } from "./x";`
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from/g)) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop();
      if (name && name !== "default") names.add(name.trim());
    }
  }
  return names;
}

/** True when src/index.ts re-exports the whole gallery barrel via a wildcard. */
function hasWildcard(src) {
  return /^\s*export\s+\*\s+from\s+["']\.\/gallery["'];/m.test(src);
}

/** Names src/index.ts re-exports from "./gallery" by hand. */
function barrelNamedGalleryExports(src) {
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']\.\/gallery["']/g)) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop();
      if (name) names.add(name.trim());
    }
  }
  return names;
}

for (const f of [GALLERY, BARREL]) {
  if (!fs.existsSync(f)) {
    console.error(`[audit:export-parity] FAIL — missing ${path.relative(ROOT, f)}`);
    process.exit(1);
  }
}

const gallerySrc = fs.readFileSync(GALLERY, "utf-8");
const barrelSrc = fs.readFileSync(BARREL, "utf-8");
const expected = galleryExports(gallerySrc);

if (hasWildcard(barrelSrc)) {
  console.log(
    `[audit:export-parity] PASS — src/index.ts re-exports the gallery barrel via \`export *\` ` +
      `(${expected.size} gallery export(s) reachable, incl. window.DS via src/umd-entry.ts).`
  );
  process.exit(0);
}

// No wildcard: the barrel is back to a hand-listed subset. Prove completeness name-by-name.
const listed = barrelNamedGalleryExports(barrelSrc);
const missing = [...expected].filter((n) => !listed.has(n)).sort();

if (missing.length === 0) {
  console.log(
    `[audit:export-parity] PASS — all ${expected.size} gallery export(s) are listed in src/index.ts. ` +
      `NOTE: this is a hand-maintained list; prefer \`export * from "./gallery"\` (see CD1.2 / DS-2).`
  );
  process.exit(0);
}

console.error(
  `[audit:export-parity] FAIL — ${missing.length} of ${expected.size} gallery export(s) are NOT ` +
    `reachable from src/index.ts, so they are also missing from the UMD bundle's window.DS:\n`
);
for (const n of missing) console.error(`  MISSING  ${n}`);
console.error(
  `\nFIX: replace the hand-maintained gallery re-export in src/index.ts with:\n` +
    `\n    export * from "./gallery";\n` +
    `\nThat is the root-cause fix — a hand-listed subset has silently drifted twice (CD1.2, DS-2).\n`
);
process.exit(1);
