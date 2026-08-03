// Token graph — registry traversal, alias resolution, cycle detection, DTCG validation.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./audit-core.js";

const REGISTRY_PATH = path.join(ROOT, "docs/registry/tokens.json");

/** DTCG reserved: names must not contain these characters. */
const DTCG_BAD_CHARS = /[.{}]/;

/** Top-level keys that are not token groups (metadata). */
const META_KEYS = new Set(["$schema", "_meta"]);

/** Keys within a group that are DTCG property keys, not child groups. */
const DTCG_PROPS = new Set(["$type", "$value", "$description", "$extensions"]);

/** Non-token metadata keys that appear in groups (skip during traversal). */
const NON_TOKEN_KEYS = new Set([
  "lightDarkParity", "totalSemanticTokens", "keys", "grid", "levels",
]);

// ── Load registry ──

export function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return null;
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
}

// ── Token tree traversal ──

/**
 * Walk a DTCG token tree. Returns a Map<path, token>.
 * A node is a token if it has both $type and $value.
 * path uses "/" separator, e.g. "primitive/color/slate/1".
 */
export function walkTokens(obj, prefix = "") {
  const tokens = new Map();
  if (!obj || typeof obj !== "object") return tokens;

  for (const [key, val] of Object.entries(obj)) {
    if (META_KEYS.has(key) || DTCG_PROPS.has(key) || NON_TOKEN_KEYS.has(key)) continue;
    if (typeof val !== "object" || val === null) continue;

    const tokenPath = prefix ? `${prefix}/${key}` : key;

    if ("$type" in val && "$value" in val) {
      // Leaf token
      tokens.set(tokenPath, val);
    } else {
      // Group — recurse
      for (const [subPath, subToken] of walkTokens(val, tokenPath)) {
        tokens.set(subPath, subToken);
      }
    }
  }
  return tokens;
}

// ── Alias parsing ──

/** Returns the referenced path if $value is an alias `{path/to/token}`, else null. */
export function parseAlias(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/^\{(.+)\}$/);
  return m ? m[1] : null;
}

// ── Alias resolution + cycle detection ──

/**
 * Resolve an alias chain to its terminal value.
 * Returns { resolved: string|object, chain: string[], cycle: boolean }.
 */
export function resolveAlias(startPath, tokenMap) {
  const chain = [startPath];
  const visited = new Set([startPath]);
  let current = startPath;

  while (true) {
    const token = tokenMap.get(current);
    if (!token) return { resolved: null, chain, cycle: false, missing: current };

    const alias = parseAlias(token.$value);
    if (!alias) return { resolved: token.$value, chain, cycle: false, missing: null };

    if (visited.has(alias)) {
      chain.push(alias);
      return { resolved: null, chain, cycle: true, missing: null };
    }

    visited.add(alias);
    chain.push(alias);
    current = alias;
  }
}

/**
 * Detect all circular references in the token map.
 * Returns array of { cycle: string[] } objects.
 */
export function detectCycles(tokenMap) {
  const cycles = [];
  const globalVisited = new Set();

  for (const [tokenPath, token] of tokenMap) {
    if (globalVisited.has(tokenPath)) continue;
    const alias = parseAlias(token.$value);
    if (!alias) { globalVisited.add(tokenPath); continue; }

    const result = resolveAlias(tokenPath, tokenMap);
    for (const p of result.chain) globalVisited.add(p);

    if (result.cycle) {
      cycles.push({ cycle: result.chain });
    }
  }
  return cycles;
}

// ── DTCG name validation ──

/**
 * Walk the raw JSON object and check group/token names for DTCG compliance.
 * Returns array of { path, name, reason } for violations.
 */
export function validateDtcgNames(obj, prefix = "") {
  const violations = [];
  if (!obj || typeof obj !== "object") return violations;

  for (const [key, val] of Object.entries(obj)) {
    if (META_KEYS.has(key) || DTCG_PROPS.has(key) || NON_TOKEN_KEYS.has(key)) continue;
    if (typeof val !== "object" || val === null) continue;

    const fullPath = prefix ? `${prefix}/${key}` : key;

    // Check name characters
    if (DTCG_BAD_CHARS.test(key)) {
      violations.push({ path: fullPath, name: key, reason: `contains reserved character (. { })` });
    }

    // Check $-prefixed group names ($ reserved for DTCG keywords)
    if (key.startsWith("$") && !DTCG_PROPS.has(key)) {
      violations.push({ path: fullPath, name: key, reason: `group name starts with $ (reserved for DTCG)` });
    }

    // Recurse into children
    if (!("$type" in val && "$value" in val)) {
      violations.push(...validateDtcgNames(val, fullPath));
    }
  }
  return violations;
}

