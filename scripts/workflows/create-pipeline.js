export const meta = {
  name: 'create-pipeline',
  description: 'Autonomous multi-persona CREATE pipeline for ONE new component: scout -> EXTRACT (spec doer) -> 3 independent spec reviewers re-fetch Figma and compare SPEC<->Figma -> spec-adjudicate (governor) -> spec-fix-loop -> spec gate -> IMPLEMENT (code doer) -> independent code-vs-spec checker -> health gate -> (commit). Enforces doer != checker across separate agents (the extractor never reviews its own spec; the implementer never certifies its own code). Ends at status: implemented — sealing against Figma is the verify stage (/evidence-wave).',
  whenToUse: 'Build a NEW design-system component from a Figma node without a human relaying steps. The /create-wave skill resolves node/fileKey/level/slug + does gallery-vs-domain triage first. args: { node, fileKey, level, slug, autoCommit?, maxRounds?, numReviewers? }',
  phases: [
    { title: 'Scout' },
    { title: 'Extract' },
    { title: 'SpecReview' },
    { title: 'SpecAdjudicate' },
    { title: 'SpecFix' },
    { title: 'SpecGate' },
    { title: 'Implement' },
    { title: 'CodeCheck' },
    { title: 'Commit' },
  ],
}

// ---- params -------------------------------------------------------------
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const node = A.node ? String(A.node) : ''
const fileKey = A.fileKey ? String(A.fileKey) : ''
const level = (A.level ? String(A.level) : '').toLowerCase()
const slug = (A.slug ? String(A.slug) : '').toLowerCase()
if (!node || !slug || !level) return { status: 'error', reason: 'args.node, args.slug and args.level (atom|molecule|organism|template) are required' }
if (!['atom', 'molecule', 'organism', 'template'].includes(level)) return { status: 'error', reason: `invalid level "${level}"` }
const autoCommit = !!A.autoCommit
const maxRounds = A.maxRounds || 3
const numReviewers = A.numReviewers || 3
const specPath = `docs/atomic/${level}/${slug}.spec.md`

const GUIDE = 'Read docs/atomic/PROTOCOL.md, docs/atomic/_TEMPLATE.spec.md, docs/icon-protocol.md, docs/atomic/CREATE-LESSONS.md, and AGENTS.md first. Apply every lesson that fits — especially L1 (if a component SET has >=2 variants, the spec thisNode/assembledNode/verify.figmaExportNode MUST point at the COMPONENT_SET, not a lone variant, or the state matrix can never verify), L4 (every visual value maps to a tokens.* alias whose actual hex in src/tokens.ts equals the Figma fill — no raw hex), L3 (a dark-pair *Dark component gets its OWN story forcing the darkAtom surface), and L7 (the canonical story renders the BARE component as Figma frames it). Figma is the source of truth (GR4). Gallery = reusable controls only — never build a domain-specific component here.'
const SPEC_IDS = ['node-path', 'set-binding', 'tokenmap-hex', 'icons-depth6', 'per-state-fills', 'checklist-honest']

// ---- schemas ------------------------------------------------------------
const SCOUT_SCHEMA = { type: 'object', additionalProperties: false, required: ['ready', 'reason', 'storybookUp', 'isReusable'], properties: {
  ready: { type: 'boolean' }, reason: { type: 'string' }, storybookUp: { type: 'boolean' },
  isReusable: { type: 'boolean' }, alreadyExists: { type: ['boolean', 'null'] },
  fileKey: { type: ['string', 'null'] }, node: { type: ['string', 'null'] },
} }
const EXTRACT_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'specWritten', 'log'], properties: {
  ok: { type: 'boolean' }, specWritten: { type: 'boolean' }, specAuditClean: { type: 'boolean' }, log: { type: 'string' },
} }
const DIM = { type: 'object', additionalProperties: false, required: ['id', 'verdict', 'evidence'], properties: {
  id: { type: 'string' }, verdict: { type: 'string', enum: ['pass', 'fail'] }, evidence: { type: 'string' }, discrepancy: { type: 'string' },
} }
const REVIEW_SCHEMA = { type: 'object', additionalProperties: false, required: ['refetchedFigma', 'dimensions'], properties: {
  refetchedFigma: { type: 'boolean' }, dimensions: { type: 'array', items: DIM }, concerns: { type: 'string' },
} }
const ADJ_SCHEMA = { type: 'object', additionalProperties: false, required: ['allPass', 'checklist', 'autoFixable', 'humanEscalations'], properties: {
  allPass: { type: 'boolean' },
  checklist: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'status', 'evidence'], properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pass', 'fail'] }, evidence: { type: 'string' } } } },
  autoFixable: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['target', 'change', 'rationale'], properties: { target: { type: 'string' }, change: { type: 'string' }, rationale: { type: 'string' } } } },
  humanEscalations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'context'], properties: { question: { type: 'string' }, context: { type: 'string' } } } },
} }
const FIX_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'applied'], properties: {
  ok: { type: 'boolean' }, applied: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { target: { type: 'string' }, summary: { type: 'string' } }, required: ['target', 'summary'] } }, log: { type: 'string' },
} }
const SPECGATE_SCHEMA = { type: 'object', additionalProperties: false, required: ['specAuditGreen', 'statusExtracting', 'log'], properties: {
  specAuditGreen: { type: 'boolean' }, statusExtracting: { type: 'boolean' }, log: { type: 'string' },
} }
const IMPL_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'componentWritten', 'storyWritten', 'log'], properties: {
  ok: { type: 'boolean' }, componentWritten: { type: 'boolean' }, storyWritten: { type: 'boolean' }, log: { type: 'string' },
} }
const CODECHECK_SCHEMA = { type: 'object', additionalProperties: false, required: ['matchesSpec', 'typecheckGreen', 'healthGreen', 'findings', 'log'], properties: {
  matchesSpec: { type: 'boolean' }, typecheckGreen: { type: 'boolean' }, healthGreen: { type: 'boolean' },
  findings: { type: 'array', items: { type: 'string' } }, log: { type: 'string' },
} }
const COMMIT_SCHEMA = { type: 'object', additionalProperties: false, required: ['committed', 'sha'], properties: {
  committed: { type: 'boolean' }, sha: { type: 'string' }, message: { type: 'string' },
} }

