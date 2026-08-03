---
name: figma-reconcile-design-system
description: Audit and reconnect existing Figma surfaces to published design-system assets. Use when a screen has drift (local wrappers, ad-hoc primitives, unbound values, variant mismatch) and the user wants either an audit-only pass or an audit+apply pass.
version: 1.0.0
---

# /figma-reconcile-design-system - audit and apply design-system alignment in Figma

Use this skill when a Figma surface already exists and needs to be evaluated or reconnected to the design system.

## Modes

1. `audit` - read-only findings with evidence and recommended mapping targets
2. `apply` - scoped remediation after audit scope is approved

Default mode: `audit`.

## Scope

Use this skill when the user asks to:

1. review a screen for design-system drift
2. identify local constructions that should be reusable instances
3. reconnect sections to design-system components
4. remove unbound or ad-hoc values in favor of published variables/styles

Do not use this skill for governed lifecycle tasks like component creation, evidence certification, or deployment handoff.

## Required Companion Skill

If the task enters apply mode and needs direct Figma writes, load and follow `/figma-use` first.

## Workflow

### 1. Determine mode and scope

If scope is unclear, run `audit` first.
If scope is already approved, continue with `apply`.

For single, isolated fixes, keep the write scope narrow and avoid broad screen rewrites.

### 2. Capture baseline evidence

Before any writes:

1. capture structural metadata for the target node or frame
2. capture a visual reference screenshot
3. identify relevant instance trees and component keys where available

### 3. Build section-level inventory

Map the surface into section-sized units, not tiny cosmetic fragments.

For each section, classify one status:

1. `already-connected`
2. `exact-swap`
3. `compose-from-primitives`
4. `blocked`

### 4. Produce audit findings (mode: audit)

Each finding must include:

1. concrete structural evidence
2. why it matters for consistency, propagation, or maintainability
3. optional replacement candidate only when confidence is credible

Do not force replacement suggestions when search evidence is ambiguous.

### 5. Apply remediation (mode: apply)

When scope is approved:

1. create a backup copy of the target screen/frame before destructive edits
2. apply section-by-section using the approved strategy map
3. prefer exact swaps first, then composition from primitives
4. validate each section before moving to the next

### 6. Report final state

Return:

1. sections remediated
2. sections still blocked and why
3. any follow-up decisions required

## Evidence Standard

A finding is valid only when it is grounded in Figma structure, not taste.

Strong evidence includes:

1. frame built locally where an instance should exist
2. repeated sibling structures that should collapse into reusable primitives
3. raw values where variables or styles should be bound
4. variant drift from the expected component set semantics

Weak evidence to avoid:

1. visual preference without structural proof
2. assumption based only on screenshot appearance
3. forced mapping to unrelated libraries

## Guardrails

1. Keep write scope section-based and explicit.
2. Never mark a section as reconciled without structural confirmation.
3. Do not fabricate component matches when library search is noisy.
4. Preserve mode boundary: audit must remain read-only.

## Done Well Looks Like

1. clear section inventory with explicit statuses
2. evidence-backed findings in audit mode
3. controlled section-by-section remediation in apply mode
4. unresolved blockers documented, not hidden
