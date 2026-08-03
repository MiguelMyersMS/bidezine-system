export const meta = {
  name: 'retrospective',
  description: 'Stage-agnostic governor-vetted self-refinement retrospective shared by every factory-line stage (create / verify / deploy). An implementor clusters a run\'s failures and proposes protocol hardenings; a UNANIMOUS 3-governor panel vets them (may ONLY tighten/clarify, never loosen; fail-closed: missing verdict = reject); safe classes auto-apply, then an INDEPENDENT checker re-diffs and reverts anything out-of-bounds/loosening. Owner-only targets escalate in JS regardless of governor opinion. NEVER fork this file: a divergent copy is exactly how a loosening would slip through — each stage configures it via args (ownerOnlyPatterns, lessonsPath, protectedPathsText, safeClasses).',
  phases: [{ title: 'Retrospective' }],
}

let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const holdsDigest = A.holdsDigest || '[]'
const stageName = A.stageName || 'stage'
const lessonsPath = A.lessonsPath || 'docs/evidence/LESSONS.md'
const docsToRead = A.docsToRead || lessonsPath
const redTeamDoc = A.redTeamDoc || 'docs/evidence/RED-TEAM-2026-06-23.md'
const classHint = A.classHint ||
  "class='tooling' (a capture/tooling script fix), 'prompt' (a scout/reviewer wording fix — but NOT the doer/checker/adjudicator/finalizer role-separation regions, those are owner-only), 'process' (commit/flow), 'lesson' (a new lessons-file entry), 'contract' (a spec/contract VALUE — OWNER ONLY), or 'gate' (changing what the gate/sign machinery accepts — OWNER ONLY)"
const protectedPathsText = A.protectedPathsText ||
  'the gate/sign/record scripts, lib/evidence.js, any *.spec.md, src/tokens.ts, .github/workflows, exemptions.json, or the doer/checker/adjudicator/finalizer role-separation prompt regions of the pipeline workflow'
const authoritativeNote = A.authoritativeNote ||
  'The authoritative files are under scripts/workflows/ (this is what the Workflow tool runs and what is committed). If a gitignored .claude/workflows/<same-name>.js mirror exists, refresh it to match too — but it is a LOCAL mirror, not the source of truth.'
const SAFE = new Set(Array.isArray(A.safeClasses) && A.safeClasses.length ? A.safeClasses : ['tooling', 'prompt', 'process', 'lesson'])
// ownerOnlyPatterns arrive as regex SOURCE strings (args are JSON; regexes don't serialize).
// FAIL LOUD on a bad pattern — silently dropping one would shrink the owner-only guard without warning
// (a malformed regex must never quietly make an owner-only target auto-appliable).
const OWNER_ONLY = (Array.isArray(A.ownerOnlyPatterns) ? A.ownerOnlyPatterns : [])
  .map((s) => { try { return new RegExp(s) } catch (e) { throw new Error(`retrospective: ownerOnlyPattern ${JSON.stringify(s)} is not a valid regex — refusing to run with a silently-shrunk owner-only guard (${e.message})`) } })
// Normalize Windows backslash separators to '/' before testing so the forward-slash path patterns
// (e.g. src/tokens.ts, scripts/workflows/...) match regardless of how the proposer wrote the target.
// Over-matching only ever ESCALATES to the owner (never auto-applies), so this is strictly a tightening.
const targetIsOwnerOnly = (t) => { const s = String(t || '').replace(/\\/g, '/'); return OWNER_ONLY.some((re) => re.test(s)) }

phase('Retrospective')

const PROPOSAL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['clusters', 'refinements'], properties: {
    clusters: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['rootCause', 'affectedSlugs', 'evidence'], properties: {
      rootCause: { type: 'string' }, affectedSlugs: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' } } } },
    refinements: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'class', 'target', 'change', 'rationale', 'effect'], properties: {
      id: { type: 'string' },
      class: { type: 'string', enum: ['tooling', 'prompt', 'process', 'lesson', 'contract', 'gate'] },
      target: { type: 'string' }, change: { type: 'string' }, rationale: { type: 'string' },
      effect: { type: 'string', enum: ['tightens', 'clarifies', 'loosens', 'neutral'] } } } },
  },
}