// ---- pipeline -----------------------------------------------------------
phase('Scout')
const scout = await agent(
  `${GUIDE}\n\nYou are the SCOUT for a NEW component slug "${slug}" (level ${level}, Figma node ${node}${fileKey ? `, fileKey ${fileKey}` : ''}). WITHOUT extracting or building anything:\n` +
  `1. Storybook on http://localhost:6006 (/index.json)? Report storybookUp.\n` +
  `2. GALLERY-VS-DOMAIN TRIAGE: is this a genuinely REUSABLE control (>=2 consumers, not tied to one data domain)? If it is domain-specific, isReusable=false and ready=false — it stays in the host project (CP.DOMAIN-IN-GALLERY).\n` +
  `3. Does ${specPath} OR src/gallery/<Name>.tsx already exist? If so alreadyExists=true and ready=false (use /evidence-wave to verify an existing one, not /create-wave).\n` +
  `4. Confirm the Figma node + fileKey are reachable for an extract.\n` +
  `Set ready=true ONLY if storybookUp, isReusable, not alreadyExists, and the node is reachable.`,
  { schema: SCOUT_SCHEMA, label: `scout:${slug}`, phase: 'Scout' },
)
if (!scout || !scout.ready) return { status: 'blocked', stage: 'scout', reason: scout ? scout.reason : 'scout failed', scout }
log(`Scout ok: ${slug} (${level}) reusable + new`)

// ---- Spec loop: EXTRACT once, then review -> adjudicate -> fix ----------
phase('Extract')
const extract = await agent(
  `${GUIDE}\n\nYou are the EXTRACTOR (spec doer) for "${slug}". Run Phase A (EXTRACT) of /figma-build: copy docs/atomic/_TEMPLATE.spec.md to ${specPath} and fill it from the Figma node ${node} — workspace/nodeMap FIRST, then read COMPONENT SETS not instances (L1: a set with >=2 variants binds thisNode/assembledNode/verify.figmaExportNode to the COMPONENT_SET), read icons at depth>=6, fill container + the full state matrix (len(states) == sum of variantStates) + tokenMap (every value a tokens.*/SPACE/RADIUS/TYPE alias; confirm each tokens.* hex in src/tokens.ts equals the Figma fill — L4), icons[] (export = SET name, setId, depthVerified), a11y, and verify wiring. Set the checklist HONESTLY (only flip to pass:true after you did that read — reviewers WILL challenge it). Then run \`node scripts/audit-specs.js\` and fix every blocker; set status: extracting. Do NOT implement code yet. Report specWritten + specAuditClean.`,
  { schema: EXTRACT_SCHEMA, label: `extract:${slug}`, phase: 'Extract' },
)
if (!extract || !extract.ok || !extract.specWritten) return { status: 'blocked', stage: 'extract', reason: extract ? extract.log : 'extract failed' }

