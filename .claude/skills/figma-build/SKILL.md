---
name: figma-build
description: Create a NEW design-system component end to end — EXTRACT a Figma node into a schema-complete spec, then IMPLEMENT the component + story from that spec. Use for "build <element> from Figma", "extract this node and code it", "create the <element> component", or when a Figma node URL is pasted for a new gallery element. This is the CREATION command (phases EXTRACT→IMPLEMENT); verification/sealing is a separate step — hand off to /evidence-pipeline <slug> (one) or /evidence-wave <level> (many).
version: 1.0.0
---

# /figma-build — Figma node → spec → component + story

Creates a new component in two phases: **EXTRACT** (inspect a Figma node into a
schema-complete `spec.md`) then **IMPLEMENT** (build the code from that spec). Verification is
NOT part of this command — once the component exists, seal it with `/evidence-pipeline` /
`/evidence-wave`.

> **Prefer `/create-wave` for reliability.** This single-agent command has no in-loop governor, so a
> wrong or hidden decision only gets caught later. `/create-wave` runs EXTRACT → 3 independent spec
> reviewers → adjudicator → fix-loop → IMPLEMENT → code-vs-spec checker in ONE command (the doer≠checker
> loop, automated). Use `/figma-build` for a quick single build or when you'll seal with `/evidence-wave`
> right after — but never hand-build here and relay to another model across rounds to "verify"; that
> recreates the wave's loop by hand, unreliably (CREATE-LESSONS CL7).

Read first: `docs/process/SPEC_KERNEL_COMPACT.md`, `docs/process/TASK_BRIEF_TEMPLATE.md`,
`docs/process/VERIFIER_CHECKLIST.md`, `docs/atomic/PROTOCOL.md`, `docs/atomic/_TEMPLATE.spec.md`,
`docs/icon-protocol.md`, and `AGENTS.md` (repo root).

## Authority — NO SILENT DECISIONS (read before building)

This command runs as a single agent with no in-loop governor, so its integrity depends on you NOT
making — or hiding — decisions. You are an INSPECTOR, not a designer.

- **Figma (GR4) is the ONLY source of visual values.** You may NOT change a value "for visual
  distinction"/aesthetics, invent a behavior, or pick a magnitude. If Figma says 4px, the spec says 4px.
- **Every departure from a literal Figma value is an OWNER decision, logged loudly.** The ONLY
  legitimate departure is an **Exception Registry `EX-<slug>-NNN`** entry that states the **Figma
  value**, the **chosen value**, and the **reason** — never a silent edit. The verification reviewers
  scrutinize each `EX-`. (Good example: `EX-LOGOSLOT-001`. Bad: quietly bumping padding to 8px.)
- **Maintain a DECISIONS LOG.** End every build by surfacing, in chat, every assumption, ambiguity,
  and deviation you made + each `EX-` entry, for the owner to ratify. If there were none, say so. The
  log is a DISCLOSURE aid, not evidence — a tidy log never substitutes for the independent
  `/evidence-pipeline` render that actually verifies the build.
- **Ambiguous? Escalate, don't decide.** If Figma is unclear/inconsistent, or no token exists for a
  fill, STOP and ask the owner. Guessing is the exact failure this command exists to prevent.
- **Never self-certify.** Do NOT write "works perfectly"/"looks correct." This command ends at
  `status: implemented` = built, NOT verified. Say "**unverified — pending /evidence-pipeline**." Only
  the independent verify stage (a different agent) may certify.
- **Recommended, free: a cross-model check before you trust it.** After building, run an adversarial
  spec-vs-Figma review in a DIFFERENT model/tab (e.g. CODEX) — uncorrelated blind spots catch what a
  same-model self-review rationalizes — then seal with `/evidence-pipeline`.

## Inputs
- A Figma node id (an assembled, real-world example) + the file key.
- The target `atomicLevel` (atom | molecule | organism | template).

## Pre-check — does this belong in the gallery? (triage BEFORE building)
Gallery components are **reusable controls** that work across multiple consumer projects.
Domain-specific components (MarkerCard, LabResultsTable, ClinicalGauge, …) stay in their host
project. Before building, confirm: (1) will ≥2 consumers use it? (2) is it tied to a specific
data domain → if so it stays in the host (`CP.DOMAIN-IN-GALLERY`); (3) does it compose DS
tokens/patterns? Only build it here if it is genuinely reusable. The component audit
(`npm run audit:components`, `CP.*` ids) enforces gallery placement, `useTokens()`, registration,
docs, and maturity status — your build must satisfy them.

---

## Phase A — EXTRACT (Figma node → spec). You are an INSPECTOR, not a translator.

**Workspace convention:** Figma is organized as workspaces — a frame holding an element, its
variations, and subcomponents. **One spec verifies ONE node**; sibling nodes get their own
specs in the same family. Fill `figma.workspace`, `figma.thisNode`, `figma.nodeMap` (every node
+ `role`, `nodeId`, layer `path`, owning `spec`). Read ONLY the node at its documented path;
confirm it sits at `nodeMap[].path` — never a similarly-named node elsewhere.

