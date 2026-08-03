// D4 acceptance red-team for the Example & Behavior Wave gate (docs/proposals/example-behavior-wave.md).
// Builds a VALID example fixture (must PASS), then applies each governor-named cheat one at a time and
// asserts scripts/audit-example.js catches it with the right blocker id. This is the durable regression
// guard: if the gate is ever weakened, a cheat goes MISSED here. MANUAL / not wired into health (it
// mutates docs/examples/_rt during the run, then cleans up). Run: node scripts/redteam-example-gate.mjs
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "_rt";
const DIR = path.join(ROOT, "docs/examples", SLUG);
const SPEC = path.join(ROOT, "docs/atomic/atom/_rt.spec.md");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

const basePngPath = ["docs/evidence/divider/storybook.png", "docs/evidence/button/storybook.png", "docs/evidence/badge/storybook.png"]
  .map((p) => path.join(ROOT, p)).find((p) => fs.existsSync(p));
if (!basePngPath) { console.log("SKIP: no base PNG available under docs/evidence/*/storybook.png"); process.exit(0); }
const basePng = fs.readFileSync(basePngPath);
const distinctPng = (tag) => Buffer.concat([basePng, Buffer.from(tag)]);

const rm = () => { fs.rmSync(DIR, { recursive: true, force: true }); fs.rmSync(SPEC, { force: true }); };
const w = (rel, buf) => { const f = path.join(DIR, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); };

function buildBase() {
  rm(); fs.mkdirSync(path.join(DIR, "views"), { recursive: true });
  w("docs-read.md", "```json\n" + JSON.stringify([{ file: "src/tokens.ts", symbol: "tokens.ink", value: "#1c2024" }]) + "\n```\n");
  const raw = Buffer.from(JSON.stringify({ node: "702:4035", document: { id: "702:4035", name: "Emoji" } }));
  w("figma-raw.json", raw);
  w("figma-layout.json", JSON.stringify({ fileKey: "EyYETHXMDDURPGK4PXTU5C", nodeId: "702:4035", capturedAt: "t", rawDumpSha256: sha(raw), surface: "atom", layout: { layoutMode: "row" }, icons: [{ slot: "opt", figmaIcon: "Emoji", dsIcon: "IconEmoji" }] }));
  w("figma-frame.png", distinctPng("frame"));
  w("story.tsx", `import { Button } from "../../../src/gallery/Button";\nimport { IconEmoji } from "../../../src/icons";\nconst c = tokens.ink;\nexport const X = () => <Button><IconEmoji/>{c}</Button>;\n`);
  w("component-manifest.json", JSON.stringify({ built_by: "builder1", story: "docs/examples/_rt/story.tsx", imports: ["Button"], slotTokens: { label: "tokens.ink" } }));
  const views = { "atom-light": "a", "atom-dark": "b", "darkAtom-light": "c", "darkAtom-dark": "d" };
  const stamps = {}, hashes = {};
  for (const [v, tag] of Object.entries(views)) { const p = distinctPng(tag); w(`views/${v}.png`, p); hashes[v] = sha(p); stamps[v] = { surface: v.startsWith("dark") ? "darkAtom" : "atom", theme: v.endsWith("dark") ? "dark" : "light", storyId: "x" }; }
  w("views/capture-stamps.json", JSON.stringify(stamps));
  w("contrast.json", JSON.stringify({ view: "darkAtom-dark", region: "sel", ratio: 5.2, pngSha256: hashes["darkAtom-dark"] }));
  w("comparison.md", "built_by: builder1\nreviewer: rev1\nadjudicator: adj1\n\n## Checklist\n- [x] figma-grounded — ok\n");
  w("comparison.sig.json", JSON.stringify({ digest: "d", sig: "s" }));
}
function gate() { try { return { pass: true, out: execSync(`node scripts/audit-example.js ${SLUG}`, { cwd: ROOT, encoding: "utf8" }) }; } catch (e) { return { pass: false, out: (e.stdout || "") + (e.stderr || "") }; } }

