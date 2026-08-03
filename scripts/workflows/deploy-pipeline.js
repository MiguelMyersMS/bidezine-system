export const meta = {
  name: 'deploy-pipeline',
  description: 'Autonomous multi-persona DEPLOY pipeline for ONE release (a Figma assembly -> a consumer app): scout -> assemble (doer) -> 3 independent verifiers open the rendered PNGs element-by-element -> adjudicate -> fix-loop -> sign+gate -> handoff. Enforces doer != checker across separate agents (the assembler stamps deploy.md assembled_by; the finalizer stamps comparison.md reviewer; audit-deploy-verify.js fails if they collide). STOPS at handed-off — deployed/signed-off stay the consumer\'s + owner\'s to report.',
  whenToUse: 'Assemble + independently verify a Figma release and take it to handed-off, no human relaying steps. The handoff folder is written into the CONSUMER\'s own workspace (<consumerDir>/docs/design-system-handoffs/), never this design-language repo. The /deploy-wave skill resolves the release(s) + gets human scope agreement first. args: { node, app, consumerDir?, releaseId?, project?, autoCommit?, maxRounds?, numVerifiers? }',
  phases: [
    { title: 'Scout' },
    { title: 'Assemble' },
    { title: 'Verify' },
    { title: 'Adjudicate' },
    { title: 'Fix' },
    { title: 'Sign' },
    { title: 'Handoff' },
  ],
}

// ---- params -------------------------------------------------------------
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const node = A.node ? String(A.node) : ''
const app = A.app ? String(A.app) : ''
if (!node || !app) return { status: 'error', reason: 'args.node (Figma assembly) and args.app (consumer) are required (e.g. {"node":"289:4585","app":"PLG_dashboard","consumerDir":"../../apps/PLG-dashboard"})' }
const releaseId = (A.releaseId ? String(A.releaseId) : node.replace(/[:]/g, '-'))
const project = (A.project ? String(A.project) : app.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
// The handoff is CONSUMER-OWNED — it lives in the consumer's own workspace, NOT this design-language
// repo (a checked-in blueprint here is what let a tool replicate the consumer app). Default the
// consumer dir from the app name; pass args.consumerDir to be explicit. See DEPLOYMENT_HANDOFF_LIFECYCLE.md.
const consumerDir = (A.consumerDir ? String(A.consumerDir) : `../../apps/${app.replace(/_/g, '-')}`).replace(/\/+$/, '')
const dir = `${consumerDir}/docs/design-system-handoffs/${releaseId}`
const autoCommit = !!A.autoCommit
const maxRounds = A.maxRounds || 3
const numVerifiers = A.numVerifiers || 3

// Identity strings the doer != checker gate compares (audit-deploy-verify.js: assembled_by != reviewer).
const ASSEMBLER = 'deploy-assembler'
const REVIEWER = 'deploy-verifier'

const GUIDE = 'Read docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md, docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md, docs/deploy/_TEMPLATE.deploy.md, and docs/deploy/DEPLOY-LESSONS.md first so you know the lifecycle, the coverage-matrix contract, and the known traps. Authority is Figma (GR4); the consumer imports the SHIPPED component, never a fork (GR5); gallery = reusable only. This pipeline takes a release ONLY to handed-off — never set deployed/signed-off (those are the consumer\'s + owner\'s).'

// ---- schemas ------------------------------------------------------------
const SCOUT_SCHEMA = { type: 'object', additionalProperties: false, required: ['ready', 'reason', 'storybookUp'], properties: {
  ready: { type: 'boolean' }, reason: { type: 'string' }, storybookUp: { type: 'boolean' },
  fileKey: { type: ['string', 'null'] }, fetchedDepth: { type: ['number', 'null'] },
  groundTruthPath: { type: ['string', 'null'] },
  pieces: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['slug', 'role', 'verified'], properties: {
    slug: { type: 'string' }, role: { type: 'string', enum: ['design-system', 'consumer-app'] }, verified: { type: 'boolean' }, note: { type: 'string' } } } },
  unverifiedPieces: { type: 'array', items: { type: 'string' } },
  consumesDesignSystemLive: { type: ['boolean', 'null'] },
} }

