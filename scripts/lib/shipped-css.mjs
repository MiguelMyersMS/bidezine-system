// ═══════════════════════════════════════════════════════════════════════════════════
// Load dist/system.css for a check — and refuse to confuse "the build has not run" with
// "an assertion failed". Shared by scripts/check-shipped-tokens.mjs and
// scripts/check-type-slots.mjs, the two checks that read the built stylesheet.
//
// ── The race this closes (Issue 07k, finding THREE) ────────────────────────────────
// Both readers ship as `npm run build && node scripts/…`, so each embeds its own
// `vite build`. Vite empties `dist/` at the start of every build (emptyOutDir defaults
// to true when outDir is inside root, which `dist` is). Run the two checks concurrently
// and the two builds share one output directory: build A finishes and its reader starts,
// while build B empties dist and rewrites `system.css` underneath it. The reader then
// observes one of two NON-assertion states —
//
//   • the file is briefly absent   (B emptied dist, has not written yet), or
//   • the file exists but is empty / partial   (B created it, has not filled it yet).
//
// The absent case an ENOENT guard already caught. The present-but-empty case it did NOT:
// `stat` succeeded, `readFile` returned "" , and every downstream slot check then failed
// with ".text-<role>{…} not found in dist/system.css" — reported as N slots that "did not
// verify". A missing INPUT masqueraded as a failed OUTPUT, which is precisely the failure
// that teaches people to rerun until green. Both cases now report the same honest thing:
// the build is not there to check.
//
// ── The completeness sentinel ──────────────────────────────────────────────────────
// `--background:` is a base semantic token present in every build, and in the minified
// output it sits ~92% of the way through the file (offset ~151.7k of ~165.5k). A file
// that is empty, truncated, or otherwise mid-write will not contain it, so its presence
// is a sound proxy for "this is a finished system.css, not a build caught in motion". It
// is deliberately NOT a size threshold: a byte count is brittle and drifts every commit.
//
// This module parses/loads only. It imports no gate and no gate imports another through
// it — the shared work is reading the artifact, nothing more.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, stat } from "node:fs/promises"

// A base semantic token every complete build declares, near the end of the minified file.
const COMPLETE_BUILD_MARKER = "--background:"

/**
 * Read the shipped stylesheet, or exit(1) with a message that names the real cause.
 *
 * Returns the CSS text on success. On a missing or incomplete build it prints an honest
 * "the build has not run" explanation to stderr and terminates the process — the caller
 * never sees a partial artifact, so it can never mislabel one as a failed assertion.
 *
 * @param {string} shippedCssPath  absolute path to dist/system.css
 * @returns {Promise<string>}
 */
export async function readShippedCss(shippedCssPath) {
  let css
  try {
    await stat(shippedCssPath)
    css = await readFile(shippedCssPath, "utf8")
  } catch {
    return buildNotReady(
      "dist/system.css does not exist — the build has not run.",
    )
  }

  if (!css.includes(COMPLETE_BUILD_MARKER)) {
    return buildNotReady(
      "dist/system.css exists but is incomplete (missing the base token layer). A build\n" +
        "is in progress or was interrupted — most often another `npm run build` ran\n" +
        "concurrently and emptied dist while this check was reading it.",
    )
  }

  return css
}

function buildNotReady(reason) {
  console.error(`\n${reason}`)
  console.error(
    "Run `npm run build` first, and do not run build-dependent checks concurrently with",
  )
  console.error(
    "another build. This is a missing/incomplete INPUT, not a failed assertion.\n",
  )
  process.exit(1)
}
