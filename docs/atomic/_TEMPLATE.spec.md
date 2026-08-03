# `<Element>` — Figma Spec

<!--
  CANONICAL SPEC TEMPLATE (hybrid: machine-checkable front-block + prose).
  Copy this file to docs/atomic/<level>/<element>.spec.md (level = atom |
  molecule | organism | template) and fill EVERY required field.

  WHY THIS SHAPE EXISTS
  ---------------------
  AI is a great translator and a poor inspector. The misses are not random —
  they are a finite set of blind spots observed across the ActionMenu sessions.
  Each `checklist` id below is one of those blind spots turned into a required,
  verifiable pass-flag. The `scripts/audit-specs.js` checker (see PROTOCOL) reads
  the front-block and FAILS the build if a required field is empty or a checklist
  claim contradicts the code. Incompleteness is meant to be impossible to ship —
  not something a human has to remember to catch.

  RULE: the IMPLEMENT step reads THIS SPEC, not Figma. The spec is the fixed
  point; VERIFY guards it. That is what stops fixes from regressing.
-->

```yaml
# ============================================================
#  FRONT-BLOCK  (machine-checkable — audit-specs.js validates)
# ============================================================

# --- IDENTITY -------------------------------------------------
element: ""              # PascalCase, matches src/gallery/<Element>.tsx
atomicLevel: ""          # atom | molecule | organism | template
status: draft            # draft | extracting | implemented | verified | locked
specVersion: 1
lastVerifiedCycle: null  # sync cycle number of the last passing VERIFY

# --- FIGMA SOURCE  (read SETS, not instances) -----------------
figma:
  fileKey: ""
  fileName: ""
  # WORKSPACE = the Figma frame that holds this element, its variations, and its
  # subcomponents. One spec verifies ONE node; sibling nodes get their own specs
  # in the same family. The nodeMap documents the layer PATHS so EXTRACT reads the
  # node at its correct nested place — NOT a similarly-named node elsewhere
  # (blind spot `node-path-verified`).
  workspace:
    id: ""               # workspace frame node id (e.g. 139:3227)
    name: ""
  thisNode: ""           # the ONE node this spec verifies (e.g. 139:3321)
  nodeMap:               # every node in the workspace + its role + layer path
    - role: element      # element | variation | subcomponent
      name: ""
      nodeId: ""
      path: ""           # "Workspace > Element > ..." — the nested layer path
      spec: ""           # which .spec.md owns it (self, or a sibling file, or TODO)
  assembledNode: ""      # node id of the assembled, real-world example (usually == thisNode)
  # REQUIRED: list every component SET (not instance). This is blind-spot
  # `read-set-not-instance`: an instance only exposes ONE state; the SET
  # exposes ALL variants. Missing a set here = guaranteed missing states.
  componentSetIds:
    - id: ""
      name: ""
      variantStates: []  # exhaustive list of variant states on this set
  # REQUIRED minimum read depth. Rows with nested icons live at depth >=6
  # (the "Add Square Multiple" miss). Never read rows shallower than this.
  readDepth: 6

# --- CONTAINER CONTRACT  (tokens only, no raw hex) ------------
container:
  width: null            # px or "fill"
  padding: null
  borderRadius: null     # value AND which RADIUS tier (comment)
  background: ""         # tokens.*
  boxShadow: ""          # elevation.* or "none"
  border: ""             # tokens.* or "none"  — NB: ActionMenu outer = none
  overflow: ""

# --- STATE MATRIX  (count MUST equal sum of variantStates above) ---
# CRITICAL: every state entry MUST have a value for EVERY colored slot.
# Not just background and label. Failing to capture badge_color, icon_color,
# chevron_color per state is what causes disabled/active tokens to silently
# use rest-state values. Disabled is a FULL color reset — never assume it
# only changes background or cursor.
states:
  - name: ""             # rest | hover | active | active-expanded | disabled | focus | ...
    background: ""       # tokens.* | transparent
    label: ""            # tokens.*
    badge: ""            # tokens.* — REQUIRED: never omit; badge color changes in disabled
    icon: ""             # tokens.* — REQUIRED: icon color (usually same as label)
    icon_fill: ""        # regular | filled
    font: ""             # TYPE.*
    notes: ""

# --- TOKEN MAP  (every non-state visual value -> token) -------
# audit-specs.js forbids raw hex in the component file unless it appears here
# with a token mapping. This is blind-spot `all-colors-tokenized`.
tokenMap:
  # hairline: tokens.hairline      # #D9D9E0
  # checkmark: tokens.accentText   # #5753C6

# --- ICONS  (each depth-verified against its component set) ---
icons:
  - export: ""           # IconXxx in src/icons/index.ts
    figmaName: ""        # component SET name (= Fluent icon name)
    setId: ""
    size: null           # 16 in rows, 20 nav, 16 chevrons, 36 hero
    depthVerified: false # true only after reading the icon node at readDepth

# --- ACCESSIBILITY -------------------------------------------
a11y:
  roles: []
  keyboard: []           # keys handled
  focusVisible: true
  minTargetPx: 24
  contrastTextOk: false  # >=4.5:1
  contrastNonTextOk: false # >=3:1

# --- VERIFY  (layered: vision + pixel-diff) ------------------
verify:
  storyId: ""            # Storybook story id, e.g. gallery-element--figma-spec
  figmaExportNode: ""    # node to export as PNG ground-truth (usually assembledNode)
  snapshotBaseline: ""   # path of the Playwright visual test
  statesToCapture: []    # named viewport captures fed to vision + pixel-diff
  lastVision: { cycle: null, verdict: pending }     # pass | fail | pending
  lastPixelDiff: { cycle: null, verdict: pending }

# --- BEHAVIORS  (testable UX contracts — machine-gated via `npm run test:behavior`) ---
# Every interactive behavior is a CONTRACT TEST (a Storybook play function the behavioral
# gate runs), not just prose. A static Figma frame proves LOOK, never BEHAVIOR — behavior
# fidelity comes ONLY from these passing tests. (Lesson, RailNav 2026-06-13: search/collapse/
# subtitle/elevation all looked done statically but were broken until each was test-gated.)
behaviors:
  - id: ""                # short kebab id, e.g. "collapse-persists"
    assertion: ""         # the observable contract, e.g. "a user-collapsed group stays collapsed"
    storyId: ""           # the (hidden, tags:['!dev']) play-test story id that gates it
    gated: false          # true ONLY when the play-test runs in `npm run test:behavior`

# --- COMPLETENESS CHECKLIST  (the blind-spot guard) ----------
# Each id is a real, observed failure mode. `pass: true` is a claim the
# checker (and the Governor) can challenge. Do not flip to true blindly.
checklist: 
  - id: node-path-verified         # read THIS node at its correct nested path in the workspace
    pass: false
  - id: read-set-not-instance      # read component SETs, saw every state
    pass: false
  - id: figma-measurements-verified  # container padding, gap, borderRadius, sizing match actual Figma layout values (GR4)
    pass: false
  - id: states-match-variant-count # states[] count == sum(variantStates)
    pass: false
  - id: icons-depth6-verified      # every icon read at readDepth, depthVerified:true
    pass: false
  - id: all-colors-tokenized       # no raw hex outside tokenMap
    pass: false
  - id: slots-reserved             # fixed slots reserved even when empty (alignment)
    pass: false
  - id: optional-slots-visibility  # optional slots use visibility:hidden NOT omission (no layout shift)
    pass: false
  - id: fill-sizing-min-width      # every sizing:fill flex child has both flex:1 AND minWidth:0
    pass: false
  - id: slot-all-properties        # every slot node: ALL properties read (size AND borderRadius AND gap AND padding) — not just the one you were looking for
    pass: false
  - id: flex-role-inventory        # every immediate child wrapper has a documented fill/hug/fixed role and code mapping
    pass: false
  - id: text-role-inventory        # every visible text node has an explicit fill/hug/fixed role, alignment, and wrapping behavior
    pass: false
  - id: figma-artifact-gap-translation  # gaps to Figma-only artifacts (Scrollbar, etc.) translated to paddingRight/Bottom on content
    pass: false
  - id: text-align-explicit        # every TEXT node's textAlignHorizontal translated to explicit textAlign CSS
    pass: false
  - id: focus-ring-token           # focus ring always uses FOCUS.style(tokens) — never inline tokens.ink or hardcoded color
    pass: false
  - id: interactive-story-state    # interactive components have wired state in story (no static hardcoded states)
    pass: false
  - id: single-hover-owner         # hover state owned at parent level as single hoveredId; no per-row hover state; no static forceHover flags
    pass: false
  - id: focus-ring-keyboard-only   # focus ring shown only on keyboard Tab; onMouseDown preventDefault prevents focus on mouse click
    pass: false
  - id: organism-not-spec-for-verification  # color tokens always verified against organism Figma node hex, never from spec or memory
    pass: false
  - id: state-matrix-all-slots      # states[] captures badge, icon, chevron colors per state — not just background and label
    pass: false
  - id: atom-state-ownership-table  # molecule specs list per-atom ownership: atom rest state, shell-triggered transitions, atom-triggered transitions, forbidden overrides
    pass: false
  - id: atom-state-inheritance-proof # evidence confirms each embedded atom still runs its own state chain after composition
    pass: false
  - id: no-cross-atom-state-copy    # shell logic from one atom is not copied to other atoms unless explicitly verified in Figma + atom spec
    pass: false
  - id: disabled-full-override      # disabled state reads every fill from Figma independently; never assumes only bg/cursor changes
    pass: false
  - id: SC-UNCONDITIONAL-SCROLLBAR-GAP  # paddingRight for scrollbar is conditional on scrollable state; never hardcoded always-on
    pass: false
  - id: organism-integration            # organism stories wire all sub-components to each other; no hardcoded label/content in prop slots
    pass: false
  - id: layout-token-organism-verify    # layout spacing tokens verified against organism Figma node, not assumed
    pass: false
  - id: callback-complete-payload       # callbacks pass all state the consumer needs (not just boolean); verified against consumer use cases
    pass: false
  - id: sizes-not-inflated         # Figma px values used verbatim; no inflation unless below 24px WCAG floor
    pass: false
  - id: radii-tokenized            # every borderRadius maps to RADIUS.* token; no hardcoded px
    pass: false
  - id: padding-tokens-not-values  # every padding uses the spec's named token, not a numerically-equal substitute
    pass: false
  - id: spec-internal-consistency  # anatomy, container, tokenMap, and narrative must agree on each visual property
    pass: false
  - id: code-doc-figma-triangulated # current code, current spec, and current Figma node all read before implementation/review
    pass: false
  - id: hidden-wrapper-verified    # any suspected wrapper/slot/flex layer is proven from live code or Figma, not assumed
    pass: false
  - id: flex-role-code-match       # code mirrors the spec's nested flex-role tree for immediate child wrappers
    pass: false
  - id: text-role-code-match       # code mirrors the spec's text-node role inventory and wrapping behavior
    pass: false
  - id: rail-overflow-lineup-verified  # overflow stories verify section count/order and treat ellipsis as overflow trigger, not a normal section icon
    pass: false
  - id: rail-overflow-not-hard-capped  # overflow story does NOT hard-code maxVisibleRailItems — omit prop so rail auto-computes from available height (production behavior)
    pass: false
  - id: play-fn-canvas-scoped  # play functions use within(canvasElement) from storybook/test — never document.body or document.querySelector directly
    pass: false
  - id: overlay-uses-portal-fixed  # any menu/dropdown/popover uses ReactDOM.createPortal() with position:fixed (GR3 — NOT position:absolute inside overflow container)
    pass: false
  - id: dividers-placement         # divider ownership matches Figma (sibling vs child)
    pass: false
  - id: deep-audit-exhaustive      # ALL property categories extracted per Deep Figma Audit Procedure (PROTOCOL §): dimensions, gaps, padding, borderRadius, fills per state per slot, strokes, textAlign, sizing mode, natural height, effects, component variant IDs, overflow, disabled full reset, focus state
    pass: false
  - id: exception-registry-complete # any figma-editor artifact / non-emulable / intentional override is documented in Exception Registry with preservation rule
    pass: false
  - id: natural-height-verified    # for hug containers: computed paddingTop + max(content height) + paddingBottom and compared to code minHeight
    pass: false
  - id: elevation-effects-verified # boxShadow / elevation effects extracted from Figma and matched in code
    pass: false
  - id: hug-dimension-computed     # for sizing:hug containers: computed padding + content width/height and compared to layout constant (e.g. LAYOUT.railW = padding + buttonWidth + padding)
    pass: false
  - id: section-wrapper-nesting    # Figma multi-section wrappers (independent padding per section) replicated in code — not flattened into single-level children
    pass: false
  - id: pressed-state-per-surface  # pressed-state token verified from THIS surface's own Figma state=pressed fill var — not copied from adjacent surface
    pass: false
  - id: story-uses-ds-constants    # story implementation uses DS constants (LAYOUT.*, LIST_ROW.*, SPACE[], RADIUS.*) — no hardcoded px where a constant exists
    pass: false
  - id: story-covers-all-states    # one Storybook capture per states[] entry
    pass: false
  # --- FUNCTIONAL BEHAVIOR (non-Figma UX rules — see PROTOCOL § "IMPLEMENT functional behaviors") ---
  - id: behavior-spec-exists         # component with interactive state has behavioral spec in docs/interaction-patterns.md
    pass: false
  - id: state-persistence-verified   # state that should survive remount/re-expand uses controlled prop or lifted state — not local useState
    pass: false
  - id: keyboard-escape-defined      # Escape key behavior explicitly defined for every text input and popover
    pass: false
  - id: state-scope-documented       # each state variable's scope (transient/section/session/global) and persistence rules documented
    pass: false
  - id: footer-button-panel-slot     # footer buttons that should open panels use footerSections (not utilityItems)
    pass: false
  # --- BEHAVIORAL VERIFICATION (machine-gated — the Phase-3 generalization, RailNav 2026-06-13) ---
  - id: behavior-test-gated          # every interactive behavior has a play-test in `npm run test:behavior`, failing on regression — NOT just documented prose. "Verified" means behaviorally verified.
    pass: false
  - id: story-renders-shipped-component  # the story renders the REAL shipped component — never a duplicate/parallel reimplementation. A demo must never be ahead of the product (the duplication that caused the RailNav divergence).
    pass: false
  - id: composition-slots-complete   # every component prop/slot the assembly/reference uses is accounted for (logo / sections / footerSections / utilityItems / footer / overflow). Replicas & deployments diff the FULL prop surface, not just nav data (the missed utilityItems slot).
    pass: false
  - id: elevation-not-clipped        # elevated elements (boxShadow) are NOT truncated by a clipping (overflow:hidden) ancestor when shown — verified by walking the ancestor overflow chain. Applies at component AND consumer level.
    pass: false
```

