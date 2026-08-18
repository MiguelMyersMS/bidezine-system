// ═══════════════════════════════════════════════════════════════════════════════════
// Proof that a rewired type slot actually ships what it claims.
//
//   npm run build && node scripts/check-type-slots.mjs
//
// Issue 05b, finding 3: the original plan for this proof pointed at verifier/ (retired
// Sandbox infra — see docs/PIVOT-2026-08-15.md) and at a component-render assertion this
// repo has no test runner to execute. Neither exists, so this is built on what the repo
// actually has: a real build, and files on disk.
//
// Two links per rewired slot, both required:
//
//   Link A — SOURCE: the named file's class string for that slot contains the role
//   utility (text-control, text-body, …) and none of R6's forbidden raw size/leading/
//   tracking utilities. This is "the component still asks for the role", not "the role
//   is correct" — Link B is what proves the value.
//
//   Link B — COMPILED: dist/system.css defines a `.text-<role>{…}` rule whose font-size,
//   line-height, font-weight and letter-spacing resolve to the expected literals. This is
//   read from the BUILT stylesheet, the artifact a consumer installs — the same reasoning
//   check-shipped-tokens.mjs is built on, and for the same reason: a source file or a
//   database row can say anything; only the shipped CSS says what ships.
//
// The expected values below are LITERALS, copied from Issue 05b's shipped-value table.
// They are never read back out of the current build. A check whose expectation is
// derived from the thing it is checking passes by construction and proves nothing — if
// Finding 3 taught this repo anything it is that a check must take its input from a
// source independent of what it verifies, not construct its own idea of "expected".
//
// Exit 1 on any violation.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT } from "../verifier/lib/db.mjs"

const SHIPPED_CSS = join(REPO_ROOT, "dist", "system.css")

/** Same stripping check-rules.mjs uses, and for the same reason: a role name mentioned in
 * a comment (this file's own header does it repeatedly) must never count as a reference. */
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(Math.max(0, m.length - p.length)))

const lineOf = (source, index) => source.slice(0, index).split("\n").length

// Duplicated from scripts/check-rules.mjs's R6, not imported. check-shipped-tokens.mjs
// already established the precedent of a self-contained gate script over an interdependent
// one (it duplicates stripComments/walk rather than importing them), and R6 is explicitly
// NOT wired into the npm chain this script IS wired into — importing from it would make
// this script's exit code depend on a module whose own file says it must stay unblocking.
//
// The quoted-literal capture below uses a longer cap than R6's own `{0,600}` — src/ui/
// tabs.tsx's TabsTrigger literal alone runs past 700 characters, and a cap shorter than
// the literal it is meant to capture makes the regex fail to find the closing quote at
// all (proven against this exact file while building this script). R6 carries the smaller
// cap; that is R6's file to fix, not this one's to inherit silently.
const FONT_SIZE_RE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/
const FONT_SIZE_ARBITRARY_RE = /\btext-\[(?:length:[^\]]+|[\d.]+(?:px|rem|em))\]/
const LEADING_RE = /\bleading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])\b/
const TRACKING_RE = /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/

