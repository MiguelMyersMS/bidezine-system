// Evidence bundle helpers — the trust substrate for the commit lock.
//
// The design-system pipeline (Figma -> spec -> code -> Storybook) fails not for
// lack of documented protocol but because "verified" is self-attested and free.
// This module makes verification produce DURABLE ARTIFACTS bound to the exact
// source content they verify, so the word "done" is computed from files on disk
// instead of typed by an agent. See docs/evidence/README.md.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { ROOT } from "./audit-core.js";

export const EVIDENCE_ROOT = "docs/evidence";

// Every bundle MUST contain these, each non-empty:
//   figma.json        raw Figma REST dump  -> proof Figma was actually fetched (node-bound)
//   figma.png         exported Figma node  -> ground truth for the visual compare
//   storybook.png     rendered story capture -> what we actually shipped
//   capture-stamp.json story->source binding -> proves the png was rendered from THIS code
//   verdict.md        independent checker note -> itemized compare + `VERDICT: pass`
export const REQUIRED_ARTIFACTS = ["figma.json", "figma.png", "storybook.png", "capture-stamp.json", "verdict.md"];

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// Hash a TEXT SOURCE file with line endings normalized to LF, so a working tree
// checked out with autocrlf=true (CRLF) hashes identically to the git blob (LF) and
// across platforms. NEVER use on binary artifacts (PNGs) — only on source files.
export function hashSource(buf) {
  const normalized = Buffer.from(buf).toString("latin1").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return crypto.createHash("sha256").update(normalized, "latin1").digest("hex");
}

// Hash an evidence ARTIFACT. TEXT artifacts (capture-stamp.json / figma.json / verdict.md /
// states.json …) are hashed LF-normalized (like sources), so a Windows autocrlf=true CRLF
// working tree hashes identically to the LF blob git commits — closing the record-vs-gate
// asymmetry (was raw `sha256`, which false-flagged EV.TAMPERED-ARTIFACT on Windows, LESSONS L17).
// BINARY artifacts (PNGs) are hashed raw — git never normalizes them.
export function hashArtifact(name, buf) {
  return /\.(png|jpe?g|gif|webp|avif)$/i.test(name) ? sha256(buf) : hashSource(buf);
}

// ── Verification-metadata normalization (decouples "flip to verified" from the seal) ──
// A bundle binds its storybook.png + artifacts to the HASH of every source, INCLUDING the
// component's spec.md. So stamping `status: verified` (and its lastVision / checklist
// companions) into the spec re-stales the seal — coupling a PURE status flip to a full
// re-capture + re-record. We neutralize ONLY the verification-metadata field VALUES before
// a COMPONENT SPEC is hashed, so a status-only flip no longer moves the hash, while EVERY
// design-intent edit (figma nodes, container, states, tokenMap, icons, a11y, variantStates,
// discrepancies, verify.storyId, prose, …) still does. Applied inside the content getters
// below (workingContent / stagedContent / committedContent) because those are the SOLE feed
// into the seal hash — capture-stamp, manifest, gate, and baseline all read through them, so
// working / staged / committed stay byte-consistent.
//
// SCOPE: exactly these five fields, values only, line structure preserved — nothing else.
// TRADE-OFF (recorded): this removes the incidental tripwire whereby faking `verified` broke
// the seal. That guarantee properly belongs to the signature (EVIDENCE_CHECK_TOKEN — which the
// doer must not be able to read); the spec-hash coupling was never the real guard, and it is
// advisory today regardless. Non-spec sources (.tsx) pass through untouched.
const SPEC_META_LINE_PATTERNS = [
  [/^status:.*$/gm, "status: <verify-meta>"],                       // identity: status (col 0)
  [/^lastVerifiedCycle:.*$/gm, "lastVerifiedCycle: <verify-meta>"], // identity: lastVerifiedCycle (col 0)
  [/^[ \t]*lastVision:.*$/gm, "  lastVision: <verify-meta>"],       // verify.lastVision { cycle, verdict }
  [/^[ \t]*lastPixelDiff:.*$/gm, "  lastPixelDiff: <verify-meta>"], // verify.lastPixelDiff { cycle, verdict }
  [/^[ \t]*pass:[ \t]*(?:true|false)\b.*$/gm, "  pass: <verify-meta>"], // checklist item pass: booleans
];