---

## Container Contract

> Prose restatement of the `container` block. Note anything non-obvious — e.g.
> "outer shell has NO border; section separation is the 0.5px hairlines."

## State-by-state notes

> One short paragraph per state that needs explanation beyond the table.

## Behaviors (machine-gated)

> One line per behavioral contract from the `behaviors:` front-block — the observable rule
> and the play-test that guards it. A static Figma frame cannot prove any of these; the
> passing test is the proof. If a behavior here is not yet `gated: true`, it is NOT done.
> Examples (RailNav): search filters the rendered rows; a user-collapsed group stays
> collapsed; the panel subtitle wraps; the elevation shadow is not clipped by its wrapper.

## Structural learnings (Figma → code)

> The durable "why" — padding ownership, slot reservation, divider placement,
> font-tier-per-state. This is what a future session re-reads before touching
> the component. Keep it tight.

## Gotchas / why earlier reads were wrong

> Carry forward the specific misses (instance-vs-set, depth, unreplaced hex).
> Each gotcha here SHOULD correspond to a `checklist` id above — if it doesn't,
> the checklist is missing a guard and should grow one.

## Files

| File | Role |
|---|---|
| `src/gallery/<Element>.tsx` | component |
| `src/gallery/<Element>.stories.tsx` | stories incl. `FigmaSpec` |
| `src/icons/fluent.tsx` / `index.ts` | any new icons |
| `tests/visual/<element>.spec.ts` | Playwright pixel-diff baseline |
