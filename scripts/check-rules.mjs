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
// Neutral parsing helper, not another gate — see scripts/lib/lexical-scan.mjs's own
// header for why importing it here does not reopen the self-contained-gate question
// R6 raised: R6 stays non-blocking regardless of where its literal/comment scan lives.
//
// Issue 06d: classLiterals and stripComments both used to be independent — this file
// defined its own stripComments (a bare `//`/`/* */` regex, no string awareness), and
// class-literals.mjs computed literal spans with no comment awareness. Fixing one
// blind spot by deriving spans from the other's output (an intermediate attempt, since
// deleted) was backwards: comments and literals are mutually exclusive lexical states,
// and only a single scan that is, at every character, in exactly one of them can tell
// the two apart. lexical-scan.mjs is that one scan; classLiterals and stripComments
// below are both thin views over it, and neither keeps a private copy of either's logic.
import { classLiterals, stripComments } from "./lib/lexical-scan.mjs"

const JSON_OUT = process.argv.includes("--json")
const violations = []
const notes = []

const report = (rule, file, line, detail) => violations.push({ rule, file, line, detail })

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
//
// Issue 06c: the cap is now 2000, matching R6 and check-type-slots.mjs's Link A — the
// same failure family as R6's old 600 (05c's finding: an undersized cap makes the
// literal-capture regex find no closing quote and silently skip the WHOLE literal, not
// truncate it), and this was the line already being edited to fix the quote-matching
// bug, so it is sized correctly in the same commit rather than carried as a decision
// for a later issue.
//
// Deliberately repo-wide (SHIPPED, not src/ui/ alone) — unlike R6, this protects
// against a real visual clipping defect anywhere shipped, not just where Issue 05's
// type-role rewire went. Issue 06d: do not narrow this to src/ to make a doc-page
// finding disappear; that is weakening the rule to reach green, which is the opposite
// of what an allow-list entry (below) is for.
//
// ── R4's real limitation, honestly stated ───────────────────────────────────────────
// This rule matches `leading-none` and `truncate`/`overflow-hidden` anywhere within
// ONE literal, not per element. A literal that legitimately holds more than one
// element's class string — the only known case being a documentation code sample
// whose template literal displays several example elements' recipes concatenated —
// can pair two utilities that never sit on the same real element. R4_ALLOWED's
// ScrollAreaShowcase.tsx entry exists because of this, not because the rule is wrong
// to fire in general. A later reader deciding whether to re-litigate that entry should
// decide instead whether R4 is worth making per-element (parsing which literal belongs
// to which JSX attribute) rather than substring-scanning whole literals; that is a
// different, larger change than this rule's current design and is not attempted here.
// ═══════════════════════════════════════════════════════════════════════════════════
const R4_ALLOWED = [
  {
    file: "site/src/routes/components/ScrollAreaShowcase.tsx",
    match: "leading-none",
    reason:
      "Documentation code sample: one template literal displays several example elements' class strings concatenated as prose, not one live element's own className. leading-none and overflow-hidden in this literal belong to two different elements in the shown snippet — see R4's header above for why a literal-wide substring scan can pair utilities that never meet on a real element.",
  },
  {
    file: "sandbox/src/data/rail-sidebar.ts",
    truncated: true,
    reason:
      "Protected byte-identical content (do not touch — preserved verbatim for a corpus-verify check elsewhere in this repo), genuinely past the 2000-character cap. The cap reporting truncation here is the cap doing its job, not a defect — see lexical-scan.mjs's cap comment. Raising the cap to silence this would reopen 05c's finding (an oversized cap turns a count into an unreliable floor); it is not raised.",
  },
]