const proposal = await agent(
  `Read ${docsToRead}. You are the RETROSPECTIVE IMPLEMENTOR for a ${stageName} run just finished. These items did NOT pass:\n${holdsDigest}\n\n` +
  `For any hold with empty escalations, READ the reviewer transcripts if the harness exposes them (this run's workflow transcript dir, files matching agent-*.jsonl; grep '"verdict":"fail"') to get the exact failing row; if they are not reachable, say so and reason from the artifacts instead. Cluster the holds by ROOT CAUSE. ` +
  `Then propose concrete refinements that make the protocol TIGHTER or CLEARER so this CLASS of failure is caught up front next time — NOT one-off contract decisions (those are the owner's). ` +
  `Classify each: ${classHint}. ` +
  `Mark effect honestly: tighten/clarify/loosen/neutral. You may NEVER propose loosening a check to make items pass. Describe each change precisely enough to apply (exact file + edit). New lessons go in ${lessonsPath}.`,
  { schema: PROPOSAL_SCHEMA, label: 'retro:propose', phase: 'Retrospective' },
)
if (!proposal || !Array.isArray(proposal.refinements) || !proposal.refinements.length) {
  return { ran: true, clusters: proposal && proposal.clusters, proposed: 0, note: 'no refinements proposed' }
}

const GOV_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['verdicts'], properties: {
    verdicts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'approve', 'detectedEffect', 'safeClass', 'touchesProtected', 'reason'], properties: {
      id: { type: 'string' }, approve: { type: 'boolean' },
      detectedEffect: { type: 'string', enum: ['tightens', 'clarifies', 'loosens', 'neutral'] },
      safeClass: { type: 'boolean' }, touchesProtected: { type: 'boolean' }, reason: { type: 'string' } } } },
  },
}

const govPrompt = (n) =>
  `Read ${redTeamDoc} (if present) and ${lessonsPath}. You are GOVERNOR #${n} of 3 — an adversarial reviewer of proposed protocol self-refinements. ` +
  `HARD RULE (non-negotiable): a refinement may ONLY tighten or clarify verification. REJECT (approve:false) any refinement that would loosen/relax a check, make the gate accept more, weaken doer!=checker or signing, edit a spec/contract VALUE, or change gate strictness. ` +
  `Set touchesProtected=true if its target (or its described edit) touches ANY of: ${protectedPathsText} — those are owner-only and must be rejected for auto-apply. ` +
  `Set safeClass=true ONLY if class is ${[...SAFE].join('/')} AND touchesProtected=false. Independently judge detectedEffect by reading the ACTUAL target file (do not echo the proposer); apply a lexical loosening tripwire — if the change adds permissive tokens (accepts/skip/allow/optional/"N/A"/pass-through/ignore) to a check, treat it as loosens. Default to approve:false when unsure. Proposals:\n${JSON.stringify(proposal.refinements, null, 1)}`

const govs = (await parallel([1, 2, 3].map((n) => () =>
  agent(govPrompt(n), { schema: GOV_SCHEMA, label: `retro:gov#${n}`, phase: 'Retrospective' })))).filter(Boolean)

