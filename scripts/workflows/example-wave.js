export const meta = {
  name: 'example-wave',
  description: 'Example & Behavior Wave for ONE component: ground (read docs + extract Figma layout) -> build a Figma-faithful interactive example from the SHIPPED component (4 surface×theme views) -> 3 independent reviews -> adjudicate -> gate (audit-example.js) -> STOP at the owner render gate. A second stage (absorb) turns the owner\'s played-with feedback into behaviors: docs + play tests. Enforces doer != checker; content-binding gate; owner HMAC stamps promote to verified.',
  whenToUse: 'Build a Figma-faithful interactive example the owner can play with to discover behaviors Figma cannot express, then absorb that feedback into docs+tests. Governor-vetted spec: docs/proposals/example-behavior-wave.md. args: { slug, node, fileKey, surface?, stage?("build"|"absorb"), ownerBehaviors?, maxRounds?, numReviewers?, token? }',
  phases: [
    { title: 'Scout' },
    { title: 'Ground' },
    { title: 'Build' },
    { title: 'Review' },
    { title: 'Adjudicate' },
    { title: 'Fix' },
    { title: 'Gate' },
    { title: 'Absorb' },
  ],
}

// ---- params -------------------------------------------------------------
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const slug = (A.slug ? String(A.slug) : '').toLowerCase()
if (!slug) return { status: 'error', reason: 'args.slug is required (e.g. {"slug":"button","node":"702:4035","fileKey":"EyYETHXMDDURPGK4PXTU5C"})' }
const stage = A.stage === 'absorb' ? 'absorb' : 'build'
const node = A.node ? String(A.node) : null
const fileKey = A.fileKey ? String(A.fileKey) : null
const surface = A.surface || null
const request = A.request ? String(A.request) : ''
const ownerBehaviors = Array.isArray(A.ownerBehaviors) ? A.ownerBehaviors : []
const maxRounds = A.maxRounds || 3
const numReviewers = A.numReviewers || 3
const token = A.token || 'pilot-checker-token-2026'

const DIR = `docs/examples/${slug}`
const GUIDE = `Read docs/proposals/example-behavior-wave.md (the governor-vetted spec you are executing), docs/deploy/AI-INTEGRITY-LEDGER.md (the 3 real cheating cases you must NOT repeat), docs/decisions/ADR-005-behavioral-verification-single-source-panel.md (stories render the SHIPPED component; behavior is a play test), and docs/THEME_AND_ATOM_SURFACES.md (the four surface×theme combinations are ALL supported and must stay READABLE — a washout is a bug to FIX, never a question to escalate). NON-NEGOTIABLE: you look at the DOCS and the RENDERED pixels, never eyeball from memory; a plausible-looking approximation is a FAILURE. Every artifact you write lands under ${DIR}/ and is checked by node scripts/audit-example.js ${slug} — which BINDS content to source (it re-reads the real spec/tokens.ts and the bound Figma dump), so fabricated values are caught.`
// The verdict is COMPUTED from these source-derived ids (never typed by the doer).
const VERDICT_IDS = ['figma-grounded', 'shipped-components', 'tokens-contract-bound', 'icons-grounded', 'icons-match-figma', 'interactive-icon-states', 'spec-variants-grounded', 'four-views-distinct', 'contrast-readable', 'behaviors-owner-sourced']
const VIEWS = ['atom-light', 'atom-dark', 'darkAtom-light', 'darkAtom-dark']

