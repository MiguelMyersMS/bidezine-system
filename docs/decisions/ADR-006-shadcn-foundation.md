# ADR-006: Adopt the shadcn Foundation for a Fresh "v2" Design System

**Status:** Proposed (awaiting Miguel's go + the §10 site-scope decision)
**Date:** 2026-08-02
**Context:** Branch `feat/shadcn-foundation`. Authored by Blair (Laptop B) for Miguel (Laptop A).
Full plan + step-by-step + Laptop-A pickup: `docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md`.
Companion visual guide: Figma *Single shape* file, atoms Page, frame left of node `1473-926`.

## Background

Our design system is ~4% built. shadcn/ui is 100% built, MIT-licensed, and — on honest inspection —
genuinely ahead of us on two architectural axes (**styling** and **theming**), because our "no build
step" premise forces inline `CSSProperties` (which cannot do `:hover`, media queries, `@keyframes`,
etc.) and React-context theming (which re-renders on theme change and can't reach plain CSS). Building
the remaining 96% from scratch would re-solve behavior + accessibility that shadcn already ships. Our
adopted method (`PRIMITIVES-FIRST-METHOD.md`) already prescribes "borrow proven primitives (Radix),
own the look via tokens" — which shadcn *is*. At 4% done, the cost of switching foundations is at its
lifetime minimum.

## Decision

1. **Start a fresh "v2"** on shadcn's foundation instead of continuing bottom-up. The current system
   becomes legacy/harvest (per PRIMITIVES-FIRST §9/§11).
2. **Four-axis foundation:** Behavior = **Radix** (unchanged); Styling = **Tailwind + CVA**; Theming =
   **CSS variables authored from one typed DTCG source**; Distribution = **package** (unchanged;
   copy-in is a later, optional decision, not adopted now).
3. **This requires a build step — CLAUDE.md Rule #1 reverses.** Tailwind + CSS variables cannot exist
   without one. v2 ships compiled `dist/` (JS + `.d.ts` + CSS); consumers import built output.
4. **Borrow behavior, not styling.** We take shadcn's Radix behavior and re-skin to our tokens; we
   never paste its Tailwind/CVA look. Guardrail against **mold contamination**.
5. **Dual source of truth:** Figma owns the *look*, code owns the *behavior* (Radix), **Code Connect**
   binds them. GR4's "Figma sole truth" is scoped to the visual layer.
6. **Pipeline:** copy in as read-only vendored reference → *extract* (tokens→DTCG, CVA→variants,
   registry→atomic graph) → author Figma from one token source → Code Connect bind → re-skin through
   the evidence/deploy waves.
7. **Golden path first:** prove the whole pipeline on a **modal-form slice** (Dialog + Field/Input/
   Label + Button — walks atoms, molecules, organism, Radix behavior, nested Code Connect) before any
   fan-out. Combobox is slice #2. Chart / Data Table / Calendar / Date Picker / Carousel / Sidebar are
   outliers needing their own mini-slices.
8. **Ownership/attribution:** keep a `NOTICE` / `THIRD-PARTY-LICENSES` file (MIT). We may license v2
   ourselves (even proprietary) and keep it closed; ownership deepens as we rewrite internals over time.

## Consequences

- **Positive:** a modern, capable foundation (real CSS states/media queries, instant CSS-var theming),
  a 100%-built behavioral starting line, our protocols mostly preserved, and our own method fully
  expressed. Ownership is legally clean and deepens automatically.
- **Cost:** we now own a build config; consumer setup guidance is rewritten; the initial Figma
  bootstrap runs *reverse* (code→Figma) once. "100% built" means a finished *skeleton*, not a finished
  product — the re-skin + Figma + evidence work is still the real project.
- **Protocol churn:** Rule #1, styling ideology, token architecture, and GR4 change; three new
  protocols added (import, token pipeline, attribution). See handoff §11.

## Follow-ups (not in this ADR's scope)

- Miguel to answer site scope: components-only vs entire site (Blair votes entire site). Handoff §10.
- Rewrite CLAUDE.md Rule #1 + Token Architecture + consumer Vite guidance once Step 5 confirms specifics.
- Decide v2 location (new repo vs `src-v2/`) — handoff §13.
