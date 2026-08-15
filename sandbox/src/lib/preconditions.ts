/**
 * Preconditions — putting the component into a state a check's subject can EXIST in.
 *
 * ## The gap this closes
 *
 * `verifier/run-checks.mjs` drives a check by loading a URL and resolving one
 * `[data-divergence="…"]`. It can hold an element in an interaction state (hover, pressed,
 * focus-visible) because those act on an element that is already rendered. It has no way to
 * perform a PREPARATORY interaction — a click that makes the subject exist in the first place.
 *
 * That blocks an entire class of subject rather than one row. Anything inside a Radix portal —
 * a dropdown's items, a popover, a dialog — renders only while open, so its anchors are absent
 * from a default page load and the runner correctly reports ANCHOR NOT FOUND. Measured on this
 * component: C-6, C-7, C-8 and C-9 all describe the panel-header "…" menu's rows, and D-12
 * describes their text alignment. Five rows, one closed menu.
 *
 * C-6..C-9 are also the four most depended-on rows in the whole rail corpus (28–29 rows each
 * cite them, directly or transitively), so the closed menu was not a minor gap — it sat on top
 * of the largest dependency cluster there is.
 *
 * ## Why the URL, and not a new field on the spec
 *
 * A spec already names its own `url`, and the runner already passes it through untouched. So a
 * precondition needs no runner change, no schema change, and no new vocabulary in the check
 * format — `"url": "http://localhost:4199?open=panel-actions"` is a spec that works today
 * against a runner that knows nothing about preconditions. That matters beyond convenience:
 * the runner is the one component that must stay trustworthy, and this adds nothing to it.
 *
 * ## Why this is not a `forcedState`
 *
 * `forcedState` answers "which element, held how" for a subject that renders either way, and it
 * is driven by the REVIEW UI from the selected declaration's `subject_state`. A precondition is
 * a different question — "does the subject render at all" — and is driven by the SPEC. Merging
 * them would make one prop mean two things, which is the enum collision CLAUDE.md item 26's
 * fifth axis warns about, one level up.
 *
 * ## The rule for adding one
 *
 * A precondition must be a state a real user can actually reach by ordinary interaction. Opening
 * a menu is one. Forcing a component into a configuration it can never enter on its own would
 * measure something that does not exist, which is worse than not measuring it — the evidence
 * would look identical to the real thing.
 */

/** Preconditions this component understands. Unknown values are ignored, never guessed at. */
export type Precondition = "panel-actions"

const KNOWN: readonly Precondition[] = ["panel-actions"]

/**
 * Read the requested precondition from the current URL.
 *
 * Returns `null` for anything unrecognised rather than throwing or approximating. A spec naming
 * a precondition this build does not implement must fail as ANCHOR NOT FOUND — a real, visible
 * failure naming the missing subject — rather than silently rendering some near-enough state and
 * measuring it. A check that quietly measures the wrong thing is the failure mode this whole
 * verifier exists to prevent.
 */
export function readPrecondition(search: string = typeof window === "undefined" ? "" : window.location.search): Precondition | null {
  const value = new URLSearchParams(search).get("open")
  return KNOWN.includes(value as Precondition) ? (value as Precondition) : null
}