// ---- schemas ------------------------------------------------------------
const SCOUT_SCHEMA = { type: 'object', additionalProperties: false, required: ['ready', 'reason', 'storybookUp'], properties: {
  ready: { type: 'boolean' }, reason: { type: 'string' }, storybookUp: { type: 'boolean' },
  fileKey: { type: ['string', 'null'] }, node: { type: ['string', 'null'] },
  storyId: { type: ['string', 'null'] }, surface: { type: ['string', 'null'] },
  governingDocs: { type: 'array', items: { type: 'string' } },
} }
const OK_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'log'], properties: {
  ok: { type: 'boolean' }, log: { type: 'string' }, artifacts: { type: 'array', items: { type: 'string' } }, actorId: { type: ['string', 'null'] },
} }
const DIM = { type: 'object', additionalProperties: false, required: ['id', 'verdict', 'evidence'], properties: {
  id: { type: 'string' }, verdict: { type: 'string', enum: ['pass', 'fail'] }, evidence: { type: 'string' }, discrepancy: { type: 'string' },
} }
const REVIEW_SCHEMA = { type: 'object', additionalProperties: false, required: ['dimensions'], properties: {
  dimensions: { type: 'array', items: DIM }, concerns: { type: 'string' },
} }
const ADJ_SCHEMA = { type: 'object', additionalProperties: false, required: ['allPass', 'checklist', 'autoFixable', 'humanEscalations'], properties: {
  allPass: { type: 'boolean' },
  checklist: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'status', 'evidence'], properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pass', 'fail'] }, evidence: { type: 'string' } } } },
  autoFixable: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'target', 'change', 'rationale'], properties: { type: { type: 'string', enum: ['code-bug', 'contract-violation'] }, target: { type: 'string' }, change: { type: 'string' }, rationale: { type: 'string' } } } },
  humanEscalations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'context', 'docsSearched'], properties: { question: { type: 'string' }, context: { type: 'string' }, docsSearched: { type: 'array', items: { type: 'string' } } } } },
} }
const GATE_SCHEMA = { type: 'object', additionalProperties: false, required: ['gateGreen', 'blockers', 'log'], properties: {
  gateGreen: { type: 'boolean' }, blockers: { type: 'array', items: { type: 'string' } }, log: { type: 'string' },
} }

// ---- absorb stage (segment B) -------------------------------------------
if (stage === 'absorb') {
  if (!ownerBehaviors.length) return { status: 'error', reason: 'stage:absorb requires args.ownerBehaviors: [{id, quote}] captured VERBATIM from the owner at render-gate 1' }
  phase('Absorb')
  const write = await agent(
    `${GUIDE}\n\nYou are the BUILDER (doer) ABSORBING the owner's played-with feedback for "${slug}". The owner stated these behaviors VERBATIM (do NOT paraphrase, soften, or add your own):\n${JSON.stringify(ownerBehaviors, null, 2)}\n` +
    `1. Write ${DIR}/owner-behaviors.md with each quote EXACTLY, tagged as [[q-<id>]] using the given ids.\n` +
    `2. For EACH owner behavior, add an entry to the component's spec behaviors: block (docs/atomic/**/${slug}.spec.md) that CITES its q-<id> (field: quote: q-<id>). Do NOT invent behaviors the owner did not state; if you believe an additional behavior is implied, add it ONLY as proposal: true (quarantined) for the owner to accept later — never as an accepted behavior.\n` +
    `3. For EACH owner behavior, write a Storybook play-function contract test (wired into test:behavior) that asserts the behavior on the SHIPPED component (>=1 expect/toHave against a DOM role/query/computed style). Then PROVE it is not a stub: temporarily disable the behavior in the code, confirm the test FAILS (red), restore, confirm it PASSES (green), and record the red->green in ${DIR}/mutation-proof.json {behaviorId, redRun, greenRun}.\n` +
    `Report ok only if owner-behaviors.md, the behaviors: entries (each with a q-id), the play tests, and mutation-proof.json all exist. Set actorId to your reviewer-distinct id.`,
    { schema: OK_SCHEMA, label: `absorb:build:${slug}`, phase: 'Absorb' },
  )
  if (!write || !write.ok) return { status: 'blocked', stage: 'absorb', reason: write ? write.log : 'absorb failed' }
  const intent = await agent(
    `${GUIDE}\n\nYou are an INDEPENDENT REVIEWER for "${slug}" behavior absorption — you did NOT write these and have no stake. For EACH entry in the spec behaviors: block, verify the play test's ASSERTIONS actually check what the OWNER QUOTE (${DIR}/owner-behaviors.md, by q-id) says — not merely what the builder's prose says. Flag any behavior whose test is weaker than the quote, any behavior with no q-id, and any proposal:true that was smuggled in as accepted. Return a verdict per behavior id.`,
    { schema: REVIEW_SCHEMA, label: `absorb:review:${slug}`, phase: 'Absorb' },
  )
  phase('Gate')
  const gate = await agent(
    `${GUIDE}\n\nYou are the independent GATE runner for "${slug}". Run: node scripts/audit-example.js ${slug}. Report gateGreen=true ONLY if it prints "[example-audit] PASS" (0 blockers). List every blocker id verbatim otherwise. Independent reviewer notes: ${JSON.stringify(intent && intent.dimensions || [], null, 2)}`,
    { schema: GATE_SCHEMA, label: `absorb:gate:${slug}`, phase: 'Gate' },
  )
  if (!gate || !gate.gateGreen) return { status: 'absorb-gate-failed', blockers: gate && gate.blockers, intent }
  return { status: 'awaiting-owner-behaviors', note: 'Behaviors absorbed, tests pass, gate green (example-ready). OWNER GATE 2: confirm these documented behaviors + tests match what you said, then produce owner-behaviors-stamp.json (HMAC) to flip status: verified. The doer cannot self-promote.' }
}

