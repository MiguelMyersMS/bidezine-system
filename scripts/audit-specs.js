// Spec completeness audit — the blind-spot guard for the Figma→Storybook pipeline.
//
// Reads every docs/atomic/**/*.spec.md (except _TEMPLATE) and lints the
// machine-checkable ```yaml front-block. The point is NOT to validate design —
// it is to make INCOMPLETENESS impossible to ship. Each check corresponds to a
// real, observed failure mode from the ActionMenu sessions (read instance vs set,
// shallow icon reads, untokenized color, unverified claims).
//
// Lightweight by design: no YAML dependency (the package ships zero build deps).
// We scan the front-block structurally for presence, counts, and a few values.
//
// Exit non-zero on any BLOCKER so `npm run health` fails loudly.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonIfChanged } from "./lib/audit-core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPECS_DIR = path.join(ROOT, "docs/atomic");
const AUDITS_DIR = path.join(ROOT, "docs/audits");

const ATOMIC_LEVELS = ["atom", "molecule", "organism", "template"];
const STATUSES = ["draft", "extracting", "implemented", "verified", "locked"];

// Semantic token names. A tokenMap/state alias `tokens.<name>` must resolve to one of these — a
// dangling token reference is a spec CONTENT bug the structural checks can't see. We read the keys of
// the TOKENS_LIGHT object literal directly (the source of truth `type TokenSet = { [K in keyof typeof
// TOKENS_LIGHT]: string }` maps over) — NOT the one-line mapped type, which a regex would overshoot.
// FAIL LOUD on a bad parse rather than silently no-opping the whole content check (fail-open).
function loadTokenKeys() {
  const tk = fs.readFileSync(path.join(ROOT, "src/tokens.ts"), "utf-8");
  const start = tk.indexOf("export const TOKENS_LIGHT = {");
  if (start === -1) throw new Error("audit-specs: could not find TOKENS_LIGHT in src/tokens.ts — token-resolution check cannot run");
  const after = tk.slice(start);
  const end = after.search(/\n\};/);                       // first column-0 "};" closes the object
  const body = end === -1 ? after : after.slice(0, end);
  const keys = new Set([...body.matchAll(/^  ([A-Za-z0-9_]+):/gm)].map((m) => m[1])); // top-level (2-space) keys only
  if (keys.size < 10) throw new Error(`audit-specs: parsed only ${keys.size} TokenSet keys from TOKENS_LIGHT — refusing to run the token check fail-open`);
  return keys;
}

// Canonical blind-spot checklist ids — every spec MUST carry all of these.
const REQUIRED_CHECKLIST = [
  "node-path-verified",
  "read-set-not-instance",
  "states-match-variant-count",
  "icons-depth6-verified",
  "all-colors-tokenized",
  "slots-reserved",
  "dividers-placement",
  "story-covers-all-states",
];

const REQUIRED_KEYS = [
  "element", "atomicLevel", "status", "figma",
  "container", "states", "tokenMap", "icons", "a11y", "verify", "checklist",
];

// A discrepancy is "settled" only with one of these verdicts. Anything else
// (open, unconfirmed, empty, missing) blocks a `verified`/`locked` status.
const SETTLED_VERDICTS = ["resolved", "accepted", "story-setup"];

const TOKEN_KEYS = loadTokenKeys();

// ── tiny structural helpers (not a full YAML parser) ─────────────────────────

function yamlBlock(md) {
  const m = md.match(/```ya?ml\s*\n([\s\S]*?)\n```/);
  return m ? m[1] : null;
}

function hasTopKey(block, key) {
  return new RegExp(`^${key}:`, "m").test(block);
}

function topValue(block, key) {
  const m = block.match(new RegExp(`^${key}:\\s*(.+?)\\s*(?:#.*)?$`, "m"));
  return m ? m[1].trim() : null;
}

// Return the lines belonging to a top-level key's block (indented under it),
// stopping at the next column-0 key.
function section(block, key) {
  const lines = block.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (start === -1) return "";
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) break; // next top-level key
    out.push(lines[i]);
  }
  return out.join("\n");
}

