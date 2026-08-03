# `<Element>` — Spec (lean)

<!--
  The LEAN spec standard (2026-07-12). Replaces the ~400-line schema-complete spec with the ~40-line
  CONTRACT. Rule for every line: "if I delete this, is the next implementation WRONG, or just less
  annotated?" WRONG → keep. Less annotated → cut (the code, Figma, or git already holds it).
  DROP from the old format: ASCII layer anatomy, full child nodeMaps (they rot — see railnav OD-2),
  "gotchas / why earlier reads were wrong" (that's a changelog → git), prose that duplicates code
  comments, per-child variantState re-listings (the child's own spec owns those).
  KEEP: identity, tier, Figma node, the state→token contract, real exceptions, verify, composed children.
-->

```yaml
# --- IDENTITY ---
element: "<Element>"
atomicLevel: atom | molecule | organism
tier: A | B | C            # blast radius — A load-bearing (full rigor) · B standard (types+eyeball) · C long-tail (types+renders)
status: implemented | verified

# --- SOURCE (visual truth) ---
figma:
  fileKey: "EyYETHXMDDURPGK4PXTU5C"
  node: "<SET or frame id>"

# --- COMPOSITION (molecules/organisms only) ---
# The already-SEALED children this composes. Verified BY REFERENCE — do not re-verify them here.
composes:
  - "<child-slug>"         # e.g. railbuttondark, selectrow

# --- STATE CONTRACT (tokens only, no raw hex in the body) ---
states:
  - name: "default"
    background: "tokens.<...>"
    icon: "tokens.<...>"       # or fg/label
    border: "none | inset 1.5px tokens.<...>"   # inner ring via inset box-shadow, never a fractional CSS border
    font: "TYPE.<...>"
  # …one row per coded state. Interactive states (hover/pressed/focus) live on the child atoms.

# --- TOKEN MAP (only the non-obvious hex→token bindings) ---
tokenMap:
  "#<hex>": "tokens.<name>"

# --- A11Y ---
a11y:
  roles: ["<role>"]
  keyboard: ["Enter", "Space"]
  focusVisible: true

# --- EXCEPTIONS (ONLY real, intentional departures from Figma; each is a decision) ---
exceptions:
  - id: "EX-<NAME>-001"
    what: "<one line: what differs>"
    why: "<one line: why it's intentional>"

# --- VERIFY ---
verify:
  storyId: "<level>-<slug>--variants"   # the clean matrix capture target — NEVER the interactive FigmaSpec harness
  figmaNode: "<node>"
```

## Notes (optional — ≤5 bullets, only what the code/Figma don't already say)
- <non-obvious decision or gotcha that has no other home>