// ── the slot table ──────────────────────────────────────────────────────────────────
// expected values are [font-size, line-height, font-weight, letter-spacing] literals.
const SLOT_TABLE = [
  { file: "src/ui/button.tsx", slot: "Button label", role: "control" },
  { file: "src/ui/button-group.tsx", slot: "ButtonGroup text", role: "control" },
  { file: "src/ui/tabs.tsx", slot: "TabsTrigger label", role: "control" },
  { file: "src/ui/toggle.tsx", slot: "Toggle label", role: "control" },
  { file: "src/ui/accordion.tsx", slot: "AccordionTrigger label", role: "control" },

  { file: "src/ui/table.tsx", slot: "Table root text", role: "body" },
  { file: "src/ui/dialog.tsx", slot: "DialogDescription", role: "body" },
  { file: "src/ui/card.tsx", slot: "CardDescription", role: "body" },
  { file: "src/ui/select.tsx", slot: "SelectItem", role: "body" },
  { file: "src/ui/breadcrumb.tsx", slot: "Breadcrumb root text", role: "body" },
  { file: "src/ui/item.tsx", slot: "ItemDescription", role: "body", note: "absorbed slot — 21px → 20px line-height, deliberate." },

  { file: "src/ui/input.tsx", slot: "Input (base breakpoint)", role: "body-lg" },

  { file: "src/ui/tooltip.tsx", slot: "TooltipContent", role: "caption" },
  { file: "src/ui/select.tsx", slot: "SelectLabel", role: "caption" },
  { file: "src/ui/badge.tsx", slot: "Badge regular", role: "caption" },
  { file: "src/ui/calendar.tsx", slot: "Calendar weekday", role: "caption", note: "absorbed slot — 12.8px → 12px line-height, deliberate." },

  { file: "src/ui/kbd.tsx", slot: "Kbd", role: "control-sm" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarGroupLabel", role: "control-sm" },
  { file: "src/ui/message.tsx", slot: "Message author", role: "control-sm" },
  { file: "src/ui/combobox.tsx", slot: "Combobox chip", role: "control-sm" },
  { file: "src/ui/badge.tsx", slot: "Badge emphasis", role: "control-sm" },

  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenu shortcut", role: "shortcut" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenu shortcut", role: "shortcut" },
  { file: "src/ui/menubar.tsx", slot: "Menubar shortcut", role: "shortcut" },
  { file: "src/ui/command.tsx", slot: "Command shortcut", role: "shortcut" },

  { file: "src/ui/label.tsx", slot: "Label", role: "label" },
  { file: "src/ui/item.tsx", slot: "ItemTitle", role: "label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },
  { file: "src/ui/field.tsx", slot: "FieldTitle", role: "label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },

  { file: "src/ui/dialog.tsx", slot: "DialogTitle", role: "heading-sm" },

  { file: "src/ui/alert-dialog.tsx", slot: "AlertDialogTitle", role: "heading-sm-loose" },
  { file: "src/ui/empty.tsx", slot: "EmptyTitle", role: "heading-sm-loose" },
]

// Expected compiled values, keyed by role — the literal table from Issue 05b's spec.
// Roles NOT listed here (display, heading-lg, heading, body-strong, eyebrow, metric,
// metric-sm, code) have no consumer in src/ui, so Tailwind v4's source-scanning emitter
// never generates their utility class — @theme declares the custom properties regardless,
// but `.text-<role>{…}` only exists in dist/system.css if some source file's class string
// actually asked for it. A role missing from the build because nothing consumes it is
// expected, not a failure; it is why Link B only runs for roles that appear below.
const EXPECTED = {
  control: { fontSize: "14px", lineHeight: "20px", fontWeight: "500", letterSpacing: "0em" },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: "400", letterSpacing: "0em" },
  "body-lg": { fontSize: "16px", lineHeight: "24px", fontWeight: "400", letterSpacing: "0em" },
  caption: { fontSize: "12px", lineHeight: "16px", fontWeight: "400", letterSpacing: "0em" },
  "control-sm": { fontSize: "12px", lineHeight: "16px", fontWeight: "500", letterSpacing: "0em" },
  shortcut: { fontSize: "12px", lineHeight: "16px", fontWeight: "400", letterSpacing: "0.1em" },
  label: { fontSize: "14px", lineHeight: "14px", fontWeight: "500", letterSpacing: "0em" },
  "heading-sm": { fontSize: "18px", lineHeight: "18px", fontWeight: "600", letterSpacing: "0em" },
  "heading-sm-loose": { fontSize: "18px", lineHeight: "28px", fontWeight: "600", letterSpacing: "0em" },
}

// ── Link A ──────────────────────────────────────────────────────────────────────────
// A word-boundary match on "text-<role>" alone would let role="control" match inside the
// literal "text-control-sm" (there IS a \b between "control" and the following "-", since
// letter/hyphen is itself a word/non-word transition). The (?!-) guard refuses that: it
// only matches when the role name is not immediately followed by another hyphenated
// segment, so "control" cannot claim a hit that belongs to "control-sm", and "heading-sm"
// cannot claim one that belongs to "heading-sm-loose".
function roleRegex(role) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\btext-${escaped}(?!-)\\b`)
}

// ── Element-targeting vs condition-only variants ───────────────────────────────────
// A slot check asks whether THIS element carries a raw type utility. A variant that
// changes what gets styled — a pseudo-element or a descendant — takes the declaration
// out of this element's scope entirely, so it is not this question's concern regardless
// of what utility it carries. A variant that only changes the CONDITION under which
// this same element is styled (a breakpoint, a state, a theme) leaves the element being
// styled unchanged, so it stays in scope — `md:text-sm` on the slot itself is still the
// slot at a different breakpoint, and must still be a role.
//
// Named element-targeting variants: pseudo-elements Tailwind ships variants for.
const ELEMENT_TARGETING_NAMED = new Set([
  "file",
  "placeholder",
  "before",
  "after",
  "marker",
  "selection",
  "first-line",
  "first-letter",
  "backdrop",
])
// Arbitrary descendant/child selectors: "[&_svg]" (space, encoded "_") or "[&>span]"
// (direct child, ">") both select something other than the element the base utility
// class lives on.
const ELEMENT_TARGETING_ARBITRARY_RE = /^\[&[_>]/

/** Splits a Tailwind utility token on ':' into its variant chain plus trailing utility,
 * ignoring colons that appear inside `[...]` (an arbitrary value like `text-[length:1rem]`
 * has a colon that is not a variant separator). Returns { variants, utility }. */
function splitVariantChain(token) {
  const parts = []
  let depth = 0
  let current = ""
  for (const ch of token) {
    if (ch === "[") depth++
    if (ch === "]") depth--
    if (ch === ":" && depth === 0) {
      parts.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  parts.push(current)
  return { variants: parts.slice(0, -1), utility: parts[parts.length - 1] }
}

function isElementTargetingToken(token) {
  const { variants } = splitVariantChain(token)
  return variants.some((v) => ELEMENT_TARGETING_NAMED.has(v) || ELEMENT_TARGETING_ARBITRARY_RE.test(v))
}

/** Removes every whitespace-delimited utility token whose variant chain contains an
 * element-targeting variant, leaving condition-only-variant and bare tokens (including
 * the slot's own role utility) in place for the forbidden-utility scan. */
function stripElementTargeting(cls) {
  return cls
    .split(/\s+/)
    .filter((token) => token.length > 0 && !isElementTargetingToken(token))
    .join(" ")
}

async function checkLinkA(entry) {
  const abs = join(REPO_ROOT, entry.file)
  const raw = await readFile(abs, "utf8").catch(() => null)
  if (raw === null) return { ok: false, detail: `file not found: ${entry.file}` }
  const source = stripComments(raw)
  const re = roleRegex(entry.role)

  for (const m of source.matchAll(/["'`]([^"'`\n]{0,2000})["'`]/g)) {
    const cls = m[1]
    if (!re.test(cls)) continue
    const scoped = stripElementTargeting(cls)
    const forbidden =
      FONT_SIZE_RE.test(scoped) || FONT_SIZE_ARBITRARY_RE.test(scoped) || LEADING_RE.test(scoped) || TRACKING_RE.test(scoped)
    if (forbidden) {
      return { ok: false, detail: `${entry.file}:${lineOf(source, m.index)} carries a forbidden utility alongside text-${entry.role}: "${cls.slice(0, 120)}"` }
    }
    return { ok: true, detail: `${entry.file}:${lineOf(source, m.index)}  "${cls.slice(0, 120)}"` }
  }
  return { ok: false, detail: `no class string in ${entry.file} references text-${entry.role}` }
}

