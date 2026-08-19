// ═══════════════════════════════════════════════════════════════════════════════════
// The forbidden-type-utility test, shared between R6 (scripts/check-rules.mjs — does a
// src/ui/ component's own class string carry a raw size/leading/tracking utility) and
// R7 (does a caller override a role-bearing component's type from outside). Both rules
// test the SAME utilities against a class string once variant-scoped; Issue 07a pulled
// the regexes and the scoped-test function out of check-rules.mjs so R7 could reuse them
// rather than keeping a second copy that could drift from R6's, the same reasoning
// scripts/lib/variant-scope.mjs's own header gives for sharing stripElementTargeting.
//
// Forbidden: text-xs/sm/base/lg/xl/2xl+ and length-valued text-[...] arbitrary values,
// leading-*, tracking-*. Legal: bare font-normal/font-medium/font-semibold (overriding
// weight on a parent- or role-supplied size is a pattern no role can express), the
// text-<role> utilities themselves, and text-* colour utilities (matched precisely so a
// colour never trips a size rule) — see check-rules.mjs's R6 header for the full
// reasoning; this module only holds the mechanism, not the policy narrative.
// ═══════════════════════════════════════════════════════════════════════════════════

import { stripElementTargeting, isElementTargetingToken } from "./variant-scope.mjs"

export const FONT_SIZE_RE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/
export const FONT_SIZE_ARBITRARY_RE = /\btext-\[(?:length:[^\]]+|[\d.]+(?:px|rem|em))\]/
export const LEADING_RE = /\bleading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])\b/
export const TRACKING_RE = /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/

/** True if the utility portion of a single token is a forbidden size/leading/tracking
 * utility. Tests the whole token (variant chain included) — the forbidden regexes all
 * carry `\b` anchors, so `[&>span]:text-xs` and `file:text-sm` match on their `text-*`
 * tail while the `[&>span]`/`file` prefix and any descendant-selector name inside it
 * (e.g. `cmdk-group-heading`) never trip a size/leading/tracking alternation. */
function tokenCarriesForbiddenType(token) {
  return FONT_SIZE_RE.test(token) || FONT_SIZE_ARBITRARY_RE.test(token) || LEADING_RE.test(token) || TRACKING_RE.test(token)
}

/** True if `cls`, after stripping element-targeting variants (file:, placeholder:, a
 * [&_...]/[&>...] descendant selector — out of THIS element's scope regardless of what
 * utility they carry, per Issue 05c/06h), still carries a forbidden size/leading/
 * tracking utility. */
export function hasForbiddenTypeUtility(cls) {
  const scoped = stripElementTargeting(cls)
  return FONT_SIZE_RE.test(scoped) || FONT_SIZE_ARBITRARY_RE.test(scoped) || LEADING_RE.test(scoped) || TRACKING_RE.test(scoped)
}

/** The inverse view of hasForbiddenTypeUtility's strip: the element-targeting tokens
 * (file:, placeholder:, [&_...]/[&>...] descendant selectors) that carry a raw size/
 * leading/tracking utility — exactly the tokens hasForbiddenTypeUtility discards before
 * it tests. hasForbiddenTypeUtility answers "does THIS element carry a raw utility" and
 * must strip these; this returns them so a caller can COUNT what that strip removed,
 * rather than let "zero on the element" read as "zero anywhere" (Issue 07h). Returns the
 * offending tokens verbatim so a report can cite them; empty when there are none. */
export function elementTargetingTypeUtilities(cls) {
  return cls
    .split(/\s+/)
    .filter((token) => token.length > 0 && isElementTargetingToken(token) && tokenCarriesForbiddenType(token))
}