const ASSEMBLE_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'log'], properties: {
  ok: { type: 'boolean' }, log: { type: 'string' }, artifactsPresent: { type: 'array', items: { type: 'string' } },
} }

const ROW = { type: 'object', additionalProperties: false, required: ['node', 'element', 'figma', 'render', 'verdict'], properties: {
  node: { type: 'string' }, element: { type: 'string' }, figma: { type: 'string' }, render: { type: 'string' },
  verdict: { type: 'string', enum: ['match', 'diff', 'missing'] },
} }
const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, required: ['openedImages', 'overall', 'rows'], properties: {
  openedImages: { type: 'boolean' }, overall: { type: 'string', enum: ['PASS', 'FAIL'] },
  rows: { type: 'array', items: ROW }, concerns: { type: 'string' },
} }

const ADJ_SCHEMA = { type: 'object', additionalProperties: false, required: ['allMatch', 'rows', 'autoFixable', 'humanEscalations'], properties: {
  allMatch: { type: 'boolean' },
  rows: { type: 'array', items: ROW },
  autoFixable: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'target', 'change', 'rationale'], properties: {
    type: { type: 'string', enum: ['consumer-data', 'consumer-asset', 'matrix-routing'] }, target: { type: 'string' }, change: { type: 'string' }, rationale: { type: 'string' } } } },
  humanEscalations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'context'], properties: { question: { type: 'string' }, context: { type: 'string' } } } },
  upstreamComponentDrift: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['slug', 'drift'], properties: { slug: { type: 'string' }, drift: { type: 'string' } } } },
  toolingGaps: { type: 'array', items: { type: 'string' } },
} }

const FIX_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'applied'], properties: {
  ok: { type: 'boolean' }, applied: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { target: { type: 'string' }, summary: { type: 'string' } }, required: ['target', 'summary'] } }, log: { type: 'string' },
} }

const SIGN_SCHEMA = { type: 'object', additionalProperties: false, required: ['comparisonWritten', 'statusHandedOff', 'coverageGreen', 'verifyGreen', 'lifecycleGreen', 'log'], properties: {
  comparisonWritten: { type: 'boolean' }, statusHandedOff: { type: 'boolean' },
  coverageGreen: { type: 'boolean' }, verifyGreen: { type: 'boolean' }, lifecycleGreen: { type: 'boolean' }, log: { type: 'string' },
} }

const HANDOFF_SCHEMA = { type: 'object', additionalProperties: false, required: ['promptWritten', 'committed'], properties: {
  promptWritten: { type: 'boolean' }, committed: { type: 'boolean' }, sha: { type: 'string' }, message: { type: 'string' },
} }

// ---- pipeline -----------------------------------------------------------
phase('Scout')
const scout = await agent(
  `${GUIDE}\n\nYou are the SCOUT for the release "${releaseId}" (Figma node ${node}) targeting app "${app}". Verify readiness WITHOUT assembling or changing anything:\n` +
  `1. Is Storybook serving on http://localhost:6006 (check /index.json)? If not, report storybookUp:false (do NOT start it).\n` +
  `2. Deep-fetch the Figma assembly ${node} at depth >= 6 and save it VERBATIM as the ground truth under ${dir}/ (report its path + the depth). Export the assembly to a PNG and LOOK at the rendering — the tree includes hidden (visible:false) layers; build the inventory from the VISIBLE state only.\n` +
  `3. TRIAGE every visible node -> [new|changed] x [design-system|consumer-app]. For each design-system piece, find its slug + confirm it already carries a SIGNED, gate-green evidence bundle (docs/evidence/<slug>/ with a signature, and audit-evidence passes). This pipeline does NOT build or verify components — if any DS piece is unverified, list it in unverifiedPieces.\n` +
  `4. Confirm the target app at apps/* consumes @miguel/design-system as a LIVE dependency (and would optimizeDeps.exclude it).\n` +
  `Set ready=true ONLY if storybookUp, the ground truth is saved at depth>=6, AND every design-system piece is already verified (unverifiedPieces empty). If any piece is unverified, ready=false with reason "unverified pieces — run /create-wave + /evidence-wave first: <slugs>". Scope/triage disagreements are the human's to resolve before this runs.`,
  { schema: SCOUT_SCHEMA, label: `scout:${releaseId}`, phase: 'Scout' },
)
if (!scout || !scout.ready) return { status: 'blocked', stage: 'scout', reason: scout ? scout.reason : 'scout failed', scout }
log(`Scout ok: ${releaseId} -> ${app}, ground truth @ depth ${scout.fetchedDepth}, ${scout.pieces?.length || 0} pieces all verified`)

