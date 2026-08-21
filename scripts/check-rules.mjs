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
// Issue 07o: REPO_ROOT comes from a database-free module, NOT verifier/lib/db.mjs, which
// imports mssql at top level. This is a source-only check; borrowing the constant from the
// db module crashed it — and the blocking `rules` CI gate — with ERR_MODULE_NOT_FOUND on
// any clean/root-only install, before it could assert a single rule.
import { REPO_ROOT } from "./lib/repo-root.mjs"
// Neutral parsing helper, not another gate — see scripts/lib/lexical-scan.mjs's own
// header for why importing it here does not reopen the self-contained-gate question
// R6 raised when it was non-blocking. As of Issue 06h R6 is blocking, which removes
// that question entirely rather than reopening it: the module has no opinion on which
// of its importers gates the build, blocking or not.
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
// Issue 06h: R6's own raw-utility scan used to test the class string directly, with no
// variant scoping at all — so `file:text-sm` (an element-targeting variant, out of
// scope per Issue 05c) was a violation here while Link A (check-type-slots.mjs) already
// treated it as legal. Same literal, two answers. Both checks now share one answer —
// see scripts/lib/variant-scope.mjs's own header. Issue 07a: the scoping itself moved
// into lib/type-utility.mjs (below) so R7 could reuse it; this file no longer calls
// stripElementTargeting directly.
// Issue 07a: the forbidden-utility regexes and the variant-scoped test used to live
// only inline in R6 below. R7 needs the identical test — same regexes, same
// stripElementTargeting scoping — so it moved here rather than being copied a second
// time. See type-utility.mjs's own header.
import { hasForbiddenTypeUtility, elementTargetingTypeUtilities } from "./lib/type-utility.mjs"
// Issue 07a: R7 asks a different question than R6's whole-file scan can answer outside
// src/ui/ — see componentClassLiterals's own header for why a caller-side scan needs to
// first find which literals reach a component's className-shaped prop at all.
import { componentClassLiterals } from "./lib/component-class-scope.mjs"
// Issue 07g: R8 (the ≥3-file padding tripwire) asks "which box-padding values recur
// across enough files to deserve a decision on record" — the box-vs-single-edge scope
// and the offset exclusion that answer defensibly live in lib/padding-scan.mjs, not
// inline here, so a future consumer reads one scope decision rather than copying a
// second regex. See that module's header for why single-edge padding is out of scope.
import { boxPaddingUtilities } from "./lib/padding-scan.mjs"


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
// Issue 06h: this rule blocks. It used to say it was deliberately NOT wired into a
// blocking `npm run *` script, because Issue 05's rewire table left ~90 raw-utility
// lines across ~25 files untouched by design and wiring this gate into the build would
// have failed on that intentionally-unrewired code the same day the rule was
// introduced. That reason is spent: every rewireable slot in src/ui/ has since been
// rewired across Issues 05 and 06a-06h, this rule is wired into the same npm chain
// check-type-slots is (see package.json), and it is no longer in NON_BLOCKING_RULES
// below. A raw type utility in src/ui/ now fails the chain; the only way past it is an
// entry in TYPE_UTILITIES_ALLOWED with a stated reason, same as any other exception in
// this file.
// ═══════════════════════════════════════════════════════════════════════════════════
// Issue 07b: the eight entries this list used to carry for a raw leading-* utility on a
// parent-inherited size (card.tsx, attachment.tsx, field.tsx x2, chart.tsx, calendar.tsx,
// empty.tsx, bubble.tsx) are retired — each now consumes a named leading-<job> token from
// the new line-height axis (tokens/base.tokens.json), which LEADING_RE does not match, so
// none of the eight trips hasForbiddenTypeUtility any more and none needs an exception here.
const TYPE_UTILITIES_ALLOWED = []

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
      // Issue 06h: scoped through the same stripElementTargeting Link A uses, before
      // testing for a forbidden utility — a variant that targets a different element
      // (file:, placeholder:, a [&_...]/[&>...] descendant selector) is out of THIS
      // element's scope regardless of what utility it carries, the same rule 05c
      // established for Link A. Reporting/allow-listing below still reads the ORIGINAL
      // `cls`, matching Link A's own scoped-for-detection/whole-literal-for-identity split.
      // Issue 07a: the scoping + regex test itself moved to lib/type-utility.mjs so R7
      // could share it rather than copy it — see that module's header.
      if (!hasForbiddenTypeUtility(cls)) continue
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

