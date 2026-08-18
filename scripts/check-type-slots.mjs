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
//
// `anchor` is a required, distinctive substring of the slot's OWN class literal —
// something structural (a utility combination, a data-attribute selector, a container
// name), never a bare word likely to recur. Link A uses it to find that ONE literal
// among possibly several in the same file that reference the same role utility; without
// it, Link A silently matched the FIRST literal referencing the role, which is how the
// Calendar weekday false pass (Issue 06a) happened — the table's own note described an
// "absorbed slot" change on src/ui/calendar.tsx's week_number cell, but the entry's
// literal match landed on the ALREADY-rewired weekday cell instead, so the check reported
// PASS while week_number's arbitrary text-[0.8rem] shipped unexamined.
const SLOT_TABLE = [
  { file: "src/ui/button.tsx", slot: "Button label", role: "control", anchor: "justify-center gap-2 rounded-md text-control" },
  { file: "src/ui/button-group.tsx", slot: "ButtonGroup text", role: "control", anchor: "rounded-md border bg-muted px-4 text-control" },
  { file: "src/ui/tabs.tsx", slot: "TabsTrigger label", role: "control", anchor: "h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5" },
  { file: "src/ui/toggle.tsx", slot: "Toggle label", role: "control", anchor: "rounded-md text-control whitespace-nowrap transition-[color,box-shadow]" },
  { file: "src/ui/accordion.tsx", slot: "AccordionTrigger label", role: "control", anchor: "justify-between gap-4 rounded-md py-4 text-left text-control" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuLabel", role: "control", anchor: "text-control text-foreground data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuLabel", role: "control", anchor: "text-control data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/menubar.tsx", slot: "MenubarTrigger", role: "control", anchor: "px-2 py-1 text-control", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/menubar.tsx", slot: "MenubarLabel", role: "control", anchor: "text-control data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/navigation-menu.tsx", slot: "NavigationMenuTrigger style", role: "control", anchor: "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-control", note: "text-sm font-medium collapses to text-control; font-medium dropped." },

  { file: "src/ui/table.tsx", slot: "Table root text", role: "body", anchor: "caption-bottom text-body" },
  { file: "src/ui/dialog.tsx", slot: "DialogDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/card.tsx", slot: "CardDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/select.tsx", slot: "SelectItem", role: "body", anchor: "pr-8 pl-2 text-body" },
  { file: "src/ui/select.tsx", slot: "SelectTrigger", role: "body", anchor: "data-[size=default]:h-9 data-[size=sm]:h-8", note: "text-sm with no weight utility is text-body even though the element reads semantically as a control." },
  { file: "src/ui/breadcrumb.tsx", slot: "Breadcrumb root text", role: "body", anchor: "flex-wrap items-center gap-1.5 text-body" },
  { file: "src/ui/item.tsx", slot: "ItemDescription", role: "body", anchor: "line-clamp-2 text-body text-balance", note: "absorbed slot — 21px → 20px line-height, deliberate." },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuSubTrigger", role: "body", anchor: "select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuItem", role: "body", anchor: "data-[variant=destructive]:text-destructive" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuCheckboxItem/RadioItem", role: "body", anchor: "py-1.5 pr-2 pl-8 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none", literals: 2, note: "CheckboxItem and RadioItem share one byte-identical recipe — two consumers, one entry." },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuItem", role: "body", anchor: "active:bg-[var(--accent-pressed,var(--accent))]" },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuCheckboxItem", role: "body", anchor: "data-[state=checked]:bg-accent/50" },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuRadioItem", role: "body", anchor: "focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", note: "Anchor stops before the [class*='size-'] embedded single quote — the literal-capture regex treats an embedded ' as a closing quote, truncating cls there." },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuSubTrigger", role: "body", anchor: "data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0", note: "Anchor stops before the [class*='size-'] embedded single quote — see DropdownMenuRadioItem note." },
  { file: "src/ui/menubar.tsx", slot: "MenubarItem", role: "body", anchor: "data-[variant=destructive]:text-destructive" },
  { file: "src/ui/menubar.tsx", slot: "MenubarCheckboxItem/RadioItem", role: "body", anchor: "rounded-xs py-1.5 pr-2 pl-8 text-body outline-hidden select-none", literals: 2, note: "CheckboxItem and RadioItem share one byte-identical recipe — two consumers, one entry." },
  { file: "src/ui/menubar.tsx", slot: "MenubarSubTrigger", role: "body", anchor: "data-[inset]:pl-8 data-[state=open]:bg-accent" },
  { file: "src/ui/command.tsx", slot: "CommandInput", role: "body", anchor: "h-10 w-full rounded-md bg-transparent py-3 text-body outline-hidden placeholder:text-muted-foreground" },
  { file: "src/ui/command.tsx", slot: "CommandEmpty", role: "body", anchor: "py-6 text-center text-body" },
  { file: "src/ui/command.tsx", slot: "CommandItem", role: "body", anchor: "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground" },
  { file: "src/ui/combobox.tsx", slot: "Combobox item", role: "body", anchor: "data-highlighted:bg-accent data-highlighted:text-accent-foreground" },
  { file: "src/ui/combobox.tsx", slot: "Combobox empty", role: "body", anchor: "group-data-empty/combobox-content:flex" },
  { file: "src/ui/combobox.tsx", slot: "Combobox chips", role: "body", anchor: "min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input" },
  { file: "src/ui/navigation-menu.tsx", slot: "NavigationMenuLink", role: "body", anchor: "flex flex-col gap-1 rounded-sm p-2 text-body transition-all" },

  { file: "src/ui/input.tsx", slot: "Input (base breakpoint)", role: "body-lg", anchor: "px-3 py-1 text-body-lg" },

  { file: "src/ui/tooltip.tsx", slot: "TooltipContent", role: "caption", anchor: "bg-foreground px-3 py-1.5 text-caption" },
  { file: "src/ui/select.tsx", slot: "SelectLabel", role: "caption", anchor: "px-2 py-1.5 text-caption" },
  { file: "src/ui/badge.tsx", slot: "Badge regular", role: "caption", anchor: "text-caption" },
  { file: "src/ui/calendar.tsx", slot: "Calendar weekday", role: "caption", anchor: "flex-1 rounded-md text-caption", note: "absorbed slot — 12.8px → 12px line-height, deliberate." },
  { file: "src/ui/calendar.tsx", slot: "Calendar week number", role: "caption", anchor: "text-muted-foreground text-caption", note: "absorbed slot — 12.8px → 12px line-height, deliberate." },
  { file: "src/ui/combobox.tsx", slot: "Combobox group heading", role: "caption", anchor: "px-2 py-1.5 text-caption text-muted-foreground pointer-coarse:px-3", note: "condition-only pointer-coarse:text-sm variant is in scope per 05c and becomes pointer-coarse:text-body." },

  { file: "src/ui/kbd.tsx", slot: "Kbd", role: "control-sm", anchor: "bg-muted px-1 text-control-sm" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarGroupLabel", role: "control-sm", anchor: "px-2 text-control-sm text-sidebar-foreground/70" },
  { file: "src/ui/message.tsx", slot: "Message author", role: "control-sm", anchor: "px-3 text-control-sm text-muted-foreground" },
  { file: "src/ui/combobox.tsx", slot: "Combobox chip", role: "control-sm", anchor: "bg-muted px-1.5 text-control-sm" },
  { file: "src/ui/badge.tsx", slot: "Badge emphasis", role: "control-sm", anchor: "text-control-sm" },

  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenu shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenu shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/menubar.tsx", slot: "Menubar shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/command.tsx", slot: "Command shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },

  { file: "src/ui/label.tsx", slot: "Label", role: "label", anchor: "flex items-center gap-2 text-label" },
  { file: "src/ui/item.tsx", slot: "ItemTitle", role: "label", anchor: "flex w-fit items-center gap-2 text-label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },
  { file: "src/ui/field.tsx", slot: "FieldTitle", role: "label", anchor: "flex w-fit items-center gap-2 text-label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },

  { file: "src/ui/dialog.tsx", slot: "DialogTitle", role: "heading-sm", anchor: "text-heading-sm" },

  { file: "src/ui/alert-dialog.tsx", slot: "AlertDialogTitle", role: "heading-sm-loose", anchor: "text-heading-sm-loose sm:group-data-[size=default]" },
  { file: "src/ui/empty.tsx", slot: "EmptyTitle", role: "heading-sm-loose", anchor: "text-heading-sm-loose font-medium" },
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
  const expectedCount = entry.literals ?? 1

  // Every literal in the file that carries BOTH the role utility and this slot's own
  // anchor. Zero means the anchor doesn't identify this slot's literal (wrong anchor, or
  // the rewire never happened); more than expected means the anchor is ambiguous — a
  // check that silently used the first match regardless is exactly the bug this file
  // exists to fix (Issue 06a: the Calendar weekday entry matched the ALREADY-rewired
  // weekday cell while the actually-unrewired week_number cell, the one the "absorbed
  // slot" note was written about, went unchecked). An ambiguous anchor must fail loudly,
  // not silently pick one.
  //
  // `literals` (default 1) exists for the case an anchor genuinely cannot separate: two
  // elements sharing one byte-identical class string (Issue 06b: context-menu.tsx's
  // CheckboxItem/RadioItem, menubar.tsx's same pair). The count is EXACT, not a floor —
  // "at least N" would let a slot silently grow a third consumer that was never read
  // against this table, and report PASS on two literals while a new, unexamined third
  // one ships untouched. Every one of the `literals` matches is scanned; a violation in
  // any of them fails the whole entry, and every line number is reported.
  const matches = []
  for (const m of source.matchAll(/["'`]([^"'`\n]{0,2000})["'`]/g)) {
    const cls = m[1]
    if (re.test(cls) && cls.includes(entry.anchor)) matches.push({ cls, index: m.index })
  }

  if (matches.length === 0) {
    return { ok: false, detail: `no literal in ${entry.file} contains both text-${entry.role} and the anchor "${entry.anchor}"` }
  }
  if (matches.length !== expectedCount) {
    return {
      ok: false,
      detail: `the anchor "${entry.anchor}" matches ${matches.length} literal(s) in ${entry.file}; entry declares literals: ${expectedCount}`,
    }
  }

  const lines = matches.map((m) => lineOf(source, m.index))
  for (const { cls, index } of matches) {
    const scoped = stripElementTargeting(cls)
    const forbidden =
      FONT_SIZE_RE.test(scoped) || FONT_SIZE_ARBITRARY_RE.test(scoped) || LEADING_RE.test(scoped) || TRACKING_RE.test(scoped)
    if (forbidden) {
      return { ok: false, detail: `${entry.file}:${lineOf(source, index)} carries a forbidden utility alongside text-${entry.role}: "${cls.slice(0, 120)}"` }
    }
  }
  return { ok: true, detail: `${entry.file}:${lines.join(",")}  "${matches[0].cls.slice(0, 120)}"` }
}

// ── Table integrity ─────────────────────────────────────────────────────────────────
// Checked once, before the per-slot loop, and reported in its own section. An anchor
// that collides with another entry's anchor in the same file is exactly the ambiguity
// checkLinkA above refuses to resolve silently — catching it here, against the table
// itself, is cheaper than waiting for checkLinkA to fail per-slot and gives one place
// that states the whole table's anchors are pairwise distinct.
function checkTableIntegrity(table) {
  const problems = []

  for (const entry of table) {
    if (!entry.anchor || entry.anchor.trim() === "") {
      problems.push(`${entry.file} — ${entry.slot}: missing anchor`)
    }
  }

  const byFile = new Map()
  for (const entry of table) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, [])
    byFile.get(entry.file).push(entry)
  }

  for (const [file, entries] of byFile) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (entries[i].anchor && entries[i].anchor === entries[j].anchor) {
          problems.push(`${file}: "${entries[i].slot}" and "${entries[j].slot}" share the anchor "${entries[i].anchor}"`)
        }
      }
    }
  }

  // Same-role entries in the same file are the exact condition that produced the
  // Calendar weekday false pass, and issue 06 is about to make it common (several
  // slots on text-body in one menu file) — called out separately even though it is
  // already covered by the no-duplicate-anchor-per-file check above.
  const byFileRole = new Map()
  for (const entry of table) {
    const key = `${entry.file}::${entry.role}`
    if (!byFileRole.has(key)) byFileRole.set(key, [])
    byFileRole.get(key).push(entry)
  }
  const sameFileRole = [...byFileRole.entries()].filter(([, entries]) => entries.length > 1)

  return { problems, sameFileRole }
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

console.log(`\ntable integrity — ${SLOT_TABLE.length} entries\n`)
const integrity = checkTableIntegrity(SLOT_TABLE)
if (integrity.problems.length === 0) {
  console.log(`  PASS  every entry has a non-empty anchor, and no two entries in the same file share one`)
} else {
  console.log(`  FAIL  ${integrity.problems.length} table integrity problem(s):`)
  for (const p of integrity.problems) console.log(`    ${p}`)
}
if (integrity.sameFileRole.length === 0) {
  console.log(`  (no file currently holds more than one entry on the same role)`)
} else {
  console.log(`  ${integrity.sameFileRole.length} file/role pair(s) with multiple entries — anchors distinct per the check above:`)
  for (const [key, entries] of integrity.sameFileRole) {
    console.log(`    ${key}: ${entries.map((e) => `"${e.slot}" (${e.anchor})`).join(", ")}`)
  }
}
if (integrity.problems.length > 0) {
  console.log(`\nRefusing to run per-slot checks against a table that failed its own integrity check.\n`)
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
