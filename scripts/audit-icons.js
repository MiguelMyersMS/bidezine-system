// Icon audit — checks icon compliance and registry consistency.
import { SEV, finding, readSource, writeAuditResult } from "./lib/audit-core.js";

const findings = [];

const fluentSrc = readSource("src/icons/fluent.tsx");
const indexSrc = readSource("src/icons/index.ts");

// Parse exported icon names from index.ts (skip type-only exports)
const exportLines = indexSrc.split("\n").filter((l) => !/^\s*export\s+type\b/.test(l));
const exportedNames = [...exportLines.join("\n").matchAll(/\b(Icon\w+)/g)].map((m) => m[1]);
const uniqueExports = [...new Set(exportedNames)];

// Parse icon functions from fluent.tsx
const iconFunctions = [...fluentSrc.matchAll(/export\s+(?:const|function)\s+(Icon\w+)/g)].map((m) => m[1]);

// ── IC.WRONG-VIEWBOX: icons must have viewBox="0 0 20 20" (except IconLogo) ──
const iconBlocks = fluentSrc.split(/(?=export\s+(?:const|function)\s+Icon)/);
for (const block of iconBlocks) {
  const nameMatch = block.match(/export\s+(?:const|function)\s+(Icon\w+)/);
  if (!nameMatch) continue;
  const name = nameMatch[1];
  if (name === "IconLogo") continue; // custom logo has 32x32 viewBox

  const viewBoxes = [...block.matchAll(/viewBox="([^"]+)"/g)].map((m) => m[1]);
  for (const vb of viewBoxes) {
    if (vb !== "0 0 20 20") {
      findings.push(
        finding("IC.WRONG-VIEWBOX", SEV.HIGH, `${name} has viewBox="${vb}" — expected "0 0 20 20"`, "src/icons/fluent.tsx"),
      );
    }
  }
}

// ── IC.MISSING-FILLED: interactive icons should have filled prop ──
for (const block of iconBlocks) {
  const nameMatch = block.match(/export\s+(?:const|function)\s+(Icon\w+)/);
  if (!nameMatch) continue;
  const name = nameMatch[1];
  if (name === "IconLogo") continue;

  const hasFilled = /filled\s*[=?:]/.test(block);
  // Icons without filled are not interactive — report as MEDIUM (informational)
  if (!hasFilled) {
    findings.push(
      finding("IC.MISSING-FILLED", SEV.MEDIUM, `${name} has no filled prop — add if used interactively`, "src/icons/fluent.tsx"),
    );
  }
}

// ── IC.NOT-REGISTERED: exported icon not in registry ──
let registryNames = [];
try {
  const registry = JSON.parse(readSource("docs/registry/icons.json"));
  registryNames = registry.icons.map((i) => i.name);
} catch { /* registry missing — skip */ }

if (registryNames.length > 0) {
  for (const name of uniqueExports) {
    if (!registryNames.includes(name)) {
      findings.push(
        finding("IC.NOT-REGISTERED", SEV.MEDIUM, `${name} exported but not in icons.json registry`, "src/icons/index.ts"),
      );
    }
  }
  for (const name of registryNames) {
    if (!uniqueExports.includes(name)) {
      findings.push(
        finding("IC.STALE-REGISTRY", SEV.MEDIUM, `${name} in registry but not exported`, "docs/registry/icons.json"),
      );
    }
  }
}

// ── IC.NOT-EXPORTED: icon in fluent.tsx but not re-exported from index.ts ──
for (const name of iconFunctions) {
  if (!uniqueExports.includes(name)) {
    findings.push(
      finding("IC.NOT-EXPORTED", SEV.HIGH, `${name} defined in fluent.tsx but not exported from index.ts`, "src/icons/fluent.tsx"),
    );
  }
}

const { exitCode } = writeAuditResult("icon-audit", findings);
process.exit(exitCode);
