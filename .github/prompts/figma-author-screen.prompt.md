---
name: figma-author-screen
description: Author or update composed Figma surfaces from written requirements while reusing the published design system. Use for page, screen, modal, dialog, drawer, sidebar, panel, and multi-section view authoring in Figma. This skill is Figma-authoring support only; it does NOT replace design-system lifecycle skills like `/figma-build`, `/create-wave`, `/evidence-pipeline`, or `/figma-deploy`.
version: 1.0.0
---

# /figma-author-screen - design-system-first Figma screen authoring

Use this skill to create or update full Figma surfaces from text requirements.
It is optimized for composed views that should reuse design-system components, variables, and styles.

## Scope

This skill is for Figma authoring in the design file itself.

Use it when the user asks to:

1. create a new screen or page in Figma
2. update an existing Figma screen from requirements
3. build or revise a modal, dialog, drawer, sidebar, or panel in Figma
4. turn a product description into a structured Figma view using existing design-system assets

Do not use it when the job is governed by lifecycle skills:

1. new reusable design-system component creation from Figma (`/figma-build` or `/create-wave`)
2. component verification against Figma (`/evidence-pipeline` or `/evidence-wave`)
3. deployment release assembly and handoff (`/figma-deploy` or `/deploy-wave`)

## Required Companion Skill

If any step needs direct Figma Plugin API writes, load and follow `/figma-use` first.

`figma-author-screen` defines workflow decisions.
`figma-use` defines low-level `use_figma` safety rules.

## Workflow

Follow this sequence in order.

### 1. Confirm destination file

Before searching or writing:

1. resolve the destination Figma file from URL or file key
2. if no file exists, create one and retain the returned file key
3. state the active file key before authoring

### 2. Understand the deliverable

Create a concrete section map from the request:

1. major sections
2. likely component families per section
3. expected density and interaction intent

If requirements are ambiguous, ask one concise clarification pass before writing.

### 3. Discover reusable assets first

Before drawing custom primitives:

1. search available design-system components
2. inspect relevant variables and styles
3. prefer existing component sets and variants over local reconstruction

If the right asset cannot be found, document the gap explicitly rather than silently inventing a pseudo-system component.

### 4. Author incrementally

Write in small structural passes:

1. create page and top-level containers
2. establish section layout
3. place reusable components
4. bind variables and styles
5. add copy and state details

Validate between passes. Do not perform large one-shot writes.

### 5. Reconcile against intent

After the first usable draft:

1. compare structure against the section map
2. verify that reused assets are still linked to the design system
3. list unresolved gaps and whether they are acceptable for this pass

### 6. Report output

Return:

1. destination file key and URL
2. what was created or updated
3. unresolved gaps or follow-up decisions

## Decision Rules

1. Reuse before recreate. Search and import before drawing local substitutes.
2. Narrow write scope. Keep each mutation pass small and verifiable.
3. Surface uncertainty. Do not hide unresolved component or token mapping gaps.
4. Keep boundaries. This skill authors screens; it does not certify components or run deployment gates.

## Guardrails

1. No silent fallback to hardcoded raw values when system variables should apply.
2. No hidden conversion of reusable component work into local ad-hoc frame construction.
3. No escalation of this skill into create/verify/deploy lifecycle authority.

## Done Well Looks Like

1. destination file is explicit
2. screen structure matches requested sections
3. reusable components are used where expected
4. variables and styles are bound intentionally
5. remaining gaps are explicitly documented for the next decision
