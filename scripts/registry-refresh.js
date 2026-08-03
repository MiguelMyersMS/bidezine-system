// Registry refresh — regenerate docs/registry/*.json from source files.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readSource, listFiles } from "./lib/audit-core.js";

const registryDir = path.join(ROOT, "docs/registry");
fs.mkdirSync(registryDir, { recursive: true });

// Human-readable role per TYPE token (kept here so the registry carries intent, not just numbers).
const TYPE_DESC = {
  displayXl: "Hero callout numbers",
  displayL: "Large display headings",
  displayL400: "Large display headings in regular weight",
  headingL: "Section headings",
  headingM: "Subsection headings",
  headingS: "Card/panel titles",
  bodyM: "Default body text — nav/list/input surfaces",
  bodyS: "Compact body text — menu/action rows",
  labelL: "Selected/active nav, select & rail-overflow rows",
  labelM: "Selected/active menu/action rows; buttons, pills, badges",
  numberL: "Large inline metric number — Inter Medium 28, tight line-height, tabular",
  caption: "Small labels, timestamps, footer metadata",
  captionStrong: "Small labels with stronger emphasis",
};

// Derive the DTCG typeScale straight from the TYPE block so it can never drift from tokens.ts.
// (Previously typeScale was a hand-authored block registry:refresh "preserved" — it silently
// went stale: missing labelL/labelM/caption and listing bodyM at the wrong size.)
function parseTypeScale(src) {
  // Resolve fontFamily variable names → the first declared font family.
  const fontVars = {};
  for (const m of src.matchAll(/const\s+(FONT_\w+)\s*=\s*"([^"]+)"/g)) {
    const first = m[2].match(/'([^']+)'/);
    fontVars[m[1]] = first ? first[1] : m[2].split(",")[0].trim();
  }
  const block = src.match(/export const TYPE\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (!block) return null;
  const scale = {};
  for (const line of block[1].split("\n")) {
    const lm = line.match(/^\s*(\w+):\s*\{(.*)\},?\s*$/);
    if (!lm) continue;
    const [, key, body] = lm;
    const size = body.match(/fontSize:\s*(\d+)/);
    if (!size) continue; // skip modifiers (strong/medium/light — no fontSize)
    const fam = body.match(/fontFamily:\s*(FONT_\w+)/);
    const weight = body.match(/fontWeight:\s*(\d+)/);
    const lh = body.match(/lineHeight:\s*([\d.]+)/);
    const ls = body.match(/letterSpacing:\s*(-?[\d.]+)/);
    const value = {
      fontFamily: fam ? fontVars[fam[1]] || "Inter" : "Inter",
      fontWeight: weight ? Number(weight[1]) : 400,
      fontSize: `${size[1]}px`,
    };
    if (lh) value.lineHeight = Number(lh[1]);
    if (ls && Number(ls[1]) !== 0) value.letterSpacing = `${ls[1]}px`;
    scale[key] = { $type: "typography", $value: value, $description: TYPE_DESC[key] || "" };
  }
  return scale;
}

// ── 1. tokens.json — count semantic tokens from TOKENS_LIGHT + derive typeScale from TYPE ──
function refreshTokens() {
  const src = readSource("src/tokens.ts");

  // Extract keys from TOKENS_LIGHT by finding property assignments
  const lightBlock = src.match(/export const TOKENS_LIGHT\s*=\s*\{([\s\S]*?)\n\};\s*\n/);
  let semanticKeys = [];
  if (lightBlock) {
    semanticKeys = [...lightBlock[1].matchAll(/^\s+(\w+)\s*:/gm)].map((m) => m[1]);
  }

  // Read existing tokens.json to preserve primitive + type sections
  const existingPath = path.join(registryDir, "tokens.json");
  let existing = {};
  if (fs.existsSync(existingPath)) {
    existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  }

  // Update semantic section
  if (!existing.semantic) existing.semantic = {};
  existing.semantic.totalSemanticTokens = semanticKeys.length;
  existing.semantic.keys = semanticKeys;

  // Regenerate typography.typeScale from TYPE (fontStack + modifiers + figma_parity stay manual).
  const typeScale = parseTypeScale(src);
  if (typeScale) {
    if (!existing.typography) existing.typography = {};
    existing.typography.typeScale = typeScale;
  }

  // Update meta
  existing._meta = {
    ...existing._meta,
    generated: new Date().toISOString().slice(0, 10),
    source: "src/tokens.ts",
  };

  fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2) + "\n");
  console.log(
    `[tokens.json] ${semanticKeys.length} semantic tokens, ${Object.keys(typeScale || {}).length} type-scale tokens`,
  );
}

