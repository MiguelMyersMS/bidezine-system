// ═══════════════════════════════════════════════════════════════════════════════════
// property name → property type. The single source of that mapping.
//
// The type exists to choose a RENDERER. That is its whole job, and it is why the set is
// small and closed: a divergence's declaration says which properties it concerns, and the
// widget needs to know whether to draw a dimension line, a swatch, a replay control or
// just two literal values side by side. Five renderers cover 154 rows because the
// variation lives here rather than in per-card improvisation.
//
// DERIVED, never hand-assigned. `sandbox.divergence_property.property_type` stores the
// result because SQL needs to group by it, but the value is always produced by this
// function and `sandbox/verify-approval.mjs` re-derives and compares — so a stored type
// cannot drift away from the rule that produced it. Assigning types by hand per row would
// reintroduce exactly the free-form fragmentation the category enum exists to prevent
// (SANDBOX-SPEC §5.3).
//
// The types:
//   length   — measurable on a scale; render as a dimension overlay on the real element
//   color    — render as a swatch pinned to the surface it applies to, in the right state
//   text     — type metrics; render as a text sample with its line box drawn
//   time     — duration or easing; render as a replay control
//   layer    — stacking; render as a stacking example
//   keyword  — enumerated value with no visual metaphor; show both literals and say so
// ═══════════════════════════════════════════════════════════════════════════════════

/** Exact names first — these would otherwise be caught by a broader suffix rule. */
const EXACT = {
  // Type metrics belong together because the DEFECT is usually their interaction: a
  // line-height equal to font-size clips descenders (L-34). Rendering them on the same
  // text sample is what makes that visible at all.
  "font-size": "text",
  "line-height": "text",
  "font-weight": "text",
  "letter-spacing": "text",
  "text-overflow": "text",
  "white-space": "text",

  "z-index": "layer",

  // Enumerated values. There is no scale to draw, and pretending otherwise would be worse
  // than showing the two literals honestly.
  "box-sizing": "keyword",
  overflow: "keyword",
  "overflow-x": "keyword",
  "overflow-y": "keyword",
  display: "keyword",
  position: "keyword",
  "flex-shrink": "keyword",
  "flex-grow": "keyword",
  visibility: "keyword",
  cursor: "keyword",
}

/** Suffix and prefix rules, applied in order. */
const PATTERNS = [
  [/color$/, "color"],
  [/^background/, "color"],
  [/^fill$|^stroke$/, "color"],
  [/shadow$/, "color"],

  [/duration$|delay$/, "time"],
  [/easing$|timing-function$/, "time"],
  [/^transition|^animation/, "time"],

  [/^width$|^height$/, "length"],
  [/^(min|max)-(width|height)$/, "length"],
  [/^(padding|margin|inset|gap|border-radius|border-width)/, "length"],
  [/^(top|left|right|bottom)$/, "length"],
  [/^(row|column)-gap$/, "length"],
  [/^outline-(width|offset)$/, "length"],
]

/**
 * @param {string} property a CSS property name, or one of the runner's box measurements
 *   (`width`/`height`/`top`/`left`/`right`/`bottom`), which share the same names.
 * @returns {"length"|"color"|"text"|"time"|"keyword"|"layer"}
 */
export function propertyType(property) {
  const name = String(property).trim().toLowerCase()
  if (name in EXACT) return EXACT[name]
  for (const [pattern, type] of PATTERNS) if (pattern.test(name)) return type
  // Unknown properties fall to `keyword`, which renders as two literal values. That is the
  // honest default: it shows the reader the real numbers and claims nothing about how to
  // visualise them, rather than guessing a metaphor that might mislead.
  return "keyword"
}

/** Every type the schema allows, for validation and for enumerating renderers. */
export const PROPERTY_TYPES = ["length", "color", "text", "time", "keyword", "layer"]