// True only for a flat component spec (docs/atomic/<level>/<slug>.spec.md).
export function isComponentSpec(relPath) {
  return /^docs\/atomic\/[^/]+\/[A-Za-z0-9-]+\.spec\.md$/.test(String(relPath).replace(/\\/g, "/"));
}

// Return `buf` with a component spec's verification-metadata VALUES masked (identity for any
// non-spec source). Used ONLY to feed the seal hash — never mutates the file on disk.
export function normalizeSpecForHash(relPath, buf) {
  if (!isComponentSpec(relPath)) return buf;
  let text = Buffer.from(buf).toString("latin1");
  for (const [re, rep] of SPEC_META_LINE_PATTERNS) text = text.replace(re, rep);
  return Buffer.from(text, "latin1");
}

export function slugFor(componentName) {
  return String(componentName).toLowerCase();
}

// Canonical digest of everything a bundle attests: the component, its Figma node, and
// the hashes of every source + artifact. The independent checker signs THIS; any later
// change to source, artifact, or node moves the digest and invalidates the signature.
export function bundleDigest(manifest) {
  const sortObj = (o) => Object.fromEntries(Object.keys(o ?? {}).sort().map((k) => [k, o[k]]));
  const canonical = JSON.stringify({
    slug: manifest.slug ?? null,
    figmaNode: manifest.figmaNode ?? null,
    sources: sortObj(manifest.sources),
    artifacts: sortObj(manifest.artifacts),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function hmac(token, digest) {
  return crypto.createHmac("sha256", token).update(digest).digest("hex");
}

export function loadSignature(slug) {
  const p = path.join(ROOT, evidenceDirFor(slug), "signature.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export function evidenceDirFor(slug) {
  return `${EVIDENCE_ROOT}/${slug}`;
}

// Map a repo-relative changed path to the evidence slug it belongs to, or null
// if the file is NOT evidence-gated (infra, index barrels, animation specs, etc.).
// Anchored to flat paths: a sub-dir/relocated gallery file does NOT resolve here
// and is caught fail-closed by isUnresolvedGalleryFile() instead of slipping past.
export function slugForFile(relPath) {
  const p = String(relPath).replace(/\\/g, "/");

  let m = p.match(/^src\/gallery\/([A-Za-z0-9]+)\.stories\.tsx$/);
  if (m) return m[1] === "index" ? null : slugFor(m[1]);

  m = p.match(/^src\/gallery\/([A-Za-z0-9]+)\.tsx$/);
  if (m) return m[1] === "index" ? null : slugFor(m[1]);

  if (p.endsWith(".anim.spec.md")) return null; // animation specs are behavior-tested, not visually gated
  m = p.match(/^docs\/atomic\/[^/]+\/([A-Za-z0-9-]+)\.spec\.md$/);   // allow hyphen so `<name>-dark.spec.md` gates (was silently un-gated / fail-open)
  if (m) return slugFor(m[1]);

  return null;
}

// A gallery .tsx that does NOT resolve to a flat slug (sub-dir, odd chars, relocation).
// The gate treats this as a BLOCKER rather than silently ungating it (fail-closed).
export function isUnresolvedGalleryFile(relPath) {
  const p = String(relPath).replace(/\\/g, "/");
  if (!/^src\/gallery\/.+\.tsx$/.test(p)) return false;
  if (/^src\/gallery\/index\.tsx?$/.test(p)) return false;
  // *.example.stories.tsx are Example & Behavior Wave output — gated by scripts/audit-example.js, NOT the
  // evidence gate, and deliberately NOT bound into any atom's seal (an example changes independently of the
  // shipped component). Exempt them here so they don't trip EV.UNRESOLVED-GALLERY.
  if (/\.example\.stories\.tsx$/.test(p)) return false;
  return slugForFile(p) === null;
}

// All source files that belong to a slug (whatever exists on disk).
export function sourcesForSlug(slug) {
  const out = [];

  const galleryDir = path.join(ROOT, "src/gallery");
  if (fs.existsSync(galleryDir)) {
    for (const f of fs.readdirSync(galleryDir)) {
      if (!f.endsWith(".tsx")) continue;
      const base = f.replace(/\.stories\.tsx$/, "").replace(/\.tsx$/, "");
      if (base === "index") continue;
      if (slugFor(base) === slug) out.push(`src/gallery/${f}`);
    }
  }

  // sourcesForSlug returns the FULL source set including the spec — it is the RESOLVER (readSpecFigma /
  // readSpecStateNodes locate the Figma node via `.find(s => s.endsWith(".spec.md"))`). Do NOT drop the
  // spec here or capture/resolution breaks. The BINDING (what stales the seal) excludes the spec via the
  // separate `renderSourcesForSlug` below (DIAL 1, 2026-07-12) — that is what the capture-stamp / gate use.
  const atomicDir = path.join(ROOT, "docs/atomic");
  if (fs.existsSync(atomicDir)) {
    for (const level of fs.readdirSync(atomicDir)) {
      const rel = `docs/atomic/${level}/${slug}.spec.md`;
      if (fs.existsSync(path.join(ROOT, rel))) out.push(rel);
    }
  }

  // Single-component dark slug (e.g. chevrontrigger-dark): there is NO dedicated *Dark.tsx, so the
  // loop above bound only the spec. The dark render is produced by the BASE light component + its
  // shared .stories.tsx (which holds the base-title `--dark` story). Bind those so drift in them
  // re-stales the dark bundle and the gate targets the render's real sources.
  if (/-dark$/.test(slug) && !out.some((f) => f.endsWith(".tsx")) && fs.existsSync(galleryDir)) {
    const baseSlug = slug.replace(/-dark$/, "");
    for (const f of fs.readdirSync(galleryDir)) {
      if (!f.endsWith(".tsx")) continue;
      const base = f.replace(/\.stories\.tsx$/, "").replace(/\.tsx$/, "");
      if (base === "index") continue;
      if (slugFor(base) === baseSlug) out.push(`src/gallery/${f}`);
    }
  }

  return out;
}

// DIAL 1 (2026-07-12, owner-approved): the RENDER-BINDING source set = sourcesForSlug MINUS the spec .md.
// The evidence bundle (capture-stamp + gate staleness) binds only what determines the captured render
// (component .tsx + its .stories.tsx). A spec is documentation — verified vs Figma at SEAL time and by
// audit-specs.js on every commit — so editing spec PROSE cannot change the sealed screenshot and must not
// re-stale the bundle (else the lean-spec doc-retrofit sweep would re-stale all ~63 components). The
// RESOLVER (sourcesForSlug) still returns the spec so readSpecFigma/readSpecStateNodes can locate the node.
export function renderSourcesForSlug(slug) {
  return sourcesForSlug(slug).filter((f) => !/\.spec\.md$/.test(String(f)));
}

// ── L19/L22 light-sibling re-stale guard (owner-authorized 2026-07-08) ───────────────────
// A *dark slug's render comes from the SHARED base src/gallery/<Name>.{tsx,stories.tsx}, which
// slugForFile maps to the LIGHT slug (a DIFFERENT slug). If a dark run edits that shared base file,
// the LIGHT sibling's SEAL goes stale — and because `audit-evidence --slug` re-expands over the shared
// sources (L11/L12), the dark run can never finalize green until the light sibling is re-sealed. These
// helpers let the scout/finalizer DETECT that mechanically instead of dying ~250k tokens later at the gate.

// Shared base .tsx/.stories.tsx bound to a *dark slug that actually belong to a different (light) slug.
export function darkSiblingSharedSources(slug) {
  if (!/-?dark$/i.test(slug)) return [];
  return sourcesForSlug(slug).filter(
    (f) => /^src\/gallery\/.*\.tsx$/i.test(f) && slugForFile(f) !== slug,
  );
}

// If any shared base source of a *dark slug has a source hash that no longer matches the LIGHT
// sibling's recorded manifest hash, return {file, light, recorded, current}; else null. Detect-only —
// the caller STOPs. Uses hashSource (LF-normalized), so a CRLF working tree is NOT false-flagged (NOT
// the L17 artifact-CRLF trap). A non-null result means a shared-base edit re-staled the light sibling
// and it must be re-sealed FIRST (full re-verify if its LIGHT token value diverged per L19/GUIDE §3a).
export function lightSiblingStale(slug) {
  for (const f of darkSiblingSharedSources(slug)) {
    const light = slugForFile(f);
    if (!light) continue;
    const man = loadManifest(light);
    if (!man || !man.sources) continue;
    const recorded = man.sources[f];
    if (!recorded) continue;
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const current = hashSource(fs.readFileSync(abs));
    if (recorded !== current) return { file: f, light, recorded, current };
  }
  return null;
}

// Files staged for commit (added/copied/modified). Empty on any git error.
export function stagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only --diff-filter=ACM", { cwd: ROOT, encoding: "utf-8" });
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// Content of the STAGED (index) version of a file — what will actually be committed,
// not the working tree. Falls back to working tree, then empty.
// Spec verification-metadata is normalized here (see normalizeSpecForHash) so all three
// getters feed the seal hash byte-identically.
export function stagedContent(relPath) {
  const p = String(relPath).replace(/\\/g, "/");
  let buf;
  try {
    buf = execSync(`git show :${p}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  } catch {
    const full = path.join(ROOT, relPath);
    buf = fs.existsSync(full) ? fs.readFileSync(full) : Buffer.from("");
  }
  return normalizeSpecForHash(p, buf);
}

export function workingContent(relPath) {
  const full = path.join(ROOT, relPath);
  const buf = fs.existsSync(full) ? fs.readFileSync(full) : Buffer.from("");
  return normalizeSpecForHash(relPath, buf);
}

export function resolveRef(ref) {
  try {
    return execSync(`git rev-parse ${ref}`, { cwd: ROOT, encoding: "utf-8" }).trim();
  } catch {
    return ref;
  }
}

// Files changed between two committed refs (the server-side authority's input).
export function committedFiles(base, head) {
  try {
    const out = execSync(`git diff --name-only --diff-filter=ACMR ${base} ${head}`, { cwd: ROOT, encoding: "utf-8" });
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// Content of a file AS COMMITTED at a ref — never the working tree. This is what
// closes the TOCTOU hole (gate must hash the bytes that are actually committed).
// Spec verification-metadata is normalized here too (see normalizeSpecForHash) so the
// CI/baseline hash of a committed spec matches the working/staged hash.
export function committedContent(relPath, ref) {
  const p = String(relPath).replace(/\\/g, "/");
  let buf;
  try {
    buf = execSync(`git show ${ref}:${p}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  } catch {
    buf = Buffer.from("");
  }
  return normalizeSpecForHash(p, buf);
}

// Explicit, reviewable exemptions — privileged and LOUD, never a silent hatch.
// Every entry must carry reason/by/date/expires; malformed or expired entries are
// fail-CLOSED (ignored, so the gate fires) AND reported as problems so they cannot
// quietly un-gate a component. Returns { active: {slug: entry}, problems: [msg] }.
//   docs/evidence/exemptions.json -> { "exempt": { "<slug>": { reason, by, date, expires } } }
export function validateExemptions(today = new Date().toISOString().slice(0, 10)) {
  const p = path.join(ROOT, EVIDENCE_ROOT, "exemptions.json");
  if (!fs.existsSync(p)) return { active: {}, problems: [] };

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return { active: {}, problems: ["docs/evidence/exemptions.json is not valid JSON — all exemptions ignored (fail-closed)"] };
  }

  const exempt = raw.exempt ?? {};
  const active = {};
  const problems = [];
  for (const [slug, e] of Object.entries(exempt)) {
    if (!e || !e.reason || !e.by || !e.date || !e.expires) {
      problems.push(`exemption "${slug}" is missing required field(s) reason/by/date/expires — ignored`);
      continue;
    }
    if (String(e.expires) < today) {
      problems.push(`exemption "${slug}" expired on ${e.expires} — ignored (re-verify or renew)`);
      continue;
    }
    active[slug] = e;
  }
  return { active, problems };
}

// Validate a PNG buffer is a real, non-trivial image (header + IHDR dimensions +
// plausible size). Kills the "byte-padded / blank / 1x1" artifact forgery cheaply
// without an image-decode dependency. Full pixel-variance is a later refinement.
export function validatePng(buf, { minPx = 8, minBytes = 1024 } = {}) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(sig)) return { ok: false, reason: "not a PNG (bad signature)" };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width < minPx || height < minPx) return { ok: false, width, height, reason: `too small (${width}x${height})` };
  if (buf.length < minBytes) return { ok: false, width, height, reason: `suspiciously tiny (${buf.length}B) — likely blank` };
  return { ok: true, width, height };
}

// Pull Figma coordinates out of a spec's front-block (fileKey + the node to export).
// Returns null if the slug has no spec. Light regex parse (not full YAML).
export function readSpecFigma(slug) {
  const specRel = sourcesForSlug(slug).find((s) => s.endsWith(".spec.md"));
  if (!specRel) return null;
  const body = fs.readFileSync(path.join(ROOT, specRel), "utf-8");
  const pick = (re) => {
    const m = body.match(re);
    return m ? m[1] : null;
  };
  const exportNode = pick(/figmaExportNode:\s*["']?(\d+:\d+)["']?/);
  const thisNode = pick(/thisNode:\s*["']?(\d+:\d+)["']?/);
  return {
    specRel,
    fileKey: pick(/fileKey:\s*["']?([A-Za-z0-9]+)["']?/),
    node: exportNode || thisNode,
    exportNode,
    thisNode,
  };
}

// The grandfather record: master-committed source hashes per component, written by
// evidence:baseline. A component is exempt from the full bundle requirement ONLY
// while it stays byte-identical to its master baseline; any change forces real
// evidence (EV.BASELINE-DRIFT). Returns null if not baselined.
export function loadBaseline() {
  const p = path.join(ROOT, EVIDENCE_ROOT, "baseline.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

// Parse the spec's nodeMap for per-state Figma variation nodes (state=default/active/
// disabled → nodeId), so a bundle can capture and verify the FULL state matrix, not
// just one state. Returns { specRel, fileKey, states: [{ state, nodeId }] }.
export function readSpecStateNodes(slug) {
  const specRel = sourcesForSlug(slug).find((s) => s.endsWith(".spec.md"));
  if (!specRel) return { specRel: null, fileKey: null, states: [] };
  const body = fs.readFileSync(path.join(ROOT, specRel), "utf-8");
  const fileKey = (body.match(/fileKey:\s*["']?([A-Za-z0-9]+)["']?/) || [])[1] ?? null;
  const states = [];
  const re = /-\s*role:\s*variation\s+name:\s*["']?(state=[^"'\n]+)["']?\s+nodeId:\s*["']?(\d+:\d+)["']?/g;
  let m;
  while ((m = re.exec(body))) states.push({ state: m[1].replace(/^state=/, ""), nodeId: m[2] });
  // R4 (LESSONS L29): a kind:frame with no COMPONENT_SET has no `role: variation` entries; its states live
  // in a view-state block (`- name: <state>` … `figmaNode: <id>` — or legacy `nodeId: <id>`). Read a
  // per-state node when the spec author binds one, so each state frame is captured — not just
  // figmaExportNode. `figmaNode:` is the canonical key (`_TEMPLATE.lean.spec.md` L58, and every field spec:
  // selectfield/buttonfield/calendarfield/filterpane/sliderfield); `nodeId:` is accepted for back-compat.
  // Line-scoped to the `states:` block (indent-aware) so it never bleeds into nodeMap or other blocks.
  if (!states.length) {
    let inStates = false;
    let curState = null;
    for (const line of body.split(/\r?\n/)) {
      if (/^states:\s*(#.*)?$/.test(line)) { inStates = true; continue; }
      if (inStates && /^\S/.test(line)) break; // dedent → out of the states block
      if (!inStates) continue;
      const nameM = line.match(/^\s*-\s*name:\s*["']?([a-z0-9-]+)["']?/);
      if (nameM) { curState = nameM[1]; continue; }
      const idM = line.match(/^\s*(?:figmaNode|nodeId):\s*["']?(\d+:\d+)["']?/);
      if (idM && curState) { states.push({ state: curState, nodeId: idM[1] }); curState = null; }
    }
  }
  return { specRel, fileKey, states };
}

export function loadManifest(slug) {
  const p = path.join(ROOT, evidenceDirFor(slug), "manifest.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

// Mechanism D — the verdict is a machine-checked CHECKLIST, and `pass` is COMPUTED,
// never typed. Every core verify dimension must appear as a checked `- [x] <id>` line;
// any missing id, any unchecked `- [ ]` row, or any conventional unresolved marker
// (TODO/FIXME/WIP/TBD/XXX/deferred/unverified/unresolved) forces a computed FAIL. This
// defeats "VERDICT: pass with buried open items" — there is no free-text pass to launder.
export const VERDICT_REQUIRED_IDS = {
  "figma-fetched": "Figma node JSON fetched (figma.json)",
  "node-bound": "figma.json node id matches the spec/manifest node",
  "story-rendered": "story captured to storybook.png",
  "dimensions": "rendered dimensions match Figma",
  "colors": "every slot fill matches its token",
  "typography": "TYPE tokens (size/weight/lineHeight) match",
  "states": "every state in the matrix is covered",
  "icons": "icon identities verified against Figma",
};

const VERDICT_FORBIDDEN = [/\b(TODO|FIXME|WIP|TBD|XXX)\b/, /\b(deferred|unverified|unresolved)\b/i];

// Returns { pass, missing[], unchecked[], forbidden[] }.
export function computeVerdict(body) {
  const lines = String(body).split(/\r?\n/);
  const checked = new Set();
  const unchecked = new Set();
  for (const line of lines) {
    const m = line.match(/^\s*-\s*\[([ xX])\]\s*([a-z0-9-]+)\b/);
    if (!m) continue;
    const id = m[2].toLowerCase();
    (m[1].toLowerCase() === "x" ? checked : unchecked).add(id);
  }
  const required = Object.keys(VERDICT_REQUIRED_IDS);
  const missing = required.filter((id) => !checked.has(id) && !unchecked.has(id));
  const stillOpen = required.filter((id) => unchecked.has(id));
  // Scan for unresolved markers ONLY on checklist/note/evidence lines (where a checker
  // would actually bury an open item), not on instructional prose that may legitimately
  // name these words. A "content" line is a list item or an `evidence:` line.
  const forbidden = [];
  for (const line of lines) {
    if (!/^\s*(-|evidence:)/i.test(line)) continue;
    if (VERDICT_FORBIDDEN.some((re) => re.test(line))) forbidden.push(line.trim().slice(0, 80));
  }
  return { pass: missing.length === 0 && stillOpen.length === 0 && forbidden.length === 0, missing, unchecked: stillOpen, forbidden };
}
