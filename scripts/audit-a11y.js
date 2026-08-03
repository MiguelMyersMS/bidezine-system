// A11y audit — checks accessibility evidence for gallery components.
import { SEV, finding, readSource, listFiles, writeAuditResult } from "./lib/audit-core.js";

const findings = [];

// Gallery component source files
const componentFiles = listFiles("src/gallery", ".tsx").filter(
  (f) => !f.endsWith(".stories.tsx") && !f.endsWith("index.ts"),
);

// Story files
const storyFiles = listFiles("src/gallery", ".stories.tsx");

// Load registry for interactive status checks
let registry;
try {
  registry = JSON.parse(readSource("docs/registry/components.json"));
} catch { /* skip */ }

// ── A11.NO-KEYBOARD: no keyboard interaction test (interactive components only) ──
for (const storyFile of storyFiles) {
  const content = readSource(storyFile);
  const componentName = storyFile.split("/").pop().replace(".stories.tsx", "");
  const entry = registry?.components?.find((c) => c.name === componentName);
  if (!entry?.interactive) continue;
  const hasKeyboard = /userEvent\.keyboard|\.focus\(\)|\.tab\(\)|{Enter}|{Tab}|{Escape}|{ArrowLeft}|{ArrowRight}/.test(content);
  if (!hasKeyboard) {
    findings.push(
      finding("A11.NO-KEYBOARD", SEV.HIGH, `${componentName} has no keyboard interaction tests`, storyFile),
    );
  }
}

// ── A11.BAD-NAME-ROLE-VALUE: custom interactive widgets without ARIA ──
// Native <button>/<a> with visible text are fine.
// Only flag non-native controls (div/span with onClick) that lack role.

for (const file of componentFiles) {
  const content = readSource(file);
  const name = file.split("/").pop().replace(".tsx", "");
  const entry = registry?.components?.find((c) => c.name === name);
  if (!entry?.interactive) continue;

  // Detect non-native interactive elements (div/span with onClick/onKeyDown)
  const openingTags = [...content.matchAll(/<(\w+)\s+([\s\S]*?)>/g)];
  const hasNonNativeHandler = openingTags.some(([, tag, attrs]) =>
    /onClick|onKeyDown|onKeyUp/.test(attrs) &&
    !["button", "a", "input", "select", "textarea", "label", "summary"].includes(tag),
  );

  if (hasNonNativeHandler && !/role\s*=/.test(content)) {
    findings.push(
      finding("A11.BAD-NAME-ROLE-VALUE", SEV.MEDIUM, `${name}: non-native interactive element without role`, file),
    );
  }
}

const { exitCode } = writeAuditResult("a11y-audit", findings);
process.exit(exitCode);
