export const meta = {
  name: 'deploy-wave',
  description: 'Take one or more Figma releases through the deploy pipeline (scout -> assemble -> 3 independent verifiers open the rendered PNGs -> adjudicate -> fix-loop -> sign+gate -> handoff), then run the SHARED governor-vetted self-refinement retrospective over any holds. Enforces doer != checker (assembler != comparison reviewer) and STOPS at handed-off — deployed/signed-off stay the consumer\'s + owner\'s. Self-refinement is FAIL-CLOSED: only tooling/prompt/process/lesson changes a UNANIMOUS 3-governor panel approves as non-loosening are applied, an independent checker re-diffs, and any edit to the deploy gates/lifecycle/role-separation machinery escalates to the owner.',
  whenToUse: 'Assemble + independently verify Figma release(s) to handed-off. The /deploy-wave skill resolves the release(s) and gets HUMAN SCOPE AGREEMENT first. args: { releases: [{node, app, releaseId?, project?}], autoCommit?, refine? }',
  phases: [
    { title: 'Deploy', detail: 'deploy pipeline per release (scout -> assemble -> 3 verifiers -> adjudicate -> fix-loop -> sign+gate -> handoff)' },
    { title: 'Retrospective', detail: 'cluster holds -> implementor proposes -> 3 governors vet (unanimous, non-loosening) -> apply safe -> independent checker re-diffs' },
  ],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
// Accept a single {node, app} or a list under `releases`.
let releases = Array.isArray(A.releases) ? A.releases : (A.node && A.app ? [{ node: A.node, app: A.app, releaseId: A.releaseId, project: A.project }] : [])
releases = releases.filter((r) => r && r.node && r.app)
const autoCommit = A.autoCommit !== false   // default true
const refine = A.refine !== false           // default true
if (!releases.length) return { error: 'no releases provided — the /deploy-wave skill resolves release(s) + gets human scope agreement, then passes { releases: [{node, app}] }.' }

// ---------- Deploy phase: the per-release pipeline ----------
phase('Deploy')
const results = []
for (let i = 0; i < releases.length; i++) {
  const rel = releases[i]
  const tag = rel.releaseId || String(rel.node).replace(/[:]/g, '-')
  log(`▶ [${i + 1}/${releases.length}] ${tag} → ${rel.app}`)
  let r
  try {
    r = await workflow({ scriptPath: 'scripts/workflows/deploy-pipeline.js' }, { ...rel, autoCommit })
  } catch (e) {
    r = { status: 'error', error: String((e && e.message) || e) }
  }
  results.push({
    releaseId: (r && r.releaseId) || tag,
    app: rel.app,
    status: (r && r.status) || 'unknown',
    sha: r && r.handoff && r.handoff.sha,
    escalations: r && (r.humanEscalations || r.upstreamComponentDrift),
    reason: r && (r.reason || r.error),
  })
  log(`  ${tag} → ${results[i].status}`)
}
const pick = (...s) => results.filter((r) => s.includes(r.status)).map((r) => r.releaseId)
const PASSED = new Set(['committed', 'ready-to-handoff'])   // ready-to-handoff = a fully-passing no-commit run
const ledger = {
  total: releases.length,
  committed: pick('committed'),
  readyToHandoff: pick('ready-to-handoff'),
  commitHeld: pick('commit-held'),
  needsHuman: results.filter((r) => r.status === 'needs-human'),
  failed: results.filter((r) => ['blocked', 'unresolved', 'error', 'gate-failed', 'unknown'].includes(r.status)),
  results,
}

// ---------- Retrospective: governor-vetted, fail-closed self-refinement (SHARED machine) ----------
const holds = results.filter((r) => !PASSED.has(r.status))
if (!refine || !autoCommit || !holds.length) {
  return { ...ledger, refinement: { ran: false, reason: !refine ? 'refine:false' : !autoCommit ? 'no-commit (dry run — nothing to learn)' : 'clean wave — nothing to learn' } }
}

phase('Retrospective')
const holdsDigest = JSON.stringify(
  holds.map((h) => ({ releaseId: h.releaseId, app: h.app, status: h.status, escalations: h.escalations, reason: h.reason })), null, 1)

// Same SHARED scripts/workflows/retrospective.js the verify stage uses — only the config differs.
const refinement = await workflow({ scriptPath: 'scripts/workflows/retrospective.js' }, {
  holdsDigest,
  stageName: 'deploy',
  lessonsPath: 'docs/deploy/DEPLOY-LESSONS.md',
  docsToRead: 'docs/deploy/DEPLOY-LESSONS.md, docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md and docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md',
  redTeamDoc: 'docs/evidence/RED-TEAM-2026-06-23.md',
  classHint: "class='tooling' (a deploy capture/template/handoff-generation fix — NOT the audit-deploy-*.js gates), 'prompt' (a scout/verifier wording fix in deploy-pipeline.js — but NOT the assembler/verifier/adjudicator/finalizer role-separation regions, those are owner-only), 'process' (flow/handoff), 'lesson' (a new docs/deploy/DEPLOY-LESSONS.md entry), 'contract' (a matrix-routing rule, lifecycle state, or coverage obligation — OWNER ONLY), or 'gate' (changing what audit-deployment / audit-deploy-verify / audit-deploy-lifecycle accept — OWNER ONLY)",
  ownerOnlyPatterns: [
    'audit-deployment\\.js', 'audit-deploy-verify\\.js', 'audit-deploy-lifecycle\\.js',
    'DEPLOYMENT_HANDOFF_LIFECYCLE\\.md', 'DEPLOYMENT_VERIFICATION_PROTOCOL\\.md', '_TEMPLATE\\.deploy\\.md',
    '\\.spec\\.md$', 'src/tokens\\.ts$', '\\.github/workflows/',
    'scripts/workflows/deploy-pipeline\\.js', 'scripts/workflows/deploy-wave\\.js', 'scripts/workflows/retrospective\\.js',
  ],
  protectedPathsText: 'scripts/audit-deployment.js, audit-deploy-verify.js, audit-deploy-lifecycle.js, docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md, docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md, docs/deploy/_TEMPLATE.deploy.md, any *.spec.md, src/tokens.ts, .github/workflows, the SHARED scripts/workflows/retrospective.js, OR the assembler/verifier/adjudicator/finalizer role-separation prompt regions of scripts/workflows/deploy-pipeline.js',
  safeClasses: ['tooling', 'prompt', 'process', 'lesson'],
})

return { ...ledger, refinement: refinement || { ran: false, reason: 'retrospective sub-workflow returned null' } }