// ---- build stage (segment A) --------------------------------------------
phase('Scout')
const scout = await agent(
  `${GUIDE}\n\nYou are the SCOUT for the "${slug}" example (Figma node ${node || '(from spec)'}, file ${fileKey || '(from spec)'}). Verify readiness WITHOUT building anything:\n` +
  `1. Storybook on http://localhost:6006 (/index.json)? Report storybookUp (do NOT start it).\n` +
  `2. Resolve the component spec docs/atomic/**/${slug}.spec.md and its shipped component (src/gallery/${slug[0].toUpperCase()+slug.slice(1)}.tsx or per spec).\n` +
  `3. Resolve the Example story id to build into (e.g. atoms-${slug}--example).\n` +
  `4. Confirm the governing docs exist and list them (THEME_AND_ATOM_SURFACES.md, ADR-005, the ${slug} spec).\n` +
  `5. surface: ${surface || 'derive from the Figma frame (atom vs darkAtom)'}.\n` +
  `ready=true only if storybookUp, the spec + shipped component exist, the Figma node is reachable, and the story id resolves. Else ready=false with a precise reason.`,
  { schema: SCOUT_SCHEMA, label: `scout:${slug}`, phase: 'Scout' },
)
if (!scout || !scout.ready) return { status: 'blocked', stage: 'scout', reason: scout ? scout.reason : 'scout failed', scout }
const theNode = node || scout.node
const theFileKey = fileKey || scout.fileKey
log(`Scout ok: node ${theNode}, story ${scout.storyId}, surface ${scout.surface || surface}`)

