// Figma capture — the un-fakeable half of mechanism A.
//
// Reads the slug's spec for { fileKey, exportNode }, then fetches the node JSON and
// a rendered PNG DIRECTLY from the Figma REST API using FIGMA_API_KEY. Because the
// SCRIPT fetches (not the agent), figma.json/figma.png cannot be hand-substituted
// with a wrong-node or junk artifact: the node id is read from the spec and the
// fetched JSON is asserted to contain exactly that node. See docs/evidence/README.md.
//
// Usage:
//   FIGMA_API_KEY=... node scripts/evidence-capture-figma.js <slug> [--node <id>] [--file <key>]

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";
import { evidenceDirFor, readSpecFigma, readSpecStateNodes, validatePng, slugFor, sourcesForSlug } from "./lib/evidence.js";
import { buildDivergenceReport } from "./lib/token-divergence.js";

const args = process.argv.slice(2);
const slug = slugFor(args.find((a) => !a.startsWith("--")) ?? "");
const nodeArg = args.includes("--node") ? args[args.indexOf("--node") + 1] : undefined;
const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : undefined;
// R1 (LESSONS L28): --resolve-only is the SCOUT preflight — resolve the bound node against Figma and
// exit WITHOUT capturing/writing anything, so a stale binding fails fast at scout (one API call) instead
// of detonating mid-capture ~250k tokens later. Also surfaces R3 (under-bound multi-state kind:frame).
const resolveOnly = args.includes("--resolve-only");

const fail = (msg) => {
  console.error(`✗ evidence:capture:figma ${slug || "?"} — ${msg}`);
  process.exit(1);
};

if (!slug) fail("usage: node scripts/evidence-capture-figma.js <slug> [--node <id>] [--file <key>]");
const key = process.env.FIGMA_API_KEY;
if (!key) fail("FIGMA_API_KEY is not set — cannot fetch Figma.");

const spec = readSpecFigma(slug);
const fileKey = fileArg ?? spec?.fileKey;
const node = nodeArg ?? spec?.node;
if (!fileKey) fail(`no Figma fileKey (spec ${spec?.specRel ?? "missing"} has none; pass --file).`);
if (!node) fail(`no Figma node (spec has no figmaExportNode/thisNode; pass --node).`);

const dir = path.join(ROOT, evidenceDirFor(slug));
fs.mkdirSync(dir, { recursive: true });

const figmaGet = async (url) => {
  const r = await fetch(url, { headers: { "X-Figma-Token": key } });
  if (!r.ok) throw new Error(`Figma API ${r.status} for ${url}: ${(await r.text()).slice(0, 200)}`);
  return r;
};

