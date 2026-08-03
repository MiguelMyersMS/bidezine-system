---
name: deployment-verify
description: INDEPENDENT verification pass for a deployment handoff — loads the rendered Figma image and our rendered (Storybook/app) image and itemizes the per-element comparison. Run SEPARATELY from whoever built the handoff (doer ≠ checker). Blocks a release from reaching `handed-off`/`signed-off` on any unexplained difference. Use when verifying a `/figma-deploy` handoff, or any "does our build match the Figma rendering" check.
version: 1.0.0
---

# /deployment-verify — open the pixels, itemize the diff, independently

This skill exists because an agent that BUILDS a deployment cannot be trusted to certify its own
output — it rationalizes shortcuts (it once compared PNG **byte size** instead of opening the image
and missed a logo swap + two disabled icons). So verification is a **separate pass** that does the one
thing that actually catches drift: **opens both rendered images and reads them, element by element.**

## NON-NEGOTIABLE RULES
1. **You MUST open and read the actual rendered images** (the `Read` tool on the PNGs). 
2. **A file size, hash, byte count, node count, or "looks about right" is NEVER a substitute for
   opening the image.** Using any such proxy is the exact failure this skill prevents — it is a
   verification FAILURE, not a pass.
3. **You are independent.** If you also built this handoff, say so and recommend a fresh reviewer; do
   not rubber-stamp your own work.
4. Authority is **Figma** (the rendered frame). Our render is what's checked against it.

## Inputs (a handoff folder, e.g. `docs/deploy/<project>/<release>/`)
- `verify/figma.png` — the rendered Figma frame (the design).
- `verify/storybook.png` (and later `verify/app.png`) — our rendered output.
- `deploy.md` — the coverage matrix = the list of visible elements that MUST be checked.

## Steps
1. **Refuse if an image is missing.** No `figma.png` or `storybook.png` → FAIL ("cannot verify without
   both rendered images").
2. **Open both images** with `Read`. Look at them.
3. **Itemize — every visible element, one row each.** From the rendered frame, enumerate each visible
   element and compare it to our render. At minimum, for a nav surface: the logo; each rail icon (+
   its state: active / disabled); the footer; the panel header (title · subtitle · "…" menu · collapse
   button); search; and EACH nav row (label · icon · state [active/disabled/comingSoon] · badge ·
   chevron). For each: `Figma value · our render value · verdict (match | diff | missing)`.
4. **Write the itemized result** to `verify/comparison.md` with this EXACT shape — the
   `audit:deploy:verify` gate parses it and FAILS the handoff if it's incomplete:
   ```
   overall: PASS            # or FAIL — FAIL if ANY row is diff/missing
   reviewer: <name>
   independent: true        # were you a separate pass from the builder?

   | node | element | figma | render | verdict |
   |------|---------|-------|--------|---------|
   | 289:4587 | logo | Azure "A" | IconLogo (Azure) | match |
   | I289:4590;… | rail icon: growth | Arrow Trending Sparkle | IconArrowTrendingSparkle | match |
   | … one row per DRIFT-PRONE element — every matrix `match`/`gap`/`ruling` node … |
   ```
   First cell = the matrix node-id; last cell = the verdict (`match` | `diff` | `missing`). The gate
   FAILS `handed-off` if any drift-prone node lacks a row, any verdict ≠ `match`, or overall ≠ `PASS`.
5. **Verdict.** ANY `diff` or `missing` row → **FAIL**: the release MUST NOT advance to
   `handed-off`/`signed-off`; the fix is made UPSTREAM (the component/data), then re-verify. ALL rows
   `match` → **PASS**.

## Done when
`verify/comparison.md` exists with a row per visible element, an overall PASS/FAIL, and the reviewer's
independence noted. A PASS is required before `/figma-deploy` sets `lifecycle.status: handed-off`.
