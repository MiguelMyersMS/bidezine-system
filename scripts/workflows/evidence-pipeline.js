export const meta = {
  name: 'evidence-pipeline',
  description: 'Autonomous multi-persona evidence pipeline for ONE component: capture -> 3 independent reviews -> adjudicate -> fix-loop -> record -> sign -> gate -> (commit). Enforces doer != checker across separate agents.',
  whenToUse: 'Run the full Figma->evidence verification on a component without a human relaying steps. args: { slug, autoCommit?, maxRounds?, numCheckers?, token? }',
  phases: [
    { title: 'Scout' },
    { title: 'Capture' },
    { title: 'Review' },
    { title: 'Adjudicate' },
    { title: 'Fix' },
    { title: 'Finalize' },
    { title: 'Commit' },
  ],
}

// ---- params -------------------------------------------------------------
// The harness may hand `args` over as a JSON string OR an object — normalize both.
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = {} } }
A = A || {}
const slug = (A.slug ? String(A.slug) : '').toLowerCase()
if (!slug) return { status: 'error', reason: 'args.slug is required (e.g. {"slug":"clearbutton"})' }
const autoCommit = !!A.autoCommit
const maxRounds = A.maxRounds || 3
const numCheckers = A.numCheckers || 3
const token = A.token || 'pilot-checker-token-2026'

const GUIDE = 'Read docs/evidence/GUIDE.md and docs/evidence/README.md first so you know the protocol and the npm scripts. Also read docs/evidence/LESSONS.md and apply every Prevention check that fits this component — especially L1 (when the spec lists >=2 variantStates, confirm the exported node is the COMPONENT_SET, not a lone variant), L3 (a *dark slug is captured from its BASE-TITLE --dark story that renders the dark component unconditionally — via the spec verify.storyId; no dedicated *Dark-titled story required), L4 (resolve each tokenMap alias to its actual hex in src/tokens.ts and confirm it equals the Figma fill), L5 (single-state capture), and L7 (capture the bare component, not a story context wrapper).'
const REQUIRED_IDS = ['figma-fetched', 'node-bound', 'story-rendered', 'dimensions', 'colors', 'typography', 'states', 'icons']

// ---- schemas ------------------------------------------------------------
const SETUP_SCHEMA = { type: 'object', additionalProperties: false, required: ['ready', 'reason', 'storybookUp'], properties: {
  ready: { type: 'boolean' }, reason: { type: 'string' }, storybookUp: { type: 'boolean' },
  fileKey: { type: ['string', 'null'] }, node: { type: ['string', 'null'] },
  storyId: { type: ['string', 'null'] }, variantsStoryId: { type: ['string', 'null'] },
  surface: { type: ['string', 'null'] },
  states: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { state: { type: 'string' }, nodeId: { type: 'string' } }, required: ['state', 'nodeId'] } },
  // L19/L22 light-sibling preflight (scout item 6): a *dark slug renders from a shared base file whose
  // seal belongs to a different LIGHT slug. willRestaleIfFixed=true warns a shared-base fix will re-stale
  // it; renderDiverges=true means the fix's LIGHT token value moves (full light re-verify, not lean).
  lightSibling: { type: ['object', 'null'], additionalProperties: false, properties: {
    slug: { type: 'string' }, sealedAndFresh: { type: 'boolean' }, willRestaleIfFixed: { type: 'boolean' }, renderDiverges: { type: 'boolean' },
  } },
} }

const CAPTURE_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'log'], properties: {
  ok: { type: 'boolean' }, log: { type: 'string' }, artifactsPresent: { type: 'array', items: { type: 'string' } },
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
  autoFixable: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type', 'target', 'change', 'rationale'], properties: { type: { type: 'string', enum: ['code-bug', 'figma-exception'] }, target: { type: 'string' }, change: { type: 'string' }, rationale: { type: 'string' } } } },
  humanEscalations: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'context'], properties: { question: { type: 'string' }, context: { type: 'string' } } } },
  toolingGaps: { type: 'array', items: { type: 'string' } },
} }

const FIX_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'applied'], properties: {
  ok: { type: 'boolean' }, applied: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { target: { type: 'string' }, summary: { type: 'string' } }, required: ['target', 'summary'] } }, log: { type: 'string' },
} }

const FINAL_SCHEMA = { type: 'object', additionalProperties: false, required: ['verdictPass', 'recorded', 'signed', 'gateGreen', 'log'], properties: {
  verdictPass: { type: 'boolean' }, recorded: { type: 'boolean' }, signed: { type: 'boolean' }, gateGreen: { type: 'boolean' }, log: { type: 'string' },
} }

