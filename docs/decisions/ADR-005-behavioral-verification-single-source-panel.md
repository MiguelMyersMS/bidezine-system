# ADR-005: Behavioral Verification & Single-Source Components

**Status:** Accepted
**Date:** 2026-06-13
**Context:** RailNav Panel Unification (branch `feat/figma-storybook-pipeline`); supersedes the
ad-hoc "demo proves the design" practice. See `sync/RAILNAV_PANEL_UNIFICATION_LEDGER.md`.

## Background

A deployment (RailNav → PLG) repeatedly "looked done" in Storybook yet shipped broken behavior:
the panel **search didn't filter**, a **collapsed group re-opened**, the **subtitle truncated**,
a pinned **rail button was missing**, and the **elevation shadow was clipped**. Investigation
found two structural causes — not a series of unlucky bugs:

1. **Duplication: the complete implementation lived in a *demo*, not the *product*.** A Storybook
   story (`SidebarPanelSpec`) had the full behavior, while the **shipped** built-in panel — the
   thing consumers actually import — did not. A demo ahead of the product *guarantees* drift.
2. **Verification certified *structure*, never *behavior*.** The machine gate proved Figma-node
   coverage and static-render parity, but nothing proved search/expand/scroll/elevation worked.
   "Machine-green / inherited fidelity" was therefore a **false guarantee** — the exact
   notice-a-few-declare-done disease the design system exists to prevent, one level deeper.

## Decision

1. **Single source of truth.** A UI element is implemented in **exactly one** shipped component.
   Stories and deployments **render that component** — never a parallel reimplementation. A demo
   may never be ahead of the product.
2. **Behavior is machine-verified, not assumed.** Every interactive behavior is a **contract test**
   (a Storybook play function) wired into **`npm run test:behavior`**, part of `npm run health`.
   "Verified" means *behaviorally* verified. A static Figma frame / screenshot proves look only.
3. **Composition completeness.** Replicas and deployments diff the component's **full prop/slot
   surface** (`logo / sections / footerSections / utilityItems / footer / overflow`), not just the
   nav data — rendered slots aren't in the data tree.
4. **Elevation must not be clipped.** Elevated elements (`boxShadow`) must escape any clipping
   (`overflow:hidden`) ancestor when shown — checked at component *and* consumer level.
5. **Generalize, don't special-case.** The above are encoded as required guards in the spec
   template (`docs/atomic/_TEMPLATE.spec.md` — `behaviors:` block + `behavior-test-gated`,
   `story-renders-shipped-component`, `composition-slots-complete`, `elevation-not-clipped`) and the
   deployment protocol (`DEPLOYMENT_VERIFICATION_PROTOCOL.md` blind-spots + inheritance clause).

## Consequences

- **Positive:** a new consumer imports one component that is behavior-gated by a suite that fails
  loudly on regression; no demo-vs-product gap; no green gate hiding broken behavior. Storybook ==
  deployment by construction (same component, same props), for *look and behavior*.
- **Cost:** `npm run health` now requires a running Storybook on :6006 (or `--skip-behavior`) so the
  browser behavior gate can run. Behavioral cycles are slower than static ones (real browser).
- **Verified instance (RailNav):** one `<SidebarPanel>`; 6 contract tests
  (collapse / search / subtitle / elevation + 2 smoke) green in the gate; the comparison `Default`
  view confirms parity. Behaviors implemented test-first (failing test → fix → green).

## Follow-ups (not in this ADR's scope)

- `scripts/audit-specs.js` enforcement of the new behavioral checklist ids (kept out for now —
  would retroactively fail the existing spec review-pile).
- Propagate the behavioral-fidelity gate to the Rayfin build method (`data-model-system`, Step 8).
- A possible `AGENTS.md` Golden Rule codifying "stories render the shipped component; behavior is
  test-verified" (user-driven / per-instance authorization required).