let adjudication = null
let round = 0
let assembled = false
while (round < maxRounds) {
  round += 1

  // Assemble only needs to run once (round 1); later rounds re-capture inside Fix.
  if (!assembled) {
    phase('Assemble')
    const asm = await agent(
      `${GUIDE}\n\nYou are the ASSEMBLER (doer) for release "${releaseId}" -> "${app}". Build the handoff folder ${dir}/ from docs/deploy/_TEMPLATE.deploy.md. Do NOT verify or judge fidelity — just assemble:\n` +
      `1. ${dir}/deploy.md — fill assembly (fileKey, nodeId ${node}, fetchedDepth, groundTruth path), app (name "${app}", path, consumesDesignSystemLive), and the COVERAGE MATRIX: one row for EVERY ground-truth node exactly once (match|inherited|gap|ruling|ignore; visible:false -> ignore with a reason). Set lifecycle.status: verified, lifecycle.created: today.\n` +
      `2. lifecycle.assembled_by: ${ASSEMBLER}  — REQUIRED. You are the doer; this is your identity. Do NOT write the comparison.md reviewer field (that is the independent finalizer's, and it MUST be a different actor).\n` +
      `3. ${dir}/consumer-snapshot/ — the reference wiring (App.tsx/composition, data/config, vite.config.ts) the consumer copies.\n` +
      `4. ${dir}/verify/figma.png + ${dir}/verify/storybook.png — the two triangulation captures you can take here (export the Figma frame; render the shipped component's story). verify/app.png is the consumer's.\n` +
      `5. Run \`npm run registry:refresh\` and the behavior gate \`npm run test:behavior\`.\n` +
      `Report ok=true only if deploy.md (with assembled_by:${ASSEMBLER}), consumer-snapshot/, and verify/figma.png + verify/storybook.png all exist.`,
      { schema: ASSEMBLE_SCHEMA, label: `assemble:${releaseId} r${round}`, phase: 'Assemble' },
    )
    if (!asm || !asm.ok) return { status: 'blocked', stage: 'assemble', round, reason: asm ? asm.log : 'assemble failed' }
    assembled = true
  }

  phase('Verify')
  const verifyPrompt = (n) =>
    `${GUIDE}\n\nYou are INDEPENDENT VERIFIER #${n} of ${numVerifiers} for release "${releaseId}". You did NOT assemble this and have no stake in it passing. Your ONE job is to find where our render does NOT match the Figma rendering.\n` +
    `NON-NEGOTIABLE: you MUST OPEN and READ the actual images with the Read tool — ${dir}/verify/figma.png (the design) and ${dir}/verify/storybook.png (our render). A file size / hash / byte count / node count / "looks right" is NEVER a substitute for opening the pixels; using a proxy is a verification FAILURE, not a pass. Set openedImages=true only if you actually read both.\n` +
    `Itemize EVERY drift-prone element in the matrix (each match/gap/ruling node in ${dir}/deploy.md) as one row: { node, element, figma value, our render value, verdict }. verdict=match only if the pixels genuinely agree; otherwise diff or missing with what's wrong. For a nav surface check at minimum: logo; each rail icon (+ active/disabled state); footer; panel header (title/subtitle/menu/collapse); search; each nav row (label/icon/state/badge/chevron). overall=PASS only if every row is match.`
  const verifications = (await parallel(Array.from({ length: numVerifiers }, (_, i) =>
    () => agent(verifyPrompt(i + 1), { schema: VERIFY_SCHEMA, label: `verify:${releaseId} #${i + 1} r${round}`, phase: 'Verify' }),
  ))).filter(Boolean)
  if (!verifications.length) return { status: 'blocked', stage: 'verify', round, reason: 'no verifications returned' }
  if (verifications.some((v) => !v.openedImages)) {
    return { status: 'blocked', stage: 'verify', round, reason: 'a verifier did not open the rendered images (no-proxy rule) — refusing to proceed', verifications }
  }

  phase('Adjudicate')
  adjudication = await agent(
    `${GUIDE}\n\nYou are the ADJUDICATOR (governor) for release "${releaseId}". You received ${verifications.length} independent verifications (JSON below). Verifiers can be wrong or rationalize — re-open ${dir}/verify/figma.png and ${dir}/verify/storybook.png yourself and VERIFY every claim against the matrix in ${dir}/deploy.md. Figma is the source of truth (GR4).\n\n` +
    `Verifications:\n${JSON.stringify(verifications, null, 2)}\n\n` +
    `Produce the resolved per-node rows (match|diff|missing). For every non-match, classify the cause into EXACTLY one bucket:\n` +
    `  - autoFixable type "consumer-data": the deployment data/prop the matrix wires is wrong (fix the deploy.md/consumer-snapshot wiring). type "consumer-asset": a consumer-side asset (logo/icon swap) is wrong. type "matrix-routing": a node is mis-routed (e.g. a visible node marked ignore). Give exact target + change. These edit the HANDOFF only — never component code.\n` +
    `  - upstreamComponentDrift: the divergence is in a SHIPPED design-system component (an "inherited" node), not the consumer. This is NOT fixable here — it escalates to /evidence-pipeline for that slug. Record { slug, drift }. Forking/patching it in the app is a GR5 violation.\n` +
    `  - humanEscalations: a genuine design-authority decision (an accepted deviation / ruling), with a crisp question.\n` +
    `  - toolingGaps: an artifact of the capture/compare tooling, not the deployment.\n` +
    `allMatch=true ONLY if every node resolves to match. Be conservative: if a divergence is in component fidelity, escalate it upstream — do NOT invent a consumer-side patch for it.`,
    { schema: ADJ_SCHEMA, label: `adjudicate:${releaseId} r${round}`, phase: 'Adjudicate' },
  )
  if (!adjudication) return { status: 'blocked', stage: 'adjudicate', round, reason: 'adjudication failed' }
  log(`Round ${round}: allMatch=${adjudication.allMatch}, autoFixable=${adjudication.autoFixable.length}, upstreamDrift=${adjudication.upstreamComponentDrift?.length || 0}, escalations=${adjudication.humanEscalations.length}`)

  if (adjudication.allMatch) break
  // Upstream component drift or a human decision can't be fixed in the deploy stage — hand it back.
  if ((adjudication.upstreamComponentDrift && adjudication.upstreamComponentDrift.length) || !adjudication.autoFixable.length) {
    return { status: 'needs-human', round, rows: adjudication.rows, upstreamComponentDrift: adjudication.upstreamComponentDrift, humanEscalations: adjudication.humanEscalations, toolingGaps: adjudication.toolingGaps }
  }

  phase('Fix')
  const fix = await agent(
    `${GUIDE}\n\nYou are the ASSEMBLER (doer) applying deploy-side fixes for "${releaseId}". Apply ONLY these adjudicated fixes, exactly as described — make no other changes, and touch NO component source (those escalate upstream):\n${JSON.stringify(adjudication.autoFixable, null, 2)}\n` +
    `These edit the handoff only (deploy.md matrix/data, consumer-snapshot wiring, consumer-side assets). After applying, re-take ${dir}/verify/storybook.png if the render changed. If a fix would require editing a shipped component, do NOT apply it — report ok:false (it must escalate to /evidence-pipeline). Report what you changed.`,
    { schema: FIX_SCHEMA, label: `fix:${releaseId} r${round}`, phase: 'Fix' },
  )
  if (!fix || !fix.ok) return { status: 'blocked', stage: 'fix', round, reason: fix ? fix.log : 'fix failed', adjudication }
  // loop: re-verify the fixed handoff
}