const COMMIT_SCHEMA = { type: 'object', additionalProperties: false, required: ['committed', 'sha'], properties: {
  committed: { type: 'boolean' }, sha: { type: 'string' }, message: { type: 'string' },
} }

// ---- pipeline -----------------------------------------------------------
phase('Scout')
const setup = await agent(
  `${GUIDE}\n\nYou are the SCOUT for component slug "${slug}". Verify readiness WITHOUT capturing or changing anything:\n` +
  `1. Is Storybook serving on http://localhost:6006 (check /index.json)? If not, report storybookUp:false (do NOT try to start it).\n` +
  `2. Find the component's spec under docs/atomic/**/${slug}.spec.md and report figma.fileKey and verify.figmaExportNode (or thisNode).\n` +
  `3. From the Storybook index, find the Example story id and the Variants story id. Then choose the PRIMARY capture target (storyId) that frames the component the way the Figma node does: PREFER the spec verify.storyId; OPEN the chosen story .stories.tsx and confirm it renders the BARE component the Figma node frames (borderless/transparent per the spec container contract), NOT an in-context demo CARD (a bordered Surface / heading / multiple sample rows / a browser-scroll region wrapping the atom — L7). If the --example story is an in-context wrapper AND a bare --variants/verify.storyId story exists, set storyId to the BARE story and report which and why. If ONLY an in-context --example exists (no bare render), report ready:false reason "primary capture target is an in-context wrapper (L7): ${slug} has no bare-component story for the primary".\n` +
  `4. From the spec nodeMap, list the per-state variation nodes (state=default/active/disabled with nodeId).\n` +
  `5. SURFACE: if the slug ends with "dark" it is a DARK-SURFACE component -> report surface="darkAtom"; otherwise surface="atom". CANONICAL DARK CAPTURE TARGET (owner decision 2026-07-03 = Option A, per 7cbc15f): a *dark slug is captured from a BASE-TITLE "--dark" story (e.g. atoms-railbutton--dark under title "Atoms/RailButton") that renders the dark variant UNCONDITIONALLY on a tokens.darkSurface wrapper and sets parameters.atomSurface.supported="darkAtom". Resolve it from the spec verify.storyId: (a) confirm that exact id exists in the live /index.json; (b) OPEN its .stories.tsx and confirm the story renders the dark variant UNCONDITIONALLY — this is EITHER a dedicated *Dark.tsx component (dark-PAIR, e.g. RailButtonDark) OR, for a single-component re-theme atom with NO src/gallery/*Dark.tsx, the BASE component rendered on a tokens.darkSurface wrapper (the decorator supplies dark tokens when the pipeline captures with --surface darkAtom). REJECT a swap-by-global "isDarkAtom ? <Dark/> : <Light/>" render (it silently shows the LIGHT sibling). If it holds, set BOTH storyId AND variantsStoryId to that verify.storyId and surface="darkAtom". A dedicated "Atoms/<Name>Dark"-titled story is NOT required (L3/L8). Report ready=false with a precise reason ONLY if verify.storyId is missing from the live index, or the target story swaps by global instead of rendering the dark variant unconditionally.\n` +
  `6. LIGHT-SIBLING PREFLIGHT (L11/L12/L19/L22 — owner-authorized 2026-07-08): a *dark slug's render comes from a SHARED base src/gallery/<Name>.tsx / .stories.tsx whose SEAL belongs to a DIFFERENT light slug. Because "audit-evidence.js --slug" re-expands over those shared sources (L11/L12), the dark run can NEVER finalize green while the light sibling is unsealed/stale — it would only die ~250k tokens later at the gate. So verify the light sibling(s) UP FRONT. Resolve them:\n` +
  `     node -e "import('./scripts/lib/evidence.js').then(m=>{const s=(m.darkSiblingSharedSources('${slug}')||[]).map(f=>m.slugForFile(f)).filter((v,i,a)=>v&&a.indexOf(v)===i); console.log(JSON.stringify(s)); const st=m.lightSiblingStale('${slug}'); if(st) console.error('LIGHT-SIBLING-STALE '+JSON.stringify(st));})"\n` +
  `   For EACH light sibling slug printed: run \`EVIDENCE_CHECK_TOKEN=${token} node scripts/audit-evidence.js --slug <lightSibling>\` AND grep that sibling's spec status: line for the literal marker "AWAITING evidence-wave re-seal". If the light sibling shows ANY finding (EV.STALE-EVIDENCE / EV.TAMPERED-ARTIFACT — INCLUDING a PARTIAL re-seal: a re-captured stamp/PNG left over a pre-fix manifest/verdict), OR the LIGHT-SIBLING-STALE line printed, OR the spec carries the AWAITING marker: report ready=false, reason "light sibling <slug> is not sealed+fresh — re-seal it FIRST (a FULL re-verify if the shared-base fix's LIGHT token value diverges per L19/GUIDE §3a, else a lean re-record); the --slug gate re-expands to it and this run can never finalize otherwise". Also set lightSibling:{slug:<lightSibling>, sealedAndFresh:<bool>, willRestaleIfFixed:true, renderDiverges:<true if a proposed shared-base token fix would move the LIGHT value, e.g. faintFill=slate2 vs surface=white>}. If there is no light sibling (fork with its own *Dark.tsx, or a non-dark slug), set lightSibling:null. NEVER loosen this to pass. Do NOT proceed to capture when a light sibling is unsealed/stale.\n` +
  `7. NODE PREFLIGHT (R1/R3, LESSONS L28/L29 — resolve the binding against Figma BEFORE any capture): run \`node scripts/evidence-capture-figma.js ${slug} --resolve-only\` (FIGMA_API_KEY is set; this makes ONE API call and writes nothing).\n` +
  `   • If it exits non-zero with "STALE-NODE-BINDING": report ready=false, reason "stale node binding — figmaExportNode resolves to null in Figma; owner/scout must RE-BIND the spec node, this is NOT a builder fix (LESSONS L28)". Do NOT proceed to capture.\n` +
  `   • If it prints "UNDER-BOUND-MULTISTATE": report ready=false, reason "under-bound multi-state kind:frame — the states carry no per-state nodeIds, so the cross-state contract is unverifiable (LESSONS L29); bind per-state nodeIds in the spec, OR verify the composition compositionally (behavior contract + play-gates, advisory-exempt) instead of pixel-sealing cross-state values". Do NOT proceed to pixel-seal.\n` +
  `   • "RESOLVE OK" (exit 0, no UNDER-BOUND line) clears the preflight. A "⚠ nodeMap … resolve to null" line is ADVISORY (a moved subcomponent verified via its own bundle) — note it but it does not block.\n` +
  `Set ready=true only if storybookUp, fileKey, node, and storyId are all present AND the node preflight is RESOLVE OK (no STALE-NODE-BINDING, no UNDER-BOUND-MULTISTATE) AND (there is no light sibling OR every light sibling is sealed+fresh with no AWAITING marker). Otherwise ready=false with a precise reason.`,
  { schema: SETUP_SCHEMA, label: `scout:${slug}`, phase: 'Scout' },
)
if (!setup || !setup.ready) return { status: 'blocked', stage: 'scout', reason: setup ? setup.reason : 'scout failed', setup }
log(`Scout ok: node ${setup.node}, story ${setup.storyId}, ${setup.states?.length || 0} states`)

