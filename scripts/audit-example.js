// audit-example.js — the Example & Behavior Wave gate (governor-vetted spec:
// docs/proposals/example-behavior-wave.md). FAIL-CLOSED and CONTENT-BINDING: it does not merely check
// that artifacts EXIST — it binds each to a source of truth (the ledger's failures were fabricated
// content that passed presence checks). Reuses the evidence substrate so this mirrors audit-evidence.js.
//
// Scope: only slugs that exist under docs/examples/<slug>/ are gated (so wiring into `npm run health`
// never fails on the absence of examples). Usage:
//   node scripts/audit-example.js            # all example slugs
//   node scripts/audit-example.js <slug...>  # specific slugs
//
// Artifact contract per docs/examples/<slug>/ (produced by the /example-wave pipeline):
//   docs-read.md         — JSON fence: [{file, symbol, value}] triples the builder claims it read
//   figma-layout.json    — {fileKey, nodeId, capturedAt, rawDumpSha256, surface, layout:{...}}
//   figma-raw.json       — the raw get_figma_data dump (its sha256 must equal figma-layout.rawDumpSha256)
//   figma-frame.png      — exported reference frame
//   component-manifest.json — {built_by, story, imports:[...], slotTokens:{slot: "tokens.X"}}
//   views/{atom-light,atom-dark,darkAtom-light,darkAtom-dark}.png
//   views/capture-stamps.json — {"<view>": {surface, theme, storyId, sha256}}
//   contrast.json        — {view:"darkAtom-dark", region, ratio, pngSha256}  (computed upstream, bound here)
//   comparison.md        — reviewer verdict (checklist ids) + `built_by:`/`reviewer:`/`adjudicator:`
//   comparison.sig.json  — reviewer HMAC over the comparison (EVIDENCE_CHECK_TOKEN)
//   owner-behaviors.md   — verbatim owner quotes, each `[[q-<id>]]`
//   owner-renders-stamp.json / owner-behaviors-stamp.json — owner HMAC stamps (D1/D2)
// Spec behaviors: block lives in docs/atomic/<level>/<slug>.spec.md.

import fs from "node:fs";
import path from "node:path";
import { ROOT, SEV, finding, writeAuditResult } from "./lib/audit-core.js";
import { sha256, hashSource, bundleDigest, hmac, validatePng } from "./lib/evidence.js";

const EXAMPLES_ROOT = "docs/examples";
const VIEWS = ["atom-light", "atom-dark", "darkAtom-light", "darkAtom-dark"];
const CONTRAST_MIN = 4.5; // WCAG AA for the darkAtom-dark readable-content contract (THEME_AND_ATOM_SURFACES)
const CHECK_TOKEN = process.env.EVIDENCE_CHECK_TOKEN || "";
// The example verdict is COMPUTED from these ids (never typed) — mirrors evidence VERDICT_REQUIRED_IDS.
const EXAMPLE_VERDICT_IDS = [
  "figma-grounded", "shipped-components", "tokens-contract-bound", "icons-grounded", "interactive-icon-states",
  "spec-variants-grounded", "four-views-distinct", "contrast-readable", "behaviors-owner-sourced",
];

const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const abs = (rel) => path.join(ROOT, rel);
const read = (rel) => (fs.existsSync(abs(rel)) ? fs.readFileSync(abs(rel)) : null);
const readText = (rel) => { const b = read(rel); return b ? b.toString("utf8") : null; };
const readJson = (rel) => { const t = readText(rel); if (t == null) return null; try { return JSON.parse(t); } catch { return undefined; } };
const jsonFence = (md) => { const m = md && md.match(/```json\s*([\s\S]*?)```/); if (!m) return null; try { return JSON.parse(m[1]); } catch { return undefined; } };

