// Generate dist-browser/API.md — a consumer-facing prop/type reference for the browser (window.DS) bundle.
//
// WHY (finding CD1.3): a browser-only consumer gets the bundle + manifest + consumption README, but NO
// prop-surface documentation — the spec is Figma anatomy and the behavior contract cites src/ line numbers,
// neither of which helps someone wiring `window.DS.RailNav`. This emits a plain props table per exported
// gallery component/type, extracted from the TS source (names, `?`/required, type text, and JSDoc).
//
// Freshness: this runs inside `npm run build:umd`, so API.md is regenerated with the bundle; any src change
// invalidates the bundle's sourceHash and `check:umd-fresh` fails until a rebuild (which regenerates this).
// Do not hand-edit dist-browser/API.md.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { ROOT } from "./lib/umd-source-hash.mjs";

const GALLERY = path.join(ROOT, "src", "gallery");

/** Read the JSDoc text attached to a node (first block), collapsed to one line. */
function jsdocText(node, sourceFile) {
  const docs = ts.getJSDocCommentsAndTags(node);
  for (const d of docs) {
    if (ts.isJSDoc(d) && d.comment) {
      const raw = typeof d.comment === "string" ? d.comment : d.comment.map((c) => c.text).join("");
      return raw.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();
    }
  }
  return "";
}

/** Extract exported `interface`/object-`type` declarations from a source file as {name, props[]}. */
function extractTypes(file) {
  const text = fs.readFileSync(file, "utf-8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = [];
  sf.forEachChild((node) => {
    const isExported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) return;
    let name, members;
    if (ts.isInterfaceDeclaration(node)) {
      name = node.name.text;
      members = node.members;
    } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      name = node.name.text;
      members = node.type.members;
    } else {
      return;
    }
    const props = [];
    for (const m of members) {
      if (!ts.isPropertySignature(m) || !m.name) continue;
      props.push({
        name: m.name.getText(sf),
        optional: !!m.questionToken,
        type: m.type ? m.type.getText(sf).replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|") : "unknown",
        doc: jsdocText(m, sf),
      });
    }
    if (props.length) out.push({ name, props });
  });
  return out;
}

const files = fs.readdirSync(GALLERY).filter((f) => /\.tsx?$/.test(f) && !/\.stories\.|\.test\./.test(f));
const all = [];
for (const f of files) all.push(...extractTypes(path.join(GALLERY, f)));
all.sort((a, b) => a.name.localeCompare(b.name));

const lines = [];
lines.push("# `window.DS` — component & type reference");
lines.push("");
lines.push("**Generated — do not hand-edit.** Regenerate with `npm run build:umd`. Extracted from the TypeScript");
lines.push("source of the gallery components (the same surface the raw-TS package exposes). Every name below is a");
lines.push("named export on `window.DS` (props types are TS-only; the *component* of the same name minus `Props`");
lines.push("is the runtime export). This is the browser consumer's API reference — the spec/behavior-contract");
lines.push("cover Figma anatomy and internal behavior, not the prop surface (finding CD1.3).");
lines.push("");
lines.push(`_${all.length} exported interfaces/types._`);
lines.push("");
for (const t of all) {
  lines.push(`## ${t.name}`);
  lines.push("");
  lines.push("| prop | required | type | description |");
  lines.push("|------|----------|------|-------------|");
  for (const p of t.props) {
    lines.push(`| \`${p.name}\` | ${p.optional ? "" : "✓"} | \`${p.type}\` | ${p.doc} |`);
  }
  lines.push("");
}

const outPath = path.join(ROOT, "dist-browser", "API.md");
fs.writeFileSync(outPath, lines.join("\n") + "\n");
console.log(`[gen-umd-api] wrote dist-browser/API.md (${all.length} types from ${files.length} files)`);