// ── DTCG shape validation ──

/**
 * Check tokens for missing $type, $value, or $description.
 * Returns array of { path, missing: string[] }.
 */
export function validateDtcgShape(tokenMap) {
  const violations = [];
  for (const [tokenPath, token] of tokenMap) {
    const missing = [];
    if (!("$type" in token)) missing.push("$type");
    if (!("$value" in token)) missing.push("$value");
    if (!("$description" in token) || !token.$description) missing.push("$description");
    if (missing.length > 0) {
      violations.push({ path: tokenPath, missing });
    }
  }
  return violations;
}

// ── Token classification ──

/** Returns true if a token path is in the primitive layer. */
export function isPrimitive(tokenPath) {
  return tokenPath.startsWith("primitive/");
}

/** Returns true if a token path is in the semantic layer. */
export function isSemantic(tokenPath) {
  return tokenPath.startsWith("semantic/");
}

/**
 * Get the list of semantic token runtime keys (the keys array from tokens.json).
 * These are the property names used in useTokens() / TokenSet.
 */
export function getSemanticKeys(registry) {
  return registry?.semantic?.keys ?? [];
}

// ── Orphan detection ──

/**
 * Find semantic tokens that are not referenced in any source files.
 * Checks source text against the semantic keys array.
 * Returns array of { path, key } for unreferenced tokens,
 * after filtering out waived tokens.
 */
export function findOrphans(registry, tokenMap, sourceContents) {
  const keys = getSemanticKeys(registry);
  if (keys.length === 0) return [];

  // Combine all source content for fast search
  const allSource = sourceContents.join("\n");

  const orphans = [];
  for (const key of keys) {
    // Check if the key appears anywhere in source files
    if (allSource.includes(key)) continue;

    // Find the corresponding semantic token path
    const tokenPath = findSemanticPathForKey(key, registry);
    if (!tokenPath) continue;

    // Check for waiver
    const token = tokenMap.get(tokenPath);
    if (isWaived(token, "TK.ORPHAN-TOKEN")) continue;

    orphans.push({ path: tokenPath, key });
  }
  return orphans;
}

/** Map a runtime key back to its semantic token path (best effort). */
function findSemanticPathForKey(key, registry) {
  // Walk semantic tokens and match by convention
  const semantic = registry?.semantic;
  if (!semantic) return null;

  const tokenMap = walkTokens({ semantic }, "");
  for (const [path] of tokenMap) {
    const segments = path.split("/");
    const leaf = segments[segments.length - 1];
    if (leaf === key) return path;
  }
  return null;
}

/** Check if a token has a waiver for a specific check ID. */
export function isWaived(token, checkId) {
  if (!token?.$extensions?.miguel?.waive) return false;
  return token.$extensions.miguel.waive.includes(checkId);
}

// ── Primitive pattern detection (source scan) ──

/** Patterns that indicate primitive/raw color usage in source code. */
const PRIMITIVE_COLOR_PATTERNS = [
  // Radix color scale references (e.g., slate.12, iris.9, red.10)
  { pattern: /\b(slate|iris|red|amber|green|slateDark|irisDark|redDark|amberDark|greenDark)\s*[.[]\s*["']?\d{1,2}["']?\s*[\])]?/g, label: "Radix color reference" },
  // PALETTE direct references
  { pattern: /\bPALETTE\s*\./g, label: "Direct PALETTE reference" },
];

/**
 * Scan a line for primitive color bypass patterns.
 * Returns array of { match, label } for each hit.
 */
export function detectPrimitiveBypass(line) {
  const hits = [];
  // Skip imports and comments
  if (/^\s*(import|\/\/)/.test(line)) return hits;

  for (const { pattern, label } of PRIMITIVE_COLOR_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(line)) !== null) {
      hits.push({ match: m[0], label });
    }
  }
  return hits;
}
