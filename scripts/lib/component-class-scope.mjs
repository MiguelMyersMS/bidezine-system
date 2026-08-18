// ═══════════════════════════════════════════════════════════════════════════════════
// Which class-string literals land on a role-bearing component's own type, from the
// CALLER's side — the question R7 asks (scripts/check-rules.mjs), which is a different
// question from R6's "does a component's own recipe carry a raw type utility". R6 can
// assume every literal in the file IS a component's own class string, because src/ui/
// contains nothing else; a consumer page mixes raw HTML with component calls freely, so
// answering R7's question there means first finding which literals reach a component's
// *ClassName-shaped prop at all, then testing only those.
//
// Issue 07a: a whole-file literal scan (R6's own algorithm, pointed at site/src +
// sandbox/src) returned 427 hits, almost all page headings and code-sample markup that
// never claimed a role — proof that R6's claim ("this component's own class string...")
// is false outside src/ui/, not a bigger version of the same finding. This module is
// the narrower question asked properly: only literals that actually reach a capitalised
// JSX tag's className-shaped prop, whether directly, through a template literal, through
// a cn() call, or through a local variable.
//
// ── What counts as "reaching a *ClassName-shaped prop" ──────────────────────────────
//   direct    — `<Foo className="...">`, `<Foo inputClassName="...">`, any prop whose
//               name is exactly "className" or ends in "ClassName" (inputClassName,
//               triggerClassName, contentClassName, ...), assigned a plain string or
//               template literal, or the first argument(s) of a `cn(...)` call sitting
//               directly in that prop's value position.
//   variable  — `const x = "..."` / `const x = cn(...)`, later used as
//               `className={x}` (or any *ClassName-shaped prop) on a capitalised tag.
//               A cheap, deliberately bounded heuristic (see findVariableLiterals'
//               comment below), not a real data-flow analysis.
//
// ── What is deliberately NOT attempted ───────────────────────────────────────────────
// This is not a JSX/TS parser. It re-derives "which tag, which prop" from character
// offsets and bracket-depth counting, the same tradeoff lexical-scan.mjs makes for
// comments/literals: cheap, auditable, wrong only in constructions this codebase does
// not use (a literal split across multiple `+`-concatenated pieces, a *ClassName prop
// set through spread props, a variable reassigned between its declaration and use).
// None of those appear in this repo's src/ or site/src/ as of Issue 07a; if one is added
// later, this module will silently miss it, the same failure mode lexical-scan.mjs's own
// header names for `/` and regex literals.
// ═══════════════════════════════════════════════════════════════════════════════════

import { classLiterals } from "./lexical-scan.mjs"

const CLASSNAME_PROP_DIRECT_RE = /(?:^|[^\w$])([A-Za-z_$][\w$]*ClassName|className)\s*=\s*$/
const CLASSNAME_PROP_CN_RE = /(?:^|[^\w$])([A-Za-z_$][\w$]*ClassName|className)\s*=\s*\{?\s*cn\(\s*$/

/** Finds `const`/`let` declarations in `source` and, for each, the class-shaped
 * literals assigned to it within a short lookahead window (covers `cn("a", "b")` with
 * several string arguments) — used so a literal reaching a component through a named
 * variable is still attributable to that variable. Bounded and cheap, not a real
 * data-flow analysis; see this module's header. */
function findVariableLiterals(source) {
  const varLiterals = new Map()
  const declRe = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*/g
  let m
  while ((m = declRe.exec(source))) {
    const name = m[1]
    const afterEq = m.index + m[0].length
    const windowEnd = Math.min(source.length, afterEq + 600)
    const window = source.slice(afterEq, windowEnd)
    for (const { value, index, truncated } of classLiterals(window)) {
      if (truncated) continue
      if (!varLiterals.has(name)) varLiterals.set(name, [])
      varLiterals.get(name).push({ value, index: afterEq + index })
    }
  }
  return varLiterals
}

/**
 * Yields `{ value, index, tagName, viaVariable }` for every class-string literal in
 * `source` that lands on a *ClassName-shaped prop of a capitalised JSX tag — see this
 * module's header for exactly what that covers. `viaVariable` is the variable name if
 * the literal reached the prop indirectly, `null` if the literal is the prop's direct
 * value.
 */
export function* componentClassLiterals(source) {
  const varLiterals = findVariableLiterals(source)
  const usedAsPropCache = new Map()
  const usedAsProp = (name) => {
    if (usedAsPropCache.has(name)) return usedAsPropCache.get(name)
    const hit = new RegExp(`(?:^|[^\\w$])([A-Za-z_$][\\w$]*ClassName|className)\\s*=\\s*\\{\\s*${name}\\s*\\}`).test(source)
    usedAsPropCache.set(name, hit)
    return hit
  }

  for (const { value: cls, index, truncated } of classLiterals(source)) {
    if (truncated) continue

    const before = source.slice(Math.max(0, index - 120), index)
    const isDirect = CLASSNAME_PROP_DIRECT_RE.test(before) || CLASSNAME_PROP_CN_RE.test(before)

    let viaVariable = null
    if (!isDirect) {
      for (const [name, spans] of varLiterals) {
        if (spans.some((s) => s.index === index) && usedAsProp(name)) viaVariable = name
      }
      if (!viaVariable) continue
    }

    // Find the nearest enclosing JSX tag-open "<" with no depth-0 ">" between it and
    // the literal (a depth-0 ">" there means that tag already closed before the
    // literal, so it belongs to something else — a child, a sibling, code after it).
    let tagStart = -1
    for (let i = index; i >= 0; i--) {
      if (source[i] === "<" && /[A-Za-z]/.test(source[i + 1] || "")) {
        tagStart = i
        break
      }
    }
    if (tagStart === -1) continue
    const between = source.slice(tagStart, index)
    let depth = 0
    let closedEarly = false
    for (let i = 0; i < between.length; i++) {
      const ch = between[i]
      if (ch === "{") depth++
      else if (ch === "}") depth--
      else if (ch === ">" && depth === 0 && between[i - 1] !== "=") {
        closedEarly = true
        break
      }
    }
    if (closedEarly) continue
    const tagMatch = /^<([A-Za-z_$][\w$.]*)/.exec(between)
    if (!tagMatch) continue
    const tagName = tagMatch[1]
    if (!/^[A-Z]/.test(tagName)) continue // raw HTML element, not a component — out of scope

    yield { value: cls, index, tagName, viaVariable }
  }
}
