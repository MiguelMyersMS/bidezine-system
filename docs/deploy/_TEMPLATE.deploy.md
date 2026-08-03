# Deployment Inventory + Coverage Matrix — `<Assembly>` → `<App>`

> Copy this file into the CONSUMER's own workspace at
> `<consumer>/docs/design-system-handoffs/<release>/deploy.md` and fill it — the handoff is
> consumer-owned and does NOT live in this design-language repo. This template is the only generic
> artifact that stays here.
> Governed by [`../atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md`](../atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md)
> (Phase 7 — DEPLOY). `scripts/audit-deployment.js` (in `npm run health`) lints the
> ```yaml front-block below and **fails the build** until every Figma node in the
> recorded ground-truth fetch is accounted for in the `matrix`. Completeness is a
> red build, not a human sign-off — the human signs off **judgment** (rulings,
> accepted deviations), never **coverage**.

```yaml
# ============================================================
#  FRONT-BLOCK  (machine-checkable — audit-deployment.js validates)
# ============================================================

# --- LIFECYCLE (handoff state machine — see DEPLOYMENT_HANDOFF_LIFECYCLE.md) ---
#   draft → assembled → verified → handed-off → deployed → signed-off → retired
#                                                   ↑___________ reopened (regression found)
# `signed-off` is GATED (see SIGN-OFF below), not a free edit. On sign-off, RETIRE with
# keep-evidence: move deploy.md + verify/*.png to this consumer workspace's _archive/<release>/, delete
# the scaffolding, append a LEDGER.md line with the retire SHA (the LEDGER + these records live in the
# CONSUMER's own workspace docs, e.g. apps/<consumer>/docs/design-system-handoffs/, not the DS repo).
# audit-deploy-lifecycle.js FAILS on:
# missing/invalid status · a `retired` status left in the active area · a signed-off release missing
# its gate evidence · an archived release missing its kept evidence.
lifecycle:
  status: draft            # draft|assembled|verified|handed-off|deployed|signed-off|reopened|retired
  created: null            # YYYY-MM-DD
  signed_off: null         # YYYY-MM-DD (set when status reaches signed-off)
  # DOER != CHECKER (deploy-stage analog of the evidence gate's checker signature). The actor that
  # ASSEMBLED this release. audit-deploy-verify.js FAILS any handed-off+ release where this is unset
  # or equals verify/comparison.md `reviewer:` — the assembler may not verify their own deployment.
  # Use a ROLE/agent identity (e.g. "deploy-assembler"), NOT a bare model name shared with the reviewer.
  assembled_by: null       # who built the assembly; MUST differ from comparison.md reviewer

# --- THE ASSEMBLY (the Figma prototype being deployed) --------
assembly:
  fileKey: "EyYETHXMDDURPGK4PXTU5C"   # figma.com/design/<fileKey>/...
  nodeId: "289:4585"                  # the ASSEMBLED node (composes components + data)
  name: "RailNav"
  fetchedDepth: 6                     # MUST be >= 6 (Deep Figma Audit minimum)
  # Companion file: the RAW get_figma_data output saved VERBATIM. This is ground
  # truth. The audit extracts every node id from its `nodes:` section and requires
  # each to appear in `matrix` below. Path is relative to this file.
  groundTruth: "railnav-289-4585.figma.yaml"

# --- THE DEPLOYMENT TARGET ------------------------------------
app:
  name: "PLG_dashboard"
  path: "apps/PLG-dashboard/PLG_dashboard"
  # Confirm the design system is a live symlink AND optimizeDeps.excludes it
  # (otherwise a stale Vite pre-bundle masks every change).
  consumesDesignSystemLive: true
  # SIGN-OFF GATE part 3 — the consumer must import the SHIPPED component, not a fork
  # (else app==Storybook triangulation passes against a fork; Golden Rule #5). Fill from a
  # real grep of the consumer at verify time; required non-null before `signed-off`.
  import_proof: null        # e.g. "src/App.tsx:12 import { RailNav } from '@miguel/design-system/gallery'"
  no_fork: false            # true = grep confirmed NO local copy of the deployed component in the app

# --- SIGN-OFF (GATED — see DEPLOYMENT_HANDOFF_LIFECYCLE.md "sign-off gate") ----
# `complete: true` is a RED BUILD unless: audit-deployment.js coverage passes, the 3
# triangulation screenshots exist under verify/, audit_passed_commit is recorded, and
# app.import_proof + app.no_fork are set. The owner signs JUDGMENT (rulings), never coverage.
signoff:
  complete: false
  by: null
  date: null
  audit_passed_commit: null   # SIGN-OFF GATE part 2 — commit where `npm run health` passed for this release

# --- COVERAGE MATRIX  (every ground-truth node, exactly once) -
# layer:    L1 (DS component) | L2 (DS asset) | L3 (app data/config) | L4 (ruling)
# status:   match | inherited | gap | ruling | ignore
#   match     = consumer-controlled aspect correctly deployed (data/prop/asset right)
#   inherited = component-owned; app consumes the Storybook-verified component, so its
#               fidelity is inherited (proven by app==Storybook), NOT re-claimed here.
#               A divergence in an inherited node escalates to the component evidence
#               pipeline (/evidence-pipeline), not the app.
#   gap       = consumer-controlled gap to remediate     ruling = needs a human decision
#   ignore    = internal artifact with no deployment obligation (needs a reason)
# severity: none | low | medium | high | blocker     (gap/ruling need >= low; others = none)
# reason:   REQUIRED when status: ignore (why this node carries no deployment obligation)
matrix:
  - node: "289:4590"
    name: "RailButton — Slide Text Multiple (state=active)"
    layer: L1
    status: match
    severity: none
    figma: "state=active, fill rgba(255,255,255,0.2)"
    actual: "activeSection=key-metrics drives active state"

  - node: "I290:4824;209:3598;136:10933"
    name: "Icon/Slot — Arrow Trending Checkmark"
    layer: L2
    status: gap
    severity: medium
    figma: "Arrow Trending Checkmark, filled, ink"
    actual: "IconTrendUp (substitute) — icon missing from design system"

  - node: "I289:4587;166:4235"
    name: "LogoSlot inner SVG shape"
    layer: L1
    status: ignore
    severity: none
    reason: "Internal SVG of the LogoSlot instance — covered by the LogoSlot row; carries no independent deployment obligation."

  # ... one row for EVERY node id in the ground-truth `nodes:` tree ...
```

## Narrative (optional, human-facing)

Free-form notes, screenshots-of-record links, and rationale. The machine reads only
the front-block; this section is for humans.

### Triangulated verification (Phase 5)

| Source | Screenshot | Matches? |
|---|---|---|
| Figma `289:4585` export | `<assembly>-verify/figma.png` | — |
| Storybook component | `<assembly>-verify/storybook.png` | — |
| Deployed app | `<assembly>-verify/app.png` | — |
