---
name: example-wave
description: Build a Figma-faithful, INTERACTIVE Storybook example the owner can play with to discover behaviors Figma cannot express (hover, disabled, container-overflow grow-vs-truncate, the 4 surface×theme views), then ABSORB the owner's played-with feedback into behaviors: docs + machine-verified play tests. Use for "make an example of <component>", "build a testing example from this Figma", "let me play with <component> to spec its behavior". Autonomous build+verify to `example-ready` (doer≠checker, content-binding gate), STOPS at the owner render gate; a second `stage:absorb` run turns feedback into docs+tests. NOT for verifying a component against a static frame (that is /evidence-wave) or a consumer release (that is /deploy-wave).
---

# /example-wave — the Example & Behavior Wave

Governor-vetted (3-panel, HOLES-FOUND → tightened). Spec: `docs/proposals/example-behavior-wave.md`.
Artifact contract: `docs/examples/_TEMPLATE.md`. Gate: `scripts/audit-example.js`. Pipeline:
`scripts/workflows/example-wave.js`.

## Why this exists (read `docs/deploy/AI-INTEGRITY-LEDGER.md`)

The ledger records the AI repeatedly shipping a plausible-but-wrong example: eyeballing instead of
reading the docs + extracting the Figma **layout**, reasoning a design the docs already decided, and
self-briefing a checker then declaring "verified." This wave makes each of those **structurally
impossible** — every step leaves an artifact the gate binds to a source of truth, so a fabricated value
is caught, and `status: verified` is unreachable without the owner's cryptographic stamp.

## Preconditions

- Storybook serving on `:6006` (`npm run storybook`) — the pipeline renders the 4 views.
- `FIGMA_API_KEY` set (the ground phase fetches the layout dump).
- The component has a spec under `docs/atomic/**/<slug>.spec.md` and a shipped component in `src/gallery/`.
- On a feature branch. For real crypto (owner/reviewer signing) `EVIDENCE_CHECK_TOKEN` must be provisioned;
  until then signing is advisory and `verified` stays unreachable (the wave stops at `example-ready`).

## How to launch (segment A — build → owner render gate)

```
Workflow({ scriptPath: "scripts/workflows/example-wave.js",
           args: { slug: "button", node: "702:4035", fileKey: "EyYETHXMDDURPGK4PXTU5C" } })
```

It runs autonomously: **Scout → Ground (read docs + extract Figma layout, provenance-bound) → Build (the
example from the SHIPPED component, 4 views) → 3 independent Reviews → Adjudicate → Fix-loop → Gate
(`audit-example.js`)** and STOPS at `awaiting-owner-renders`. doer≠checker is enforced by the workflow
spawning distinct agents; the gate fails if `built_by`/`reviewer`/`adjudicator` collide.

## OWNER GATE 1 (you, after the build)

Open the 4 rendered views + the live story and **play**: hover, toggle disabled, resize the container,
switch atom↔darkAtom and light↔dark. Then:
1. **Confirm the renders** → produce `docs/examples/<slug>/owner-renders-stamp.json` (HMAC over the 4 render
   hashes; the wave cannot forge it).
2. **Capture behaviors Figma can't express** as VERBATIM quotes (e.g. "when the label is longer than the
   button, truncate with an ellipsis, don't grow the height").

## How to launch (segment B — absorb → owner behavior gate)

```
Workflow({ scriptPath: "scripts/workflows/example-wave.js",
           args: { slug: "button", stage: "absorb",
                   ownerBehaviors: [{ id: "overflow", quote: "<your verbatim words>" }] } })
```

It writes `owner-behaviors.md`, adds each behavior to the spec `behaviors:` block **citing its quote**,
writes a play test per behavior with a **red→green mutation proof** (proving it's not a stub), has an
independent reviewer check the tests against your quotes, and gates. AI-inferred behaviors are quarantined
as `proposal: true` — never absorbed as yours.

## OWNER GATE 2 (you)

Confirm the documented behaviors + tests match what you said → `owner-behaviors-stamp.json`. Only with BOTH
stamps + a computed-pass checklist does `status: verified` become reachable.

## Do not

- Do not build the example by hand and relay it — that recreates the exact ledger failures. Run the wave.
- Do not accept a "verified" self-report — the gate + your stamps are the only authority.
