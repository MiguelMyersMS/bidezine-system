export const meta = {
  name: 'create-wave',
  description: 'Build one or more NEW components through the create pipeline (scout -> EXTRACT -> 3 independent spec reviewers re-fetch Figma -> spec-adjudicate -> spec-fix-loop -> spec gate -> IMPLEMENT -> independent code-vs-spec check -> health gate -> commit), then run the SHARED governor-vetted self-refinement retrospective. Enforces doer != checker (the extractor never reviews its own spec; the implementer never certifies its own code) and ends at status: implemented — sealing against Figma is the verify stage (/evidence-wave). Self-refinement is FAIL-CLOSED: only tooling/prompt/process/lesson changes a UNANIMOUS 3-governor panel approves as non-loosening are applied; spec-template/PROTOCOL/gate edits escalate to the owner.',
  whenToUse: 'Build NEW component(s) from Figma. The /create-wave skill resolves node/fileKey/level/slug + does gallery-vs-domain triage first. args: { components: [{node, fileKey, level, slug}], autoCommit?, refine? }',
  phases: [
    { title: 'Create', detail: 'create pipeline per component (scout -> extract -> 3 spec reviews -> adjudicate -> fix-loop -> spec gate -> implement -> code check -> commit)' },
    { title: 'Retrospective', detail: 'cluster holds -> implementor proposes -> 3 governors vet (unanimous, non-loosening) -> apply safe -> independent checker re-diffs' },
  ],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
// Accept a single {node, fileKey, level, slug} or a list under `components`.
let components = Array.isArray(A.components) ? A.components : (A.node && A.slug && A.level ? [{ node: A.node, fileKey: A.fileKey, level: A.level, slug: A.slug }] : [])
components = components.filter((c) => c && c.node && c.slug && c.level).map((c) => ({ ...c, slug: String(c.slug).toLowerCase(), level: String(c.level).toLowerCase() }))
const autoCommit = A.autoCommit !== false   // default true
const refine = A.refine !== false           // default true
if (!components.length) return { error: 'no components provided — the /create-wave skill resolves node/fileKey/level/slug (+ gallery-vs-domain triage), then passes { components: [{node, fileKey, level, slug}] }.' }

// ---------- Create phase: the per-component pipeline ----------
phase('Create')
const results = []
for (let i = 0; i < components.length; i++) {
  const c = components[i]
  log(`▶ [${i + 1}/${components.length}] ${c.slug} (${c.level})`)
  let r
  try {
    r = await workflow({ scriptPath: 'scripts/workflows/create-pipeline.js' }, { ...c, autoCommit })
  } catch (e) {
    r = { status: 'error', error: String((e && e.message) || e) }
  }
  results.push({
    slug: (r && r.slug) || c.slug,
    level: c.level,
    status: (r && r.status) || 'unknown',
    sha: r && r.commit && r.commit.sha,
    escalations: r && r.humanEscalations,
    reason: r && (r.reason || r.error),
  })
  log(`  ${c.slug} → ${results[i].status}`)
}
const pick = (...s) => results.filter((r) => s.includes(r.status)).map((r) => r.slug)
const PASSED = new Set(['committed', 'ready-to-commit'])   // ready-to-commit = a fully-passing no-commit run
const ledger = {
  total: components.length,
  committed: pick('committed'),
  readyToCommit: pick('ready-to-commit'),
  commitHeld: pick('commit-held'),
  needsHuman: results.filter((r) => r.status === 'needs-human'),
  failed: results.filter((r) => ['blocked', 'unresolved', 'error', 'spec-gate-failed', 'code-check-failed', 'unknown'].includes(r.status)),
  results,
}

// ---------- Retrospective: governor-vetted, fail-closed self-refinement (SHARED machine) ----------
const holds = results.filter((r) => !PASSED.has(r.status))
if (!refine || !autoCommit || !holds.length) {
  return { ...ledger, refinement: { ran: false, reason: !refine ? 'refine:false' : !autoCommit ? 'no-commit (dry run — nothing to learn)' : 'clean wave — nothing to learn' } }
}

phase('Retrospective')
const holdsDigest = JSON.stringify(
  holds.map((h) => ({ slug: h.slug, level: h.level, status: h.status, escalations: h.escalations, reason: h.reason })), null, 1)

// Same SHARED scripts/workflows/retrospective.js the verify + deploy stages use — only the config differs.
const refinement = await workflow({ scriptPath: 'scripts/workflows/retrospective.js' }, {
  holdsDigest,
  stageName: 'create',
  lessonsPath: 'docs/atomic/CREATE-LESSONS.md',
  docsToRead: 'docs/atomic/CREATE-LESSONS.md, docs/atomic/PROTOCOL.md and docs/atomic/_TEMPLATE.spec.md',
  redTeamDoc: 'docs/evidence/RED-TEAM-2026-06-23.md',
  classHint: "class='tooling' (a create capture/helper fix — NOT audit-specs.js / audit-components.js), 'prompt' (a scout/reviewer wording fix in create-pipeline.js — but NOT the extractor/reviewer/adjudicator/implementer/checker role-separation regions, those are owner-only), 'process' (flow), 'lesson' (a new docs/atomic/CREATE-LESSONS.md entry), 'contract' (a spec-template/PROTOCOL value or any .spec.md value — OWNER ONLY), or 'gate' (changing what audit-specs / audit-components accept — OWNER ONLY)",
  ownerOnlyPatterns: [
    'audit-specs\\.js', 'audit-components\\.js', '_TEMPLATE\\.spec\\.md', 'docs/atomic/PROTOCOL\\.md', 'icon-protocol\\.md',
    '\\.spec\\.md$', 'src/tokens\\.ts$', '\\.github/workflows/',
    'scripts/workflows/create-pipeline\\.js', 'scripts/workflows/create-wave\\.js', 'scripts/workflows/retrospective\\.js',
  ],
  protectedPathsText: 'scripts/audit-specs.js, scripts/audit-components.js, docs/atomic/_TEMPLATE.spec.md, docs/atomic/PROTOCOL.md, docs/icon-protocol.md, any *.spec.md, src/tokens.ts, .github/workflows, the SHARED scripts/workflows/retrospective.js, OR the extractor/reviewer/adjudicator/implementer/checker role-separation prompt regions of scripts/workflows/create-pipeline.js',
  safeClasses: ['tooling', 'prompt', 'process', 'lesson'],
})

return { ...ledger, refinement: refinement || { ran: false, reason: 'retrospective sub-workflow returned null' } }