async function ruleLeadingNoneTruncate(files) {
  const seenAllowed = new Set()
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    // Scans each quoted class string rather than each line: a className can span lines, and
    // two unrelated elements can share one.
    for (const { value: cls, index, truncated } of classLiterals(source)) {
      if (truncated) {
        const entry = R4_ALLOWED.find((e) => e.file === path && e.truncated)
        if (entry) {
          seenAllowed.add(path)
          continue
        }
        // Not silently consumed as a partial value — see lexical-scan.mjs's cap
        // comment. No other literal in this codebase is anywhere near 2000
        // characters, so this is expected to fire only for the allow-listed entry
        // above; if it fires elsewhere the count above it is a floor.
        report("text.leading-none-truncate", path, lineOf(source, index), `literal exceeds ${cls.length}+ chars — truncated before scanning, not fully checked`)
        continue
      }
      if (/\bleading-none\b/.test(cls) && /\btruncate\b|\boverflow-hidden\b/.test(cls)) {
        const entry = R4_ALLOWED.find((e) => e.file === path && e.match && cls.includes(e.match))
        if (entry) {
          seenAllowed.add(path)
          continue
        }
        report("text.leading-none-truncate", path, lineOf(source, index), `"${cls.slice(0, 90)}" — clips descenders`)
      }
    }
  }
  for (const e of R4_ALLOWED) {
    if (!seenAllowed.has(e.file)) notes.push(`R4 allow-list entry ${e.file} no longer matches anything — the entry can go`)
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

// ═══════════════════════════════════════════════════════════════════════════════════
// R6 — no raw Tailwind type utility in src/ui/.
//
// Issue 05 phase 1: src/ui consumes named type roles (text-body, text-control, …) instead
// of raw font-size/leading/tracking utilities, so a component's typography traces back to
// one token instead of a scattered literal. Forbidden: text-xs/sm/base/lg/xl/2xl+ and
// length-valued text-[...] arbitrary values, leading-*, tracking-*. Legal: bare
// font-normal/font-medium/font-semibold (overriding weight on a parent-inherited size is a
// pattern no role can express), the text-<role> utilities themselves, and text-* colour
// utilities (text-muted-foreground etc. — matched precisely so a colour never trips a
// size rule).
//
// TYPE_UTILITIES_ALLOWED is scoped per file+snippet, not per file: several files (e.g.
// calendar.tsx) carry both a rewired slot and an untouched sibling slot in the same file,
// so a file-level exception would silently blanket the sibling too.
//
// Only src/ui/ is scanned — that is this issue's stated scope, not the wider `files` list
// R1-R4 share (site/ and sandbox/ were never part of Issue 05's rewire and are not gated
// here).
//
// This rule is deliberately NOT wired into a blocking `npm run *` script. The rewire table
// in Issue 05 explicitly leaves ~90 raw-utility lines across ~25 files untouched by design
// (every one is a real, working component slot the issue never asked to change) — wiring
// this gate into `npm run tokens`/`build`/`check-shipped` would fail those builds on
// pre-existing, intentionally-unrewired code the very same day this rule is introduced.
// Run it explicitly (`node scripts/check-rules.mjs`) and read its R6 output; do not infer
// that a clean `npm run build` means R6 passed, because R6 is not part of that chain.
// ═══════════════════════════════════════════════════════════════════════════════════
const TYPE_UTILITIES_ALLOWED = [
  {
    file: "src/ui/empty.tsx",
    match: "text-sm/relaxed",
    reason: "Empty description — deliberately loose (22.75px) zero-state prose; no role expresses text-sm/relaxed.",
  },
  {
    file: "src/ui/bubble.tsx",
    match: "leading-relaxed",
    reason: "Bubble content — deliberately loose (22.75px) chat prose; no role expresses text-sm leading-relaxed.",
  },
  {
    file: "src/ui/card.tsx",
    match: "leading-none font-semibold",
    reason:
      "Card title — leading-none on a size inherited from the card; a role would have to set a size, which would change what the title renders at. Weight and leading override only.",
  },
  {
    file: "src/ui/command.tsx",
    match: "[&_[cmdk-group-heading]]:text-xs",
    reason:
      "CommandGroup's heading is styled through a descendant selector ([&_[cmdk-group-heading]]:*), not on the element's own class string — 05c's variant-scoping rule treats descendant selectors as out of scope for role rewiring, since no role can reach through to a nested element it doesn't own. The alternative is giving the heading its own element (so its class string could carry a role directly), which is a structural change deferred to a later batch — not pursued in this commit.",
  },
  {
    file: "src/ui/field.tsx",
    match: "gap-1.5 leading-snug",
    reason:
      "FieldContent — leading-snug on a size inherited from whatever element renders inside it (FieldTitle/FieldDescription set their own size); no role can express a leading override with no size of its own to attach it to.",
  },
  {
    file: "src/ui/field.tsx",
    match: "gap-2 leading-snug",
    reason:
      "FieldLabel — same as FieldContent above: leading-snug overrides the line-height of whatever size the composed Label/content ends up rendering at, which is not this element's own size to name a role for.",
  },
]

const FONT_SIZE_RE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/
const FONT_SIZE_ARBITRARY_RE = /\btext-\[(?:length:[^\]]+|[\d.]+(?:px|rem|em))\]/
const LEADING_RE = /\bleading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])\b/
const TRACKING_RE = /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/