let adjudication = null
let round = 0
while (round < maxRounds) {
  round += 1

  phase('Capture')
  const cap = await agent(
    `${GUIDE}\n\nYou are the BUILDER (doer) for "${slug}", round ${round}. Run these capture scripts in order and report their output. Do NOT review or judge quality — just capture:\n` +
    `  node scripts/evidence-capture-figma.js ${slug}\n` +
    `  node scripts/evidence-capture-story.js ${slug} --story ${setup.storyId} --surface ${setup.surface || 'atom'}\n` +
    `  node scripts/evidence-capture-states.js ${slug} ${setup.variantsStoryId ? `--variants-story ${setup.variantsStoryId} ` : ''}--surface ${setup.surface || 'atom'}\n` +
    `Report ok=true only if all three succeeded and docs/evidence/${slug}/ now holds figma.json, figma.png, storybook.png, capture-stamp.json, and states/.`,
    { schema: CAPTURE_SCHEMA, label: `build:capture:${slug} r${round}`, phase: 'Capture' },
  )
  if (!cap || !cap.ok) return { status: 'blocked', stage: 'capture', round, reason: cap ? cap.log : 'capture failed' }

  phase('Review')
  const reviewPrompt = (n) =>
    `${GUIDE}\n\nYou are INDEPENDENT REVIEWER #${n} of ${numCheckers} for "${slug}". You did NOT build this and have no stake in it passing. Your job is to find where the build does NOT match the design.\n` +
    `Compare, using your eyes on the actual images:\n` +
    `- docs/evidence/${slug}/figma.png (Figma ground truth) vs docs/evidence/${slug}/storybook.png (what we built)\n` +
    `- docs/evidence/${slug}/states/*.figma.png vs docs/evidence/${slug}/states/variants.storybook.png (per-state)\n` +
    `- the spec docs/atomic/**/${slug}.spec.md (dimensions, tokens, state matrix, exception registry)\n` +
    `- docs/evidence/${slug}/capture-stamp.json (rendered vs figma dimensions, in numbers)\n` +
    `Return a verdict for EACH of these ids: ${REQUIRED_IDS.join(', ')}.\n` +
    `Rules: mark "pass" ONLY if you can verify it with concrete evidence (cite px / hex / token / icon name / state). If you cannot verify, or it differs from Figma/spec, mark "fail" and describe the discrepancy. A documented exception in the spec's Exception Registry can justify a pass — cite its EX-id. Do NOT pass to be agreeable.\n` +
    `DIMENSIONS: the authoritative check is the component's CODED size vs the Figma node/variant size from figma.json (absoluteBoundingBox; for a COMPONENT_SET use a single child variant, not the whole set frame). The capture-stamp screenshot box is supplementary — if the Example story embeds the atom in a larger context (e.g. a SearchBar) or figma.png is a multi-variant set frame, the stamp boxes will NOT isolate the atom. In that case do NOT fail dimensions on stamp framing alone when the coded size and the Figma variant size agree; pass it citing the data, and instead note the framing as a capture limitation in your concerns.\n` +
    `INTERNAL LAYOUT (not just the outer box — this is mandatory, a too-loose/too-tight build can match the outer height yet space its contents wrongly): also verify the component's CODED internal layout against the Figma node's layout fields in figma.json — paddingLeft/Right/Top/Bottom, itemSpacing (gap between children), and each child SLOT's dimensions (e.g. icon-slot frames like Slot.IconLeading). A "hug"/content-sized component still has fixed internal spacing + slot sizes that MUST match Figma. Fail DIMENSIONS when any internal padding/gap/slot value disagrees with Figma's layout (beyond ±1px rounding) and no EX- entry authorizes the difference — cite both numbers (coded vs Figma). Compare a slot's own FRAME dims (e.g. Slot.IconLeading 28x28), not the inner glyph. Do NOT pass dimensions on outer height alone.\n` +
    `CORNER RADIUS (a first-class DIMENSIONS field): compare the Figma VARIANT COMPONENT cornerRadius from figma.json (NOT the wrapping COMPONENT_SET frame, whose radius is editor decoration) against the coded borderRadius token resolved to px in src/layout.ts (RADIUS.pill=99 / rounded=12 / soft=8 / xs=4 / container=16). Fail DIMENSIONS on a >1px delta with no EX-, EVEN when the corner is invisible in the captured PNG (transparent/borderless at rest, or the radius on a separate un-captured focus-ring/state). A spec-vs-Figma radius disagreement is an escalation (humanEscalations), not a code auto-fix.\n` +
    `STATES: use the per-state images in states/ (states/<state>.figma.png vs the matching cell in states/variants.storybook.png). If per-state figma images exist now, verify each; only fail if a state genuinely diverges from its Figma variant. If states/states.json has "singleState": true (the Figma node is a lone COMPONENT, not a COMPONENT_SET, and there is no Variants story), the state matrix is N/A — PASS the "states" row on the basis that the Example render (storybook.png) matches figma.png; do not require per-state images.`
  const reviews = (await parallel(Array.from({ length: numCheckers }, (_, i) =>
    () => agent(reviewPrompt(i + 1), { schema: REVIEW_SCHEMA, label: `review:${slug} #${i + 1} r${round}`, phase: 'Review' }),
  ))).filter(Boolean)
  if (!reviews.length) return { status: 'blocked', stage: 'review', round, reason: 'no reviews returned' }

  phase('Adjudicate')
  adjudication = await agent(
    `${GUIDE}\n\nYou are the ADJUDICATOR (governor) for "${slug}". You received ${reviews.length} independent reviews (JSON below). Reviewers can be wrong or fabricate justifications — VERIFY every claim against the authoritative spec (docs/atomic/**/${slug}.spec.md) and Figma data (docs/evidence/${slug}/figma.json + states). Figma is the source of truth (GR4).\n\n` +
    `Reviews:\n${JSON.stringify(reviews, null, 2)}\n\n` +
    `Produce a resolved checklist for ids: ${REQUIRED_IDS.join(', ')}. For each id, status=pass only if the evidence genuinely holds against the spec/Figma (a documented Exception Registry entry can justify a pass).\n` +
    `For every failing id, classify the cause into EXACTLY one bucket:\n` +
    `  - autoFixable type "code-bug": the CODE disagrees with the spec+Figma and the correct value is unambiguous (e.g. width 400 but spec+Figma say 336). The fix edits COMPONENT CODE ONLY to match the spec. Give target file + the exact change.\n` +
    `  - autoFixable type "figma-exception": shipped interactive behavior beyond the static Figma frame, supported by a CLEAR system-wide pattern documented in the repo (AGENTS.md / CLAUDE.md / audit-components.js). The fix only ADDS an Exception Registry entry (additive) — it NEVER changes existing spec values.\n` +
    `  - humanEscalations: a genuine design-authority decision that is ambiguous, OR — IMPORTANT — any case where the SPEC's own documented value (a token, dimension, or state color) disagrees with Figma. Rewriting the spec's contract to match a reading is an OWNER decision: NEVER auto-fix it by editing spec values. Escalate with {spec value, Figma value, crisp question}.\n` +
    `  - toolingGaps: the discrepancy is an artifact of the capture/compare tooling, not the component.\n` +
    `DIMENSIONS policy: if the component's CODED size equals the Figma variant size (from figma.json absoluteBoundingBox of a single variant, not the whole COMPONENT_SET frame), resolve the OUTER-box part of dimensions to PASS even when the capture-stamp screenshot framing differs — record the framing mismatch under toolingGaps, it is NOT a dimensions failure. BUT dimensions also covers INTERNAL LAYOUT: independently verify the coded paddingLeft/Right/Top/Bottom, itemSpacing (gap), and each child slot's dimensions against the Figma node's layout fields in figma.json. A build can match the outer box yet space its contents differently — a wider gap or smaller icon slot (beyond ±1px rounding) makes the label sit looser/tighter than Figma — that IS a dimensions failure (classify it autoFixable code-bug when the Figma value is unambiguous), unless an EX- entry authorizes it. Do not pass dimensions on outer size alone.\n` +
    `allPass=true ONLY if every id resolves to pass. Be conservative on CODE changes: if unsure whether a fix is unambiguous, escalate instead of auto-fixing. But do not fail a dimension purely because of a known capture-framing artifact when the underlying data agrees.`,
    { schema: ADJ_SCHEMA, label: `adjudicate:${slug} r${round}`, phase: 'Adjudicate' },
  )
  if (!adjudication) return { status: 'blocked', stage: 'adjudicate', round, reason: 'adjudication failed' }
  log(`Round ${round}: allPass=${adjudication.allPass}, autoFixable=${adjudication.autoFixable.length}, escalations=${adjudication.humanEscalations.length}`)

  if (adjudication.allPass) break
  if (!adjudication.autoFixable.length) {
    // nothing safe to auto-fix — stop and hand the open questions to the human
    return { status: 'needs-human', round, checklist: adjudication.checklist, humanEscalations: adjudication.humanEscalations, toolingGaps: adjudication.toolingGaps }
  }

  phase('Fix')
  const fix = await agent(
    `${GUIDE}\n\nYou are the BUILDER (doer) applying fixes for "${slug}". Apply ONLY these adjudicated fixes, exactly as described — make no other changes:\n${JSON.stringify(adjudication.autoFixable, null, 2)}\n` +
    `For "code-bug": edit the COMPONENT SOURCE only to the specified value — do NOT change any existing values in the .spec.md. For "figma-exception": ADD an Exception Registry entry to the spec (additive, per the Figma Exception Preservation Protocol); you may reconcile a contradictory NOTE but must NOT change documented token/dimension/color VALUES. If applying a fix would require changing a spec value, do not apply it — report ok:false and say it needs escalation. Report what you changed.`,
    { schema: FIX_SCHEMA, label: `build:fix:${slug} r${round}`, phase: 'Fix' },
  )
  if (!fix || !fix.ok) return { status: 'blocked', stage: 'fix', round, reason: fix ? fix.log : 'fix failed', adjudication }
  // loop: re-capture against the fixed code, then re-review
}