// ── 2. icons.json — extract icon exports from source ──
function refreshIcons() {
  const fluentSrc = readSource("src/icons/fluent.tsx");
  const indexSrc = readSource("src/icons/index.ts");

  // Get exported names from index.ts
  const exportedNames = [...new Set([...indexSrc.matchAll(/\b(Icon\w+)/g)].map((m) => m[1]))];

  // Parse each icon block from fluent.tsx
  const iconBlocks = fluentSrc.split(/(?=export\s+(?:const|function)\s+Icon)/);
  const icons = [];

  for (const block of iconBlocks) {
    const nameMatch = block.match(/export\s+(?:const|function)\s+(Icon\w+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (!exportedNames.includes(name)) continue;

    const hasFilled = /filled\s*[=?:]/.test(block);
    const isLogo = name === "IconLogo";
    const source = isLogo ? "custom" : "fluent";
    const sizeTier = isLogo ? "nav" : "default";

    icons.push({
      name,
      source,
      hasFilled,
      sizeTier,
      note: isLogo ? "Brand logo — only custom icon allowed" : null,
    });
  }

  const existing = fs.existsSync(path.join(registryDir, "icons.json"))
    ? JSON.parse(fs.readFileSync(path.join(registryDir, "icons.json"), "utf-8"))
    : {};

  existing._meta = {
    ...existing._meta,
    generated: new Date().toISOString().slice(0, 10),
    source: "src/icons/fluent.tsx",
  };
  existing.icons = icons;
  existing.totalCount = icons.length;

  fs.writeFileSync(path.join(registryDir, "icons.json"), JSON.stringify(existing, null, 2) + "\n");
  console.log(`[icons.json] ${icons.length} icons`);
}

// ── 3. components.json — check gallery components + stories ──
// Internal / story-only helpers — NOT shipped public components, so they are NOT registered as public
// API here. Must stay in sync with STORY_ONLY_HELPERS in scripts/audit-components.js (the audit's
// componentNames excludes them; registering them would trip CP.STALE-REGISTRY).
const STORY_ONLY_HELPERS = ["SurfaceSpecCanvas.tsx", "MoleculeSpecHarness.tsx", "CompactTriggerShell.tsx"];
function refreshComponents() {
  const componentFiles = listFiles("src/gallery", ".tsx").filter(
    (f) => !f.endsWith(".stories.tsx") && !f.endsWith("index.ts") && !STORY_ONLY_HELPERS.some((h) => f.endsWith(h)),
  );
  const storyFiles = listFiles("src/gallery", ".stories.tsx");
  const storyMap = new Map(storyFiles.map((f) => [f.split("/").pop().replace(".stories.tsx", ""), f]));

  const existingPath = path.join(registryDir, "components.json");
  let existing = {};
  if (fs.existsSync(existingPath)) {
    existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  }
  const existingComponents = existing.components || [];

  const components = componentFiles.map((file) => {
    const name = file.split("/").pop().replace(".tsx", "");
    const storyFile = storyMap.get(name);
    const hasStory = !!storyFile;

    // Check for play functions in story
    let hasPlay = false;
    let hasKeyboard = false;
    if (storyFile) {
      const storySrc = readSource(storyFile);
      hasPlay = /\bplay\s*:/.test(storySrc);
      hasKeyboard = /userEvent\.keyboard|\.focus\(\)|{Enter}|{Tab}|{Escape}/.test(storySrc);
    }

    // Merge with existing registry entry to preserve manual fields
    const prev = existingComponents.find((c) => c.name === name) || {};
    return {
      ...prev,
      name,
      file,
      status: prev.status || "experimental",
      owner: prev.owner || "miguelmyers",
      storybook: hasStory ? `src/gallery/${name}.stories.tsx` : null,
      a11y_status: hasPlay ? (hasKeyboard ? "automated" : "partial") : prev.a11y_status || "untested",
      last_audit: new Date().toISOString().slice(0, 10),
    };
  });

  existing._meta = {
    ...existing._meta,
    generated: new Date().toISOString().slice(0, 10),
    source: "src/gallery/",
  };
  existing.components = components;
  existing.totalCount = components.length;

  fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2) + "\n");
  console.log(`[components.json] ${components.length} components`);
}