phase('Ground')
const ground = await agent(
  `${GUIDE}\n\nYou are the BUILDER (doer) GROUNDING the "${slug}" example — READ, do not reason. Produce these artifacts under ${DIR}/ (create the dir):\n` +
  `1. figma-raw.json: the RAW get_figma_data dump of node ${theNode} (file ${theFileKey}). 2. figma-layout.json: {fileKey:"${theFileKey}", nodeId:"${theNode}", capturedAt, rawDumpSha256:<sha256 of figma-raw.json bytes>, surface, layout:{layoutMode, per-child sizing (fill/hug), paddingLeft/Right/Top/Bottom, itemSpacing, and each item's layout inputs}, icons:[{slot, figmaIcon:<the Figma icon component NAME copied VERBATIM from the dump, e.g. "Number Circle 1">, dsIcon:<the matching DS icon export in src/icons>, interactive:<true if the icon sits on an interactive control>, aliasReason?:<REQUIRED only when dsIcon is not lexically related to figmaIcon, justifying the mapping>}]} — extract the LAYOUT (arrangement + sizing) AND the per-slot ICON IDENTITY from the dump; the gate re-reads figma-raw.json and FAILS if a figmaIcon name is not in it. NEVER reuse a prior example's icons — a wrong icon (folder vs "Number Circle 1") is a grounding failure (ledger Case 4). 3. figma-frame.png: export the frame image (the visible reference) and IDENTIFY its surface (light/dark) from the pixels, recording it in figma-layout.surface. 4. docs-read.md: a \`\`\`json fence of [{file, symbol, value}] triples you ACTUALLY read from the ${slug} spec, THEME_AND_ATOM_SURFACES.md, and src/tokens.ts — every token the example will use, with its real resolved value copied from the source (the gate re-reads the file and FAILS if your value is not literally present).\n` +
  `Report ok only when all four exist and figma-layout.rawDumpSha256 equals the sha256 of figma-raw.json.`,
  { schema: OK_SCHEMA, label: `build:ground:${slug}`, phase: 'Ground' },
)
if (!ground || !ground.ok) return { status: 'blocked', stage: 'ground', reason: ground ? ground.log : 'ground failed' }

