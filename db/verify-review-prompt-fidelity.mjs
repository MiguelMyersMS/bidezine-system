// A check that each rail-sidebar color divergence prompt's final sentence still matches
// the real source token it quotes -- closing the risk REVIEW-CARD-SPEC.md §3.10 names
// explicitly: "nothing currently notices" when a proposed value changes after its prompt
// was written.
//
//   node db/verify-review-prompt-fidelity.mjs
//
// Reads proposedDarkRailTokens directly out of sandbox/src/data/rail-sidebar.ts by
// bundling the real module with esbuild and importing it -- never retyping the oklch
// values by hand (CLAUDE.md checklist item 18: a fabricated-but-plausible value passes
// every check except reading the real source).
//
// The mapping from ref_code (B-1..B-9) to a token's own originName is fixed by which
// entry of proposedDarkRailTokens each prompt was written against -- not by array
// position or by re-deriving it from the prompt text, which would make this check
// trivially circular.

import { build } from "esbuild"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { connect, REPO_ROOT } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const SOURCE = join(REPO_ROOT, "sandbox", "src", "data", "rail-sidebar.ts")
const COMPONENT = join(REPO_ROOT, "sandbox", "src", "components", "FunctionalRailSidebar.tsx")

// ── layout-sizing rows quote real numbers too, and needed the same pinning ─────────
// REVIEW-CARD-SPEC §3.10 originally banned quoting a value in a layout-sizing prompt. The
// reason was never style: a quoted value goes stale silently and nothing notices. When
// F-3/F-5/F-6's prompts were rewritten they gained real numbers — which reads better, since
// a reviewer gets the actual figures rather than a paraphrase — but left them unpinned,
// which is exactly the combination the ban existed to prevent. The rule is now: quoting is
// allowed WHEN a check covers it. This is that check.
//
// Read out of the component's own source, never retyped (checklist item 18).
const LAYOUT_CLAIMS = {
  // Matched on the constant's NAME, not a line number, so moving it does not silently stop
  // checking it.
  "F-3": {
    label: "PANEL_DEFAULT_WIDTH",
    extract: (_src, component) => component.match(/^const PANEL_DEFAULT_WIDTH = (\d+)/m)?.[1],
  },
  // Not a named constant — a Tailwind class on the panel-tree rows. Pinned by finding EVERY
  // panel-tree row recipe and requiring them all to carry the same height, which checks both
  // halves of what these prompts claim: the value AND that it is uniform at every depth. A
  // single-constant check could not express the second.
  "F-5": { label: "panel-tree row height", extract: treeRowHeight },
  "F-6": { label: "panel-tree row height", extract: treeRowHeight },
}

/**
 * Every panel-tree row's height, collapsed to one value — or a description of the
 * disagreement, which FAILS rather than silently picking one.
 *
 * Residual assumption, stated rather than hidden: h-8 = 32px is Tailwind's own 4px scale.
 * This pins the class and the uniformity; it does not pin the scale itself.
 */
// The shared recipe every panel-tree row carries. If it changes, treeRowHeight returns
// null and the check fails loudly — correct, because the rows were rebuilt and the prompts
// need re-reading.
const ROW_RECIPE = 'gap-1.5 rounded-md'

function treeRowHeight(_src, component) {
  // Rows are identified by their shared recipe rather than by line number. If that recipe
  // changes this returns null and the check fails loudly — correct, because the rows were
  // rebuilt and the prompts need re-reading.
  const heights = new Set()
  for (const line of component.split(String.fromCharCode(10))) {
    const trimmed = line.trim()
    // Comments are skipped: this component's only h-9 mentions are comments explaining
    // the change away from h-9, and counting them would report a disagreement that does
    // not exist in the markup. Same reason check-rules.mjs strips comments before matching.
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
    if (!line.includes(ROW_RECIPE)) continue
    const m = line.match(new RegExp('h-([0-9]+)'))
    if (m) heights.add(Number(m[1]))
  }
  if (heights.size === 0) return null
  if (heights.size !== 1) return 'NON-UNIFORM: h-' + [...heights].join(', h-')
  return String([...heights][0] * 4)
}