function isAllowed(path, cls) {
  return TYPE_UTILITIES_ALLOWED.some((e) => e.file === path && cls.includes(e.match))
}

// Issue 06c: the literal capture is now scripts/lib/lexical-scan.mjs's classLiterals,
// not a `/["'`]([^"'`\n]{0,2000})["'`]/g` regex — that regex's character class excluded
// ALL THREE quote characters, so it closed a double-quoted literal on the FIRST
// embedded single quote (every menu-item class string in src/ui/ has one, from
// `[class*='size-']`), silently hiding whatever forbidden utility sat after it and
// making this count untrustworthy in both directions: real violations past the quote
// were invisible, and the apostrophe-delimited fragments after the cut point could be
// scanned as if they were literals of their own. See lexical-scan.mjs's header for
// the fix and cap-2000/truncated details; R4 above carries the same cap now, for the
// same reason.
async function ruleNoRawTypeUtility() {
  const seenAllowed = new Set()
  const files = await walk(join(REPO_ROOT, "src", "ui"))
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, index, truncated } of classLiterals(source)) {
      if (truncated) {
        // Not silently consumed as a partial value — see lexical-scan.mjs's cap
        // comment. No literal in src/ui/ is anywhere near 2000 characters, so this is
        // expected to never fire; if it does, the count below it is a floor.
        report("type.no-raw-utility", path, lineOf(source, index), `literal exceeds ${cls.length}+ chars — truncated before scanning, not fully checked`)
        continue
      }
      const hit =
        FONT_SIZE_RE.test(cls) || FONT_SIZE_ARBITRARY_RE.test(cls) || LEADING_RE.test(cls) || TRACKING_RE.test(cls)
      if (!hit) continue
      if (isAllowed(path, cls)) {
        seenAllowed.add(`${path}::${cls}`)
        continue
      }
      report("type.no-raw-utility", path, lineOf(source, index), `"${cls.slice(0, 100)}"`)
    }
  }
  for (const e of TYPE_UTILITIES_ALLOWED) {
    const stillPresent = [...seenAllowed].some((k) => k.startsWith(`${e.file}::`) && k.includes(e.match))
    if (!stillPresent) notes.push(`R6 allow-list entry ${e.file} (${e.match}) no longer matches anything — the entry can go`)
  }
}

// ── run ─────────────────────────────────────────────────────────────────────────────
const SHIPPED = [join(REPO_ROOT, "src"), join(REPO_ROOT, "site", "src"), join(REPO_ROOT, "sandbox", "src")]
const files = (await Promise.all(SHIPPED.map((d) => walk(d)))).flat()

await ruleIconSources(files)
await ruleNoRawScroll()
await ruleIconMarker(files)
await ruleLeadingNoneTruncate(files)
await ruleNoRawTypeUtility()

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

// Issue 06d: R6's own header (above, "no raw Tailwind type utility") already declares
// it "deliberately NOT wired into a blocking `npm run *` script" — that comment
// describes intent this file's exit code never actually honored. `violations.length`
// summed every rule together, so `node scripts/check-rules.mjs` run directly (exactly
// how R6's header says to read its output) has exited 1 off R6's own findings since
// before this issue, independent of whatever R4 or any other rule reports. That
// mismatch, not R4's regression, is why the gate could not reach green by fixing R4
// alone. Fixed here by aggregating exit status from the rules that are actually
// blocking; R6's violations still print in full above, they just stop being read as a
// gate failure — which is what "non-blocking" already meant.
const NON_BLOCKING_RULES = new Set(["type.no-raw-utility"]) // R6 — see its header
const blockingViolations = violations.filter((v) => !NON_BLOCKING_RULES.has(v.rule))
if (blockingViolations.length) process.exitCode = 1
