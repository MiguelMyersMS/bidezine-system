// Verdict template — emit the required checklist skeleton for a bundle so the
// independent checker fills in evidence and checks each box. `pass` is COMPUTED from
// this checklist (mechanism D), so an unchecked box, a missing id, or a TODO fails.
//
// Usage:  node scripts/evidence-verdict-init.js <slug>   (writes docs/evidence/<slug>/verdict.md if absent)

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";
import { evidenceDirFor, VERDICT_REQUIRED_IDS, slugFor } from "./lib/evidence.js";

const slug = slugFor(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "");
if (!slug) {
  console.error("usage: node scripts/evidence-verdict-init.js <slug>");
  process.exit(2);
}

const dir = path.join(ROOT, evidenceDirFor(slug));
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, "verdict.md");
if (fs.existsSync(out)) {
  console.error(`✗ ${evidenceDirFor(slug)}/verdict.md already exists — not overwriting.`);
  process.exit(1);
}

const rows = Object.entries(VERDICT_REQUIRED_IDS)
  .map(([id, desc]) => `- [ ] ${id} — ${desc}\n      evidence: `)
  .join("\n");

const body = `# ${slug} — independent verdict

Written by the CHECKER (not the doer). Compare figma.png against storybook.png and the
spec; cite concrete evidence per row; check a box ONLY when that dimension is verified.
\`pass\` is computed from this checklist — an unchecked box, a missing id, or any
unresolved-work marker on a checklist line makes it fail. The verdict has no free-text
pass; it is derived from the boxes below.

## Checklist
${rows}
`;

fs.writeFileSync(out, body);
console.log(`✓ wrote ${evidenceDirFor(slug)}/verdict.md — fill evidence, check each box, then evidence:record + evidence:sign.`);
