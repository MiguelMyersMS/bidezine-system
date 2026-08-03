// Divergent-key alias resolver — the mechanical half of L16.
//
// L16: a token KEY whose LIGHT and DARK values DIVERGE, read on a component's hardcoded
// `atomSurface === 'darkAtom' ? TOKENS_DARK` branch, resolves to the wrong shade — and a
// reviewer who resolves the alias against the labeled / LIGHT value passes a false
// resolution (e.g. `tokens.onDarkFaint` = onDark40 on LIGHT but slateDark8 #5a6169 on DARK).
//
// This module reads src/tokens.ts STATICALLY (no TS build) and, for a *dark slug, reports —
// for every `tokens.<key>` alias its spec references — the LIGHT hex, the DARK hex, and (when
// they diverge) the read-set (DARK) hex, so every reviewer sees the value the component
// actually paints. It ADDS information only; it changes no pass/fail gate.
//
// Reuses the src/tokens.ts static-parse pattern established in scripts/registry-refresh.js and
// the alias-resolution shape of scripts/lib/token-graph.js.

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./audit-core.js";

const TOKENS_SRC = path.join(ROOT, "src/tokens.ts");

// Parse `export const NAME = { key: "value" | PALETTE.ref, ... };` into a { key: rawValue } map.
// rawValue is the trimmed RHS text (a string literal or a `PALETTE.<name>` reference).
function parseObjectBlock(src, name) {
  const re = new RegExp(`export const ${name}\\b[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`, "m");
  const block = src.match(re);
  const out = {};
  if (!block) return out;
  // One property per line: `key: <value>,  // comment`. Capture the RHS to EOL, then strip a
  // trailing line comment and a trailing comma. NB: we must NOT split on the first comma —
  // string values like "rgba(255,255,255,0.4)" contain commas.
  for (const line of block[1].split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const key = m[1];
    if (key.startsWith("$")) continue;
    let val = m[2].replace(/\/\/.*$/, "").trim();   // drop trailing line comment
    val = val.replace(/,\s*$/, "").trim();          // drop trailing comma
    if (!val) continue;
    out[key] = val;
  }
  return out;
}

// Resolve a TokenSet raw value (a `"literal"` or `PALETTE.<name>`) to its terminal hex/rgba string.
function resolveValue(raw, palette) {
  if (raw == null) return null;
  const strLit = raw.match(/^["'](.*)["']$/);
  if (strLit) return strLit[1];
  const pal = raw.match(/^PALETTE\s*\.\s*([A-Za-z0-9_]+)$/);
  if (pal) {
    const p = palette[pal[1]];
    if (p == null) return null;
    const pStr = p.match(/^["'](.*)["']$/);
    return pStr ? pStr[1] : p; // PALETTE entries are all literals
  }
  return raw; // unknown shape — return as-is (advisory only)
}

// Load PALETTE + TOKENS_LIGHT + TOKENS_DARK from src/tokens.ts as resolved-hex maps.
// Returns { light: {key: hex}, dark: {key: hex} } (or nulls if tokens.ts is missing).
export function loadResolvedTokenSets() {
  if (!fs.existsSync(TOKENS_SRC)) return { light: {}, dark: {} };
  const src = fs.readFileSync(TOKENS_SRC, "utf-8");
  const palette = parseObjectBlock(src, "PALETTE");
  const lightRaw = parseObjectBlock(src, "TOKENS_LIGHT");
  const darkRaw = parseObjectBlock(src, "TOKENS_DARK");
  const resolve = (rawMap) => {
    const out = {};
    for (const [k, v] of Object.entries(rawMap)) out[k] = resolveValue(v, palette);
    return out;
  };
  return { light: resolve(lightRaw), dark: resolve(darkRaw) };
}

// Pull every `tokens.<key>` alias referenced in a spec body (states[].background, tokenMap[], …).
// Returns a de-duplicated array of key names.
export function specTokenKeys(specBody) {
  const keys = new Set();
  for (const m of String(specBody).matchAll(/tokens\.([A-Za-z0-9_]+)/g)) keys.add(m[1]);
  return [...keys];
}

// Static scan for the L16 decorator-bypass anti-pattern in a base component .tsx:
// a hardcoded `atomSurface === 'darkAtom' ? TOKENS_DARK` branch that reads dark tokens
// DIRECTLY, bypassing the .storybook/preview.tsx `useDarkAtomTokens` surface-aware remap.
// Returns true if present.
export function readsHardcodedDarkSet(tsxBody) {
  const body = String(tsxBody);
  const importsDark = /import\s*\{[^}]*\bTOKENS_DARK\b[^}]*\}\s*from/.test(body);
  const branchesOnDark = /atomSurface\s*===\s*["']darkAtom["']\s*\?\s*TOKENS_DARK/.test(body);
  return importsDark && branchesOnDark;
}

// The L16 report for a *dark slug. For each spec `tokens.<key>` alias, record the LIGHT hex,
// the DARK hex and the labeled hex; when LIGHT !== DARK mark `diverges:true`. If the base
// component reads a hardcoded TOKENS_DARK branch AND any referenced key diverges, set
// readSet='TOKENS_DARK' and divergentKeyWarning=true so reviewers see the read-set hex
// (e.g. darkHex #5a6169) beside the labeled/Figma hex. Advisory only — no gate change.
//
// tsxBody may be null (no base .tsx found); then the bypass scan is skipped.
export function buildDivergenceReport({ specBody, tsxBody = null }) {
  const { light, dark } = loadResolvedTokenSets();
  const keys = specTokenKeys(specBody);
  const hardcodedDark = tsxBody ? readsHardcodedDarkSet(tsxBody) : false;

  const aliases = keys.map((key) => {
    const lightHex = key in light ? light[key] : null;
    const darkHex = key in dark ? dark[key] : null;
    const diverges = lightHex != null && darkHex != null && lightHex !== darkHex;
    return { key, lightHex, darkHex, labeledHex: lightHex, diverges };
  });

  const anyDivergent = aliases.some((a) => a.diverges);
  const readSet = hardcodedDark ? "TOKENS_DARK" : "decorator-remapped";
  const divergentKeyWarning = hardcodedDark && anyDivergent;

  return {
    surface: "darkAtom",
    readSet,
    hardcodedDarkBranch: hardcodedDark,
    divergentKeyWarning,
    note:
      "L16 divergent-key advisory: for a hardcoded `atomSurface==='darkAtom' ? TOKENS_DARK` branch, " +
      "resolve each `tokens.<key>` alias against the DARK set (readSet). Where LIGHT !== DARK the read-set " +
      "(dark) hex is authoritative — the labeled/LIGHT hex is NOT. Advisory only; changes no pass/fail gate.",
    aliases,
  };
}