let adjudication = null
let round = 0
while (round < maxRounds) {
  round += 1
  phase('Build')
  const build = await agent(
    `${GUIDE}\n\n${request ? `OWNER REQUEST (in addition to the Figma-grounded base — honor it precisely): ${request}\n\n` : ''}You are the BUILDER (doer) for "${slug}", round ${round}. Build the interactive example into the ${slug} Example story using ONLY the SHIPPED component(s) (ADR-005 — NO raw <div>/<span> grafts standing in for UI, NO approximated tokens; the container is only the layout frame from figma-layout.json). Use EXACTLY the icons declared in figma-layout.icons (the dsIcon for each slot) — NEVER reuse a prior example's icons (ledger Case 4: a folder shipped where the linked node said "Number Circle 1"). DOC-GROUNDED VARIANTS: if the request includes a STATE Figma cannot encode (e.g. loading/spinner), you MUST NOT invent it — declare it in ${DIR}/example.json specVariants:[{name, authorizedBy:"<the EX-id in the spec that authorizes it, e.g. EX-BUTTON-001>", specPath:"<the component spec>", claims:[{value:<a phrase COPIED from that spec/EX-entry>}]}] and build it with the SHIPPED prop (e.g. Button loading -> its own <Spinner>), never a hand-rolled element. The gate FAILS (EX.DOCVARIANT-UNAUTHORIZED/-CLAIM-FABRICATED) if the EX-id or claim is not literally in the spec. Implement the interactive ICON protocol: each interactive icon toggles Regular->Filled on hover/press per state (CLAUDE.md icon rules), and emit ${DIR}/icon-state-proof.json {iconStates:[{slot, redRun, greenRun}]} — for EACH interactive icon, a red->green play test proving the swap (disable the swap -> test FAILS red -> restore -> PASSES green). A wrong dsIcon vs its figmaIcon name fails EX.ICON-NAME-MISMATCH (use aliasReason only for a genuinely-justified non-lexical mapping). Wire the 4-view switches (atomSurface × theme) and make it interactive (container-width control, hover, disabled) so the owner can play.\n` +
    `Then produce: 1. ${DIR}/component-manifest.json {built_by:"${`build:${slug}:r${round}`}", story:"<the .stories.tsx path>", imports:[shipped component names], slotTokens:{slot: "tokens.X"} using ONLY tokens present in docs-read.md}. 2. ${DIR}/views/{${VIEWS.join(',')}}.png — render each surface×theme combo. 3. ${DIR}/views/capture-stamps.json {"<view>":{surface,theme,storyId,sha256 of that png}}. 4. ${DIR}/contrast.json {view:"darkAtom-dark", region, ratio:<computed foreground-vs-pill contrast>, pngSha256:<sha256 of darkAtom-dark.png>} — the readable-content contract must hold (>=4.5).\n` +
    `Report ok only when the manifest, all 4 view PNGs, capture-stamps, and contrast.json exist. Set actorId to "${`build:${slug}:r${round}`}".`,
    { schema: OK_SCHEMA, label: `build:${slug} r${round}`, phase: 'Build' },
  )
  if (!build || !build.ok) return { status: 'blocked', stage: 'build', round, reason: build ? build.log : 'build failed' }

  phase('Review')
  const reviewPrompt = (n) =>
    `${GUIDE}\n\nYou are INDEPENDENT REVIEWER #${n} of ${numReviewers} for the "${slug}" example. You did NOT build it. Using your EYES on the actual images and the SOURCE artifacts (never the builder's say-so), return a pass/fail + concrete evidence for EACH id: ${VERDICT_IDS.join(', ')}.\n` +
    `- figma-grounded: ${DIR}/figma-layout.json values are derivable from ${DIR}/figma-raw.json (bound dump); ${DIR}/docs-read.md token values match the real spec/tokens.ts.\n` +
    `- shipped-components: ${DIR}/component-manifest.json imports are actually used in the story; NO raw styled <div>/<span> grafts; NO untokenized color literals.\n` +
    `- tokens-contract-bound: every tokens.* the story uses appears in docs-read.md for its slot (catch a real-but-WRONG token).\n` +
    `- icons-grounded: figma-layout.icons maps each slot to a dsIcon whose figmaIcon name is present in figma-raw.json, and the story uses ONLY those declared dsIcons (no stale/undeclared icon).\n` +
    `- icons-match-figma: OPEN the render + read figma-layout.icons: each dsIcon must be the SEMANTICALLY correct icon for its figmaIcon NAME (e.g. figmaIcon "Number Circle 1" -> a numbered-circle icon, NOT a folder). A wrong icon vs the linked node is a FAIL (ledger Case 4).\n` +
    `- interactive-icon-states: interactive icons follow the Regular->Filled hover/press protocol (CLAUDE.md); a static/no-swap icon on an interactive control is a FAIL.\n` +
    `- four-views-distinct: OPEN all 4 ${DIR}/views/*.png — they must be genuinely DIFFERENT renders (not duplicates / a switch no-op) and each match its {surface,theme} stamp.\n` +
    `- contrast-readable: the darkAtom-dark foreground is READABLE on its pill (THEME_AND_ATOM_SURFACES contract). A washout is a FAIL (a bug to fix), never an owner question.\n` +
    `- behaviors-owner-sourced: N/A at build stage (pass).\n` +
    `Mark pass ONLY with concrete evidence (cite hex/token/px/which png). Do NOT pass to be agreeable.`
  const reviews = (await parallel(Array.from({ length: numReviewers }, (_, i) =>
    () => agent(reviewPrompt(i + 1), { schema: REVIEW_SCHEMA, label: `review:${slug} #${i + 1} r${round}`, phase: 'Review' }),
  ))).filter(Boolean)
  if (!reviews.length) return { status: 'blocked', stage: 'review', round, reason: 'no reviews returned' }

  phase('Adjudicate')
  adjudication = await agent(
    `${GUIDE}\n\nYou are the ADJUDICATOR (governor) for "${slug}". ${reviews.length} independent reviews below. Reviewers can be wrong — VERIFY every claim against the SOURCE (${DIR}/figma-layout.json, ${DIR}/figma-raw.json, ${DIR}/docs-read.md, THEME_AND_ATOM_SURFACES.md), not their say-so.\nReviews:\n${JSON.stringify(reviews, null, 2)}\n\n` +
    `Produce a resolved checklist for: ${VERDICT_IDS.join(', ')}. For every failing id classify into EXACTLY one bucket:\n` +
    `  - autoFixable "code-bug": the example code/tokens disagree with figma-layout/docs-read and the fix is unambiguous (target + exact change).\n` +
    `  - autoFixable "contract-violation": the render violates a WRITTEN contract (e.g. darkAtom-dark washout vs THEME_AND_ATOM_SURFACES readable rule). This is a BUG TO FIX, never an owner question — give the fix.\n` +
    `  - humanEscalations: ONLY a genuine design-authority question that NO document answers. You MUST list docsSearched (the governing files you checked); if THEME_AND_ATOM_SURFACES / the spec / ADR-005 covers it, it is NOT an escalation — reclassify it as a fix.\n` +
    `Then write ${DIR}/comparison.md: a "## Checklist" with "- [x] <id> — <evidence>" for every id, and header lines "built_by: ${`build:${slug}`}", "reviewer: review:${slug}", "adjudicator: adjudicate:${slug}" (these must be DISTINCT — doer≠checker). allPass=true only if every id resolves pass.`,
    { schema: ADJ_SCHEMA, label: `adjudicate:${slug} r${round}`, phase: 'Adjudicate' },
  )
  if (!adjudication) return { status: 'blocked', stage: 'adjudicate', round, reason: 'adjudication failed' }
  log(`Round ${round}: allPass=${adjudication.allPass}, fixes=${adjudication.autoFixable.length}, escalations=${adjudication.humanEscalations.length}`)
  if (adjudication.allPass) break
  if (!adjudication.autoFixable.length) return { status: 'needs-human', round, checklist: adjudication.checklist, humanEscalations: adjudication.humanEscalations }

  phase('Fix')
  const fix = await agent(
    `${GUIDE}\n\nYou are the BUILDER (doer) applying ADJUDICATED fixes for "${slug}" — apply ONLY these, nothing else:\n${JSON.stringify(adjudication.autoFixable, null, 2)}\nFor a contract-violation, FIX the code so the contract holds (e.g. a theme-invariant token so darkAtom-dark stays readable). Re-render the affected views + recompute contrast.json. Report what you changed.`,
    { schema: OK_SCHEMA, label: `build:fix:${slug} r${round}`, phase: 'Fix' },
  )
  if (!fix || !fix.ok) return { status: 'blocked', stage: 'fix', round, reason: fix ? fix.log : 'fix failed', adjudication }
}
if (!adjudication || !adjudication.allPass) return { status: 'unresolved', rounds: round, checklist: adjudication && adjudication.checklist }

