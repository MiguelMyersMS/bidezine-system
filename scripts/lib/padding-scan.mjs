// ═══════════════════════════════════════════════════════════════════════════════════
// Padding parsing, shared so a gate never re-derives "what is a box-padding utility"
// inline. Consumed by check-rules.mjs's R8 (the ≥3-file padding-adjudication tripwire);
// kept here, not in a gate, so any future consumer reads the same scope decision rather
// than copying a second, drifting regex — the same reason lib/type-utility.mjs exists.
//
// ── What is in scope: BOX padding only (p-, px-, py-) ────────────────────────────────
// A box-padding utility sets the element's own inset on every side (`p-`) or a full axis
// (`px-`/`py-`). It is unambiguously "how much room this box gives its content," and it
// cannot secretly be a positional gutter for a sibling, because it pads BOTH edges of its
// axis at once. That is the property that makes it safe to reason about as a padding job.
//
// ── What is out of scope, and why the line is drawn HERE ─────────────────────────────
// Single-edge utilities (pt-, pr-, pb-, pl-) are excluded, because a single-edge padding
// and a positional offset are not mechanically separable from the class string alone:
//
//   • dropdown-menu.tsx's CheckboxItem carries `pr-…` — a real padding job, keeping the
//     label off the right edge.
//   • the SAME element carries `pl-8` — NOT a padding job, but a fixed indicator gutter:
//     it reserves the width of an absolutely-positioned check/dot (`<span class="absolute
//     … left-2">`) so text clears it. That is a positional decision about a sibling, not a
//     decision about this box's breathing room.
//
// Both are single-edge; both are `p{edge}-<n>`; nothing lexical tells them apart without
// cross-referencing whether a sibling is absolutely positioned into that edge — which a
// class-string scan cannot see. Rather than guess, the whole single-edge family is out of
// scope, and the rule's header names it. `pl-8` is the canonical excluded case; `pl-2`
// (calendar/combobox/select) is another. If a shared single-edge PADDING job is ever
// found, it gets tokenised by hand and argued in its own issue, not caught by count here.
//
// Zero values (`p-0`, `px-0`, `py-0`) are excluded: a zero inset is a reset, not a value
// worth a semantic name.
//
// ── Scoping matches the type axis ────────────────────────────────────────────────────
// Element-targeting variants (`[&_svg]:p-1`, `file:px-3`, `[&>div]:p-2`) are stripped with
// the same stripElementTargeting the type rules use, so a padding applied to a DESCENDANT
// is not counted as this component's own padding — the identical "whose element is this
// utility on" question Issue 05c settled for type, reused rather than re-answered. A
// condition-only variant (`hover:`, `data-[state=open]:`) is kept: it still pads THIS box.
// ═══════════════════════════════════════════════════════════════════════════════════

import { stripElementTargeting, splitVariantChain } from "./variant-scope.mjs"

// A box-padding utility, after its variant chain is stripped: p / px / py, then a nonzero
// value (a Tailwind step like `2`, `1.5`, `2.5`, a fraction, or an arbitrary `[…]`). The
// `0` exclusion is handled in code below, not in the pattern, so the reason stays legible.
export const BOX_PADDING_RE = /^(p|px|py)-(\[[^\]]*\]|[0-9]+(?:\.[0-9]+)?(?:\/[0-9]+)?|px)$/

/**
 * Box-padding utilities on THIS element, found in one class-literal string.
 * Element-targeting variants are stripped first (descendant/pseudo-element padding is not
 * this box's padding); single-edge utilities and zero values are never returned (see the
 * module header for why the line is drawn at box-vs-single-edge). Returns one entry per
 * matching whitespace token, in source order: `{ util, value, combo }` where `combo` is
 * the bare `util-value` (e.g. `px-2`) used as the cross-file grouping key.
 */
export function boxPaddingUtilities(cls) {
  const out = []
  for (const token of stripElementTargeting(cls).split(/\s+/)) {
    if (!token) continue
    const { utility } = splitVariantChain(token)
    const m = BOX_PADDING_RE.exec(utility)
    if (!m) continue
    const [, util, value] = m
    if (value === "0") continue
    out.push({ util, value, combo: `${util}-${value}` })
  }
  return out
}
