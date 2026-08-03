// Variant-parity: derive the per-cell (size × state) Figma-EXPLICIT facts for a multi-variant atom
// straight from the captured evidence `figma.json` (the raw Figma REST dump), and compare them to the
// per-cell facts measured from OUR rendered Storybook component. This is the mechanical form of the
// AI-INTEGRITY-LEDGER Case 7 rule: the unit of verification for a multi-variant atom is EVERY size×state
// cell, checked against the node — never a one-size glance, never the code's own comments, never "a
// render was sealed" (the seal proves a picture exists, not that each cell is right).
//
// Two facts are derived + checked per cell (both are unambiguous in the node):
//   • bgHex   — the variant frame's solid background fill (null = transparent). Catches the Case 7
//               "disabled fills hard-coded a per-size swap" bug.
//   • iconTheme — whether the Slot.Icon instance is the Regular or Filled icon component. Catches the
//               Case 7 "disabledSelected icon rendered Regular, should be Filled" bug.
//
// Pure module: no I/O, no rendering. The caller passes parsed JSON in and gets structured facts out, so
// the gate (audit-evidence.js) can run it with no Storybook and no network.

/** {r,g,b} floats 0..1 → "#rrggbb" (lowercase). */
export function colorToHex(c) {
  const h = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** DFS a raw Figma node subtree for the first INSTANCE named "Slot.Icon" carrying a componentId. */
function findSlotIconComponentId(node) {
  if (!node || typeof node !== "object") return null;
  if (node.name === "Slot.Icon" && node.componentId) return node.componentId;
  for (const child of node.children || []) {
    const found = findSlotIconComponentId(child);
    if (found) return found;
  }
  return null;
}

/** "Size=16, Theme=Filled" → "filled"; "…Theme=Regular" → "regular"; else null. */
function iconThemeFromComponentName(name) {
  if (!name) return null;
  if (/Theme\s*=\s*Filled/i.test(name)) return "filled";
  if (/Theme\s*=\s*Regular/i.test(name)) return "regular";
  return null;
}

/**
 * Derive the expected per-cell facts from a captured evidence figma.json.
 * @returns {{ kind: "set"|"single"|"unknown", node: string|null, cells: Array<{
 *   state: string, size: string, stateKey: string, bgHex: string|null, iconTheme: "regular"|"filled"|null
 * }> }}
 */
export function deriveExpectations(figmaJson) {
  const fetched = figmaJson && figmaJson.fetchedNode;
  const doc = fetched && fetched.document;
  const components = (fetched && fetched.components) || {};
  const node = (figmaJson && figmaJson.node) || (doc && doc.id) || null;

  if (!doc) return { kind: "unknown", node, cells: [] };
  if (doc.type !== "COMPONENT_SET") return { kind: "single", node, cells: [] };

  const cells = [];
  for (const child of doc.children || []) {
    if (child.type !== "COMPONENT") continue;
    const state = (child.name.match(/state\s*=\s*([a-z0-9]+)/i)?.[1] || child.name || "").toLowerCase();
    const size = (child.name.match(/size\s*=\s*([a-z0-9]+)/i)?.[1] || "").toLowerCase();
    const stateKey = state + (size ? `-${size}` : "");

    // Background fill: first visible SOLID fill on the variant frame; absent ⇒ transparent.
    const solid = (child.fills || []).find((f) => f && f.type === "SOLID" && f.visible !== false && f.color);
    const bgHex = solid ? colorToHex(solid.color) : null;

    // Icon Regular vs Filled: resolve the Slot.Icon instance's component name.
    const iconCompId = findSlotIconComponentId(child);
    const iconTheme = iconCompId ? iconThemeFromComponentName(components[iconCompId]?.name) : null;

    cells.push({ state, size, stateKey, bgHex, iconTheme });
  }
  return { kind: "set", node, cells };
}

/** Normalize a hex/rgb string → "#rrggbb" lowercase, or null for transparent/none. */
export function normHex(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (!s || s === "transparent" || s === "none") return null;
  let m = s.match(/^#?([0-9a-f]{6})$/);
  if (m) return `#${m[1]}`;
  // rgb()/rgba() — treat fully-transparent as null, else pack to hex (ignore alpha channel value)
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/);
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    const h = (n) => Number(n).toString(16).padStart(2, "0");
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
  }
  return s;
}

