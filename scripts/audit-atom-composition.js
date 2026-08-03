// Atom-composition audit — catches the recurring "hand-rolled icon button" shortcut:
// a molecule/organism that defines its OWN local <button> wrapper and feeds it a RAW
// Fluent icon (IconX from ../icons), instead of composing an icon-button ATOM
// (EllipsisButton, CommentButton, ChevronCarousel, …). A raw Fluent icon is a dumb
// SVG: hand-rolling one drops the atom's interaction states (hover→filled, hover/
// press/focus, focus ring) — the icon rule — yet still passes tsc + the other audits,
// so it only surfaces on human review. This gate fails the health check instead.
//
// Discriminator (keeps false positives ~0):
//   • A LEAF icon-button atom renders its <button> as the file's DEFAULT EXPORT root
//     (EllipsisButton, ChevronCarousel, SortTableIndicator, …) — legitimate, exempt.
//   • The shortcut is a LOCAL button-wrapper HELPER (a function/const that is NOT the
//     default export and renders a <button>) that receives/renders a raw icon as its
//     ICON-ONLY content. Labeled buttons and menu rows (icon + text) are NOT icon-only
//     and are left alone.
import { SEV, finding, readSource, listFiles, writeAuditResult } from "./lib/audit-core.js";

const findings = [];

// True when `inner` is just a raw Fluent icon (optionally inside plain spans) — no text
// label, no {children}/{label}, no composed component.
function isIconOnlyRaw(inner, rawIcons) {
  const iconUsed = rawIcons.find((ic) => new RegExp("<" + ic + "\\b").test(inner));
  if (!iconUsed) return null;
  if (/\{\s*(children|label)\b/.test(inner)) return null;
  // A non-icon Capitalized component inside ⇒ it's composing something, not a bare icon.
  if (/<[A-Z]\w+\b/.test(inner.replace(/<Icon\w+\b/g, ""))) return null;
  const residualText = inner
    .replace(/<[^>]*>/g, " ")      // strip tags
    .replace(/\{[^}]*\}/g, " ")    // strip JS expressions
    .replace(/\s+/g, " ")
    .trim();
  if (/[A-Za-z]/.test(residualText)) return null; // a visible label ⇒ not an icon-only button
  return iconUsed;
}

const files = listFiles("src/gallery", ".tsx")
  .filter((f) => !f.endsWith(".stories.tsx") && !f.endsWith(".spec.tsx"));

for (const rel of files) {
  const src = readSource(rel);
  if (!src) continue;

  const iconImport = src.match(/import\s*\{([^}]*)\}\s*from\s*["']\.\.\/icons["']/s);
  if (!iconImport) continue;
  const rawIcons = [...iconImport[1].matchAll(/\bIcon\w+/g)].map((m) => m[0]);
  if (rawIcons.length === 0) continue;

  // A leaf icon-button atom renders its own <button> and just re-exports the icon —
  // it has no local button-wrapper HELPER, so there is nothing to flag. The shortcut
  // is a composer that defines a local helper (NOT the default export, NOT imported)
  // and feeds it an icon-only raw icon. Require the file to actually hand-roll a
  // <button> so pure-layout wrappers are never implicated.
  if (!/<button\b/.test(src)) continue;

  const defaultExport = src.match(/export\s+default\s+function\s+(\w+)|export\s+default\s+(\w+)/);
  const defaultName = defaultExport ? (defaultExport[1] || defaultExport[2]) : null;
  const importedNames = new Set([...src.matchAll(/import\s+(\w+)\s+from/g)].map((m) => m[1]));

  // Local helper component names: Capitalized function/const decls that are neither the
  // file's default export nor an import (i.e. hand-rolled in this file).
  const localHelpers = [...new Set(
    [...src.matchAll(/(?:^|\n)\s*(?:function|const)\s+([A-Z]\w+)\b/g)].map((m) => m[1]),
  )].filter((n) => n !== defaultName && !importedNames.has(n));

  const flagged = new Set();
  for (const name of localHelpers) {
    // Usage: <Helper …>…icon-only raw icon…</Helper> — the icon is fed to a hand-rolled
    // button wrapper instead of composing an icon-button atom.
    for (const um of src.matchAll(new RegExp("<" + name + "\\b[^>]*>([\\s\\S]*?)<\\/" + name + "\\s*>", "g"))) {
      const hit = isIconOnlyRaw(um[1], rawIcons);
      if (hit) flagged.add(`${hit}|${name}`);
    }
  }

  for (const entry of flagged) {
    const [icon, wrapper] = entry.split("|");
    findings.push(
      finding(
        "AC.RAW-ICON-BUTTON",
        SEV.HIGH,
        `${rel.split("/").pop()} feeds a raw <${icon}/> to a hand-rolled button wrapper <${wrapper}> — compose an icon-button atom (EllipsisButton/CommentButton/ChevronCarousel/…) or create one; a raw Fluent icon carries no interaction states (icon-rule violation).`,
        rel,
      ),
    );
  }
}

const { exitCode } = writeAuditResult("atom-composition-audit", findings);
process.exit(exitCode);