1. **Copy the template** `docs/atomic/_TEMPLATE.spec.md` → `docs/atomic/<level>/<element>.spec.md`.
   Fill the workspace/nodeMap block before geometry.
2. **Read COMPONENT SETS, not instances** (`mcp__figma__get_figma_data`). For every stateful
   part, find its `componentSets` entry and list ALL `variantStates`; fill
   `figma.componentSetIds` one entry per set. **If a set has ≥2 variants, the spec's
   `thisNode`/`assembledNode`/`verify.figmaExportNode` must point at the COMPONENT_SET node, NOT
   a single variant** — otherwise the state matrix can never verify (LESSONS L1).
3. **Read icons at depth ≥ 6** — nested icons live deep. Set `figma.readDepth: 6`, verify each.
4. **Fill container, state matrix, tokenMap.** Map EVERY visual value to a `tokens.*` — no raw
   hex. `len(states[])` must equal the sum of `variantStates`. When you write a tokenMap entry,
   confirm the alias's actual hex in `src/tokens.ts` equals the Figma fill (LESSONS L4).
5. **Icons[]:** export name (= component SET name), `setId`, `size`, `depthVerified:true`. Add
   new icons via `docs/icon-protocol.md`.
6. **a11y + verify wiring:** fill `a11y`; set `verify.storyId`, `verify.figmaExportNode`,
   `verify.figmaRef`; enumerate every state in `statesToCapture`.
7. **Coverage gaps — report, never hide.** List states NOT shown by a single canonical example;
   present to the user to fold in or add one deliberate example. Keep
   `checklist.story-covers-all-states:false` until every `statesToCapture` is covered.
8. **Set the checklist honestly** — flip a `checklist` id to `pass:true` only after you did that
   read. The verification pipeline WILL challenge it. Record any Figma deviation as an `EX-` entry
   (see Authority) — never adjust a value silently to make something pass or look better.
9. **Self-check:** `npm run audit:specs`, fix every blocker, set `status: extracting`.

---

## Phase B — IMPLEMENT (spec → component + story). The FIXED-POINT RULE: read the SPEC, not Figma.

The spec is the source of truth so the build is deterministic and re-runnable. If the spec
looks wrong, do NOT improvise from Figma OR from taste — fix the spec in Phase A first (and log it).
Inventing a value or behavior in code that the spec doesn't carry is a silent decision (see Authority).

1. **Load the spec front-block** (container, `states[]`, `tokenMap`, `icons`, `a11y`) — these
   are your acceptance criteria.
2. **Icons before component.** For each `icons[]` not in `src/icons/index.ts`, follow
   `docs/icon-protocol.md` exactly: fetch regular + filled, replace ALL `#212121` with
   `{color}`, Fragment-wrap multi-path, `viewBox="0 0 20 20"`, no duplicate exports. Then
   `npm run registry:refresh`.
3. **Component** `<El>.tsx` reads tokens via `useTokens()`. Apply the tokenMap exactly — every
   color a `tokens.*`, never raw hex, never CSS `opacity` for text (use color alpha). Respect
   the 3-tier radius (99/12/8) and the scroll-gutter contract if it scrolls.
4. **Story** `<El>.stories.tsx`: ONE canonical story whose `id` matches `spec.verify.storyId`.
   Render the BARE component as the Figma node frames it (per the container contract — borderless
   if the spec says so); put any rich in-context demo in a SEPARATE story, not the capture target
   (LESSONS L7). **Dark-pair components** (`<Name>Dark`) get their OWN story that sets
   `parameters.atomSurface.supported = "darkAtom"` and renders the dark component unconditionally
   (LESSONS L3) — never a shared surface-swap.
5. **Validate:** `npm run test:typecheck` then `npm run health` (includes `audit:specs`). Fix
   every blocker. Set the spec `status: implemented`.

### AGENTS compliance (self-check before handoff)
- Tokens: no direct PALETTE refs; opacity via alpha; approved fonts; TYPE tokens.
- Icons: Fluent only; fill-based; `viewBox 0 0 20 20`; `filled` branch present.
- a11y: contrast ≥4.5:1 text / ≥3:1 non-text; keyboard; targets ≥24px; focus-visible.

## Done when
`npm run test:typecheck` + `npm run health` pass, the spec is `status: implemented`, **and you have
surfaced the DECISIONS LOG** (every assumption/deviation + each `EX-` entry, or "none"). State the
result as **unverified — pending /evidence-pipeline**; do not call it correct.
**Hand off to verification:** `/evidence-pipeline <slug>` to seal this one component, or include
it in the next `/evidence-wave <level>`. The independent verify stage — a DIFFERENT agent — is what
certifies; this command never does.