if (!adjudication || !adjudication.allPass) {
  return { status: 'unresolved', rounds: round, checklist: adjudication && adjudication.checklist, humanEscalations: adjudication && adjudication.humanEscalations }
}

phase('Finalize')
const final = await agent(
  `${GUIDE}\n\nYou are the FINALIZER (independent checker) for "${slug}". The adjudicated checklist (all pass) is:\n${JSON.stringify(adjudication.checklist, null, 2)}\n\n` +
  `Do EXACTLY this, then report each result:\n` +
  `1. Re-capture the story so the stamp is fresh: node scripts/evidence-capture-story.js ${slug} --story ${setup.storyId} --surface ${setup.surface || 'atom'}\n` +
  `2. Write docs/evidence/${slug}/verdict.md as a checklist where every id is checked. Format each line EXACTLY as: "- [x] <id> — <evidence>" using the adjudicated evidence, under a "## Checklist" heading, with a short header noting it is the independent verdict. Do NOT write any TODO/deferred/unverified/FIXME words on a checklist line.\n` +
  `3. Record: node scripts/evidence-record.js ${slug} --node ${setup.node}\n` +
  `4. Sign: EVIDENCE_CHECK_TOKEN=${token} node scripts/evidence-sign.js ${slug}\n` +
  `5. L19/L22 LIGHT-SIBLING PRE-GATE (mechanical guard, before the --slug gate): run\n` +
  `     node -e "import('./scripts/lib/evidence.js').then(m=>{const s=m.lightSiblingStale('${slug}'); if(s){console.error('LIGHT-SIBLING-STALE '+JSON.stringify(s)); process.exit(3);} else console.log('light-sibling-fresh');})"\n` +
  `   If it exits non-zero / prints LIGHT-SIBLING-STALE, a shared-base fix in THIS run re-staled the LIGHT sibling's seal (its .tsx hash no longer matches the light manifest). STOP: set gateGreen=false and put the exact cause in log (the light sibling must be re-sealed in the SAME change — full re-verify if its LIGHT token value diverged, see GUIDE §3a / LESSONS L19). Do NOT run the --slug gate.\n` +
  `6. Gate the slug over its OWN recorded sources (NOT a hand-picked gallery file — that misroutes a "-dark" slug to its light sibling):\n` +
  `     EVIDENCE_CHECK_TOKEN=${token} node scripts/audit-evidence.js --slug ${slug}\n` +
  `   DIAGNOSIS (L11/L12): if this gate fails ONLY with EV.STALE-EVIDENCE / EV.TAMPERED-ARTIFACT findings whose slug prefix is the LIGHT sibling (this dark slug's own rows all clean), report gateGreen:false with the crisp cause "gate re-expanded to LIGHT sibling <lightSlug> via the shared .tsx/.stories.tsx (L11/L12); the DARK bundle is fresh/recorded/signed — the failing finding is the light sibling's own un-re-sealed state, which THIS run cannot fix; the light sibling must be re-sealed first" (not a generic finalize-fail).\n` +
  `Set verdictPass/recorded/signed/gateGreen truthfully from the ACTUAL command output. gateGreen=true only if the pre-gate is fresh AND the gate prints "PASS" with 0 findings for ${slug}.`,
  { schema: FINAL_SCHEMA, label: `finalize:${slug}`, phase: 'Finalize' },
)
if (!final || !final.gateGreen) return { status: 'finalize-failed', rounds: round, final }