function exampleSlugs() {
  const rootDir = abs(EXAMPLES_ROOT);
  if (!fs.existsSync(rootDir)) return [];
  return fs.readdirSync(rootDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}
function specPathFor(slug) {
  const dir = abs("docs/atomic");
  if (!fs.existsSync(dir)) return null;
  for (const level of fs.readdirSync(dir)) {
    const rel = `docs/atomic/${level}/${slug}.spec.md`;
    if (fs.existsSync(abs(rel))) return rel;
  }
  return null;
}

function auditExample(slug, F) {
  const dir = `${EXAMPLES_ROOT}/${slug}`;
  const here = (f) => `${dir}/${f}`;
  const fail = (id, msg, file) => F.push(finding(id, SEV.BLOCKER, `${slug}: ${msg}`, file || here("")));
  const verdict = {}; // computed checklist
  const exampleMeta = readJson(here("example.json")) || {};

  // ── Phase 0: Ground — provenance, not presence ────────────────────────────────
  // P0.1 docs-read.md — every claimed value must LITERALLY appear in the cited file (kills fabricated grounding).
  const docsRead = jsonFence(readText(here("docs-read.md")));
  let docsReadOk = false;
  if (!docsRead) fail("EX.DOCS-READ-MISSING", "docs-read.md absent or has no valid json fence of {file,symbol,value} triples", here("docs-read.md"));
  else if (!Array.isArray(docsRead) || !docsRead.length) fail("EX.DOCS-READ-EMPTY", "docs-read.md has no {file,symbol,value} triples", here("docs-read.md"));
  else {
    let allPresent = true;
    for (const t of docsRead) {
      const src = t && t.file ? readText(t.file) : null;
      if (src == null) { fail("EX.DOCS-READ-BADFILE", `docs-read cites a file that does not exist: ${t && t.file}`, here("docs-read.md")); allPresent = false; continue; }
      if (t.value == null || !src.includes(String(t.value))) { fail("EX.DOCS-READ-FABRICATED", `claimed value ${JSON.stringify(t.value)} for ${t.symbol} is NOT present in ${t.file} — grounding fabricated/wrong`, here("docs-read.md")); allPresent = false; }
    }
    docsReadOk = allPresent;
  }

  // P0.2 figma-layout.json — bound to a committed raw dump by hash + node id (kills invented-from-memory layout).
  const layout = readJson(here("figma-layout.json"));
  const rawDump = read(here("figma-raw.json"));
  let figmaGrounded = false;
  if (!layout) fail("EX.FIGMA-LAYOUT-MISSING", "figma-layout.json absent or unparseable", here("figma-layout.json"));
  else if (!layout.fileKey || !layout.nodeId || !layout.rawDumpSha256 || !layout.layout) fail("EX.FIGMA-LAYOUT-NOPROV", "figma-layout.json lacks provenance (need fileKey, nodeId, rawDumpSha256, layout{})", here("figma-layout.json"));
  else if (!rawDump) fail("EX.FIGMA-RAW-MISSING", "figma-raw.json (the bound get_figma_data dump) is absent — cannot prove the layout was fetched, not typed", here("figma-raw.json"));
  else if (sha256(rawDump) !== layout.rawDumpSha256) fail("EX.FIGMA-RAW-TAMPERED", "figma-raw.json sha256 != figma-layout.rawDumpSha256 — dump changed or unbound", here("figma-raw.json"));
  else {
    const dump = (() => { try { return JSON.parse(rawDump.toString("utf8")); } catch { return null; } })();
    const dumpNode = dump && (dump.node || dump.fetchedNode?.document?.id || dump.nodeId);
    if (!dump) fail("EX.FIGMA-RAW-UNPARSEABLE", "figma-raw.json is not valid JSON", here("figma-raw.json"));
    else if (String(dumpNode) !== String(layout.nodeId)) fail("EX.FIGMA-NODE-MISMATCH", `figma-raw node ${dumpNode} != layout nodeId ${layout.nodeId}`, here("figma-layout.json"));
    else if (!layout.surface) fail("EX.FIGMA-SURFACE-UNSET", "figma-layout.surface not recorded (must be derived from the frame, not left blank)", here("figma-layout.json"));
    else figmaGrounded = true;
  }
  verdict["figma-grounded"] = figmaGrounded;

  // P0.3 figma-frame.png real image.
  const frame = read(here("figma-frame.png"));
  if (!frame) fail("EX.FRAME-MISSING", "figma-frame.png absent", here("figma-frame.png"));
  else if (!validatePng(frame).ok) fail("EX.FRAME-INVALID", `figma-frame.png is not a valid render: ${validatePng(frame).reason}`, here("figma-frame.png"));

  // ── Phase 1: Build — shipped components + tokens bound to the extracted contract ──
  const manifest = readJson(here("component-manifest.json"));
  const story = manifest && manifest.story ? readText(manifest.story) : null;
  let shipped = false, tokensBound = false;
  if (!manifest) fail("EX.MANIFEST-MISSING", "component-manifest.json absent or unparseable", here("component-manifest.json"));
  else if (!manifest.built_by || !manifest.story || !Array.isArray(manifest.imports)) fail("EX.MANIFEST-INCOMPLETE", "component-manifest needs built_by, story, imports[]", here("component-manifest.json"));
  else if (story == null) fail("EX.STORY-MISSING", `manifest.story does not exist: ${manifest.story}`, here("component-manifest.json"));
  else {
    // shipped imports actually imported + used
    let importsOk = true;
    for (const imp of manifest.imports) {
      const re = new RegExp(`\\b${imp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (!(new RegExp(`import[\\s\\S]*?\\b${imp}\\b`).test(story) && re.test(story.replace(/import[\s\S]*?from[^\n]*\n/g, "")))) {
        fail("EX.GRAFT-IMPORT-UNUSED", `manifest lists ${imp} but the story does not import AND use it (dead import / graft)`, manifest.story); importsOk = false;
      }
    }
    // ban untokenized color/spacing literals in the story body (kills approximated tokens)
    const bodyNoImports = story.replace(/import[\s\S]*?from[^\n]*\n/g, "");
    const hex = bodyNoImports.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const rgba = bodyNoImports.match(/\brgba?\(/g) || [];
    if (hex.length || rgba.length) fail("EX.HARDCODED-COLOR", `story uses untokenized color literals (${[...hex, ...rgba].slice(0, 5).join(", ")}) — use tokens.*`, manifest.story);
    // Undeclared-variant floor (governor 2026-07-06): a raw <div/span> with a WIDGET/status role (or a
    // spinner/loader class) stands in for a shipped component — the exact hand-built-spinner dodge. Container
    // roles (radiogroup, group, list, region, toolbar…) are NOT widget roles and stay allowed.
    const WIDGET_ROLES = "button|checkbox|radio|switch|progressbar|spinbutton|slider|textbox|searchbox|combobox|listbox|option|tab|menuitem|menuitemcheckbox|menuitemradio|treeitem|gridcell|status|alert";
    const standin = new RegExp(`<(?:div|span)\\b[^>]*\\brole=["'](?:${WIDGET_ROLES})["']`).test(bodyNoImports)
      || /<(?:div|span)\b[^>]*(?:class(?:Name)?|data-[\w-]+)=["'][^"']*(?:spinner|loader|loading)/i.test(bodyNoImports);
    if (standin) fail("EX.RAW-STANDIN-ELEMENT", "story renders a raw <div/span> standing in for a shipped component (widget/status role or spinner/loader) — an undeclared/hand-rolled variant dodging grounding", manifest.story);
    shipped = importsOk && !hex.length && !rgba.length && !standin;

    // every tokens.X used in the story must be grounded in docs-read.md (kills real-but-WRONG token, Case 1's hoverBg vs segmentedTrack)
    const usedTokens = [...new Set((bodyNoImports.match(/\btokens\.[A-Za-z0-9]+/g) || []))];
    if (usedTokens.length) {
      const grounded = new Set((Array.isArray(docsRead) ? docsRead : []).map((t) => t && t.symbol).filter(Boolean));
      const ungrounded = usedTokens.filter((tk) => !grounded.has(tk) && !grounded.has(tk.replace(/^tokens\./, "")));
      if (ungrounded.length) fail("EX.TOKEN-UNGROUNDED", `tokens used but NOT in the docs-read contract: ${ungrounded.join(", ")} — a real-but-unverified token`, manifest.story);
      else tokensBound = docsReadOk;
    } else tokensBound = docsReadOk;
  }
  verdict["shipped-components"] = shipped;
  verdict["tokens-contract-bound"] = tokensBound;

  // Icons: ground each slot's icon IDENTITY from the bound dump; the story may only use grounded DS icons.
  // (Case 4: the build shipped IconFolderMultiple while the linked node named the icon "Number Circle 1"
  //  — the correct name was in the fetched dump, but nothing extracted or checked it.)
  let iconsGrounded = false;
  const storyIcons = story ? [...new Set((story.match(/\bIcon[A-Z][A-Za-z0-9]+/g) || []))].filter((i) => i !== "IconSlot") : [];
  if (!storyIcons.length) iconsGrounded = true; // example renders no icons
  else {
    const declared = layout && Array.isArray(layout.icons) ? layout.icons : null;
    const rawText = rawDump ? rawDump.toString("utf8") : "";
    if (!declared) fail("EX.ICONS-UNGROUNDED", "story renders icons but figma-layout.json has no icons[] mapping {slot,figmaIcon,dsIcon} — icon identity was not extracted from the linked Figma node", here("figma-layout.json"));
    else {
      let ok = true;
      const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\d+$/, "");
      for (const ic of declared) {
        if (!ic.figmaIcon || !rawText.includes(ic.figmaIcon)) { fail("EX.ICON-NOT-IN-FIGMA", `declared figmaIcon ${JSON.stringify(ic && ic.figmaIcon)} (slot ${ic && ic.slot}) not present in the bound figma dump — unbound icon claim`, here("figma-layout.json")); ok = false; continue; }
        // name↔icon semantic floor (governor 2026-07-06): a real figma name paired with a lexically
        // UNRELATED DS icon (Case 4: "Number Circle 1" -> IconFolderMultiple) fails unless an explicit
        // aliasReason justifies a non-obvious mapping (e.g. "List Bar" -> IconTextBulletList).
        const fn = norm(ic.figmaIcon), dn = norm(ic.dsIcon).replace(/^icon/, "");
        if (fn && dn && !dn.includes(fn) && !fn.includes(dn) && !ic.aliasReason) { fail("EX.ICON-NAME-MISMATCH", `dsIcon ${ic.dsIcon} is lexically unrelated to figmaIcon ${JSON.stringify(ic.figmaIcon)} and has no aliasReason — likely the WRONG icon (Case 4 semantic form)`, here("figma-layout.json")); ok = false; }
      }
      const declaredDs = new Set(declared.map((i) => i && i.dsIcon));
      const undeclared = storyIcons.filter((i) => !declaredDs.has(i));
      if (undeclared.length) { fail("EX.ICON-UNDECLARED", `story uses icons not grounded in figma-layout.icons: ${undeclared.join(", ")} — a stale/wrong icon vs the linked node`, manifest && manifest.story); ok = false; }
      iconsGrounded = ok;
    }
  }
  verdict["icons-grounded"] = iconsGrounded;

  // interactive-icon-states (governor 2026-07-06): icons marked interactive MUST prove the Regular->Filled
  // swap via a red->green mutation proof (mirrors the absorb stage). Reviewer-only is the Case 3/4 failure.
  let iconStatesOk = true;
  const interactiveIcons = (layout && Array.isArray(layout.icons) ? layout.icons : []).filter((i) => i && i.interactive);
  if (interactiveIcons.length) {
    const proof = readJson(here("icon-state-proof.json"));
    const proven = new Set((proof && Array.isArray(proof.iconStates) ? proof.iconStates : []).filter((p) => p && p.redRun && p.greenRun).map((p) => p.slot));
    for (const ic of interactiveIcons) if (!proven.has(ic.slot)) { fail("EX.ICON-STATE-UNPROVEN", `interactive icon slot ${ic.slot} has no red->green icon-state-proof (Regular->Filled swap unverified)`, here("icon-state-proof.json")); iconStatesOk = false; }
  }
  verdict["interactive-icon-states"] = iconStatesOk;

  // ── Documentation-grounded variants: states Figma CANNOT encode (e.g. loading — EX-BUTTON-001) ──
  // A pure-text / spec-documented variant with NO Figma node is allowed ONLY when a real EX-entry in the
  // component spec authorizes it AND every design claim binds to that spec — so "doc-grounded" can never be
  // a loophole to skip grounding (you must cite a real EX-id, content-bound exactly like the Figma path).
  let specVariantsOk = true;
  const specVariants = Array.isArray(exampleMeta.specVariants) ? exampleMeta.specVariants : [];
  for (const sv of specVariants) {
    // require specPath explicitly (fail-CLOSED): a missing specPath used to reach readText(undefined) ->
    // path.join(ROOT, undefined) THROWS (fail-dirty, aborts sibling audits). (governor 2026-07-06)
    if (!sv || !sv.name || !sv.authorizedBy || !sv.specPath) { fail("EX.DOCVARIANT-MALFORMED", "specVariant needs {name, authorizedBy:<EX-id>, specPath, realizedBy:{component,prop}, claims:[{value}]}", here("example.json")); specVariantsOk = false; continue; }
    const svSpec = readText(sv.specPath);
    if (svSpec == null) { fail("EX.DOCVARIANT-NOSPEC", `specVariant ${sv.name} cites a spec that does not exist: ${sv.specPath}`, here("example.json")); specVariantsOk = false; continue; }
    // SCOPE the match to the EX-entry BLOCK (governor 2026-07-06): the authorization AND every claim must
    // live in the SAME EX-<id> entry, not anywhere in the file (a real EX-id + a stray spec word must not
    // satisfy an unrelated variant).
    const exAt = svSpec.indexOf(sv.authorizedBy);
    if (exAt < 0) { fail("EX.DOCVARIANT-UNAUTHORIZED", `specVariant ${sv.name} authorizedBy ${JSON.stringify(sv.authorizedBy)} is NOT in the cited spec — doc-grounding must cite a REAL EX-entry`, here("example.json")); specVariantsOk = false; continue; }
    const tail = svSpec.slice(exAt + sv.authorizedBy.length);
    const stop = tail.search(/\n\s*(?:- id:|#|EX-[A-Za-z]+-\d)/);
    const block = svSpec.slice(exAt, exAt + sv.authorizedBy.length + (stop < 0 ? tail.length : stop));
    for (const c of (Array.isArray(sv.claims) ? sv.claims : [])) if (!c || c.value == null || !block.includes(String(c.value))) { fail("EX.DOCVARIANT-CLAIM-FABRICATED", `specVariant ${sv.name} claim ${JSON.stringify(c && c.value)} is not within the ${sv.authorizedBy} entry — fabricated / mis-scoped doc-grounding`, here("example.json")); specVariantsOk = false; }
    // BIND the variant to a SHIPPED realization the story actually uses (governor 2026-07-06): closes the
    // "correct paperwork, hand-rolled element" hole. realizedBy.component must be imported + prop used.
    const rb = sv.realizedBy;
    if (!rb || !rb.component) { fail("EX.DOCVARIANT-UNREALIZED", `specVariant ${sv.name} must declare realizedBy:{component, prop} — the shipped realization the gate binds to the story`, here("example.json")); specVariantsOk = false; }
    else if (!story || !new RegExp(`import[\\s\\S]*?\\b${rb.component}\\b`).test(story) || (rb.prop && !new RegExp(`\\b${rb.prop}\\b`).test(story))) { fail("EX.DOCVARIANT-UNREALIZED", `specVariant ${sv.name} realizedBy {${rb.component}${rb.prop ? ", " + rb.prop : ""}} but the story does not import+use it — hand-rolled despite declaration`, manifest && manifest.story); specVariantsOk = false; }
  }
  verdict["spec-variants-grounded"] = specVariantsOk;

  // ── Phase 2: Verify — 4 distinct real views, contrast gate, computed+signed verdict, actor separation ──
  const stamps = readJson(here("views/capture-stamps.json"));
  const viewHashes = {};
  let fourViews = true;
  for (const v of VIEWS) {
    const png = read(here(`views/${v}.png`));
    if (!png) { fail("EX.VIEW-MISSING", `views/${v}.png absent — the ${v} surface×theme render was not captured`, here(`views/${v}.png`)); fourViews = false; continue; }
    if (!validatePng(png).ok) { fail("EX.VIEW-INVALID", `views/${v}.png not a valid render: ${validatePng(png).reason}`, here(`views/${v}.png`)); fourViews = false; continue; }
    const h = sha256(png); viewHashes[v] = h;
    const st = stamps && stamps[v];
    if (!st || st.surface == null || st.theme == null || !st.storyId) { fail("EX.VIEW-UNSTAMPED", `views/${v}.png has no {surface,theme,storyId} capture-stamp — cannot prove it shows ${v}`, here("views/capture-stamps.json")); fourViews = false; }
    else if (st.sha256 && st.sha256 !== h) { fail("EX.VIEW-STAMP-MISMATCH", `views/${v}.png sha256 != its capture-stamp — mislabeled render`, here("views/capture-stamps.json")); fourViews = false; }
  }
  // pairwise-distinct (kills duplicate PNGs / a silent surface-switch no-op)
  const hs = Object.entries(viewHashes);
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) {
    if (hs[i][1] === hs[j][1]) { fail("EX.VIEWS-DUPLICATE", `views ${hs[i][0]} and ${hs[j][0]} are byte-identical — a switch did not fire or a PNG was reused`, here("views/")); fourViews = false; }
  }
  verdict["four-views-distinct"] = fourViews && Object.keys(viewHashes).length === VIEWS.length;

  // contrast gate on darkAtom-dark (THEME_AND_ATOM_SURFACES readable-content contract → a computed number, bound to the png)
  const contrast = readJson(here("contrast.json"));
  let contrastOk = false;
  if (!contrast) fail("EX.CONTRAST-MISSING", "contrast.json absent — the darkAtom-dark readable-content contract is unmeasured", here("contrast.json"));
  else if (contrast.view !== "darkAtom-dark" || typeof contrast.ratio !== "number" || !contrast.pngSha256) fail("EX.CONTRAST-MALFORMED", "contrast.json needs {view:'darkAtom-dark', ratio:number, pngSha256}", here("contrast.json"));
  else if (viewHashes["darkAtom-dark"] && contrast.pngSha256 !== viewHashes["darkAtom-dark"]) fail("EX.CONTRAST-UNBOUND", "contrast.pngSha256 != the darkAtom-dark render — contrast measured on the wrong image", here("contrast.json"));
  else if (contrast.ratio < CONTRAST_MIN) fail("EX.CONTRAST-FAIL", `darkAtom-dark foreground contrast ${contrast.ratio} < ${CONTRAST_MIN} — washout (Case 2 defect), a bug to FIX`, here("contrast.json"));
  else contrastOk = true;
  verdict["contrast-readable"] = contrastOk;

  // computed + signed reviewer verdict; actor separation
  const comparison = readText(here("comparison.md"));
  if (!comparison) fail("EX.COMPARISON-MISSING", "comparison.md absent — no independent verification", here("comparison.md"));
  else {
    const actor = (label) => { const m = comparison.match(new RegExp(`^${label}:\\s*(\\S+)`, "m")); return m ? m[1] : null; };
    const builtBy = manifest && manifest.built_by, reviewer = actor("reviewer"), adjudicator = actor("adjudicator");
    if (!reviewer || !adjudicator) fail("EX.ACTORS-UNNAMED", "comparison.md must name reviewer: and adjudicator:", here("comparison.md"));
    else if (builtBy && (builtBy === reviewer || builtBy === adjudicator || reviewer === adjudicator)) fail("EX.DOER-IS-CHECKER", `builder/reviewer/adjudicator collide (${builtBy}/${reviewer}/${adjudicator}) — doer≠checker violated`, here("comparison.md"));
    // reviewer signature (crypto independence, D1)
    const sig = readJson(here("comparison.sig.json"));
    if (!sig || !sig.digest || !sig.sig) fail("EX.COMPARISON-UNSIGNED", "comparison.sig.json absent/incomplete — reviewer verdict is not signed", here("comparison.sig.json"));
    else if (CHECK_TOKEN) { if (hmac(CHECK_TOKEN, sig.digest) !== sig.sig) fail("EX.BAD-SIGNATURE", "comparison signature does not verify against EVIDENCE_CHECK_TOKEN", here("comparison.sig.json")); }
    else F.push(finding("EX.SIGNING-ADVISORY", SEV.MEDIUM, `${slug}: EVIDENCE_CHECK_TOKEN not set — reviewer/owner signatures are ADVISORY, not cryptographic (status: verified stays unreachable)`, here("comparison.sig.json")));
  }

  // ── Phase 3: Absorb — behaviors sourced to verbatim owner quotes (D3) ──
  const specRel = specPathFor(slug);
  const spec = specRel ? readText(specRel) : null;
  const ownerBeh = readText(here("owner-behaviors.md"));
  let behSourced = false;
  const behBlock = spec && spec.match(/behaviors:\s*([\s\S]*?)(?:\n[a-zA-Z_]+:|\n#|$)/);
  if (behBlock) {
    const quoteIds = new Set([...(ownerBeh || "").matchAll(/\[\[q-([\w-]+)\]\]/g)].map((m) => m[1]));
    const entries = [...behBlock[1].matchAll(/-\s*id:\s*["']?([\w-]+)["']?[\s\S]*?(?:quote:\s*["']?q-([\w-]+)|proposal:\s*(true))?/g)];
    let ok = entries.length > 0;
    for (const e of entries) {
      const [, id, quote, proposal] = e;
      if (proposal === "true") continue; // quarantined inferred behavior — allowed, not counted as accepted
      if (!quote || !quoteIds.has(quote)) { fail("EX.BEHAVIOR-UNSOURCED", `behavior ${id} cites no verbatim owner quote (q-*) in owner-behaviors.md — AI-authored intent (must be a proposal:true or owner-sourced)`, specRel); ok = false; }
    }
    behSourced = ok && !!ownerBeh;
    if (!ownerBeh) fail("EX.OWNER-BEHAVIORS-MISSING", "owner-behaviors.md absent — cannot verify behaviors trace to what the owner said", here("owner-behaviors.md"));
  }
  verdict["behaviors-owner-sourced"] = behSourced;

  // ── Owner gates + status ceiling (D1/D2): the EXAMPLE's status requires BOTH valid owner HMAC stamps ──
  // The example has its OWN lifecycle status in docs/examples/<slug>/example.json {status}, SEPARATE from
  // the component spec's evidence-wave status — an atom can be `verified` against Figma while its example
  // is only `example-ready`. Keying this ceiling on the component spec's status conflates the two (a
  // verified atom could never have an example). Default is example-ready; only the owner promotes it.
  const exampleStatus = exampleMeta.status || "example-ready";
  if (exampleStatus === "verified") {
    for (const stampFile of ["owner-renders-stamp.json", "owner-behaviors-stamp.json"]) {
      const stamp = readJson(here(stampFile));
      if (!stamp || !stamp.digest || !stamp.sig) fail("EX.OWNER-STAMP-MISSING", `example.json status: verified but ${stampFile} absent/incomplete — the doer cannot self-promote to verified`, here(stampFile));
      else if (!CHECK_TOKEN) fail("EX.OWNER-STAMP-UNVERIFIABLE", `example status: verified requires a cryptographic owner stamp but EVIDENCE_CHECK_TOKEN is not set — verified is unreachable until the token is provisioned`, here(stampFile));
      else if (hmac(CHECK_TOKEN, stamp.digest) !== stamp.sig) fail("EX.OWNER-STAMP-FORGED", `${stampFile} does not verify against EVIDENCE_CHECK_TOKEN — forged owner confirmation`, here(stampFile));
    }
    // verdict must actually compute pass for a verified claim
    const failed = EXAMPLE_VERDICT_IDS.filter((id) => !verdict[id]);
    if (failed.length) fail("EX.VERIFIED-UNEARNED", `example.json status: verified but the computed checklist has failing ids: ${failed.join(", ")}`, here("example.json"));
  }
}

// ── run ──
const targets = argv.length ? argv : exampleSlugs();
const F = [];
if (!targets.length) {
  console.log("[example-audit] PASS — no examples under docs/examples/ to gate.");
  writeAuditResult("example", []);
  process.exit(0);
}
for (const slug of targets) auditExample(slug, F);
const b = F.filter((f) => f.severity === SEV.BLOCKER).length, h = F.filter((f) => f.severity === SEV.HIGH).length,
  m = F.filter((f) => f.severity === SEV.MEDIUM).length, l = F.filter((f) => f.severity === SEV.LOW).length;
for (const f of F) console.log(`  ${f.severity.toUpperCase().padEnd(7)} ${f.primary_id.padEnd(26)} ${f.message}`);
writeAuditResult("example", F);
const pass = b === 0;
console.log(`\n[example-audit] ${pass ? "PASS" : "FAIL"} — ${F.length} finding(s) (${b}B ${h}H ${m}M ${l}L) over ${targets.length} example(s)`);
process.exit(pass ? 0 : 1);