if (!adjudication || !adjudication.allMatch) {
  return { status: 'unresolved', rounds: round, rows: adjudication && adjudication.rows, humanEscalations: adjudication && adjudication.humanEscalations }
}

phase('Sign')
const sign = await agent(
  `${GUIDE}\n\nYou are the FINALIZER (independent checker) for "${releaseId}" — a DIFFERENT actor than the ${ASSEMBLER} who built this. The adjudicated rows (all match) are:\n${JSON.stringify(adjudication.rows, null, 2)}\n\n` +
  `Do EXACTLY this, then report each result truthfully from the ACTUAL command output:\n` +
  `1. Write ${dir}/verify/comparison.md with this EXACT head then the itemized table:\n` +
  `     overall: PASS\n` +
  `     reviewer: ${REVIEWER}\n` +
  `     independent: true\n` +
  `   followed by a markdown table with columns | node | element | figma | render | verdict | — one row per adjudicated node, last cell the verdict (must be match). The reviewer MUST be "${REVIEWER}" (NOT "${ASSEMBLER}") — the deploy gate FAILS if the assembler signed their own comparison.\n` +
  `2. Set lifecycle.status: handed-off in ${dir}/deploy.md. Do NOT set deployed/signed-off (those are the consumer's + owner's).\n` +
  `3. Run the three deploy audits as the gate, pointed at THIS consumer's handoff root (the handoff is\n` +
  `   consumer-owned; the audits scan it via DEPLOY_DIR), and report each:\n` +
  `     DEPLOY_DIR=${consumerDir}/docs/design-system-handoffs node scripts/audit-deployment.js        (coverage — every ground-truth node accounted for)\n` +
  `     DEPLOY_DIR=${consumerDir}/docs/design-system-handoffs node scripts/audit-deploy-verify.js     (verify-completeness + doer!=checker: assembled_by != reviewer)\n` +
  `     DEPLOY_DIR=${consumerDir}/docs/design-system-handoffs node scripts/audit-deploy-lifecycle.js  (valid status, one active release)\n` +
  `Set coverageGreen/verifyGreen/lifecycleGreen true ONLY if that audit exits 0 with no violations for this release.`,
  { schema: SIGN_SCHEMA, label: `sign:${releaseId}`, phase: 'Sign' },
)
if (!sign || !(sign.coverageGreen && sign.verifyGreen && sign.lifecycleGreen && sign.statusHandedOff)) {
  return { status: 'gate-failed', rounds: round, sign }
}