// Fixed at authoring time: which proposedDarkRailTokens entry (by its own originName)
// each B-ref's prompt was written against. Order matches the user's own B-1..B-9 list.
const REF_TO_ORIGIN_NAME = {
  "B-1": "darkSurface",
  "B-2": "darkHoverBg",
  "B-3": "darkActiveBg",
  "B-4": "darkPressedBg",
  "B-5": "darkBorderStrong",
  "B-6": "onDark",
  "B-7": "onDarkHover",
  "B-8": "onDarkSubtle",
  "B-9": "onDarkDisabled",
}

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const tmp = await mkdtemp(join(tmpdir(), "rail-sidebar-bundle-"))
const outfile = join(tmp, "rail-sidebar.mjs")
try {
  await build({ entryPoints: [SOURCE], outfile, bundle: true, platform: "node", format: "esm", logLevel: "silent" })
  const mod = await import(pathToFileURL(outfile).href)
  const { proposedDarkRailTokens } = mod

  const tokensByName = new Map(proposedDarkRailTokens.map((t) => [t.originName, t]))

  let pool
  try {
    pool = await connect("ADMIN")
    const { recordset } = await pool.request().query(`
      SELECT d.ref_code, d.review_prompt
      FROM   sandbox.divergence d
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = '${SLUG}' AND d.ref_code LIKE 'B-%'`)

    console.log(`\n${recordset.length} B-ref rows with a review_prompt to check\n`)

    for (const { ref_code: ref, review_prompt: prompt } of recordset.sort((a, b) => a.ref_code.localeCompare(b.ref_code))) {
      const originName = REF_TO_ORIGIN_NAME[ref]
      if (!originName) {
        check(false, `${ref}: no known mapping to a proposedDarkRailTokens entry -- add one to REF_TO_ORIGIN_NAME`)
        continue
      }
      const token = tokensByName.get(originName)
      if (!token) {
        check(false, `${ref}: originName "${originName}" no longer exists in proposedDarkRailTokens`)
        continue
      }
      if (!prompt) {
        check(false, `${ref}: review_prompt is empty, nothing to check`)
        continue
      }

      // Only the FINAL sentence is the contract per §3.10 -- an earlier sentence may
      // legitimately mention a different var (this is the mistake the spec's own first
      // checker made).
      const sentences = prompt.split(/(?<=[.])\s+/)
      const last = sentences[sentences.length - 1]

      // Matched on the literal "Proposed --var" phrase, not any dashed identifier in the
      // sentence -- a bare `/--[a-z0-9-]+/` also fires on an unrelated token the prose
      // merely mentions (B-1's own remaining sentence names --background, a real but
      // different var, in a bounding comparison that isn't a proposed-value claim at all).
      // Once the Adjusted block renders proposedDarkRailTokens live, B-1..B-9's prompts no
      // longer end in a "Proposed --var: ..." sentence at all -- that is NOT a failure, it
      // is the fidelity risk moving from prose (which can go stale) to the array the
      // component actually renders from (which cannot). No "Proposed --var" phrase means
      // there is nothing left in prose to verify, so this loop iteration is skipped rather
      // than failed.
      const varMatch = last.match(/Proposed (--[a-z0-9-]+)/)
      if (!varMatch) continue
      if (varMatch[1] !== token.proposedVar) {
        check(false, `${ref}: final sentence's var is ${varMatch[1]}, expected ${token.proposedVar}`)
        continue
      }

      const oklchValues = [...last.matchAll(/oklch\([^)]*\)/g)].map((m) => m[0])
      const missing = []
      if (!oklchValues.includes(token.proposedLight)) missing.push(`light ${token.proposedLight}`)
      if (token.proposedLight !== token.proposedDark && !oklchValues.includes(token.proposedDark)) missing.push(`dark ${token.proposedDark}`)

      check(missing.length === 0, `${ref} (${originName} / ${token.proposedVar}) still matches its source token`, missing.length ? `missing ${missing.join(", ")} -- found ${JSON.stringify(oklchValues)}` : "")
    }
    // ── layout-sizing rows ────────────────────────────────────────────────────────
    const component = await readFile(COMPONENT, "utf8")
    const layout = (
      await pool.request().query(`
        SELECT d.ref_code, d.review_prompt
        FROM   sandbox.divergence d
        JOIN   sandbox.component c ON c.component_id = d.component_id
        WHERE  c.slug = '${SLUG}' AND d.ref_code IN ('F-3','F-5','F-6')`)
    ).recordset

    console.log(`
${layout.length} layout-sizing rows whose prompts quote a real value
`)

    for (const { ref_code: ref, review_prompt: prompt } of layout.sort((a, b) => a.ref_code.localeCompare(b.ref_code))) {
      const claim = LAYOUT_CLAIMS[ref]
      const value = claim.extract(null, component)
      if (!value) {
        check(false, `${ref}: could not read ${claim.label} from the component`, "the shape this matches on has changed — re-read the rows before trusting their prompts")
        continue
      }
      if (String(value).startsWith("NON-UNIFORM")) {
        check(false, `${ref}: ${claim.label} is no longer uniform`, String(value))
        continue
      }
      const wanted = `${value}px`
      check(
        Boolean(prompt?.includes(wanted)),
        `${ref} still quotes the real ${claim.label} (${wanted})`,
        prompt?.includes(wanted) ? "" : `prompt does not contain ${wanted} — the source moved and the prompt did not`,
      )
    }
  } finally {
    await pool?.close()
  }
} finally {
  await rm(tmp, { recursive: true, force: true })
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) {
  console.log("\nA review_prompt no longer matches the token it quotes. Failing checks:")
  failed.forEach((r) => console.log(`  - ${r.label}`))
  process.exitCode = 1
}