// ── internal-consistency check (spec contradicts ITSELF) ─────────────────────
// A spec is authored in several sections (anatomy prose, `tokenMap`, the `states`
// matrix). When the SAME logical slot is assigned CONFLICTING values across those
// sections — a font named one thing in tokenMap and another in the state matrix, or
// a token whose tokenMap value the state matrix over-collapses — the contradiction is
// independent of Figma and fully machine-detectable. Catching it here forces it to be
// resolved at spec-authoring time, before Figma is even consulted, and removes it from
// the adjudicator's plate. Advisory (HIGH), never a blocker.

function cleanVal(raw) {
  let v = raw.trim();
  if (v[0] === '"' || v[0] === "'") {
    const q = v[0];
    const end = v.indexOf(q, 1);
    if (end !== -1) return v.slice(1, end).trim();
  }
  const c = v.indexOf(" #"); // strip trailing inline comment (unquoted)
  if (c !== -1) v = v.slice(0, c);
  return v.replace(/^["']|["']$/g, "").trim();
}

const normSlot = (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

// Parse the `states:` matrix into [{name, props:{key:value}}]. Split on /\r?\n/ so a
// CRLF checkout doesn't leave a trailing \r that breaks the `$`-anchored line regexes.
function parseStates(statesText) {
  const entries = [];
  let cur = null;
  for (const line of statesText.split(/\r?\n/)) {
    const nameM = line.match(/^\s*-\s*name:\s*(.+)$/);
    if (nameM) { cur = { name: cleanVal(nameM[1]), props: {} }; entries.push(cur); continue; }
    const kv = line.match(/^\s+([A-Za-z0-9_]+):\s*(.+)$/);
    if (kv && cur) cur.props[kv[1]] = cleanVal(kv[2]);
  }
  return entries;
}

// Parse a flat `key: value` block (e.g. tokenMap).
function parseKeyVals(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const kv = line.match(/^\s+([A-Za-z0-9_]+):\s*(.+)$/);
    if (kv) out[kv[1]] = cleanVal(kv[2]);
  }
  return out;
}

const isFontVal = (v) => /^TYPE[./]/.test(v);
const isTokenColor = (v) => /^tokens\./.test(v);

// Extract the TYPE token name(s) a font value references. "TYPE/labelM" -> ["labelM"],
// "TYPE.caption" -> ["caption"], and the dual-font notation "TYPE.caption/labelM" ->
// ["caption","labelM"] (an intentional either/or that covers BOTH tokens, not a conflict).
function fontTokens(v) {
  const m = v.match(/^TYPE[./](.+)$/);
  if (!m) return [];
  return m[1].split(/[/,]/).map((s) => s.trim().replace(/^TYPE[./]/, "")).filter(Boolean);
}

// Normalise a raw width/sizing value to a sizing MODE — 'hug' | 'fill' | null. Used to
// compare a frontmatter `container.width` against the `## Anatomy` root line's `width:`
// without tripping on cosmetic wording. 'hug'/'inline-flex'/'inline-block'/'fit-content'/
// 'content' => 'hug'; 'fill'/'stretch'/'100%' => 'fill'; anything else (a fixed px, unknown)
// => null so the comparison only fires when BOTH sides resolve.
function sizingMode(raw) {
  if (raw == null) return null;
  const v = String(raw).toLowerCase();
  if (/\b(hug|inline-flex|inline-block|fit-content|content)\b/.test(v)) return "hug";
  if (/(fill|stretch|100\s*%)/.test(v)) return "fill";
  return null;
}

// Extract the body of a markdown "## Heading" section from the FULL spec md (the prose,
// outside the yaml front-block), stopping at the next heading. Require ≥2 hashes so a
// single-`#` yaml comment inside the front-block can't false-match.
function mdSection(md, heading) {
  if (!md) return "";
  // Anchor the heading at a line start (^ or after a newline; a heading needs ≥2 hashes so a
  // single-`#` yaml comment can't false-match), then capture until the NEXT markdown heading or
  // end of string. No `m` flag: `$` must mean end-of-string, not every line end (an `m`-flag `$`
  // in the lookahead terminates the lazy capture at the first line break — capturing nothing).
  const re = new RegExp(`(?:^|\\n)#{2,6}[ \\t]*${heading}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,6}[ \\t]|$)`, "i");
  const m = md.match(re);
  return m ? m[1] : "";
}

function lintInternalConsistency(block, md, add) {
  const statesText = section(block, "states");
  const tokenMapText = section(block, "tokenMap");

  // Track slots that contradicted so the checklist re-derivation guard (4) can name them.
  const contradictionSlots = [];
  const flag = (level, msg, slot) => { contradictionSlots.push(slot); add(level, msg); };

  if (statesText || tokenMapText) {
    const states = parseStates(statesText);
    const tokenMap = parseKeyVals(tokenMapText);

    // (1) FONT slot: the primary text element's font must be ONE token. Compare the
    //     tokenMap `*font*` value(s) against the state-matrix `font` value(s); a spec that
    //     names the label font `TYPE/caption` in tokenMap but `TYPE/labelM`/`TYPE/bodyM` in
    //     the state matrix contradicts itself (feedbacktext).
    const tmFontVals = Object.entries(tokenMap)
      .filter(([k, v]) => /font/i.test(k) && !/icon/i.test(k) && isFontVal(v))
      .map(([, v]) => v);
    const stateFontVals = states
      .flatMap((s) => Object.entries(s.props))
      .filter(([k, v]) => /^font$/i.test(k) && isFontVal(v))
      .map(([, v]) => v);
    if (tmFontVals.length && stateFontVals.length) {
      const tmNames = new Set(tmFontVals.flatMap(fontTokens));
      const stNames = new Set(stateFontVals.flatMap(fontTokens));
      // Contradiction only when the two sides share NO token — a dual-font value like
      // "TYPE.caption/labelM" that covers a tokenMap font is NOT a conflict.
      const shared = [...tmNames].some((n) => stNames.has(n));
      if (tmNames.size && stNames.size && !shared) {
        flag("high", `spec internally contradicts itself on font: tokenMap '${[...new Set(tmFontVals)].join(", ")}' vs state matrix '${[...new Set(stateFontVals)].join(", ")}'`, "font");
      }
    }

    // (2) NORMALIZED TOKEN SLOT: a tokenMap color slot whose normalized key matches a
    //     state-matrix slot on which every state UNANIMOUSLY agrees a value, yet tokenMap
    //     records a DIFFERENT token — an unambiguous self-contradiction. Only exact
    //     normalized-key matches with a unanimous state value are compared: a slot that
    //     legitimately VARIES across states (a placeholder vs typed input colour, a rest
    //     vs hover overlay) is intentionally NOT flagged here — per-state variation is the
    //     point of a state matrix and is not mechanically distinguishable from an
    //     over-collapse, so that judgment stays with the reviewer.
    const stateSlotVals = {}; // norm -> Set(token values)
    for (const s of states) {
      for (const [k, v] of Object.entries(s.props)) {
        if (!isTokenColor(v)) continue;
        (stateSlotVals[normSlot(k)] ||= new Set()).add(v);
      }
    }
    for (const [k, v] of Object.entries(tokenMap)) {
      if (!isTokenColor(v)) continue;
      const sv = stateSlotVals[normSlot(k)];
      if (!sv || sv.size !== 1) continue; // require a UNANIMOUS state value
      const stateVal = [...sv][0];
      if (stateVal !== v) {
        flag("high", `spec internally contradicts itself on ${k}: tokenMap '${v}' vs state matrix '${stateVal}'`, k);
      }
    }
  }

  // (3) CONTAINER SIZING vs ANATOMY: the frontmatter `container.width` and the `## Anatomy`
  //     root/first line's `width:` describe the SAME slot from two authoring surfaces. When
  //     BOTH resolve to a sizing mode and DISAGREE (one 'hug', the other 'fill'), the spec
  //     contradicts itself independently of Figma — a re-design moved the Anatomy prose + code
  //     but left the frontmatter scalar stale (L26). Advisory HIGH.
  const containerText = section(block, "container");
  const cwM = containerText.match(/^\s*width:\s*(.+?)\s*(?:#.*)?$/m);
  const containerWidthRaw = cwM ? cleanVal(cwM[1]) : null;
  const anatomyText = mdSection(md, "Anatomy");
  const awM = anatomyText.match(/width:\s*([^\n,;)]+)/i);
  const anatomyWidthRaw = awM ? cleanVal(awM[1]) : null;
  const cMode = sizingMode(containerWidthRaw);
  const aMode = sizingMode(anatomyWidthRaw);
  if (cMode && aMode && cMode !== aMode) {
    flag("high", `spec internally contradicts itself on container sizing: frontmatter container.width '${containerWidthRaw}' vs Anatomy 'width:${anatomyWidthRaw}'`, "container.width");
  }

  // (4) CHECKLIST RE-DERIVATION GUARD: when ANY internal contradiction was detected above
  //     (font/token OR container sizing) and the frontmatter `checklist:` still asserts
  //     `spec-internal-consistency: pass:true`, that box lies and must be re-derived.
  if (contradictionSlots.length) {
    const checklistText = section(block, "checklist");
    const sicPass = /-\s*id:\s*spec-internal-consistency[^\n]*\n\s*pass:\s*true/.test(checklistText);
    if (sicPass) {
      add("high", `checklist spec-internal-consistency asserts pass:true but the spec contradicts itself (${contradictionSlots.join(", ")}) — re-derive the box`);
    }
  }
}

// ── per-spec lint ────────────────────────────────────────────────────────────

function lintSpec(file, md) {
  const findings = []; // {level: 'blocker'|'high'|'info', msg}
  const add = (level, msg) => findings.push({ level, msg });

  const block = yamlBlock(md);
  if (!block) {
    add("blocker", "no ```yaml front-block found");
    return findings;
  }

  // status + atomicLevel enums (checked first; drafts are linted leniently)
  const status = topValue(block, "status");
  if (status && !STATUSES.includes(status)) add("blocker", `invalid status: ${status}`);

  // A `draft` is work-in-progress: only require it to be identifiable. Full
  // completeness is enforced once status advances to extracting+.
  if (status === "draft") {
    if (!hasTopKey(block, "element")) add("blocker", "missing required key: element");
    add("info", "status=draft — completeness checks deferred until extracting+");
    return findings;
  }

  for (const k of REQUIRED_KEYS) {
    if (!hasTopKey(block, k)) add("blocker", `missing required key: ${k}`);
  }

  // CONTENT: every `tokens.<name>` alias in the front-block must resolve to a real TokenSet key. A
  // dangling token reference (typo or renamed token) is a spec bug the structural checks miss — it
  // ships a component wired to a non-existent token. (Skip the literal filename `tokens.ts`.)
  if (TOKEN_KEYS.size) {
    const seen = new Set();
    for (const m of block.matchAll(/\btokens\.([A-Za-z0-9_]+)/g)) {
      const name = m[1];
      if (name === "ts" || seen.has(name)) continue;
      seen.add(name);
      if (!TOKEN_KEYS.has(name)) add("blocker", `tokens.${name} is not a TokenSet key in src/tokens.ts (dangling token alias)`);
    }
  }

  const level = topValue(block, "atomicLevel");
  if (level && !ATOMIC_LEVELS.includes(level)) add("blocker", `invalid atomicLevel: ${level}`);
  const folderLevel = path.basename(path.dirname(file)); // docs/atomic/<level>/x.spec.md
  if (level && ATOMIC_LEVELS.includes(folderLevel) && level !== folderLevel) {
    add("high", `atomicLevel '${level}' does not match folder '${folderLevel}'`);
  }

  // figma source: must read SETS, not instances — UNLESS the spec is for an
  // assembled FRAME (a composition has no variant set; it declares `kind: frame`).
  const figma = section(block, "figma");
  if (!/fileKey:\s*\S/.test(figma)) add("blocker", "figma.fileKey is empty");
  const figmaKind = (figma.match(/\bkind:\s*(\w+)/) || [])[1];
  if (figmaKind !== "frame" && (!/componentSetIds:/.test(figma) || !/- id:\s*\S/.test(figma))) {
    add("blocker", "figma.componentSetIds is empty (read component SETs, not instances — or declare `kind: frame` for an assembled frame)");
  }

  // verify wiring
  const verify = section(block, "verify");
  if (!/storyId:\s*\S/.test(verify)) add("high", "verify.storyId is empty");
  if (!/figmaRef:\s*\S/.test(verify)) add("high", "verify.figmaRef missing (no Figma ground-truth export)");

  // checklist: all canonical ids present, with pass values
  const checklist = section(block, "checklist");
  const items = {};
  const re = /- id:\s*([a-z0-9-]+)[^\n]*\n\s*pass:\s*(true|false)/g;
  let mm;
  while ((mm = re.exec(checklist)) !== null) items[mm[1]] = mm[2] === "true";
  for (const id of REQUIRED_CHECKLIST) {
    if (!(id in items)) add("blocker", `checklist missing required id: ${id}`);
  }

  // discrepancy verdicts — scope to the `discrepancies:` sub-block ONLY, so we
  // don't pick up the verdict: fields inside lastVision/lastPixelDiff.
  const discBlock = verify.includes("discrepancies:")
    ? verify.slice(verify.indexOf("discrepancies:"))
    : "";
  const verdicts = [...discBlock.matchAll(/verdict:\s*([a-z0-9-]+)/g)].map((x) => x[1]);

  // Gate: a spec may only claim verified/locked when fully clean.
  if (status === "verified" || status === "locked") {
    for (const id of REQUIRED_CHECKLIST) {
      if (items[id] === false) {
        add("blocker", `status=${status} but checklist '${id}' is pass:false`);
      }
    }
    const unsettled = verdicts.filter((v) => !SETTLED_VERDICTS.includes(v));
    if (unsettled.length) {
      add("blocker", `status=${status} but unsettled discrepancy verdict(s): ${unsettled.join(", ")}`);
    }
    const vision = (verify.match(/lastVision:\s*\{[^}]*verdict:\s*(\w+)/) || [])[1];
    if (vision && vision !== "pass") {
      add("blocker", `status=${status} but verify.lastVision verdict is '${vision}' (need pass)`);
    }
  }

  // NOT a defect and NOT a to-do. `status:` was deliberately DECOUPLED from verification (see the
  // "verified-flip decoupling" in scripts/migrate-evidence-normalize.js — status no longer contributes
  // to the seal hash). The verification record is the SIGNED EVIDENCE BUNDLE, not this field. The old
  // wording ("not yet VERIFIED (Figma-conformance pending)") read as 86 defects and manufactured a
  // phantom backlog item that cost the owner days. Flipping these to `verified` would REDDEN the
  // required gate, because a `verified` spec must have verify.lastVision verdict=pass (see above) and
  // these were honestly downgraded precisely because lastVision never ran.
  if (status === "implemented") add("info", "status=implemented — verification of record is the signed evidence bundle (docs/evidence/<slug>/), not this field");

  // Internal-consistency (spec contradicts itself) — advisory HIGH, machine-detectable
  // without consulting Figma. Runs for all non-draft specs.
  lintInternalConsistency(block, md, add);

  return findings;
}

// ── run ──────────────────────────────────────────────────────────────────────

function findSpecs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findSpecs(p));
    // Animation specs (.anim.spec.md) are a DIFFERENT artifact (motion/reduced-motion
    // front-matter, inventoried in animations.json) — not component specs; skip them here.
    else if (entry.name.endsWith(".spec.md") && !entry.name.endsWith(".anim.spec.md") && !entry.name.startsWith("_")) out.push(p);
  }
  return out;
}