let adjudication = null
let round = 0
while (round < maxRounds) {
  round += 1

  phase('SpecReview')
  const reviewPrompt = (n) =>
    `${GUIDE}\n\nYou are INDEPENDENT SPEC REVIEWER #${n} of ${numReviewers} for "${slug}". You did NOT write this spec. RE-FETCH the Figma node ${node} yourself (do not trust the spec's copy) and compare the SPEC (${specPath}) against Figma. Return a verdict for EACH id:\n` +
    `- node-path: the spec's thisNode/nodeMap path resolves to the RIGHT node (not a similarly-named one elsewhere).\n` +
    `- set-binding (L1): for every part with a COMPONENT_SET of >=2 variants, thisNode/assembledNode/verify.figmaExportNode points at the SET, and len(states) == sum of variantStates.\n` +
    `- tokenmap-hex (L4): EACH tokenMap tokens.* alias's actual hex in src/tokens.ts equals the Figma fill it maps. Cite a mismatch with both hexes.\n` +
    `- icons-depth6: each icons[] export is the real Fluent SET at depth>=6 with the right identity (regular/filled).\n` +
    `- per-state-fills: each state's fills/typography in the matrix match that Figma variant.\n` +
    `- checklist-honest: no checklist id is pass:true without real evidence (challenge any unverifiable pass).\n` +
    `Set refetchedFigma=true only if you actually re-fetched. Mark "pass" ONLY with concrete evidence (px/hex/token/node id); otherwise "fail" + the discrepancy. Do NOT pass to be agreeable.`
  const reviews = (await parallel(Array.from({ length: numReviewers }, (_, i) =>
    () => agent(reviewPrompt(i + 1), { schema: REVIEW_SCHEMA, label: `specreview:${slug} #${i + 1} r${round}`, phase: 'SpecReview' }),
  ))).filter(Boolean)
  if (!reviews.length) return { status: 'blocked', stage: 'specreview', round, reason: 'no spec reviews returned' }
  if (reviews.some((v) => !v.refetchedFigma)) return { status: 'blocked', stage: 'specreview', round, reason: 'a reviewer did not re-fetch Figma — refusing to proceed', reviews }

  phase('SpecAdjudicate')
  adjudication = await agent(
    `${GUIDE}\n\nYou are the SPEC ADJUDICATOR (governor) for "${slug}". You received ${reviews.length} independent reviews (JSON below). Reviewers can be wrong — RE-FETCH Figma ${node} and VERIFY every claim against it + src/tokens.ts. Figma is the source of truth (GR4).\n\n` +
    `Reviews:\n${JSON.stringify(reviews, null, 2)}\n\n` +
    `Produce a resolved checklist for ids: ${SPEC_IDS.join(', ')}. For every failing id, classify:\n` +
    `  - autoFixable: the SPEC is unambiguously wrong vs Figma/tokens and the correct value is clear (e.g. wrong node binding, a tokenMap alias whose hex doesn't match — point it at the alias whose hex DOES match, or fix the node id). The fix edits ${specPath} ONLY. Give exact target + change.\n` +
    `  - humanEscalations: a genuine design-authority/ambiguous call (Figma itself is inconsistent, or a token doesn't exist for a Figma fill — adding a token is an OWNER decision). Escalate with a crisp question.\n` +
    `allPass=true ONLY if every id resolves to pass. Be conservative: if unsure, escalate rather than auto-fix.`,
    { schema: ADJ_SCHEMA, label: `specadjudicate:${slug} r${round}`, phase: 'SpecAdjudicate' },
  )
  if (!adjudication) return { status: 'blocked', stage: 'specadjudicate', round, reason: 'spec adjudication failed' }
  log(`Spec round ${round}: allPass=${adjudication.allPass}, autoFixable=${adjudication.autoFixable.length}, escalations=${adjudication.humanEscalations.length}`)

  if (adjudication.allPass) break
  if (!adjudication.autoFixable.length) {
    return { status: 'needs-human', stage: 'spec', round, checklist: adjudication.checklist, humanEscalations: adjudication.humanEscalations }
  }

  phase('SpecFix')
  const fix = await agent(
    `${GUIDE}\n\nYou are the EXTRACTOR (spec doer) applying spec fixes for "${slug}". Apply ONLY these adjudicated fixes to ${specPath}, exactly as described — change nothing else, write NO component code:\n${JSON.stringify(adjudication.autoFixable, null, 2)}\n` +
    `These correct the SPEC to match Figma/tokens. After applying, re-run \`node scripts/audit-specs.js\` and fix any blocker. Report what you changed.`,
    { schema: FIX_SCHEMA, label: `specfix:${slug} r${round}`, phase: 'SpecFix' },
  )
  if (!fix || !fix.ok) return { status: 'blocked', stage: 'specfix', round, reason: fix ? fix.log : 'spec fix failed', adjudication }
}
if (!adjudication || !adjudication.allPass) {
  return { status: 'unresolved', stage: 'spec', rounds: round, checklist: adjudication && adjudication.checklist, humanEscalations: adjudication && adjudication.humanEscalations }
}