// ── 4. decisions.json — parse ADR markdown frontmatter ──
function refreshDecisions() {
  const decisionsDir = path.join(ROOT, "docs/decisions");
  if (!fs.existsSync(decisionsDir)) {
    console.log("[decisions.json] No docs/decisions/ directory");
    return;
  }

  const mdFiles = fs.readdirSync(decisionsDir).filter((f) => f.endsWith(".md") && f !== "README.md");
  const decisions = [];

  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(decisionsDir, file), "utf-8");

    // Parse metadata from YAML frontmatter (---\n...\n---) or bold-style (**Key:** Value)
    const meta = {};
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      for (const line of fmMatch[1].split(/\r?\n/)) {
        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        meta[key] = val;
      }
    } else {
      // Fallback: parse **Key:** Value lines (e.g. **Status:** Accepted)
      for (const m of content.matchAll(/\*\*(\w[\w\s]*?):\*\*\s*(.+)/g)) {
        meta[m[1].trim().toLowerCase()] = m[2].trim();
      }
      // Extract title from first heading if not in meta
      const h1 = content.match(/^#\s+(?:ADR-\d+:\s*)?(.+)/m);
      if (h1 && !meta.title) meta.title = h1[1].trim();
    }

    // Extract summary from first paragraph after ## Decision, ## Context, or ## Background
    let summary = "";
    const decisionMatch = content.match(/## (?:Decision|Context|Background)\r?\n\r?\n([\s\S]*?)(?=\r?\n##|\s*$)/);
    if (decisionMatch) {
      summary = decisionMatch[1].split(/\r?\n\r?\n/)[0].replace(/\r?\n/g, " ").slice(0, 200);
    }

    const id = file.match(/^(?:ADR-)?(\d+)/i)?.[1] || file;
    decisions.push({
      id,
      title: meta.title || file,
      status: (meta.status || "proposed").toLowerCase(),
      date: meta.date || "unknown",
      owner: meta.owner || meta["decision maker"] || "miguelmyers",
      file: `docs/decisions/${file}`,
      summary,
    });
  }

  const result = {
    _meta: {
      generated: new Date().toISOString().slice(0, 10),
      source: "docs/decisions/",
      description: "Index of architecture decision records. Generated from markdown ADRs in docs/decisions/. Regenerate via registry-refresh skill.",
    },
    decisions,
  };

  fs.writeFileSync(path.join(registryDir, "decisions.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(`[decisions.json] ${decisions.length} ADRs`);
}

// ── 5. animations.json — motion presets from src/motion.ts + anim-spec inventory ──
function refreshAnimations() {
  const motionSrc = readSource("src/motion.tsx");
  const statusSrc = readSource("src/status.ts");

  // Resolve MOTION token values from status.ts (number durations + string easings).
  const motionVals = {};
  const motionBlock = statusSrc.match(/export const MOTION\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (motionBlock) {
    for (const m of motionBlock[1].matchAll(/(\w+):\s*(?:(\d+)|"([^"]*)")/g)) {
      motionVals[m[1]] = m[2] !== undefined ? Number(m[2]) : m[3];
    }
  }

  // Parse TRANSITIONS presets from motion.ts.
  const presets = {};
  const tBlock = motionSrc.match(/export const TRANSITIONS\s*=\s*\{([\s\S]*?)\}\s*as const;/);
  if (tBlock) {
    for (const m of tBlock[1].matchAll(/(\w+):\s*\{\s*duration:\s*MOTION\.(\w+),\s*easing:\s*MOTION\.(\w+)\s*\}/g)) {
      const [, name, dTok, eTok] = m;
      presets[name] = {
        duration_token: `MOTION.${dTok}`,
        duration_ms: motionVals[dTok] ?? null,
        easing_token: `MOTION.${eTok}`,
        easing: motionVals[eTok] ?? null,
      };
    }
  }

  // Exported motion primitives (components — capitalised exported functions).
  const primitives = [...motionSrc.matchAll(/export function ([A-Z]\w+)/g)].map((m) => m[1]);

  // Inventory the animation specs.
  const animDir = path.join(ROOT, "docs/atomic/animations");
  let specs = [];
  if (fs.existsSync(animDir)) {
    specs = fs.readdirSync(animDir)
      .filter((f) => f.endsWith(".anim.spec.md") && !f.startsWith("_TEMPLATE"))
      .map((f) => f.replace(".anim.spec.md", ""));
  }

  const result = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    _meta: {
      generated: new Date().toISOString().slice(0, 10),
      source: "src/motion.ts + src/status.ts (MOTION) + docs/atomic/animations/",
      description: "Inventory of motion presets, primitives, and animation specs. Generated — source of truth is src/motion.ts and the *.anim.spec.md files.",
    },
    presets,
    primitives,
    specs,
  };

  fs.writeFileSync(path.join(registryDir, "animations.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(`[animations.json] ${Object.keys(presets).length} presets, ${primitives.length} primitive(s), ${specs.length} spec(s)`);
}

// ── Run all ──
console.log("Registry refresh\n");
refreshTokens();
refreshIcons();
refreshComponents();
refreshDecisions();
refreshAnimations();
console.log("\nDone.");