const specs = findSpecs(SPECS_DIR);
let blockers = 0;
let high = 0;

console.log(`[spec-audit] linting ${specs.length} spec(s) under docs/atomic/`);
for (const file of specs) {
  const rel = path.relative(ROOT, file);
  const findings = lintSpec(file, fs.readFileSync(file, "utf-8"));
  const b = findings.filter((f) => f.level === "blocker");
  const h = findings.filter((f) => f.level === "high");
  blockers += b.length;
  high += h.length;
  if (findings.length === 0) {
    console.log(`  ✓ ${rel}`);
  } else {
    const tag = b.length ? "✗" : "⚠";
    console.log(`  ${tag} ${rel}`);
    for (const f of findings) console.log(`      [${f.level}] ${f.msg}`);
  }
}

// Write latest.json for parity with other audits (strict mode reads summary.high)
try {
  fs.mkdirSync(AUDITS_DIR, { recursive: true });
  // Idempotent write (2026-08-02): only rewrite when the RESULT changed. This hand-written artifact
  // previously rewrote LF bytes over a CRLF checkout on every run, which git reports as " M" while
  // `git diff` shows nothing - invisible, non-self-healing dirt. See writeJsonIfChanged in audit-core.
  const __w = writeJsonIfChanged(
    path.join(AUDITS_DIR, "spec-audit-latest.json"),
    { summary: { blocker: blockers, high, specs: specs.length } },
  );
  if (__w.skipped) console.log("[spec-audit] unchanged - artifact not rewritten");
} catch { /* non-fatal */ }

console.log(
  blockers
    ? `\n✗ spec-audit: ${blockers} blocker(s), ${high} high`
    : `\n✓ spec-audit: passed (${high} high warning(s))`,
);
process.exit(blockers ? 1 : 0);