// ── Link B ──────────────────────────────────────────────────────────────────────────
// Pull the .text-<role>{…} rule body out of the (minified, single-line) shipped
// stylesheet, then resolve each of its four properties to the custom property it
// references and that property's declared value. Properties are located by name inside
// the rule body, not by position — Tailwind's own emit order is not a contract this
// script should depend on.
function extractRuleBody(css, role) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = css.match(new RegExp(`\\.text-${escaped}\\{([^}]*)\\}`))
  return m ? m[1] : null
}

function resolveVar(css, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = css.match(new RegExp(`${escaped}:([^;}]+)[;}]`))
  return m ? m[1].trim() : null
}

// CSS minifiers drop a leading zero ("0.1em" → ".1em") and this repo's own build does
// exactly that (confirmed against the real dist/system.css). Compared numerically so that
// is not mistaken for a value mismatch — the literal expectation stays "0.1em" per the
// issue's own table; only the comparison normalises. Parses via parseFloat rather than
// stripping the dot by hand — a hand-rolled "drop the leading zero" regex was tried first
// and silently mismatched ".1em" against "0.1em" (parseFloat(".1") === parseFloat("0.1")
// is true; a string-shaped regex missed that), so the fix is to compare numbers, not text.
function sameCssNumber(a, b) {
  const parse = (v) => {
    const m = String(v)
      .trim()
      .match(/^(-?[\d.]+)([a-z%]*)$/i)
    if (!m) return null
    return { num: parseFloat(m[1]), unit: m[2] }
  }
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return String(a).trim() === String(b).trim()
  return pa.num === pb.num && pa.unit === pb.unit
}