// R6b — descendant/pseudo-element raw type utilities in src/ui/ (Issue 07h), reported, not
// blocked.
//
// R6 above asks "does THIS element's own class string carry a raw size/leading/tracking
// utility", and by design strips element-targeting variants (file:, placeholder:, a
// [&_...]/[&>...] descendant selector) before it looks — a variant that styles a DIFFERENT
// element than the one the class sits on is out of that question's scope, the rule 05c/06h
// established and R6/R7/Link A all share. That strip is correct and stays.
//
// What was wrong was the claim built on top of it. R6 reporting zero, and the token file
// recording the type layer as having "zero exceptions", read as "zero raw type utilities
// anywhere in src/ui/". It was only ever zero on each element's OWN string; the strip
// removed an uncounted number of raw utilities riding on descendant/pseudo-element slots,
// and emptying a count by narrowing what the rule looks at is precisely the failure mode
// R6 exists to prevent — turned, unnoticed, on R6's own blind spot. This rule makes that
// bound a reported count instead of an unstated one.
//
// Non-blocking, and deliberately so: a descendant slot's size is genuinely out of an
// element role's reach — a role sets the element it is on, not a child two selectors down —
// so several of these cannot become a role at all, and forcing the count to zero would be
// the exception-hiding move, not the fix. What the count buys is that each one is visible
// and re-adjudicated on sight rather than silently absent. Same src/ui/ scope as R6, same
// classLiterals/stripComments lexical pipeline, and the offending tokens come from
// elementTargetingTypeUtilities — the exact inverse of the strip hasForbiddenTypeUtility
// applies — so this count and R6's own-element count are two halves of one scan, not two
// scans that can drift.
// Issue 07(R6b-clear) — each slot in this count re-examined for whether a role can express
// it (Item 3), and the precise finding recorded so the count carries WHY, not just WHAT.
// Both genuinely cannot become a role, and the reason is not a matter of taste: raw
// text-xs/text-sm set font-size and a stock line-height ONLY, whereas every text-<role> in
// this system is a four-axis composite (font-size + line-height + letter-spacing +
// font-weight — read straight out of dist/system.css). A role therefore cannot reproduce a
// raw size's size-and-leading-only render on a slot that wants nothing but the size; it
// would impose two or three extra axes the slot does not currently carry. Keyed on the
// verbatim token (distinct per slot, stable across line drift); any NEW descendant slot
// falls through to the generic reason so the scan keeps catching the unexamined ones. This
// enriches the reason only — the token still appears in the count, still non-blocking, exit
// code unchanged; forcing the count to zero is the exact defect R6b exists to prevent.
const R6B_ADJUDICATED = {
  "[&>span]:text-xs":
    "react-day-picker renders these secondary <span>s inside the day cell, so the span is not a bidezine component and cannot carry a role; it sits at 12px beside the day number (a direct text node in the same button at the button's own inherited size), so giving the button a role would resize the number too; and any 12px role (caption/control-sm/shortcut) is a four-axis composite that would additionally impose its letter-spacing, font-weight and line-height on the span — no value-unchanged rewire exists",
  "file:text-sm":
    "::file-selector-button is a browser pseudo-element, never a DOM node we render, so it can only be reached via the file: variant and can never carry a role; any 14px role (body/control/label) is a four-axis composite that would impose its letter-spacing and line-height on the button (font-weight is already pinned by the adjacent file:font-medium) — no value-unchanged rewire exists",
}
async function ruleDescendantScopedType() {
  const files = await walk(join(REPO_ROOT, "src", "ui"))
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, index, truncated } of classLiterals(source)) {
      if (truncated) continue
      for (const token of elementTargetingTypeUtilities(cls)) {
        const reason = R6B_ADJUDICATED[token] ?? "descendant/pseudo-element slot, outside R6's own-element scope; a role cannot reach it unless the child is a component"
        report("type.descendant-scoped", path, lineOf(source, index), `${token} — ${reason}`)
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R7 — no caller override of a role-bearing component's type
//
// A different claim from R6's, not a wider version of it. R6 asks "does this
// component's OWN class string carry a raw type utility" — a question that only makes
// sense where every literal in the file genuinely IS a component's own class string,
// which is true throughout src/ui/ and false everywhere else. Issue 07a tried widening
// R6's directory list to site/src/ + sandbox/src/ and got 427 hits, almost all page
// headings and code-sample chrome that never claimed a role — proof the claim itself
// doesn't hold outside src/ui/, not evidence of a bigger version of the same problem.
//
// R7's claim is different and DOES hold everywhere a component is called from OUTSIDE
// the system: a CALLER must not override the type of a component that already consumes
// a role. That claim needs a narrower scan than R6's — not "every literal in this
// file", but "every literal that actually reaches a capitalised JSX tag's className-
// shaped prop" — see scripts/lib/component-class-scope.mjs's own header for how that's
// found. The forbidden-utility test itself (size/leading/tracking, variant-scoped) is
// identical to R6's and shared from scripts/lib/type-utility.mjs rather than copied.
//
// ── Scope: site/src/ only — not bare src/, not sandbox/src/ ──────────────────────────
// R7 was first tried scoped to src/ + site/src/, matching R1-R4's SHIPPED list. Running
// it that way surfaced three hits inside src/ui/ itself (bubble.tsx:77's asChild `Comp`,
// calendar.tsx:211's internal `Button`, field.tsx:118's internal `Label`) — every one of
// them a literal R6 had ALREADY adjudicated and allow-listed in TYPE_UTILITIES_ALLOWED
// above. src/ui/ contains nothing but component internals: when Calendar composes its
// own Button, or Field its own Label, that is not a caller from outside overriding a
// role, it is the system's own composition, and R6 already owns that entire directory.
// Scanning it again under R7 asks R6's question a second time through a second, empty
// allow-list — exactly the "same literal, two answers" failure Issue 06h fixed by
// giving R6 and Link A one shared stripElementTargeting rather than two. R7 therefore
// walks site/src/ only; src/ (all of it, not just src/ui/) is out of its scope, and R6
// remains the sole rule governing src/ui/.
//
// docs/PIVOT-2026-08-15.md is a further, standing instruction, not a per-issue one:
// "The database and sandbox/ are left in place, read-only. Nothing new should be
// written to either." Issue 07a's re-derived component-scoped scan found 28 caller
// overrides; all but one (site/src/components/Layout.tsx:46) live under sandbox/src/ —
// 27 real, unreachable-while-frozen instances. The honest way to record that is a
// directory exclusion with the standing reason cited once here, not 27 allow-list
// entries (an allow-list that long is the same "nobody got around to fixing it" outcome
// this file's own header warns against, just spelled differently). sandbox/ is not
// walked by this rule at all.
//
// ── Tags excluded because they do not ship a role of their own ──────────────────────
// The component-scoped detector (component-class-scope.mjs) only knows "this is a
// capitalised JSX tag with a className-shaped prop" — it cannot know whether that tag's
// OWN recipe carries a text-role utility. Five tags matched during Issue 07a's manual
// 40→28 count that were checked against their own src/ui/ source and found to carry NO
// font-size role themselves (CardTitle/CardContent render a plain heading/div with no
// text-* role; PopoverContent, ContextMenuTrigger and NavLink are structural/positioning
// wrappers, not typography slots) — overriding their size is not overriding a role,
// because there is no role there to override. Excluded by name below rather than
// re-deriving "does this tag ship a role" from the SLOT_TABLE check-type-slots.mjs
// already maintains, which is keyed to literal anchors inside src/ui/, not tag names as
// consumed elsewhere.
//
// R7 starts blocking from its first commit — not added to NON_BLOCKING_RULES below. R6
// spent two phases (Issue 06 through 06h) non-blocking before anyone noticed the gate
// was red regardless; starting R7 the same way risks the identical failure mode for no
// reason, since at introduction R7's count is 0 in-scope (the one editable instance,
// Layout.tsx:46, is a design question left in place and reported — see the commit's own
// report, not this file — because Button structurally cannot express the token this
// element needs; that is not this rule relaxing, it is TYPE_UTILITIES_ALLOWED-style
// allow-listing with its own cited reason, same mechanism R6 already uses).
// ═══════════════════════════════════════════════════════════════════════════════════
const NON_ROLE_BEARING_TAGS = new Set(["CardTitle", "CardContent", "PopoverContent", "ContextMenuTrigger", "NavLink"])

const COMPONENT_TYPE_OVERRIDES_ALLOWED = [
  {
    file: "site/src/components/Layout.tsx",
    match: "text-xs font-medium uppercase tracking-wide",
    reason:
      "Category-header Button (Collapsible trigger). Its recipe (12/16/500/+wide uppercase) matches type-eyebrow almost exactly, but type-eyebrow's own token description says \"site and documentation surfaces only... do not wire a component to it\" and Button's cva ships no size/variant that produces an eyebrow-style recipe — its base class always sets text-control. Adding one is a component-API decision, not a cleanup (Issue 07a's own \"what not to do\"); the honest fix may be that this element should not be a Button, which is a separate design decision for its own commit. Left in place and reported.",
  },
]

function isComponentOverrideAllowed(path, cls) {
  return COMPONENT_TYPE_OVERRIDES_ALLOWED.some((e) => e.file === path && cls.includes(e.match))
}

async function ruleNoCallerTypeOverride() {
  const seenAllowed = new Set()
  const files = await walk(join(REPO_ROOT, "site", "src"))
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, tagName, viaVariable, index } of componentClassLiterals(source)) {
      if (NON_ROLE_BEARING_TAGS.has(tagName)) continue
      if (!hasForbiddenTypeUtility(cls)) continue
      if (isComponentOverrideAllowed(path, cls)) {
        seenAllowed.add(`${path}::${cls}`)
        continue
      }
      const via = viaVariable ? ` (via ${viaVariable})` : ""
      report("type.no-caller-override", path, lineOf(source, index), `<${tagName}>${via} "${cls.slice(0, 100)}"`)
    }
  }
  for (const e of COMPONENT_TYPE_OVERRIDES_ALLOWED) {
    const stillPresent = [...seenAllowed].some((k) => k.startsWith(`${e.file}::`) && k.includes(e.match))
    if (!stillPresent) notes.push(`R7 allow-list entry ${e.file} (${e.match}) no longer matches anything — the entry can go`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R8 — a box-padding value used across ≥3 files in src/ui/ must be a decision on record.
//
// Issue 07g. Density's height axis tokenised cleanly because "be an N-height box" is one
// job in every component that has it; its padding axis did not, and 07e–07f established
// why: a shared raw pixel value is NOT evidence of a shared job. The most-reused inline
// paddings host the MOST distinct jobs — px-2 lands on a badge pill, a toggle inset, a
// tab trigger and eleven other unrelated controls — so "same value, N files" cannot, by
// itself, mean "same job." Structural sameness (icon-conditionality, height-pairing,
// fixed-vs-content sizing) is what decides, and that is not computable from a class string.
//
// So this rule does NOT assert "≥3 files ⇒ must be tokenised." That assertion is false
// here and would flag fourteen combos that 07e–07f already adjudicated as either container
// padding (permanently raw) or one value hosting many jobs — reproducing R6's original
// mistake (hundreds of violations nobody clears) in miniature. What the evidence DOES
// support is narrower and true: once a box-padding value recurs across three or more files
// it is common enough that a new adopter deserves a moment's adjudication, because the two
// genuine shared padding jobs this project found — menu-item-padding-y and -x — were BOTH
// found at exactly three files. Three files is therefore the notify threshold, not a
// tokenise mandate: at 3+ a combo must be a decision ON RECORD — tokenised (a named job)
// OR listed in PADDING_ADJUDICATED below with its category and reason. A 3+ combo that is
// NEITHER is the violation: an unadjudicated recurrence, which is exactly the moment a
// future shared job would first look like every other coincidence and slip through.
//
// Why not a file-count number that separates signal from coincidence? There isn't one.
// The two real jobs sit at 3 files; container padding reaches 3–7 (p-1 at 7, p-4 at 6);
// pure coincidence reaches 3–13 (px-2 at 13). The three populations overlap completely
// across the whole 3+ range, so no threshold partitions them — the separator is
// structural, not numeric, and a class-string scan cannot see it. The rule buys a human
// look at each recurrence; it does not pretend to judge the job itself.
//
// ── Scope: box padding only; offsets excluded ───────────────────────────────────────
// Only p-/px-/py- (nonzero) are scanned — see lib/padding-scan.mjs's header. Single-edge
// pt-/pr-/pb-/pl- are out of scope because a single-edge padding job (pr-… keeping content
// off an edge) and a positional offset (pl-8, the fixed indicator gutter clearing an
// absolutely-positioned check) are the same shape in the class string and separable only
// by inspecting a sibling's position, which a lexical scan cannot do. Two single-edge
// combos reach 3 files today and are deliberately NOT flagged: pl-2 (calendar/combobox/
// select) and pl-8 (context-menu/dropdown-menu/menubar, the canonical indicator gutter).
//
// Each PADDING_ADJUDICATED entry cites a category, same discipline as every allow-list in
// this file: "container" = the box's own inset on a surface/container, decided permanently
// raw in 07g (tokenising container padding and gaps is explicitly out of scope); "coincidence"
// = a common control inline/block value carrying distinct jobs per 07e's method, where a
// name would lengthen the value without describing a job. An entry that stops reaching 3
// files self-reports below so it can be removed.
// ═══════════════════════════════════════════════════════════════════════════════════
const PADDING_MIN_FILES = 3

const PADDING_ADJUDICATED = [
  // Container / surface padding — the box's OWN inner inset on a floating surface or a
  // layout container. Out of scope for tokenisation in 07g (container padding and gaps
  // stay raw). Reported so the owner can see which container paddings recur widely.
  { combo: "p-1", category: "container", reason: "menu/listbox/command surface inner inset (dropdown/context/menubar/command/combobox/select) + attachment media box" },
  { combo: "p-4", category: "container", reason: "floating-surface body padding (drawer/hover-card/popover/sheet) + item/rail container" },
  { combo: "p-2", category: "container", reason: "container inset (navigation-menu/sidebar/table/rail) + attachment media box" },
  { combo: "p-6", category: "container", reason: "large dialog-surface body padding (alert-dialog/dialog/empty)" },
  // Coincidence — a common control inline/block padding value that lands on structurally
  // distinct jobs across its files (07e: a shared value is not a shared job). Naming it
  // would produce a value with a longer name, not a job description. Kept raw.
  { combo: "px-2", category: "coincidence", reason: "8px inline inset across distinct controls (badge pill, toggle, tab/select triggers, table cell, field, command/combobox, menubar trigger, …)" },
  { combo: "px-3", category: "coincidence", reason: "12px inline inset across distinct controls (input/textarea/select/native-select, bubble, message, tooltip, toggle-group)" },
  { combo: "py-2", category: "coincidence", reason: "8px block inset across distinct controls (bubble, native-select, navigation-menu, select, textarea, combobox, rail)" },
  { combo: "py-1.5", category: "coincidence", reason: "6px block inset across distinct controls (chart, combobox, command, input-group, select, tooltip)" },
  { combo: "px-2.5", category: "coincidence", reason: "10px inline inset across distinct controls (chart, combobox, input-group, pagination, sidebar, attachment)" },
  { combo: "px-1.5", category: "coincidence", reason: "6px inline inset across distinct controls (bubble, combobox, toggle, rail, attachment)" },
  { combo: "py-1", category: "coincidence", reason: "4px block inset across distinct controls (menubar, native-select, select, tabs, attachment)" },
  { combo: "py-3", category: "coincidence", reason: "12px block inset across distinct controls (command, input-group, item, rail)" },
  { combo: "px-4", category: "coincidence", reason: "16px inline inset across distinct controls (button-group, item, navigation-menu)" },
  { combo: "py-0.5", category: "coincidence", reason: "2px block inset across distinct controls (badge pill, bubble, sidebar) — 07f Finding 3, single-consumer-per-job" },
]

async function ruleShared3FilePadding() {
  const uiFiles = await walk(join(REPO_ROOT, "src", "ui"))
  // combo -> { files:Set, first:{path,line} } — the first occurrence anchors the report,
  // since a cross-file combo has no single site.
  const combos = new Map()
  for (const file of uiFiles) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, index } of classLiterals(source)) {
      for (const { combo } of boxPaddingUtilities(cls)) {
        if (!combos.has(combo)) combos.set(combo, { files: new Set(), first: null })
        const rec = combos.get(combo)
        rec.files.add(path)
        if (rec.first === null) rec.first = { path, line: lineOf(source, index) }
      }
    }
  }
  const adjudicated = new Set(PADDING_ADJUDICATED.map((e) => e.combo))
  const seenAdjudicated = new Set()
  for (const [combo, rec] of combos) {
    if (rec.files.size < PADDING_MIN_FILES) continue
    if (adjudicated.has(combo)) {
      seenAdjudicated.add(combo)
      continue
    }
    const list = [...rec.files].sort().join(", ")
    report(
      "padding.shared-3-file",
      rec.first.path,
      rec.first.line,
      `${combo} is used in ${rec.files.size} files (${list}) but is neither tokenised nor adjudicated — name a semantic if it is one shared job, or record it in PADDING_ADJUDICATED with its category`,
    )
  }
  // An adjudication that no longer reaches the threshold is one nobody will notice is stale.
  for (const e of PADDING_ADJUDICATED) {
    if (!seenAdjudicated.has(e.combo)) {
      notes.push(`R8 adjudication for ${e.combo} (${e.category}) no longer reaches ${PADDING_MIN_FILES} files — the entry can go`)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R9 — no raw Tailwind stock elevation utility in src/ui/ (the elevation gate).
//
// Issues 07p and 07q tokenised the two stock shadow families this project uses: six
// md-tier surfaces (combobox, hover-card, popover, select content, the rail-sidebar
// browsing panel, the navigation-menu indicator arrow) now read shadow-elevation-md, and
// three lg-tier surfaces (alert-dialog, dialog, sheet) read shadow-elevation-lg. Both
// commits proved from dist/system.css that the stock .shadow-md / .shadow-lg rules then
// DISAPPEARED — Tailwind stops emitting a utility no scanned source references. So this
// gate guards the SOURCE: the first raw shadow-md or shadow-lg to reappear in src/ui
// silently re-materialises the stock rule and makes elevation-md/-lg's own $description
// (which names all nine consumers) false again — the exact defect class 07p/07q closed.
//
// Zero threshold, blocking: one raw shadow-md or shadow-lg in src/ui fails the build —
// the same shape as R6 (source-scoped, comment-stripped, reason-carrying allow-list).
//
// Why the scan also matches shadow-xl, when the assertion is about md/lg: chart.tsx
// carries the one remaining raw stock elevation utility, a shadow-xl the queue chose to
// leave unnamed (a single consumer, no shared job to name). That is a deliberate
// exception, and an exception in this file is a LIVE allow-list entry that self-reports
// when it goes stale — not a tier quietly left outside the scan, which would record the
// decision nowhere and leave the entry below matching nothing (and, in the R8/R6 shape,
// perpetually reporting itself removable). So the stock tiers md|lg|xl are all scanned:
// md and lg find zero, xl finds chart.tsx alone, and that one match is allow-listed with
// its reason. A NEW shadow-xl consumer fails here until it is rewired or given its own
// ELEVATION_ALLOWED entry — which is the gate working, not the gate too wide.
//
// Deliberately NOT matched: bare `shadow` (Tailwind's default tier, e.g. the
// navigation-menu viewport), the shadow-none resets, and the shadow-elevation-* tokens
// themselves (shadow-md is not a substring of shadow-elevation-md, and the token bracket
// on either side of md|lg|xl keeps the two apart). shadow-xs / shadow-sm are out of THIS
// gate's scope — this commit does not widen it past the two families just put on record.
// ═══════════════════════════════════════════════════════════════════════════════════
const RAW_STOCK_ELEVATION_RE = /(?<![\w-])shadow-(?:md|lg|xl)(?![\w-])/

const ELEVATION_ALLOWED = [
  { file: "src/ui/chart.tsx", match: "shadow-xl", reason: "Intentional — one consumer, deliberately unnamed" },
]

function isElevationAllowed(path, cls) {
  return ELEVATION_ALLOWED.some((e) => e.file === path && cls.includes(e.match))
}

async function ruleNoRawElevation() {
  const seenAllowed = new Set()
  const files = await walk(join(REPO_ROOT, "src", "ui"))
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, index, truncated } of classLiterals(source)) {
      if (truncated) {
        // Same floor as R6: no src/ui/ literal is near the 2000-char cap, so this is
        // expected never to fire; if it does, the scan below it is a floor, not a pass.
        report("elevation.no-raw-shadow", path, lineOf(source, index), `literal exceeds ${cls.length}+ chars — truncated before scanning, not fully checked`)
        continue
      }
      const hit = cls.match(RAW_STOCK_ELEVATION_RE)?.[0]
      if (!hit) continue
      if (isElevationAllowed(path, cls)) {
        seenAllowed.add(`${path}::${cls}`)
        continue
      }
      report("elevation.no-raw-shadow", path, lineOf(source, index), `raw ${hit}: "${cls.slice(0, 90)}"`)
    }
  }
  for (const e of ELEVATION_ALLOWED) {
    const stillPresent = [...seenAllowed].some((k) => k.startsWith(`${e.file}::`) && k.includes(e.match))
    if (!stillPresent) notes.push(`R9 allow-list entry ${e.file} (${e.match}) no longer matches anything — the entry can go`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// R10 — no raw arbitrary-value ring WIDTH in src/ui/ (the focus-ring-width gate).
//
// Issue 07s tokenised the one ring width this project uses: nineteen src/ui focus-ring
// surfaces — accordion, badge, button, calendar, checkbox, combobox, input, input-group,
// input-otp, item, native-select, navigation-menu, radio-group, scroll-area, select,
// switch, tabs, textarea, toggle — that each carried a raw ring-[3px] now read ring-focus,
// an @utility in system.css reading the authored --ring-focus token, which tailwind-merge
// is taught to keep via the ring-w group (src/lib/tw-merge.mjs). The build proved from
// dist/system.css that the stock .*:ring-[3px] rules then vanished, exactly as the two
// elevation families did under R9. This gate guards the SOURCE: the first raw
// ring-[<number>] to reappear in src/ui re-materialises a stock arbitrary-width rule and
// makes ring-focus's role (and its token's $description) false again — the defect 07s closed.
//
// Zero threshold, blocking — the R9 shape (source-scoped, comment-stripped). It ships with
// an EMPTY allow-list: unlike R9's chart.tsx shadow-xl there is no ring-width exception, and
// the regex is narrow enough that none of the legitimate ring utilities need one. The list
// and its stale-note loop are kept so a future exception has the same self-reporting home.
//
// The claim is deliberately narrow — ARBITRARY-VALUE widths only. The regex matches `ring-[`
// immediately followed by a digit, i.e. a bracketed length like ring-[3px]. It does NOT
// match, and is not meant to:
//   • stock numeric widths ring-0/1/2/3/4 — Tailwind's own scale, which have no token to
//     read and are out of this commit's scope (e.g. bubble.tsx's decorative ring-3, and the
//     ring-2 focus rings on avatar/dialog/sheet/sidebar). Naming those is a later pass.
//   • ring-offset-[…] — a different CSS property (ring offset, not ring width).
//   • ring colours — ring-ring, ring-sidebar-ring, ring-foreground/10 — the [isAny] colour
//     namespace, a different axis entirely.
//   • ring-[length:var(--ring-focus)] — the @utility's own definition, which lives in
//     system.css (not src/ui) and begins with a letter, not a digit, so it is excluded twice.
// ═══════════════════════════════════════════════════════════════════════════════════
const RAW_RING_WIDTH_RE = /(?<![\w-])ring-\[[0-9]/

const RING_WIDTH_ALLOWED = []

function isRingWidthAllowed(path, cls) {
  return RING_WIDTH_ALLOWED.some((e) => e.file === path && cls.includes(e.match))
}

async function ruleNoRawRingWidth() {
  const seenAllowed = new Set()
  const files = await walk(join(REPO_ROOT, "src", "ui"))
  for (const file of files) {
    const path = rel(file)
    const source = stripComments(await readFile(file, "utf8"))
    for (const { value: cls, index, truncated } of classLiterals(source)) {
      if (truncated) {
        report("ring.no-raw-width", path, lineOf(source, index), `literal exceeds ${cls.length}+ chars — truncated before scanning, not fully checked`)
        continue
      }
      const hit = cls.match(RAW_RING_WIDTH_RE)?.[0]
      if (!hit) continue
      if (isRingWidthAllowed(path, cls)) {
        seenAllowed.add(`${path}::${cls}`)
        continue
      }
      report("ring.no-raw-width", path, lineOf(source, index), `raw arbitrary ring width ${hit}…]: "${cls.slice(0, 90)}"`)
    }
  }
  for (const e of RING_WIDTH_ALLOWED) {
    const stillPresent = [...seenAllowed].some((k) => k.startsWith(`${e.file}::`) && k.includes(e.match))
    if (!stillPresent) notes.push(`R10 allow-list entry ${e.file} (${e.match}) no longer matches anything — the entry can go`)
  }
}

// Issue 06d: R6's own header (above, "no raw Tailwind type utility") used to declare
// it "deliberately NOT wired into a blocking `npm run *` script" — that comment
// described intent this file's exit code never actually honored at the time.
// `violations.length` summed every rule together, so `node scripts/check-rules.mjs`
// run directly (exactly how R6's header said to read its output) exited 1 off R6's own
// findings, independent of whatever R4 or any other rule reported. That mismatch, not
// R4's regression, was why the gate could not reach green by fixing R4 alone. Fixed
// then by aggregating exit status from the rules that were actually blocking.
//
// Issue 06h: R6 itself became blocking and this Set went empty. Every rewireable slot in
// src/ui/ had been rewired (Issue 05, 06a-06h); a raw type utility on an element's own
// string is a real exit-1 failure, same as R1-R4, unless it carries a
// TYPE_UTILITIES_ALLOWED entry with a stated reason.
//
// Issue 07h: R6b (type.descendant-scoped) is the one non-blocking member — see its header
// above. It is non-blocking by design, not as a grace period: a raw size on a descendant/
// pseudo-element slot is out of an element role's reach, so its count is a reported fact to
// be re-adjudicated on sight, not a build failure to be forced to zero. Blocking R6 and
// non-blocking R6b are two halves of one scan; keeping R6b out of the exit code is what
// stops it from re-hiding, as an exit-1 pressure to empty it, exactly what it exists to
// surface.
const NON_BLOCKING_RULES = new Set(["type.descendant-scoped"])

// ── run ─────────────────────────────────────────────────────────────────────────────
const SHIPPED = [join(REPO_ROOT, "src"), join(REPO_ROOT, "site", "src"), join(REPO_ROOT, "sandbox", "src")]
const files = (await Promise.all(SHIPPED.map((d) => walk(d)))).flat()

await ruleIconSources(files)
await ruleNoRawScroll()
await ruleIconMarker(files)
await ruleLeadingNoneTruncate(files)
await ruleNoRawTypeUtility()
await ruleDescendantScopedType()
await ruleNoCallerTypeOverride()
await ruleShared3FilePadding()
await ruleNoRawElevation()
await ruleNoRawRingWidth()

if (JSON_OUT) {
  console.log(JSON.stringify({ violations, notes }, null, 2))
} else {
  console.log(`\nchecked ${files.length} source files across src/, site/src/, sandbox/src/\n`)
  if (!violations.length) console.log("  no violations")
  const byRule = new Map()
  for (const v of violations) byRule.set(v.rule, [...(byRule.get(v.rule) ?? []), v])
  for (const [rule, list] of byRule) {
    const tag = NON_BLOCKING_RULES.has(rule) ? " (non-blocking)" : ""
    console.log(`  ${rule} — ${list.length} violation(s)${tag}`)
    for (const v of list) console.log(`      ${v.file}:${v.line}  ${v.detail}`)
  }
  for (const n of notes) console.log(`\n  NOTE  ${n}`)
  console.log("\n  R5 (origin quarantine) is owned by scripts/check-quarantine.mjs and not duplicated here.")
}

const blockingViolations = violations.filter((v) => !NON_BLOCKING_RULES.has(v.rule))
if (blockingViolations.length) process.exitCode = 1
