// Figma-sync verification for the Token Change Propagation Protocol.
// Reports the applied text style (name + fontSize/fontWeight) of every TEXT node under the
// given Figma node ids, so you can confirm changed surfaces match the documented typography
// tier — and FLAG any node still on the old style (a FIGMA-DESYNC finding).
//
// Usage:  FIGMA_API_KEY=... node scripts/figma-text-style-check.mjs <nodeId> [<nodeId> ...]
//   e.g.  node scripts/figma-text-style-check.mjs 207:3406 195:3231 139:3053
// fileKey defaults to the design Figma file; override with FIGMA_FILE_KEY.
const KEY = process.env.FIGMA_API_KEY;
const FILE = process.env.FIGMA_FILE_KEY || "EyYETHXMDDURPGK4PXTU5C";
const IDS = process.argv.slice(2);
if (!KEY) { console.error("Set FIGMA_API_KEY."); process.exit(2); }
if (IDS.length === 0) { console.error("Pass one or more Figma node ids."); process.exit(2); }

const url = `https://api.figma.com/v1/files/${FILE}/nodes?ids=${encodeURIComponent(IDS.join(","))}&depth=10`;
const res = await fetch(url, { headers: { "X-Figma-Token": KEY } });
const data = await res.json();
const styleNames = data.styles || {};

function walk(node, out) {
  if (node.type === "TEXT") {
    const sref = node.styles?.text;
    out.push({
      name: node.name, chars: (node.characters || "").slice(0, 18),
      size: node.style?.fontSize, weight: node.style?.fontWeight,
      style: sref ? (styleNames[sref]?.name || sref) : "(none)",
    });
  }
  (node.children || []).forEach((c) => walk(c, out));
}

for (const id of IDS) {
  const doc = data.nodes?.[id]?.document;
  console.log(`\n=== ${id} (${doc?.name ?? "NOT FOUND"}) — TEXT nodes ===`);
  if (!doc) continue;
  const out = [];
  walk(doc, out);
  const seen = new Set();
  for (const t of out) {
    const k = `${t.size}|${t.weight}|${t.style}|${t.name}`;
    if (seen.has(k)) continue; seen.add(k);
    console.log(`  ${t.size}px/${t.weight}  style="${t.style}"  name="${t.name}"  "${t.chars}"`);
  }
}
