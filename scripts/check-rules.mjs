// ═══════════════════════════════════════════════════════════════════════════════════
// M9 step 2 — the rules that used to be prose.
//
//   node scripts/check-rules.mjs [--json]
//
// §6's M9: "conversion of the top offenders from prose into executable checks." Each rule
// below exists because the thing it forbids ALREADY HAPPENED and was written up in
// CLAUDE.md afterwards. A rule with no incident behind it is not included — this is a
// record of real failures, not a style guide.
//
// Exit 1 on any violation. Exit 10 is reserved by detect-scope.mjs for "system-wide
// change"; nothing here uses it.
//
// ── Comments are stripped before matching, and that is not a detail ────────────────
// A naive grep for `overflow-y-auto` in `src/ui/` returns TEN files. Five of those matches
// are inside comments explaining why the component does NOT use one — including the
// comments documenting this very migration. A rule that fires on its own documentation is
// a rule people learn to ignore within a week, which is worse than no rule: it trains the
// team to skip a red CI step. So every rule matches against source with comments removed.
//
// ── Exceptions carry a reason, or they are not exceptions ──────────────────────────
// Each entry below cites where the decision was made. An allowlist of bare filenames is
// indistinguishable from a list of things nobody got around to fixing.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, readdir } from "node:fs/promises"
import { join, relative } from "node:path"
import { REPO_ROOT } from "../verifier/lib/db.mjs"

const JSON_OUT = process.argv.includes("--json")
const violations = []
const notes = []

const report = (rule, file, line, detail) => violations.push({ rule, file, line, detail })