function checkLinkB(css, role) {
  const expected = EXPECTED[role]
  const body = extractRuleBody(css, role)
  if (!body) return { ok: false, detail: `.text-${role}{…} not found in dist/system.css` }

  const props = [
    { key: "fontSize", cssProp: "font-size", varRe: /font-size:var\((--type-[a-z0-9-]+-font-size)\)/ },
    {
      key: "lineHeight",
      cssProp: "line-height",
      varRe: /line-height:var\(--tw-leading,var\((--type-[a-z0-9-]+-line-height)\)\)/,
    },
    {
      key: "letterSpacing",
      cssProp: "letter-spacing",
      varRe: /letter-spacing:var\(--tw-tracking,var\((--type-[a-z0-9-]+-letter-spacing)\)\)/,
    },
    {
      key: "fontWeight",
      cssProp: "font-weight",
      varRe: /font-weight:var\(--tw-font-weight,var\((--type-[a-z0-9-]+-font-weight)\)\)/,
    },
  ]

  const mismatches = []
  for (const p of props) {
    const varMatch = body.match(p.varRe)
    if (!varMatch) {
      mismatches.push(`${p.cssProp}: no var(--type-${role}-${p.cssProp}) reference found in the compiled rule`)
      continue
    }
    const value = resolveVar(css, varMatch[1])
    if (value === null) {
      mismatches.push(`${p.cssProp}: ${varMatch[1]} is referenced but never declared in dist/system.css`)
      continue
    }
    if (!sameCssNumber(value, expected[p.key])) {
      mismatches.push(`${p.cssProp}: expected ${expected[p.key]}, compiled value is ${value}`)
    }
  }

  if (mismatches.length) return { ok: false, detail: mismatches.join("; ") }
  return {
    ok: true,
    detail: `font-size ${expected.fontSize} / line-height ${expected.lineHeight} / font-weight ${expected.fontWeight} / letter-spacing ${expected.letterSpacing}`,
  }
}

// ── run ─────────────────────────────────────────────────────────────────────────────
let css
try {
  await stat(SHIPPED_CSS)
  css = await readFile(SHIPPED_CSS, "utf8")
} catch {
  console.error("\ndist/system.css is missing. Run `npm run build` first.")
  console.error("Refusing to report success against a build that does not exist.\n")
  process.exit(1)
}

const failures = []
let linksChecked = 0

console.log(`\nchecking ${SLOT_TABLE.length} rewired type slot(s), 2 links each\n`)

// Link B only needs to run once per distinct role, not once per slot — the compiled rule
// is the same regardless of how many components consume it — but is reported per slot so
// a failure is legible against the exact component it was raised for.
const rolesChecked = new Set()

for (const entry of SLOT_TABLE) {
  const a = await checkLinkA(entry)
  linksChecked++
  const b = checkLinkB(css, entry.role)
  linksChecked++
  rolesChecked.add(entry.role)

  const label = `${entry.slot} (${entry.file} → text-${entry.role})${entry.note ? `  [${entry.note}]` : ""}`
  if (a.ok && b.ok) {
    console.log(`  PASS  ${label}`)
    console.log(`        A: ${a.detail}`)
    console.log(`        B: ${b.detail}`)
  } else {
    console.log(`  FAIL  ${label}`)
    console.log(`        A: ${a.ok ? "ok — " + a.detail : "FAIL — " + a.detail}`)
    console.log(`        B: ${b.ok ? "ok — " + b.detail : "FAIL — " + b.detail}`)
    failures.push({ entry, a, b })
  }
}

console.log(`\n${SLOT_TABLE.length} slot(s), ${linksChecked} link(s) checked, ${new Set(SLOT_TABLE.map((e) => e.role)).size} distinct role(s)`)

if (failures.length === 0) {
  console.log(`\n  PASS  all ${SLOT_TABLE.length} slots trace from source through to the compiled stylesheet`)
  console.log(`\n${SLOT_TABLE.length}/${SLOT_TABLE.length} checks passed.`)
} else {
  console.log(`\n  FAIL  ${failures.length} of ${SLOT_TABLE.length} slot(s) did not verify:`)
  for (const f of failures) {
    console.log(`    ${f.entry.file} — ${f.entry.slot} (text-${f.entry.role})`)
    if (!f.a.ok) console.log(`      Link A: ${f.a.detail}`)
    if (!f.b.ok) console.log(`      Link B: ${f.b.detail}`)
  }
  console.log(`\n${SLOT_TABLE.length - failures.length}/${SLOT_TABLE.length} checks passed.`)
  process.exitCode = 1
}
