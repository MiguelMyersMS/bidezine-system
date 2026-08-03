export const meta = {
  name: 'evidence-wave',
  description: 'Verify a wave of components through the evidence pipeline, then run a governor-vetted self-refinement retrospective that hardens the protocol from the run\'s failures. Self-refinement is FAIL-CLOSED: only tooling/prompt/process/lesson changes that a UNANIMOUS 3-governor panel approves as non-loosening are applied, an independent checker re-diffs every edit, and any edit to the gate/sign/spec/role-separation machinery is escalated to the owner, never auto-applied.',
  whenToUse: 'Run a full verification wave. The /evidence-wave skill resolves + filters slugs first. args: { slugs: string[], autoCommit?: boolean, refine?: boolean }',
  phases: [
    { title: 'Verify', detail: 'evidence pipeline per component (scout -> 3 reviews -> adjudicate -> fix-loop -> record -> sign -> gate -> commit)' },
    { title: 'Retrospective', detail: 'cluster holds -> implementor proposes -> 3 governors vet (unanimous, non-loosening) -> apply safe -> independent checker re-diffs' },
  ],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const slugs = (Array.isArray(A.slugs) ? A.slugs : []).map((s) => String(s).toLowerCase()).filter(Boolean)
const autoCommit = A.autoCommit !== false   // default true
const refine = A.refine !== false           // default true
// DIAL 2 (2026-07-12, owner-approved): expose the pipeline's existing `numCheckers` knob on the wave.
// Composition-tier components (organisms that compose ALREADY-SEALED children) run with numCheckers:1 —
// still a full doer≠checker chain (scout → 1 independent review → adjudicate → finalizer), just not 3×
// redundant reviews of children that already carry signed bundles. Owner's contact-sheet eyeball is the
// extra check. Defaults to undefined → the pipeline keeps its 3-reviewer default for full-rigor tiers.
const numCheckers = A.numCheckers
if (!slugs.length) return { error: 'no slugs provided — the /evidence-wave skill resolves, filters (skip sealed+fresh, drop missing) and passes the slug list.' }

// ---------- Verify phase: the proven per-component pipeline, unchanged ----------
phase('Verify')
const results = []
for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i]
  log(`▶ [${i + 1}/${slugs.length}] ${slug}`)
  let r
  try {
    r = await workflow({ scriptPath: 'scripts/workflows/evidence-pipeline.js' }, { slug, autoCommit, numCheckers })
  } catch (e) {
    r = { status: 'error', error: String((e && e.message) || e) }
  }
  results.push({
    slug,
    status: (r && r.status) || 'unknown',
    sha: r && r.commit && r.commit.sha,
    escalations: r && r.humanEscalations,
    reason: r && (r.reason || r.error),
  })
  log(`  ${slug} → ${results[i].status}`)
}
const pick = (...s) => results.filter((r) => s.includes(r.status)).map((r) => r.slug)
const PASSED = new Set(['committed', 'ready-to-commit'])   // ready-to-commit = a fully-passing no-commit run
const ledger = {
  total: slugs.length,
  committed: pick('committed'),
  readyToCommit: pick('ready-to-commit'),
  commitHeld: pick('commit-held'),
  needsHuman: results.filter((r) => r.status === 'needs-human'),
  failed: results.filter((r) => ['blocked', 'unresolved', 'error', 'finalize-failed', 'unknown'].includes(r.status)),
  results,
}

// ---------- Retrospective: governor-vetted, fail-closed self-refinement (SHARED machine) ----------
// A "hold" is anything that did NOT pass (NOT merely "not committed" — a passing no-commit run
// returns ready-to-commit and must not be mined as a failure).
const holds = results.filter((r) => !PASSED.has(r.status))
// A dry preview (no-commit) has no committed work to learn from — skip the retrospective.
if (!refine || !autoCommit || !holds.length) {
  return { ...ledger, refinement: { ran: false, reason: !refine ? 'refine:false' : !autoCommit ? 'no-commit (dry run — nothing to learn)' : 'clean wave — nothing to learn' } }
}

phase('Retrospective')
const holdsDigest = JSON.stringify(
  holds.map((h) => ({ slug: h.slug, status: h.status, escalations: h.escalations, reason: h.reason })), null, 1)

// The retrospective machine is the SHARED scripts/workflows/retrospective.js — every factory-line
// stage runs the IDENTICAL fail-closed governor logic; this stage only supplies its own config
// (owner-only paths, lessons file, protected-region text). Never inline a copy here — a divergent
// copy is exactly how a loosening would slip through.
const refinement = await workflow({ scriptPath: 'scripts/workflows/retrospective.js' }, {
  holdsDigest,
  stageName: 'evidence',
  lessonsPath: 'docs/evidence/LESSONS.md',
  docsToRead: 'docs/evidence/LESSONS.md, docs/evidence/GUIDE.md and docs/evidence/PIPELINE.md',
  redTeamDoc: 'docs/evidence/RED-TEAM-2026-06-23.md',
  classHint: "class='tooling' (a scripts/evidence-capture-*.js fix), 'prompt' (a scout/reviewer wording fix in evidence-pipeline.js — but NOT the doer/checker/adjudicator/finalizer role-separation regions, those are owner-only), 'process' (commit/flow), 'lesson' (a new docs/evidence/LESSONS.md entry), 'contract' (a spec VALUE — OWNER ONLY), or 'gate' (changing what the gate/sign machinery accepts — OWNER ONLY)",
  ownerOnlyPatterns: [
    'audit-evidence\\.js', 'evidence-sign\\.js', 'evidence-record\\.js', 'evidence-baseline\\.js',
    'lib/evidence\\.js', '\\.spec\\.md$', 'src/tokens\\.ts$', '\\.github/workflows/', 'exemptions\\.json$',
    'scripts/workflows/evidence-pipeline\\.js', 'scripts/workflows/evidence-wave\\.js',
  ],
  protectedPathsText: 'scripts/audit-evidence.js, evidence-sign.js, evidence-record.js, scripts/lib/evidence.js, any *.spec.md, src/tokens.ts, .github/workflows, exemptions.json, OR the doer/checker/adjudicator/finalizer/role-separation/signing prompt regions of scripts/workflows/evidence-pipeline.js',
  safeClasses: ['tooling', 'prompt', 'process', 'lesson'],
})

return { ...ledger, refinement: refinement || { ran: false, reason: 'retrospective sub-workflow returned null' } }
