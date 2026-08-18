// ═══════════════════════════════════════════════════════════════════════════════════
// One correct string-literal matcher, shared by every rule/check that scans a class
// string for forbidden or required utilities.
//
// Issue 06c: three call sites — scripts/check-rules.mjs's R4 and R6, and
// scripts/check-type-slots.mjs's Link A — each carried their own copy of
// `/["'`]([^"'`\n]{0,N})["'`]/g`. That character class excludes ALL THREE quote
// characters, so it closes a literal on the FIRST occurrence of ANY of them, not the
// one it opened with. Every menu-item class string in this codebase contains an
// embedded single quote — `[&_svg:not([class*='size-'])]:size-4` — so a
// double-quoted literal containing that snippet was silently cut there, and
// whatever came after (including a raw text-sm a rule exists to catch) was invisible
// to the forbidden-utility scan. Issue 06b hit this directly: two anchors had to be
// shortened to stop before the embedded quote, which worked around the bug instead
// of fixing it. This module is the fix, written once.
//
// ── scripts/lib/ is not another gate ────────────────────────────────────────────────
// check-type-slots.mjs's own header used to justify NOT importing check-rules.mjs by
// name: "a self-contained gate script over an interdependent one... importing from it
// would make this script's exit code depend on a module whose own file says it must
// stay unblocking." That reasoning is about one GATE importing another GATE — R6 is
// explicitly documented as non-blocking, so a blocking script's exit code must never
// hinge on R6's own file. A neutral parsing helper that exports no verdict, no exit
// code and no notion of "passing", is not that: it is exactly the role
// scripts/lib/dependencies.mjs already plays for scan-dependencies.mjs. Importing
// class-literals.mjs into check-type-slots.mjs does not make it depend on R6 or on
// check-rules.mjs at all — both gates independently import this file, and neither
// imports the other. Do not "fix" this back into three duplicated regexes; that is
// the defect this file exists to retire.
// ═══════════════════════════════════════════════════════════════════════════════════

// Safety cap, in characters, from an opening quote to its closing one. This is NOT a
// truncation-by-design the way the old regex's `{0,N}` was — that quantifier made an
// oversized literal invisible to matchAll entirely (Issue 05c's finding: a literal
// longer than the cap has no closing quote within N characters, so the WHOLE match
// fails and the literal is skipped, silently, turning a violation count into a floor).
// This matcher instead scans forward character-by-character with no length limit on
// the search itself, and only consults LITERAL_CAP to decide when a literal has gone
// on long enough to call it pathological (an unterminated string, a minified blob,
// generated code) rather than a real Tailwind class list — the longest legitimate one
// measured in this codebase (src/ui/tabs.tsx's TabsTrigger) is under 800 characters.
// When that happens the literal is still yielded — never dropped — with `truncated:
// true` and `value` holding only the first LITERAL_CAP characters actually scanned.
// Every call site below treats `truncated` as its own finding, not as a value to
// silently consume: this is the same failure this whole issue exists to close, one
// level up, and it must not reopen here.
export const LITERAL_CAP = 2000

/**
 * Yields `{ value, index, truncated }` for every string/template literal in `source`,
 * in source order. `index` is the character offset of the OPENING quote.
 *
 * Correct in the four cases this module exists for:
 *
 *   - A double-quoted literal containing single quotes (`"...[class*='size-']..."`)
 *     and the reverse (a single-quoted literal containing double quotes): the scan
 *     anchors on the opening quote character and only a literal occurrence of THAT
 *     SAME character closes it — an embedded quote of the other kind is ordinary text.
 *   - A backslash-escaped quote of the literal's own kind (`"a \"b\" c"`): `\` plus
 *     the following character are consumed together and never tested as a closer,
 *     matching how the JS/TS parser itself treats the escape.
 *   - A template literal (`` ` ``), including one containing `${...}` interpolation:
 *     backtick literals may contain a literal newline (double/single-quoted ones may
 *     not — an unescaped `\n` ends the scan for those two kinds, since a real JS
 *     string literal cannot hold one), and text inside `${` … `}` is tracked by its
 *     own brace-depth counter so a `}` or a quote character written inside the
 *     interpolated expression does not close the template literal early. (This does
 *     not recursively re-parse the interpolated expression's own strings — no
 *     className template literal in this codebase interpolates a further string
 *     containing an unbalanced `{`/`}`, and if one ever does, over-counting depth is
 *     the safe direction: it keeps scanning rather than closing early and truncating
 *     real class text.)
 */
export function* classLiterals(source) {
  const len = source.length
  let i = 0
  while (i < len) {
    const ch = source[i]
    if (ch !== '"' && ch !== "'" && ch !== "`") {
      i++
      continue
    }
    const quote = ch
    const start = i
    let j = i + 1
    let closed = false
    let truncated = false
    let templateDepth = 0 // depth inside a `${ ... }` interpolation; 0 = plain literal text

    while (j < len) {
      const c = source[j]

      if (c === "\\") {
        j += 2 // the escape and the character it escapes are never a closing quote
        continue
      }

      if (quote === "`") {
        if (templateDepth === 0 && c === "$" && source[j + 1] === "{") {
          templateDepth = 1
          j += 2
          continue
        }
        if (templateDepth > 0) {
          if (c === "{") templateDepth++
          else if (c === "}") templateDepth--
          j++
          continue
        }
        if (c === "`") {
          closed = true
          break
        }
        // a literal newline is legal inside a template literal — keep scanning
      } else {
        if (c === "\n") break // real JS string literals can't hold a literal newline: not a match
        if (c === quote) {
          closed = true
          break
        }
      }

      if (j - start - 1 >= LITERAL_CAP) {
        truncated = true
        break
      }
      j++
    }

    if (!closed && !truncated) {
      // Hit EOF, or (for a "/'-quoted attempt) a literal newline before any closing
      // quote — this opening character does not start a literal this scan can
      // resolve. Resume one character past it so a later quote in the same run of
      // text still gets its own independent attempt, the same way the old regex
      // would simply fail to match and move on.
      i = start + 1
      continue
    }

    const end = truncated ? start + 1 + LITERAL_CAP : j
    yield { value: source.slice(start + 1, end), index: start, truncated }
    i = truncated ? end : j + 1
  }
}
