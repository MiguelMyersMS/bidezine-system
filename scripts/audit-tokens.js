// Token audit — checks token compliance across gallery components and registry.
import { SEV, finding, readSource, listFiles, scanLines, writeAuditResult } from "./lib/audit-core.js";
import {
  loadRegistry,
  walkTokens,
  parseAlias,
  resolveAlias,
  detectCycles,
  validateDtcgNames,
  validateDtcgShape,
  findOrphans,
  detectPrimitiveBypass,
} from "./lib/token-graph.js";

const findings = [];

// ════════════════════════════════════════════════════════════
// PART 1: Registry token graph checks (docs/registry/tokens.json)
// ════════════════════════════════════════════════════════════

const registry = loadRegistry();
const REGISTRY_FILE = "docs/registry/tokens.json";

if (registry) {
  const tokenMap = walkTokens(registry);

  // ── TK.INVALID-REFERENCE: alias references a missing token ──
  for (const [tokenPath, token] of tokenMap) {
    const alias = parseAlias(token.$value);
    if (!alias) continue;
    if (!tokenMap.has(alias)) {
      findings.push(
        finding("TK.INVALID-REFERENCE", SEV.BLOCKER,
          `${tokenPath} references {${alias}}, but ${alias} does not exist`,
          REGISTRY_FILE, undefined, {
            evidence: `${tokenPath} references {${alias}}, but ${alias} does not exist.`,
            recommended_fix: `Create ${alias} or update the alias to an existing token.`,
          }),
      );
    }
  }

  // ── TK.CIRCULAR-REFERENCE: alias chain creates a cycle ──
  const cycles = detectCycles(tokenMap);
  for (const { cycle } of cycles) {
    const chain = cycle.join(" → ");
    findings.push(
      finding("TK.CIRCULAR-REFERENCE", SEV.BLOCKER,
        `Circular alias chain: ${chain}`,
        REGISTRY_FILE, undefined, {
          evidence: chain,
          recommended_fix: "Break the alias cycle by pointing one token to a primitive value.",
        }),
    );
  }

  // ── TK.NON-DTCG-NAME: name contains ".", "{", "}" or group starts with "$" ──
  const nameViolations = validateDtcgNames(registry);
  for (const { path: vPath, name, reason } of nameViolations) {
    findings.push(
      finding("TK.NON-DTCG-NAME", SEV.BLOCKER,
        `Token/group name "${name}" ${reason} (at ${vPath})`,
        REGISTRY_FILE, undefined, {
          evidence: `"${name}" at ${vPath}`,
          recommended_fix: "Rename to use only alphanumeric characters, hyphens, or underscores.",
        }),
    );
  }

  // ── TK.NON-DTCG-SHAPE: token missing $type or $value ──
  const shapeViolations = validateDtcgShape(tokenMap);
  for (const { path: vPath, missing } of shapeViolations) {
    // Missing $description is a separate, lower-severity check
    const structural = missing.filter((m) => m !== "$description");
    if (structural.length > 0) {
      findings.push(
        finding("TK.NON-DTCG-SHAPE", SEV.HIGH,
          `Token ${vPath} missing DTCG properties: ${structural.join(", ")}`,
          REGISTRY_FILE, undefined, {
            evidence: `${vPath} missing: ${structural.join(", ")}`,
            recommended_fix: `Add ${structural.join(" and ")} to token definition.`,
          }),
      );
    }
  }

  // ── TK.MISSING-DESCRIPTION: token has empty or missing $description ──
  for (const { path: vPath, missing } of shapeViolations) {
    if (missing.includes("$description")) {
      findings.push(
        finding("TK.MISSING-DESCRIPTION", SEV.MEDIUM,
          `Token ${vPath} has empty or missing $description`,
          REGISTRY_FILE, undefined, {
            evidence: vPath,
            recommended_fix: "Add a meaningful $description to the token.",
          }),
      );
    }
  }

  // ── TK.ORPHAN-TOKEN: semantic token not referenced in source/docs ──
  const sourceFiles = [
    ...listFiles("src/gallery", ".tsx").filter((f) => !f.endsWith(".stories.tsx") && !f.endsWith("index.ts")),
    ...listFiles("src/gallery", ".stories.tsx"),
    "src/theme.ts",
    "src/status.ts",
    "src/layout.ts",
    "src/tokens.ts",
    "src/index.ts",
  ];
  const sourceContents = sourceFiles.map((f) => readSource(f)).filter(Boolean);
  // Also include docs and Storybook content
  const docContent = readSource("docs/interaction-patterns.md");
  if (docContent) sourceContents.push(docContent);

  const orphans = findOrphans(registry, tokenMap, sourceContents);
  for (const { path: oPath, key } of orphans) {
    findings.push(
      finding("TK.ORPHAN-TOKEN", SEV.LOW,
        `Semantic token "${key}" (${oPath}) is not referenced in source or docs`,
        REGISTRY_FILE, undefined, {
          evidence: `"${key}" at ${oPath}`,
          recommended_fix: `Use the token in components, remove it, or add a $extensions.miguel.waive entry.`,
        }),
    );
  }
}

