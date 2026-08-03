export const meta = {
  name: 'evidence-atoms-batch',
  description: 'Run the evidence pipeline over a list of components sequentially (commits each), continuing past failures, and return a per-component summary.',
  whenToUse: 'Batch-verify many atoms/molecules. args: { atoms: string[], autoCommit?: boolean }',
  phases: [{ title: 'Batch' }],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}

const DEFAULT_ATOMS = [
  'carouselmark', 'chevroncarousel', 'chevrontrigger', 'divider', 'ellipsisbutton',
  'expandbutton', 'iconslot', 'infoicon', 'logoslot', 'navindentline',
  'railbutton', 'scrollbar', 'selectionindicator', 'trendarrow',
]
const atoms = Array.isArray(A.atoms) && A.atoms.length ? A.atoms : DEFAULT_ATOMS
const autoCommit = A.autoCommit !== false // default true

phase('Batch')
const results = []
for (let i = 0; i < atoms.length; i++) {
  const slug = String(atoms[i]).toLowerCase()
  log(`▶ [${i + 1}/${atoms.length}] ${slug}`)
  let r
  try {
    r = await workflow({ scriptPath: 'scripts/workflows/evidence-pipeline.js' }, { slug, autoCommit })
  } catch (e) {
    r = { status: 'error', error: String((e && e.message) || e) }
  }
  const status = (r && r.status) || 'unknown'
  results.push({
    slug,
    status,
    sha: r && r.commit && r.commit.sha,
    escalations: r && r.humanEscalations,
    reason: r && (r.reason || r.error),
  })
  log(`  ${slug} → ${status}`)
}

const pick = (...s) => results.filter((r) => s.includes(r.status)).map((r) => r.slug)
return {
  total: atoms.length,
  committed: pick('committed'),
  readyToCommit: pick('ready-to-commit'),
  needsHuman: results.filter((r) => r.status === 'needs-human'),
  failed: results.filter((r) => ['blocked', 'unresolved', 'error', 'finalize-failed', 'unknown'].includes(r.status)),
  results,
}
