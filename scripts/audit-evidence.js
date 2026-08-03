// Evidence gate — the commit lock.
//
// Blocks a change that touches a gallery component, its story, or its spec unless
// a FRESH, PASSING, UNTAMPERED evidence bundle exists for that component, bound by
// sha256 to the exact source content being shipped. See docs/evidence/README.md
// and the red-team findings in docs/evidence/RED-TEAM-2026-06-23.md.
//
// THE REAL LOCK IS THE SERVER-SIDE CHECK. Local hooks are advisory convenience and
// run in WARN mode; the authoritative run is `--range` in CI over committed blobs,
// executed from the trusted base ref (see .github/workflows/evidence.yml).
//
// Modes:
//   --staged              gate over `git diff --cached` (local pre-commit, WARN)
//   --range <base..head>  gate over committed blobs in a range (CI authority)
//   --files a,b,c         gate over an explicit list, working-tree content (pre-push)
//   --slug <slug>         gate a slug over its OWN recorded sources (sourcesForSlug) — used by the
//                         finalizer so a `-dark` slug checks its own bundle, not the light sibling
//   --all                 gate over every gallery component, working-tree content
//
// NOTE (honest scope): this hardens the STRUCTURAL layer (provenance of the bytes,
// freshness, tamper, scope). It does NOT yet prove the artifacts are real or that
// the verdict was written by an independent checker — that is mechanisms A/C/D.
// Until those land, the CI check is ADVISORY (non-required), not a merge blocker.

import fs from "node:fs";
import path from "node:path";
import { SEV, finding, writeAuditResult, ROOT } from "./lib/audit-core.js";
import { deriveExpectations, resolveExpected, checkParity, normHex } from "./lib/variant-parity.js";
import {
  REQUIRED_ARTIFACTS,
  evidenceDirFor,
  slugForFile,
  isUnresolvedGalleryFile,
  renderSourcesForSlug,
  stagedFiles,
  stagedContent,
  workingContent,
  committedFiles,
  committedContent,
  resolveRef,
  validateExemptions,
  loadManifest,
  loadBaseline,
  loadSignature,
  bundleDigest,
  hmac,
  computeVerdict,
  validatePng,
  sha256,
  hashSource,
  hashArtifact,
} from "./lib/evidence.js";

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith("--")) ?? "--staged";