const results = [];
buildBase();
let r = gate();
results.push(["BASE (valid fixture)", r.pass ? "PASS ✓" : "FAIL ✗ (should pass!)"]);
const cheats = [
  ["fabricated docs-read value", () => w("docs-read.md", "```json\n" + JSON.stringify([{ file: "src/tokens.ts", symbol: "tokens.ink", value: "#FAKEHEXNOTINFILE" }]) + "\n```\n"), "EX.DOCS-READ-FABRICATED"],
  ["invented figma-layout (hash mismatch)", () => { const j = JSON.parse(fs.readFileSync(path.join(DIR, "figma-layout.json"))); j.rawDumpSha256 = "deadbeef"; w("figma-layout.json", JSON.stringify(j)); }, "EX.FIGMA-RAW-TAMPERED"],
  ["figma node mismatch", () => { const j = JSON.parse(fs.readFileSync(path.join(DIR, "figma-layout.json"))); j.nodeId = "999:999"; w("figma-layout.json", JSON.stringify(j)); }, "EX.FIGMA-NODE-MISMATCH"],
  ["wrong-but-real token (not in contract)", () => w("story.tsx", `import { Button } from "x";\nconst c = tokens.hoverBg;\nexport const X = () => <Button>{c}</Button>;\n`), "EX.TOKEN-UNGROUNDED"],
  ["hardcoded color literal", () => w("story.tsx", `import { Button } from "x";\nconst c = "#ff0000";\nexport const X = () => <Button>{c}</Button>;\n`), "EX.HARDCODED-COLOR"],
  ["stale/wrong icon (undeclared vs Figma) — Case 4", () => w("story.tsx", `import { Button } from "x";\nimport { IconFolderMultiple } from "y";\nconst c = tokens.ink;\nexport const X = () => <Button><IconFolderMultiple/>{c}</Button>;\n`), "EX.ICON-UNDECLARED"],
  ["MISLABELED icon (real figma name + wrong dsIcon) — Case 4 semantic", () => {
    const raw = Buffer.from(JSON.stringify({ node: "702:4035", document: { id: "702:4035", name: "Number Circle 1" } }));
    w("figma-raw.json", raw);
    const j = JSON.parse(fs.readFileSync(path.join(DIR, "figma-layout.json"))); j.rawDumpSha256 = sha(raw); j.icons = [{ slot: "num", figmaIcon: "Number Circle 1", dsIcon: "IconFolderMultiple" }]; w("figma-layout.json", JSON.stringify(j));
    w("story.tsx", `import { Button } from "x";\nimport { IconFolderMultiple } from "y";\nconst c = tokens.ink;\nexport const X = () => <Button><IconFolderMultiple/>{c}</Button>;\n`);
  }, "EX.ICON-NAME-MISMATCH"],
  ["interactive icon with no state-proof", () => { const j = JSON.parse(fs.readFileSync(path.join(DIR, "figma-layout.json"))); j.icons = [{ slot: "opt", figmaIcon: "Emoji", dsIcon: "IconEmoji", interactive: true }]; w("figma-layout.json", JSON.stringify(j)); }, "EX.ICON-STATE-UNPROVEN"],
  ["doc-variant with FAKE authorization (no such EX in spec)", () => { fs.writeFileSync(SPEC, "status: implemented\n"); w("example.json", JSON.stringify({ specVariants: [{ name: "loading", authorizedBy: "EX-FAKE-999", specPath: "docs/atomic/atom/_rt.spec.md", claims: [] }] })); }, "EX.DOCVARIANT-UNAUTHORIZED"],
  ["doc-variant with FABRICATED claim (not in spec)", () => { fs.writeFileSync(SPEC, "status: implemented\nEX-RT-001 authorizes the loading variant\n"); w("example.json", JSON.stringify({ specVariants: [{ name: "loading", authorizedBy: "EX-RT-001", specPath: "docs/atomic/atom/_rt.spec.md", claims: [{ value: "THIS CLAIM IS NOT PRESENT IN THE SPEC AT ALL" }] }] })); }, "EX.DOCVARIANT-CLAIM-FABRICATED"],
  ["doc-variant MISSING specPath (must fail-CLOSED, not crash)", () => { w("example.json", JSON.stringify({ specVariants: [{ name: "loading", authorizedBy: "EX-RT-001" }] })); }, "EX.DOCVARIANT-MALFORMED"],
  ["UNDECLARED raw stand-in element (the owner's hole)", () => w("story.tsx", `import { Button } from "x";\nimport { IconEmoji } from "y";\nconst c = tokens.ink;\nexport const X = () => <Button><IconEmoji/><div role="progressbar"/>{c}</Button>;\n`), "EX.RAW-STANDIN-ELEMENT"],
  ["declared variant but HAND-ROLLED (realizedBy not used in story)", () => { fs.writeFileSync(SPEC, "status: implemented\nEX-RT-001: spinner renders in its own container\n"); w("example.json", JSON.stringify({ specVariants: [{ name: "loading", authorizedBy: "EX-RT-001", specPath: "docs/atomic/atom/_rt.spec.md", realizedBy: { component: "Spinner", prop: "loading" }, claims: [{ value: "spinner renders in its own container" }] }] })); }, "EX.DOCVARIANT-UNREALIZED"],
  ["dead-import graft", () => { const m = JSON.parse(fs.readFileSync(path.join(DIR, "component-manifest.json"))); m.imports = ["Segmented"]; w("component-manifest.json", JSON.stringify(m)); }, "EX.GRAFT-IMPORT-UNUSED"],
  ["duplicate view PNGs", () => w("views/darkAtom-dark.png", fs.readFileSync(path.join(DIR, "views/atom-light.png"))), "EX.VIEWS-DUPLICATE"],
  ["contrast washout", () => { const j = JSON.parse(fs.readFileSync(path.join(DIR, "contrast.json"))); j.ratio = 1.9; w("contrast.json", JSON.stringify(j)); }, "EX.CONTRAST-FAIL"],
  ["doer == checker", () => w("comparison.md", "built_by: builder1\nreviewer: builder1\nadjudicator: adj1\n\n## Checklist\n- [x] ok — ok\n"), "EX.DOER-IS-CHECKER"],
  ["self-promote to verified (no owner stamp)", () => w("example.json", JSON.stringify({ status: "verified" })), "EX.OWNER-STAMP-MISSING"],
  ["behavior not owner-sourced", () => fs.writeFileSync(SPEC, 'status: implemented\nbehaviors:\n  - id: overflow\n    desc: "truncate"\n'), "EX.BEHAVIOR-UNSOURCED"],
];
for (const [name, mutate, expectId] of cheats) { buildBase(); mutate(); const g = gate(); results.push([name, g.out.includes(expectId) ? `CAUGHT ✓ (${expectId})` : `MISSED ✗ (expected ${expectId})`]); }
rm();

console.log("\n===== D4 RED-TEAM: audit-example.js vs each governor-named cheat =====\n");
for (const [name, verdict] of results) console.log(`  ${verdict.padEnd(34)} ${name}`);
const missed = results.filter(([, v]) => v.includes("✗")).length;
console.log(`\n${missed === 0 ? "✅ ALL CHEATS CAUGHT — gate acceptance PASS" : `❌ ${missed} miss(es) — gate NOT accepted`}`);
process.exit(missed === 0 ? 0 : 1);