// FAIL-CLOSED adjudication: require the FULL 3-governor panel; a missing whole response OR a missing
// per-id verdict counts as a REJECT, never a drop; approval must be UNANIMOUS; any loosening/protected
// flag from any governor kills it; and OWNER_ONLY targets are escalated in JS regardless of class or
// governor opinion. (Preserved verbatim from the verify stage — do not weaken.)
const approved = []
const escalated = []
const PANEL = 3
for (const ref of proposal.refinements) {
  const verdicts = govs.map((g) => (g.verdicts || []).find((v) => v.id === ref.id))   // may contain undefined = abstain
  const present = verdicts.filter(Boolean)
  const fullPanel = govs.length === PANEL && present.length === PANEL
  const unanimousApprove = present.length === PANEL && present.every((v) => v.approve && v.detectedEffect !== 'loosens' && v.safeClass && !v.touchesProtected)
  const safeClass = SAFE.has(ref.class) && (ref.effect === 'tightens' || ref.effect === 'clarifies')
  const ownerOnly = targetIsOwnerOnly(ref.target) || ref.class === 'contract' || ref.class === 'gate'
  if (!ownerOnly && safeClass && fullPanel && unanimousApprove) approved.push(ref)
  else escalated.push({ id: ref.id, class: ref.class, target: ref.target, change: ref.change, effect: ref.effect, ownerOnly, govVerdicts: present })
}
log(`Retrospective(${stageName}): ${proposal.refinements.length} proposed → ${approved.length} approved-safe (unanimous 3-panel), ${escalated.length} escalated`)

// Apply, then INDEPENDENTLY verify (doer != checker).
let applied = []
let checkerReport = null
if (approved.length) {
  const APPLY_SCHEMA = { type: 'object', additionalProperties: false, required: ['results'], properties: {
    results: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'applied', 'files'], properties: {
      id: { type: 'string' }, applied: { type: 'boolean' }, files: { type: 'array', items: { type: 'string' } } } } } } }
  const applyReport = await agent(
    `You are the APPLIER. Apply ONLY these governor-approved, safe refinements EXACTLY as described — change nothing else, touch NO spec/contract values, gate, signing, or role-separation prompts:\n${JSON.stringify(approved, null, 1)}\n\n` +
    `${authoritativeNote} ` +
    `For a new lesson, append it to ${lessonsPath} in the existing format. Do NOT git-commit anything. Report per refinement: applied + the exact files you touched.`,
    { schema: APPLY_SCHEMA, label: 'retro:apply', phase: 'Retrospective' },
  )
  applied = (applyReport && applyReport.results) || []

  const CHECK_SCHEMA = { type: 'object', additionalProperties: false, required: ['verifiedIds', 'revertedIds', 'summary'], properties: {
    verifiedIds: { type: 'array', items: { type: 'string' } }, revertedIds: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' } } }
  checkerReport = await agent(
    `You are the independent REFINEMENT CHECKER (you did NOT apply these — doer != checker). The approved refinements were:\n${JSON.stringify(approved.map((r) => ({ id: r.id, target: r.target, change: r.change, effect: r.effect })), null, 1)}\n\n` +
    `Run \`git status --short\` and \`git diff\` yourself. For EACH changed file: (1) confirm it is within an approved refinement's target and is NOT one of the owner-only paths [${protectedPathsText}]; (2) confirm the hunk matches its approved change and does NOT loosen anything (lexical tripwire: reject hunks adding accepts/skip/allow/optional/"N/A"/pass-through/ignore to a check); (3) re-run the smoke test — \`node --check\` for plain scripts, and for scripts/workflows/*.js wrap-validate: \`node -e "const fs=require('fs');new Function('args','log','phase','agent','parallel','pipeline','workflow','budget','return (async()=>{'+fs.readFileSync('<file>','utf8').replace(/^export const meta[\\s\\S]*?\\n}/,'')+'})')"\`. ` +
    `REVERT (\`git checkout -- <file>\`) any file that is out-of-bounds, loosening, or fails its smoke test, and put that refinement's id in revertedIds. Only put an id in verifiedIds if ALL its files passed. Do NOT commit.`,
    { schema: CHECK_SCHEMA, label: 'retro:check', phase: 'Retrospective' },
  )
}

return {
  ran: true,
  clusters: proposal.clusters,
  proposed: proposal.refinements.length,
  approvedSafe: approved.map((r) => ({ id: r.id, class: r.class, target: r.target, change: r.change })),
  escalated,
  applied,
  checker: checkerReport,
}