// Resolve { changed files, content reader, label } for the active mode.
function resolveScope() {
  if (mode === "--all") {
    const galleryDir = path.join(ROOT, "src/gallery");
    const files = fs.existsSync(galleryDir)
      ? fs.readdirSync(galleryDir).map((f) => `src/gallery/${f}`)
      : [];
    return { files, read: workingContent, label: "all gallery components" };
  }

  if (mode === "--range") {
    const spec = args[args.indexOf("--range") + 1] ?? "origin/master..HEAD";
    const [base, head = "HEAD"] = spec.split("..");
    const headSha = resolveRef(head);
    const files = committedFiles(resolveRef(base), headSha);
    return { files, read: (p) => committedContent(p, headSha), label: `committed range ${spec}` };
  }

  if (mode === "--files") {
    const list = (args[args.indexOf("--files") + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return { files: list, read: workingContent, label: "explicit file list" };
  }

  if (mode === "--slug") {
    // Gate a slug over ITS OWN recorded sources (sourcesForSlug) — so a `-dark` slug is checked
    // against the artifacts it actually recorded, never a hand-picked gallery file that resolves to
    // the LIGHT sibling. This is how the finalizer gates a single-component dark bundle correctly.
    const slug = args[args.indexOf("--slug") + 1];
    return { files: renderSourcesForSlug(slug), read: workingContent, label: `slug ${slug}` };
  }

  return { files: stagedFiles(), read: stagedContent, label: "staged changes" };
}

const findings = [];
const { files, read, label } = resolveScope();
const { active: exemptions, problems: exemptionProblems } = validateExemptions();
const baseline = loadBaseline();
const checkToken = process.env.EVIDENCE_CHECK_TOKEN; // present in the CI authority; absent for the doer

// Loud + fail-closed: a malformed/expired exemption never silently un-gates.
for (const msg of exemptionProblems) {
  findings.push(finding("EV.BAD-EXEMPTION", SEV.HIGH, msg, "docs/evidence/exemptions.json"));
}
const activeSlugs = Object.keys(exemptions);
if (activeSlugs.length) {
  console.log(`[evidence-audit] ⚠ ${activeSlugs.length} ACTIVE EXEMPTION(S): ${activeSlugs.join(", ")} (review docs/evidence/exemptions.json)`);
}

// Fail-closed: a gallery .tsx that escapes flat slug resolution is a BLOCKER, not ungated.
const normFiles = files.map((f) => f.replace(/\\/g, "/"));
for (const f of normFiles) {
  if (isUnresolvedGalleryFile(f)) {
    findings.push(
      finding("EV.UNRESOLVED-GALLERY", SEV.BLOCKER, `${f}: gallery component path does not resolve to a flat <Name>.tsx slug — relocation/sub-dir/odd-name files are not allowed to dodge the gate.`, f),
    );
  }
}

// slug -> the changed source files that triggered the gate for it
const triggered = new Map();
for (const f of normFiles) {
  const slug = slugForFile(f);
  if (!slug) continue;
  if (!triggered.has(slug)) triggered.set(slug, []);
  triggered.get(slug).push(f);
}

for (const [slug] of triggered) {
  if (exemptions[slug]) continue; // validated, unexpired, reviewed exemption

  const dir = evidenceDirFor(slug);
  const here = (rel) => `${dir}/${rel}`;

  // 1. Manifest must exist. If not, the component may be GRANDFATHERED by the master
  //    baseline — allowed only while byte-identical to master. Any drift forces real
  //    evidence (this is what makes a CHANGED component require verification).
  const manifest = loadManifest(slug);
  if (!manifest) {
    const based = baseline?.slugs?.[slug];
    if (based) {
      for (const src of renderSourcesForSlug(slug)) {
        const b = based.sources?.[src];
        if (!b || hashSource(read(src)) !== b) {
          findings.push(
            finding("EV.BASELINE-DRIFT", SEV.BLOCKER, `${slug}: ${src} changed since the master baseline — grandfathering no longer applies. Capture real evidence (evidence:capture:figma + story + independent verdict + evidence:record).`, src),
          );
        }
      }
      continue;
    }
    findings.push(
      finding("EV.NO-EVIDENCE", SEV.BLOCKER, `${slug}: no evidence bundle and not baselined. Verify against Figma, then \`npm run evidence:record ${slug}\`. To exempt (with reason + expiry), edit docs/evidence/exemptions.json.`, here("manifest.json")),
    );
    continue;
  }

  // 2. Required artifacts present, non-empty, AND matching the hashes the recorder
  //    sealed (so artifacts cannot be swapped after recording).
  const recordedArtifacts = manifest.artifacts ?? {};
  for (const art of REQUIRED_ARTIFACTS) {
    const full = path.join(ROOT, here(art));
    if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
      findings.push(finding("EV.MISSING-ARTIFACT", SEV.BLOCKER, `${slug}: required evidence artifact missing or empty: ${art}`, here(art)));
      continue;
    }
    const recorded = recordedArtifacts[art];
    if (!recorded) {
      findings.push(finding("EV.UNSEALED-ARTIFACT", SEV.BLOCKER, `${slug}: ${art} exists but was never sealed into manifest.artifacts — re-run evidence:record.`, here(art)));
      continue;
    }
    if (hashArtifact(art, fs.readFileSync(full)) !== recorded) {
      findings.push(finding("EV.TAMPERED-ARTIFACT", SEV.BLOCKER, `${slug}: ${art} changed since it was recorded (artifact tampered/swapped). Re-verify and re-record.`, here(art)));
    }
  }

  // 2a. Extra sealed artifacts beyond REQUIRED_ARTIFACTS (e.g. variant-contract.json + states/states.json
  //     for multi-variant atoms) are ALSO tamper-checked, so the sealed per-cell rendered facts cannot be
  //     edited after recording. bundleDigest covers manifest.artifacts, so the signature binds them too.
  for (const [art, recorded] of Object.entries(recordedArtifacts)) {
    if (REQUIRED_ARTIFACTS.includes(art)) continue;
    const full = path.join(ROOT, here(art));
    if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
      findings.push(finding("EV.MISSING-ARTIFACT", SEV.BLOCKER, `${slug}: sealed artifact missing or empty: ${art}`, here(art)));
    } else if (hashArtifact(art, fs.readFileSync(full)) !== recorded) {
      findings.push(finding("EV.TAMPERED-ARTIFACT", SEV.BLOCKER, `${slug}: ${art} changed since it was recorded (tampered/swapped). Re-verify and re-record.`, here(art)));
    }
  }

  // 2b. PNG artifacts must be REAL images, not byte-padded junk.
  for (const png of ["figma.png", "storybook.png"]) {
    const full = path.join(ROOT, here(png));
    if (fs.existsSync(full) && fs.statSync(full).size > 0) {
      const v = validatePng(fs.readFileSync(full));
      if (!v.ok) findings.push(finding("EV.INVALID-PNG", SEV.BLOCKER, `${slug}: ${png} is not a valid image (${v.reason}).`, here(png)));
    }
  }

  // 2c. figma.json must be a captured dump bound to manifest.figmaNode (no wrong-node).
  const figmaJsonPath = path.join(ROOT, here("figma.json"));
  if (fs.existsSync(figmaJsonPath) && fs.statSync(figmaJsonPath).size > 0) {
    try {
      const dump = JSON.parse(fs.readFileSync(figmaJsonPath, "utf-8"));
      if (!dump.fetchedNode?.document) {
        findings.push(finding("EV.FIGMA-NOT-CAPTURED", SEV.BLOCKER, `${slug}: figma.json is not a captured dump — run evidence:capture:figma.`, here("figma.json")));
      } else if (manifest.figmaNode && dump.node !== manifest.figmaNode) {
        findings.push(finding("EV.FIGMA-NODE-MISMATCH", SEV.BLOCKER, `${slug}: figma.json node ${dump.node} != manifest.figmaNode ${manifest.figmaNode}.`, here("figma.json")));
      }
    } catch {
      findings.push(finding("EV.FIGMA-NOT-CAPTURED", SEV.BLOCKER, `${slug}: figma.json is not valid JSON — run evidence:capture:figma.`, here("figma.json")));
    }
  }

  // 3. Verdict must be a COMPLETE, resolved checklist — pass is computed (mechanism D),
  //    so a verdict with a missing dimension, an unchecked row, or a buried TODO fails.
  const verdictPath = path.join(ROOT, here("verdict.md"));
  const v = fs.existsSync(verdictPath) ? computeVerdict(fs.readFileSync(verdictPath, "utf-8")) : null;
  if (!v || !v.pass) {
    const why = !v
      ? "verdict.md missing"
      : [
          v.missing.length ? `missing: ${v.missing.join("/")}` : "",
          v.unchecked.length ? `unchecked: ${v.unchecked.join("/")}` : "",
          v.forbidden.length ? `unresolved markers: ${v.forbidden.length}` : "",
        ].filter(Boolean).join("; ");
    findings.push(
      finding("EV.VERDICT-INCOMPLETE", SEV.BLOCKER, `${slug}: verdict checklist not satisfied (${why}). Pass is computed from a resolved checklist of every verify dimension, not a typed line.`, here("verdict.md")),
    );
  }

  // 4. Freshness over the FULL slug source set (not just the changed files) — touching
  //    one file of a component re-arms verification for the whole component, defeating
  //    the partial-staging split.
  const recordedSources = manifest.sources ?? {};
  const fullSources = renderSourcesForSlug(slug);
  for (const src of fullSources) {
    const recordedHash = recordedSources[src];
    if (!recordedHash) {
      findings.push(finding("EV.SOURCE-UNTRACKED", SEV.BLOCKER, `${slug}: ${src} exists but is not in the recorded evidence — re-verify and re-record.`, src));
      continue;
    }
    if (hashSource(read(src)) !== recordedHash) {
      findings.push(finding("EV.STALE-EVIDENCE", SEV.BLOCKER, `${slug}: ${src} changed since it was verified (evidence stale). Re-capture against current code and re-record.`, src));
    }
  }

  // 4b. VARIANT PARITY (multi-variant atoms). The seal proves a picture exists; this proves each size×state
  //     cell is actually RIGHT. Expected bg is derived mechanically from figma.json fills; expected icon
  //     (Regular/Filled) comes from the reviewed variant-contract.json (the Figma componentId misreports
  //     icon fill — see AI-INTEGRITY Case 7); documented bgDeviations override known Figma authoring bugs.
  //     These are compared to OUR per-cell facts measured from the render (states.json.rendered). Opt-in:
  //     only runs when a variant-contract.json exists.
  const contractPath = path.join(ROOT, here("variant-contract.json"));
  if (fs.existsSync(contractPath)) {
    try {
      const contract = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
      const statesPath = path.join(ROOT, here("states/states.json"));
      const figmaDump = JSON.parse(fs.readFileSync(figmaJsonPath, "utf-8"));
      const states = fs.existsSync(statesPath) ? JSON.parse(fs.readFileSync(statesPath, "utf-8")) : null;
      const rendered = states?.rendered;
      if (!rendered || Object.keys(rendered).length === 0) {
        findings.push(finding("EV.VARIANT-PARITY", SEV.BLOCKER, `${slug}: variant-contract.json present but no per-cell rendered measurements in states/states.json — run \`node scripts/capture-variant-parity.mjs ${slug}\` then re-record.`, here("states/states.json")));
      } else {
        const { cells } = deriveExpectations(figmaDump);
        const expected = resolveExpected(cells, contract);
        const problems = checkParity(expected, rendered, { iconFillThreshold: contract.iconFillThreshold });
        for (const p of problems) {
          findings.push(finding("EV.VARIANT-PARITY", SEV.BLOCKER, `${slug}: cell "${p.stateKey}" render ≠ Figma/contract — ${p.mismatches.join("; ")}.`, contractPath.replace(ROOT + path.sep, "").replace(/\\/g, "/")));
        }
        // integrity: a bgDeviation is only legitimate if raw Figma actually differs from the intended bg —
        // otherwise it's a spurious override masking nothing (or drifting the contract off Figma silently).
        for (const dev of contract.bgDeviations ?? []) {
          for (const cellKey of dev.cells ?? []) {
            const raw = cells.find((c) => c.stateKey === cellKey);
            if (raw && normHex(raw.bgHex) === normHex(dev.bg)) {
              findings.push(finding("EV.VARIANT-PARITY", SEV.HIGH, `${slug}: bgDeviation for "${cellKey}" is spurious — raw Figma bg already equals ${dev.bg}. Remove it.`, here("variant-contract.json")));
            }
          }
        }
      }
    } catch (e) {
      findings.push(finding("EV.VARIANT-PARITY", SEV.BLOCKER, `${slug}: variant-parity check could not run (${e.message}). Re-capture + re-record.`, here("variant-contract.json")));
    }
  }

  // 5. Independent signature (mechanism C, doer != checker). A real bundle must be
  //    signed by a checker holding EVIDENCE_CHECK_TOKEN. Presence + digest-binding are
  //    checked everywhere; the HMAC itself is verified wherever the token is available
  //    (the CI authority) — a doer without the token cannot forge a valid signature.
  const sig = loadSignature(slug);
  const digest = bundleDigest(manifest);
  if (!sig) {
    findings.push(finding("EV.UNSIGNED", SEV.BLOCKER, `${slug}: no independent signature. A checker holding EVIDENCE_CHECK_TOKEN must \`evidence:sign ${slug}\` (doer ≠ checker).`, here("signature.json")));
  } else if (sig.digest !== digest) {
    findings.push(finding("EV.SIGNATURE-STALE", SEV.BLOCKER, `${slug}: signature is over a different bundle state (the bundle changed after signing). Re-review and re-sign.`, here("signature.json")));
  } else if (checkToken && hmac(checkToken, digest) !== sig.sig) {
    findings.push(finding("EV.BAD-SIGNATURE", SEV.BLOCKER, `${slug}: signature does not verify against EVIDENCE_CHECK_TOKEN — forged or wrong key.`, here("signature.json")));
  }
}

if (triggered.size === 0 && findings.length === 0) {
  console.log(`[evidence-audit] PASS — no evidence-gated changes in ${label}.`);
  process.exit(0);
}

console.log(`[evidence-audit] scope: ${label} — ${triggered.size} component(s): ${[...triggered.keys()].sort().join(", ") || "(none)"}`);
const { exitCode } = writeAuditResult("evidence-audit", findings);
process.exit(exitCode);