if (!autoCommit) {
  return { status: 'ready-to-commit', rounds: round, final, note: 'Bundle is sealed, signed, and gate-green. Review and commit, or re-run with autoCommit:true.' }
}

phase('Commit')
const commit = await agent(
  `${GUIDE}\n\nCommit the verified component "${slug}" and its evidence bundle. Stage the FULL source set for this slug — run \`node -e "import('./scripts/lib/evidence.js').then(m=>console.log(m.sourcesForSlug('${slug}').join('\\n')))"\` to list it, then stage EVERY file it prints (the component .tsx, its .stories.tsx, AND the spec) PLUS docs/evidence/${slug}/. Staging the .stories.tsx is REQUIRED: it is bound into the capture-stamp, so omitting it leaves the committed tree referencing an uncommitted blob → CI EV.STALE-EVIDENCE (LESSONS L6). First show the diff of the source/spec changes; if anything beyond the adjudicated fixes (or pre-existing story-helper alignment bound into the stamp) appears, STOP and report committed:false. Otherwise commit with a clear conventional message describing the fix(es) and the signed evidence bundle, ending with the project's Co-Authored-By line. Report the sha.`,
  { schema: COMMIT_SCHEMA, label: `commit:${slug}`, phase: 'Commit' },
)
return { status: commit && commit.committed ? 'committed' : 'commit-held', rounds: round, final, commit }