phase('SpecGate')
const specGate = await agent(
  `${GUIDE}\n\nYou are the SPEC GATE checker for "${slug}". The spec is adjudicated-clean against Figma. Run \`node scripts/audit-specs.js\` and confirm it exits 0 with NO blocker for ${specPath} (the content gate now also rejects any dangling tokens.* alias). Confirm the spec status is "extracting". Report specAuditGreen truthfully from the actual output.`,
  { schema: SPECGATE_SCHEMA, label: `specgate:${slug}`, phase: 'SpecGate' },
)
if (!specGate || !specGate.specAuditGreen) return { status: 'spec-gate-failed', rounds: round, specGate }

// ---- IMPLEMENT (code doer) -> independent code-vs-spec check -----------
phase('Implement')
const impl = await agent(
  `${GUIDE}\n\nYou are the IMPLEMENTER (code doer) for "${slug}". Run Phase B (IMPLEMENT) of /figma-build — the FIXED-POINT RULE: read the SPEC ${specPath}, NOT Figma. (1) For each icons[] not in src/icons/index.ts, follow docs/icon-protocol.md exactly (regular+filled, #212121->{color}, Fragment-wrap, viewBox 0 0 20 20), then \`npm run registry:refresh\`. (2) Write src/gallery/<Name>.tsx reading tokens via useTokens(), applying the tokenMap EXACTLY (every color a tokens.*, never raw hex, never CSS opacity for text), respecting the 3-tier radius + scroll-gutter contract. (3) Write src/gallery/<Name>.stories.tsx — ONE canonical story whose id == spec.verify.storyId rendering the BARE component as Figma frames it (L7); a *Dark pair gets its OWN darkAtom story (L3). Do NOT set status: implemented yet (the independent checker does, after verifying). Report componentWritten + storyWritten.`,
  { schema: IMPL_SCHEMA, label: `implement:${slug}`, phase: 'Implement' },
)
if (!impl || !impl.ok || !impl.componentWritten) return { status: 'blocked', stage: 'implement', reason: impl ? impl.log : 'implement failed' }

phase('CodeCheck')
const codeCheck = await agent(
  `${GUIDE}\n\nYou are the independent CODE-VS-SPEC CHECKER for "${slug}" — you did NOT write this code. Verify the implementation against the SPEC ${specPath} (the spec is the acceptance criteria, the FIXED POINT):\n` +
  `- every tokenMap entry is applied in src/gallery/<Name>.tsx exactly (correct tokens.* alias, no raw hex, no CSS opacity for text);\n` +
  `- each icons[] exists in src/icons and is wired (filled branch where the spec says);\n` +
  `- the story id matches spec.verify.storyId and renders the bare component per the container contract (L7); a *Dark pair has its own darkAtom story (L3);\n` +
  `- the 3-tier radius + scroll-gutter contract hold.\n` +
  `Then run \`npm run test:typecheck\` and \`npm run health\` yourself. If everything passes, set the spec status: implemented. Set matchesSpec/typecheckGreen/healthGreen truthfully from the ACTUAL output; list any finding that blocks. Do NOT commit.`,
  { schema: CODECHECK_SCHEMA, label: `codecheck:${slug}`, phase: 'CodeCheck' },
)
if (!codeCheck || !(codeCheck.matchesSpec && codeCheck.typecheckGreen && codeCheck.healthGreen)) {
  return { status: 'code-check-failed', rounds: round, codeCheck }
}

if (!autoCommit) {
  return { status: 'ready-to-commit', rounds: round, slug, level, note: 'Spec + component are built, adjudicated against Figma, and health-green at status:implemented. Review and commit, or re-run with autoCommit:true. Seal it next with /evidence-wave.' }
}

phase('Commit')
const commit = await agent(
  `${GUIDE}\n\nCommit the new component "${slug}". Stage ${specPath}, src/gallery/<Name>.tsx, src/gallery/<Name>.stories.tsx, any new src/icons/* files, and the registry json if registry:refresh changed it. First show the diff; if anything beyond this component's spec/code/story/icons/registry appears, STOP and report committed:false. Commit with a clear conventional message (feat(${slug}): new ${level} from Figma ${node}) ending with the project's Co-Authored-By line. Report the sha. (This is status:implemented — NOT verified; the verify stage seals it.)`,
  { schema: COMMIT_SCHEMA, label: `commit:${slug}`, phase: 'Commit' },
)
return { status: commit && commit.committed ? 'committed' : 'commit-held', rounds: round, slug, level, commit }