// ════════════════════════════════════════════════════════════
// PART 2: Source-level token usage checks
// ════════════════════════════════════════════════════════════

// Gallery component files (not stories, not index)
const galleryFiles = listFiles("src/gallery", ".tsx").filter(
  (f) => !f.endsWith(".stories.tsx") && !f.endsWith("index.ts"),
);

// Also check theme.ts, status.ts, layout.ts for PALETTE leaks
const infraFiles = ["src/theme.ts", "src/status.ts", "src/layout.ts"];

// ── TK.PALETTE-DIRECT: PALETTE referenced outside tokens.ts ──
for (const file of [...galleryFiles, ...infraFiles]) {
  scanLines(file, (line, lineNum, filePath) => {
    if (/\bPALETTE\b/.test(line)) {
      findings.push(
        finding("TK.PALETTE-DIRECT", SEV.BLOCKER, "Direct PALETTE reference — use useTokens() instead", filePath, lineNum),
      );
    }
  });
}

// ── TK.HARDCODED-COLOR: hex/rgb color literals in gallery ──
for (const file of galleryFiles) {
  scanLines(file, (line, lineNum, filePath) => {
    // Hex colors — but not in SVG path data or viewBox
    if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/viewBox|path d=|url\(/.test(line)) {
      const match = line.match(/#[0-9a-fA-F]{3,8}\b/);
      findings.push(
        finding("TK.HARDCODED-COLOR", SEV.HIGH, `Hardcoded color ${match[0]} — use token`, filePath, lineNum),
      );
    }
    // rgb/rgba — but not in imports
    if (/rgba?\s*\(/.test(line) && !/import/.test(line)) {
      findings.push(
        finding("TK.HARDCODED-COLOR", SEV.HIGH, "Hardcoded rgb/rgba color — use token", filePath, lineNum),
      );
    }
  });
}

// ── TK.CSS-OPACITY: opacity property used for text ──
for (const file of galleryFiles) {
  scanLines(file, (line, lineNum, filePath) => {
    if (/\bopacity\s*[:=]/.test(line)) {
      findings.push(
        finding("TK.CSS-OPACITY", SEV.HIGH, "CSS opacity property — use color alpha instead", filePath, lineNum),
      );
    }
  });
}

// ── TK.HARDCODED-FONT: fontFamily or fontSize hardcoded ──
for (const file of galleryFiles) {
  scanLines(file, (line, lineNum, filePath) => {
    if (/fontFamily\s*:/.test(line) && !/TYPE|FONT_FAMILY/.test(line)) {
      findings.push(
        finding("TK.HARDCODED-FONT", SEV.HIGH, "Hardcoded fontFamily — use TYPE token", filePath, lineNum),
      );
    }
    if (/fontSize\s*:\s*\d/.test(line) && !/TYPE/.test(line)) {
      findings.push(
        finding("TK.HARDCODED-FONT", SEV.HIGH, "Hardcoded fontSize — use TYPE token", filePath, lineNum),
      );
    }
  });
}

// ── TK.ALIAS-BYPASS: component uses primitive/raw color instead of semantic token ──
for (const file of galleryFiles) {
  scanLines(file, (line, lineNum, filePath) => {
    const hits = detectPrimitiveBypass(line);
    for (const { match, label } of hits) {
      findings.push(
        finding("TK.ALIAS-BYPASS", SEV.HIGH,
          `Component references ${match} directly instead of a semantic token`,
          filePath, lineNum, {
            evidence: `${label}: ${match}`,
            recommended_fix: "Use tokens.* from useTokens() or add a semantic/component token for this use case.",
          }),
      );
    }
  });
}

const { exitCode } = writeAuditResult("token-audit", findings);
process.exit(exitCode);