phase('Gate')
const gate = await agent(
  `${GUIDE}\n\nYou are the independent GATE runner (checker) for "${slug}". Do EXACTLY:\n` +
  `1. Sign the comparison: write ${DIR}/comparison.sig.json {digest:<sha256 of comparison.md>, sig:<HMAC-SHA256(EVIDENCE_CHECK_TOKEN, digest)>} using EVIDENCE_CHECK_TOKEN=${token} (reuse scripts/lib/evidence.js hmac()).\n` +
  `2. Run the gate: EVIDENCE_CHECK_TOKEN=${token} node scripts/audit-example.js ${slug}.\n` +
  `gateGreen=true ONLY if it prints "[example-audit] PASS" with 0 blockers. List every blocker id otherwise. (status stays example-ready — verified needs the OWNER stamp, which the wave cannot self-produce.)`,
  { schema: GATE_SCHEMA, label: `gate:${slug}`, phase: 'Gate' },
)
if (!gate || !gate.gateGreen) return { status: 'gate-failed', rounds: round, blockers: gate && gate.blockers, gate }

return {
  status: 'awaiting-owner-renders', rounds: round, views: VIEWS.map((v) => `${DIR}/views/${v}.png`),
  note: 'Example built + gate-green (example-ready). OWNER GATE 1: play with the example (hover, disable, resize the container, switch the 4 views), confirm the renders, and capture any behaviors Figma cannot express as VERBATIM quotes. Then: (a) produce owner-renders-stamp.json (HMAC) to confirm the renders, and (b) re-run this wave with {stage:"absorb", ownerBehaviors:[{id,quote}...]} to turn your feedback into behaviors: docs + play tests. The doer cannot self-promote to verified.',
}