/**
 * Compare one cell's expected (from Figma) vs actual (measured from our render).
 * `actual` = { bg: string|null (css color / hex / "transparent"), iconFilled: boolean|null }.
 * `opts.iconFillThreshold` splits the measured icon coverage ratio into regular|filled upstream, so
 * here `iconFilled` is already a boolean. Returns an array of mismatch strings (empty = cell matches).
 */
/**
 * Resolve the EXPECTED per-cell facts from the mechanical Figma derivation + the reviewed contract.
 *   • bg   — figma.json fill by default; overridden by a documented `bgDeviations` entry (owner ruling
 *            where raw Figma is a known authoring bug, e.g. the Button md/lg disabled↔disabledSelected swap).
 *   • icon — from the contract's `iconByState` (render-verified: the Figma `componentId` misreports icon
 *            fill, and PNG-contrast measurement is unreliable, so this fact is reviewed, not auto-derived).
 * @param {Array} figmaCells  output of deriveExpectations(figmaJson).cells
 * @param {object} contract   { iconByState:{[state]:"regular"|"filled"}, bgDeviations:[{cells,bg,reason}] }
 * @returns {Array<{stateKey,state,size,bg:string|null,icon:"regular"|"filled"|null,deviated:boolean,reason?:string}>}
 */
export function resolveExpected(figmaCells, contract) {
  const iconByState = contract.iconByState || {};
  const devByCell = new Map();
  for (const d of contract.bgDeviations || []) {
    for (const cell of d.cells || []) devByCell.set(cell, d);
  }
  return figmaCells.map((c) => {
    const dev = devByCell.get(c.stateKey);
    const bg = dev ? normHex(dev.bg) : normHex(c.bgHex);
    const icon = iconByState[c.state] ?? null;
    return { stateKey: c.stateKey, state: c.state, size: c.size, bg, icon, deviated: Boolean(dev), reason: dev?.reason };
  });
}

/**
 * Compare resolved expected cells to the rendered facts measured from OUR Storybook render.
 * @param {Array} expectedCells   resolveExpected() output
 * @param {object} renderedByKey  { [stateKey]: { bg:string, iconFill:number } }
 * @param {object} opts           { iconFillThreshold:number, bgHexTolerance?:number }
 * @returns {Array<{stateKey, mismatches:string[], deviated:boolean}>}  cells with a non-empty mismatch list
 */
export function checkParity(expectedCells, renderedByKey, opts = {}) {
  const threshold = opts.iconFillThreshold ?? 0.4;
  const results = [];
  for (const exp of expectedCells) {
    const r = renderedByKey[exp.stateKey];
    if (!r) {
      results.push({ stateKey: exp.stateKey, deviated: exp.deviated, mismatches: ["no rendered measurement for this cell"] });
      continue;
    }
    const iconFilled = typeof r.iconFill === "number" ? r.iconFill >= threshold : null;
    const mismatches = compareCell(
      { bgHex: exp.bg, iconTheme: exp.icon },
      { bg: r.bg, iconFilled },
      opts,
    );
    if (mismatches.length) results.push({ stateKey: exp.stateKey, deviated: exp.deviated, mismatches });
  }
  return results;
}

export function compareCell(expected, actual, opts = {}) {
  const mismatches = [];
  const bgTol = opts.bgHexTolerance ?? 0; // exact by default

  const expBg = normHex(expected.bgHex);
  const actBg = normHex(actual.bg);
  if (expBg !== actBg && !hexWithinTolerance(expBg, actBg, bgTol)) {
    mismatches.push(`bg: expected ${expBg ?? "transparent"}, rendered ${actBg ?? "transparent"}`);
  }

  if (expected.iconTheme === "filled" || expected.iconTheme === "regular") {
    const expFilled = expected.iconTheme === "filled";
    if (actual.iconFilled === null || actual.iconFilled === undefined) {
      mismatches.push(`icon: expected ${expected.iconTheme}, rendered UNMEASURED`);
    } else if (actual.iconFilled !== expFilled) {
      mismatches.push(`icon: expected ${expected.iconTheme}, rendered ${actual.iconFilled ? "filled" : "regular"}`);
    }
  }
  return mismatches;
}

function hexWithinTolerance(a, b, tol) {
  if (tol <= 0) return a === b;
  if (a === b) return true;
  if (!a || !b) return false;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
  return Math.abs(ar - br) <= tol && Math.abs(ag - bg) <= tol && Math.abs(ab - bb) <= tol;
}