/** Strips line comments and block comments (including the JSX brace-wrapped form),
 * preserving line numbering so a reported line still points at the right place. Deliberately simple: it
 * does not parse strings, so a `//` inside a string literal is treated as a comment. That
 * trade is safe here because every rule looks for className/import content, none of which
 * legitimately contains `//`, and the failure direction is a missed violation rather than
 * a false one — a rule that cries wolf is the failure mode this file exists to avoid. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(Math.max(0, m.length - p.length)))
}

async function walk(dir, test = /\.(tsx?|jsx?)$/, out = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, test, out)
    else if (test.test(e.name)) out.push(p)
  }
  return out
}

const rel = (p) => relative(REPO_ROOT, p).replace(/\\/g, "/")
const lineOf = (source, index) => source.slice(0, index).split("\n").length

// ═══════════════════════════════════════════════════════════════════════════════════
// R1 — only Fluent icons.
//
// CLAUDE.md's iconography protocol: "No Lucide, Heroicons, FontAwesome, Material Symbols,
// Tabler, or any other icon set is ever imported, copied, or referenced — not even 'just
// to check'." Shipped source only; `reference/shadcn-ui/` is vendored and excluded, since
// it legitimately contains Lucide and is never imported.
// ═══════════════════════════════════════════════════════════════════════════════════
const FORBIDDEN_ICON_PACKAGES = [
  "lucide-react",
  "@heroicons/react",
  "react-icons",
  "@tabler/icons-react",
  "@mui/icons-material",
  "material-symbols",
  "font-awesome",
  "@fortawesome",
]

async function ruleIconSources(files) {
  for (const file of files) {
    const source = stripComments(await readFile(file, "utf8"))
    for (const pkg of FORBIDDEN_ICON_PACKAGES) {
      const re = new RegExp(`from\\s+["']${pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g")
      for (const m of source.matchAll(re)) {
        report("icons.fluent-only", rel(file), lineOf(source, m.index), `imports from ${pkg}`)
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R2 — no raw scrolling primitive in src/ui/.
//
// Checklist item 8: a raw `overflow-y-auto` renders the browser's own scrollbar instead of
// the themeable `ScrollArea`, and is "exactly as much a 'no hand-rolled components'
// violation as a raw <button> standing in for Button — it is just easier to miss because
// there is no visibly wrong markup to spot."
//
// The exceptions are the four CLAUDE.md's scroll-region protocol names as deliberately NOT
// migrated, each with its own architectural reason, plus the primitive itself.
// ═══════════════════════════════════════════════════════════════════════════════════
const SCROLL_EXCEPTIONS = {
  // scroll-area.tsx is deliberately NOT listed. It was, on the assumption that the
  // primitive must obviously contain a raw overflow — and the stale-exception check
  // immediately reported that it does not: Radix owns the overflow internally, and the
  // only match in that file is inside a comment. An exception granted on an assumption
  // that turned out to be false, caught by the check that exists to catch exactly that.
  "src/ui/select.tsx": "SelectContent uses Radix's own Viewport + scroll buttons, tied to item-aligned positioning",
  "src/ui/message-scroller.tsx": "its own primitive measures that exact node for auto-scroll-to-bottom",
  "src/ui/attachment.tsx": "deliberate scrollbar-none horizontal snap gallery — no visible scrollbar to collide with",
  "src/ui/table.tsx": "byte-identical to shadcn's source; wraps a raw <table>, left on native overflow-x-auto",
}

// Built fresh at each use, never shared. `RegExp.prototype.test` on a /g regex advances
// `lastIndex` and resumes from there on the next call, so a single shared instance reports
// a file as clean simply because the previous file's match left the cursor past the end.
// That is exactly what happened here on the first run: three of the five exceptions were
// reported as stale while `grep` showed all five still matching.
const rawScrollRe = () => /overflow-(?:x-|y-)?(?:auto|scroll)/g

async function ruleNoRawScroll() {
  const files = await walk(join(REPO_ROOT, "src", "ui"))
  for (const file of files) {
    const path = rel(file)
    if (SCROLL_EXCEPTIONS[path]) continue
    const source = stripComments(await readFile(file, "utf8"))
    for (const m of source.matchAll(rawScrollRe())) {
      report("scroll.no-raw-overflow", path, lineOf(source, m.index), `${m[0]} — use the real ScrollArea, or record an exception with its reason`)
    }
  }
  // An exception that no longer applies is an exception nobody will notice is stale.
  for (const path of Object.keys(SCROLL_EXCEPTIONS)) {
    const source = await readFile(join(REPO_ROOT, path), "utf8").catch(() => null)
    if (source === null) notes.push(`exception listed for ${path}, which no longer exists`)
    else if (!rawScrollRe().test(stripComments(source))) notes.push(`${path} is listed as a scroll exception but no longer has a raw overflow — the entry can go`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R3 — every icon component carries the isActionIcon marker.
//
// Checklist item 15, and the most expensive bug in the log: `isIconElement()` falls back to
// checking whether a component's `.name` ends in "Icon", which dev mode preserves and a
// real build does not. A hand-rolled icon relying on that fallback silently stopped filling
// on hover the moment it was minified — passing every check for many turns because every
// check ran against the dev server.
// ═══════════════════════════════════════════════════════════════════════════════════
async function ruleIconMarker(files) {
  for (const file of files) {
    const path = rel(file)
    // The generated file is emitted by scripts/build-icons.mjs, which sets the marker on
    // every icon it writes; it is gitignored, so it may legitimately be absent.
    if (path.endsWith("src/icons/generated.tsx")) continue
    const raw = await readFile(file, "utf8")
    const source = stripComments(raw)
    const declared = new Set()
    for (const m of source.matchAll(/(?:function|const)\s+([A-Z][A-Za-z0-9]*Icon)\b/g)) declared.add(m[1])
    if (!declared.size) continue
    for (const name of declared) {
      // Narrowed to components that actually RENDER an <svg>. The first version flagged
      // every component whose name ended in "Icon" and immediately produced two false
      // positives: `MarkerIcon` (src/ui/marker.tsx) renders a <span> — it is a marker
      // container, not an icon — and a preview-only raw-SVG helper. A rule that fires on
      // things it does not mean is the same defect as one that fires on its own
      // documentation: people stop reading it. Name alone is not the contract.
      const body = source.slice(source.search(new RegExp(`(?:function|const)\\s+${name}\\b`)))
      if (!/<svg[\s>]/.test(body.slice(0, 1200))) continue

      // Explicit opt-out, because "renders an svg" still is not the same as "participates
      // in the action-icon fill system" — that depends on where it is USED, which no
      // single-file check can see. The opt-out has to state a reason, so a future reader
      // can tell a considered exemption from someone silencing a red check.
      //
      // Searched in the RAW source, not the comment-stripped copy: the annotation lives in
      // a comment, and stripping runs first, so checking `source` here would delete the
      // very thing being looked for and no opt-out would ever be honoured.
      //
      // The reason must START WITH A LETTER and run for at least ten more characters. A
      // first attempt required only `\s*\S`, which `/** not-an-action-icon: */` satisfied —
      // the `*` closing the comment counted as the reason. The bare silencer this
      // annotation exists to prevent was accepted, and only the planted-violation test in
      // check-rules-test.mjs caught it.
      // The window is the DOC COMMENT ATTACHED TO THIS DECLARATION — from the last block
      // comment or line comment that precedes it — not a fixed character count. A 500-char
      // window failed on the first real use: the annotation sat 529 characters above its
      // own component because the explanation was thorough, so writing a better reason
      // pushed it out of range. A rule whose exemption breaks when the justification gets
      // longer is a rule that rewards terse justifications.
      const declIdx = raw.search(new RegExp(`(?:function|const)\\s+${name}\\b`))
      const before = raw.slice(0, declIdx)
      const commentStart = Math.max(before.lastIndexOf("/*"), before.lastIndexOf("//"))
      const window = commentStart === -1 ? "" : before.slice(commentStart)
      if (/not-an-action-icon:[ \t]*[A-Za-z][^\n*]{9,}/.test(window)) continue

      if (!new RegExp(`${name}\\.isActionIcon\\s*=\\s*true`).test(source)) {
        const idx = source.search(new RegExp(`(?:function|const)\\s+${name}\\b`))
        report(
          "icons.action-marker",
          path,
          lineOf(source, idx),
          `${name} renders an <svg> but never sets ${name}.isActionIcon = true — the .name fallback does not survive minification. Set the marker, or annotate "not-an-action-icon: <reason>".`,
        )
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R4 — no leading-none on an element that also truncates.
//
// Checklist item 24: glyphs paint per the font's own metrics regardless of line-height, so
// a line box shrunk to exactly font-size clips descenders (g/y/p/q/j) the moment anything
// clips overflow. It shipped, and looked like it "appeared and disappeared" depending on
// which label happened to contain a descender.
// ═══════════════════════════════════════════════════════════════════════════════════
async function ruleLeadingNoneTruncate(files) {
  for (const file of files) {
    const source = stripComments(await readFile(file, "utf8"))
    // Scans each quoted class string rather than each line: a className can span lines, and
    // two unrelated elements can share one.
    for (const m of source.matchAll(/["'`]([^"'`\n]{0,400})["'`]/g)) {
      const cls = m[1]
      if (/\bleading-none\b/.test(cls) && /\btruncate\b|\boverflow-hidden\b/.test(cls)) {
        report("text.leading-none-truncate", rel(file), lineOf(source, m.index), `"${cls.slice(0, 90)}" — clips descenders`)
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R5 — the origin quarantine.
//
// Already executable, already in CI, already proven: scripts/check-quarantine.mjs. It is
// NOT reimplemented here. Two implementations of one rule is the defect migration 017 just
// removed elsewhere in this repo; a second copy would drift and the two would disagree
// about whether the boundary held.
// ═══════════════════════════════════════════════════════════════════════════════════

// ── run ─────────────────────────────────────────────────────────────────────────────
const SHIPPED = [join(REPO_ROOT, "src"), join(REPO_ROOT, "site", "src"), join(REPO_ROOT, "sandbox", "src")]
const files = (await Promise.all(SHIPPED.map((d) => walk(d)))).flat()

await ruleIconSources(files)
await ruleNoRawScroll()
await ruleIconMarker(files)
await ruleLeadingNoneTruncate(files)

if (JSON_OUT) {
  console.log(JSON.stringify({ violations, notes }, null, 2))
} else {
  console.log(`\nchecked ${files.length} source files across src/, site/src/, sandbox/src/\n`)
  if (!violations.length) console.log("  no violations")
  const byRule = new Map()
  for (const v of violations) byRule.set(v.rule, [...(byRule.get(v.rule) ?? []), v])
  for (const [rule, list] of byRule) {
    console.log(`  ${rule} — ${list.length} violation(s)`)
    for (const v of list) console.log(`      ${v.file}:${v.line}  ${v.detail}`)
  }
  for (const n of notes) console.log(`\n  NOTE  ${n}`)
  console.log("\n  R5 (origin quarantine) is owned by scripts/check-quarantine.mjs and not duplicated here.")
}

if (violations.length) process.exitCode = 1
