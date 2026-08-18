// ═══════════════════════════════════════════════════════════════════════════════════
// Element-targeting vs condition-only Tailwind variants — one answer, shared.
//
// Issue 05c: a slot check asks whether THIS element carries a raw type utility. A
// variant that changes what gets styled — a pseudo-element or a descendant — takes the
// declaration out of this element's scope entirely, so it is not this question's
// concern regardless of what utility it carries. A variant that only changes the
// CONDITION under which this same element is styled (a breakpoint, a state, a theme)
// leaves the element being styled unchanged, so it stays in scope — `md:text-sm` on the
// slot itself is still the slot at a different breakpoint, and must still be a role.
//
// Issue 06h: this used to be answered twice. scripts/check-type-slots.mjs (Link A) had
// this exact logic inline and treated `input.tsx`'s `file:text-sm` as out of scope; R6
// in scripts/check-rules.mjs tested the raw class string with no variant-scoping at
// all, so the same literal was legal to one check and a violation to the other. Same
// class string, two answers — which is exactly the class of drift Issue 06c and 06d
// stopped for lexical scanning by giving classLiterals/stripComments one shared
// implementation instead of two. This module is that fix applied here: both checks
// import it, so a `file:`/`placeholder:`/descendant-selector variant is out of scope
// (or not) identically wherever it's asked.
// ═══════════════════════════════════════════════════════════════════════════════════

// Named element-targeting variants: pseudo-elements Tailwind ships variants for.
export const ELEMENT_TARGETING_NAMED = new Set([
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
export const ELEMENT_TARGETING_ARBITRARY_RE = /^\[&[_>]/

/** Splits a Tailwind utility token on ':' into its variant chain plus trailing utility,
 * ignoring colons that appear inside `[...]` (an arbitrary value like `text-[length:1rem]`
 * has a colon that is not a variant separator). Returns { variants, utility }. */
export function splitVariantChain(token) {
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

export function isElementTargetingToken(token) {
  const { variants } = splitVariantChain(token)
  return variants.some((v) => ELEMENT_TARGETING_NAMED.has(v) || ELEMENT_TARGETING_ARBITRARY_RE.test(v))
}

/** Removes every whitespace-delimited utility token whose variant chain contains an
 * element-targeting variant, leaving condition-only-variant and bare tokens (including
 * the slot's own role utility) in place for a forbidden-utility scan. */
export function stripElementTargeting(cls) {
  return cls
    .split(/\s+/)
    .filter((token) => token.length > 0 && !isElementTargetingToken(token))
    .join(" ")
}