phase('Handoff')
const handoff = await agent(
  `${GUIDE}\n\nYou are the HANDOFF writer for "${releaseId}". The release is verified + handed-off. Generate the consumer prompt:\n` +
  `1. Fill the CONSUMER PROMPT template from the /figma-deploy skill with this release's specifics (components, import paths, props/data from the matrix, the host artifact, the report-back checklist) and write it to ${dir}/consumer-snapshot/HANDOFF-PROMPT.md.\n` +
  (autoCommit
    ? `2. Commit the handoff: stage ${dir}/ (and any consumer-data/matrix files you changed) and commit with a clear conventional message ending with the project's Co-Authored-By line. First show the diff; if anything outside the handoff folder + adjudicated deploy-side fixes appears, STOP and report committed:false. Report the sha.`
    : `2. Do NOT commit (autoCommit is off). Report committed:false; the owner will review and commit.`) +
  `\nThis is the boundary: the release stays at handed-off. The consumer deploys + reports app.png/import_proof/no_fork; the owner signs off.`,
  { schema: HANDOFF_SCHEMA, label: `handoff:${releaseId}`, phase: 'Handoff' },
)

return {
  status: autoCommit ? (handoff && handoff.committed ? 'committed' : 'commit-held') : 'ready-to-handoff',
  rounds: round, releaseId, project, app, sign, handoff,
}