try {
  // 1. Node JSON — the proof Figma was actually read, bound to the exact node.
  const nodesUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(node)}`;
  const nodesJson = await (await figmaGet(nodesUrl)).json();
  if (!nodesJson.nodes) fail(`Figma returned no document for node ${node} in file ${fileKey}.`);
  if (!nodesJson.nodes[node]?.document) fail(`STALE-NODE-BINDING: node ${node} resolves to null in file ${fileKey} (moved or deleted). The file fetched OK, so this is NOT an auth error — the spec's figma.thisNode/assembledNode/verify.figmaExportNode must be re-bound (owner/scout), not fixed by the builder.`);

  // R1/R3 preflight (LESSONS L28/L29): primary node resolved OK above. Report nodeMap + under-bound
  // multi-state status, then EXIT without writing figma.json/png. `RESOLVE OK` (exit 0) tells the scout
  // to proceed; a null primary already failed with STALE-NODE-BINDING above (exit 1).
  if (resolveOnly) {
    const primaryDoc = nodesJson.nodes[node].document;
    console.log(`RESOLVE OK primary ${node} "${primaryDoc.name}" (${primaryDoc.type}) in ${fileKey}`);
    // R5 (LESSONS L30): for a COMPONENT_SET (or any node with >=1 COMPONENT child), print a per-variant
    // padding/width table so the scout (R2) and a human can resolve a spec's "(Figma literal)" / "Figma
    // <measure>" provenance annotation against the live node WITHOUT a full capture. Additive print only —
    // no disk write, no extra API call (walks the node already fetched for resolution).
    const variantChildren = (primaryDoc.children || []).filter((c) => c.type === "COMPONENT");
    if (primaryDoc.type === "COMPONENT_SET" || variantChildren.length >= 1) {
      for (const c of variantChildren) {
        const bb = c.absoluteBoundingBox || {};
        console.log(`VARIANT ${c.id} "${c.name}" w=${bb.width} h=${bb.height} padL=${c.paddingLeft} padR=${c.paddingRight} padT=${c.paddingTop} padB=${c.paddingBottom} itemSpacing=${c.itemSpacing} cornerRadius=${c.cornerRadius}`);
      }
    }
    // Resolve nodeMap subcomponent ids (advisory — a moved atom node is verified via its own bundle).
    const specBody = spec?.specRel && fs.existsSync(path.join(ROOT, spec.specRel))
      ? fs.readFileSync(path.join(ROOT, spec.specRel), "utf-8") : "";
    const mapIds = [...new Set([...specBody.matchAll(/nodeId:\s*["']?(\d+:\d+)["']?/g)].map((m) => m[1]))].filter((id) => id !== node);
    if (mapIds.length) {
      const mapJson = await (await figmaGet(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(mapIds.join(","))}`)).json();
      const stale = mapIds.filter((id) => !mapJson.nodes?.[id]?.document);
      if (stale.length) console.log(`  ⚠ nodeMap: ${stale.length}/${mapIds.length} subcomponent id(s) resolve to null (advisory): ${stale.join(", ")}`);
      else console.log(`  nodeMap ✓ all ${mapIds.length} subcomponent id(s) resolve`);
    }
    // R3 (LESSONS L29): a kind:frame with a >=2-entry states: block whose states carry NO per-state
    // nodeId cannot be cross-state-verified — only figmaExportNode gets captured. Surface it so the scout
    // reports ready:false (bind per-state nodeIds, or verify compositionally / advisory-exempt).
    const isFrame = /\bkind:\s*frame\b/.test(specBody);
    const stateNameCount = (specBody.match(/^\s*-\s*name:\s*/gm) || []).length;
    const boundStates = readSpecStateNodes(slug).states.length;
    if (isFrame && stateNameCount >= 2 && boundStates === 0) {
      console.log(`UNDER-BOUND-MULTISTATE: kind:frame with ${stateNameCount} states but 0 machine-bound per-state nodeIds — cross-state contract is unverifiable; bind per-state nodeIds or verify compositionally (advisory-exempt), do NOT pixel-seal cross-state values.`);
    }
    // No process.exit here — an explicit exit while an undici fetch socket is open aborts on Windows
    // (libuv assertion → nonzero). Fall through the else so the event loop drains and we exit 0 cleanly.
  } else {
  const figmaDump = { fileKey, node, fetchedNode: nodesJson.nodes[node] };
  fs.writeFileSync(path.join(dir, "figma.json"), JSON.stringify(figmaDump, null, 2) + "\n");
  const doc = nodesJson.nodes[node].document;
  console.log(`  figma.json  ✓ node ${node} "${doc.name}" (${doc.type})`);

  // 2. Rendered PNG — the visual ground truth, fetched by the script.
  const imgJson = await (await figmaGet(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(node)}&format=png&scale=2`)).json();
  const imgUrl = imgJson.images?.[node];
  if (!imgUrl) fail(`Figma returned no image URL for node ${node}.`);
  const pngBuf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
  const v = validatePng(pngBuf);
  if (!v.ok) fail(`rendered PNG failed validation: ${v.reason}`);
  fs.writeFileSync(path.join(dir, "figma.png"), pngBuf);
  console.log(`  figma.png   ✓ ${v.width}x${v.height}, ${(pngBuf.length / 1024).toFixed(1)}KB`);

  // 3. L16 divergent-key advisory — for a *dark (darkAtom-surface) slug ONLY.
  //    For every `tokens.<key>` alias in the spec, report the LIGHT hex, the DARK hex and the
  //    labeled hex; when LIGHT !== DARK the read-set (DARK) hex is authoritative. If the base
  //    component reads a hardcoded `atomSurface==='darkAtom' ? TOKENS_DARK` branch AND a
  //    referenced key diverges, mark divergentKeyWarning so no reviewer resolves against the
  //    labeled/LIGHT value by omission. This ONLY adds evidence — it changes no pass/fail gate.
  try {
    const specRel = spec?.specRel;
    const specBody = specRel && fs.existsSync(path.join(ROOT, specRel))
      ? fs.readFileSync(path.join(ROOT, specRel), "utf-8")
      : "";
    const isDarkAtom = /-?dark$/.test(slug)
      || /verify:[\s\S]*?storyId:\s*["']?[a-z0-9-]+--dark["']?/i.test(specBody)
      || /atomSurface\s*[:=]\s*["']?darkAtom/i.test(specBody);
    if (isDarkAtom && specBody) {
      const tsxRel = sourcesForSlug(slug).find((s) => s.endsWith(".tsx") && !s.endsWith(".stories.tsx"));
      const tsxBody = tsxRel && fs.existsSync(path.join(ROOT, tsxRel))
        ? fs.readFileSync(path.join(ROOT, tsxRel), "utf-8")
        : null;
      const report = buildDivergenceReport({ specBody, tsxBody });
      const divergent = report.aliases.filter((a) => a.diverges);
      const statesDir = path.join(dir, "states");
      fs.mkdirSync(statesDir, { recursive: true });
      fs.writeFileSync(
        path.join(statesDir, "token-resolution.json"),
        JSON.stringify({ slug, baseComponent: tsxRel ?? null, capturedAt: new Date().toISOString(), ...report }, null, 2) + "\n",
      );
      if (report.divergentKeyWarning) {
        console.log(`  ⚠ token-resolution ✓ ${divergent.length} DIVERGENT key(s) on read-set ${report.readSet}; reviewers MUST resolve against the DARK hex:`);
        for (const a of divergent) console.log(`      tokens.${a.key}: LIGHT ${a.lightHex} vs DARK ${a.darkHex}  (read-set/authoritative: ${a.darkHex})`);
      } else if (divergent.length) {
        console.log(`  token-resolution ✓ ${divergent.length} divergent key(s) noted (read-set ${report.readSet}) → states/token-resolution.json`);
      } else {
        console.log(`  token-resolution ✓ no LIGHT/DARK divergent keys among ${report.aliases.length} alias(es)`);
      }
    }
  } catch (e) {
    // Advisory only — never block the capture on the report.
    console.log(`  token-resolution — skipped (${e.message})`);
  }

  console.log(`✓ evidence:capture:figma ${slug} — Figma half captured to ${evidenceDirFor(slug)}/`);
  console.log(`  next: capture the story (storybook.png), write an independent verdict.md, then evidence:record ${slug} --node ${node}`);
  } // end !resolveOnly capture
} catch (e) {
  fail(e.message);
}
