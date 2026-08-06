// NavIndentLine — atom for the vertical nesting line in sidebar navigation rows.
//
// ── Figma spec ───────────────────────────────────────────────────────────────
// File: EyYETHXMDDURPGK4PXTU5C  Node: 207-3584
// https://www.figma.com/design/EyYETHXMDDURPGK4PXTU5C/Single-shape?node-id=207-3584
//
// Component set: Atom.NavIndentLine
// Two variants:
//   weight=hairline  (node 207-3583) → 0.5 px line
//   weight=standard  (node 207-3585) → 1 px line
//
// Each variant is an 18 px wide × fill-height container that centers the line.
// Fill color for both: #D9D9E0 = tokens.hairline.
//
// ── IMPORTANT — Figma bleed guides (IGNORE IN CODE) ─────────────────────────
// Both rectangle nodes carry a top+bottom stroke (`strokeWeight: 10px 0px`,
// color #D9D9E0). These strokes ARE NOT part of the design — they are a
// workaround added by the designer to visually approximate the bleed behavior
// inside Figma, which cannot natively represent negative-margin overflow.
//
// Rule: when extracting NavIndentLine from Figma, IGNORE all strokes on the
// inner Rectangle nodes. Only the fill (line body) and the container width
// (18 px) are canonical. The stroke values will vary as the designer adjusts
// the guide for different row heights and must never be translated to code.
//
// ── Placement (row molecule) ─────────────────────────────────────────────────
// Drop NavIndentLine as the leftmost flex child of each nested row. The 18 px
// slot aligns to the same reservation used by the parent-level icon, placing
// the line at the icon's horizontal center.
//
// ── Continuity across stacked rows ──────────────────────────────────────────
// Figma shows a single fill-height segment per row. In code, each segment must
// extend through the row's padding and the gap between rows so stacked
// segments appear as one unbroken vertical line. This is done with negative
// margins — a code-only behavior that Figma approximates with the stroke guides
// described above.
//
// Math (applied automatically from props):
//
//   marginTop:    -rowPadY              → bleed through top padding
//   marginBottom: -(rowPadY + rowGap)  → bleed through bottom padding + gap
//
// Each segment then spans from its row's top border-box edge to the next row's
// top border-box edge. The last row in a group sets isLast=true to suppress the
// downward bleed past the group boundary.
//
// The group container MUST set `overflow: hidden` to clip any residual bleed
// at the group boundaries.
//
// ── Reading Figma row molecules that include this atom ────────────────────────
// 1. Identify the row's vertical padding token → pass as `rowPadY`.
// 2. Identify the gap between sibling rows → pass as `rowGap`.
// 3. Wrap the group container with `overflow: hidden`.
// 4. Ignore all strokes on the NavIndentLine rectangles in Figma.
// The Figma frame never shows the bleed — it is always a code-only concern.

import React from "react";
import { useTokens } from "../theme";
import { SPACE } from "../layout";

/** Slot width matches the 18 px icon/indicator slot used across all nav surfaces. */
export const NAV_INDENT_LINE_SLOT = 18;

export type NavIndentLineWeight = "hairline" | "standard";

export interface NavIndentLineProps {
  /**
   * Visual weight of the line.
   * - `"hairline"` — 0.5 px (subtle, Figma variant `weight=hairline`)
   * - `"standard"` — 1 px (standard, Figma variant `weight=standard`)
   * @default "standard"
   */
  weight?: NavIndentLineWeight;
  /**
   * Vertical padding of the parent row (top and bottom). Used to compute the
   * bleed so the line escapes the row's padding and appears continuous across
   * stacked rows. Defaults to `SPACE[1]` (4 px) — the standard nav row padY.
   */
  rowPadY?: number;
  /**
   * Gap between sibling rows in the parent flex container. Added to `rowPadY`
   * for the bottom bleed so the line crosses the gap to the next row.
   * Defaults to `SPACE[1]` (4 px) — the standard RailNav row gap.
   */
  rowGap?: number;
  /**
   * Pass `true` on the last row of a group to suppress the bottom bleed past
   * the group boundary. The group container's `overflow: hidden` handles this
   * automatically, but `isLast` is provided for cases where overflow clipping
   * is not available.
   * @default false
   */
  isLast?: boolean;
}

export default function NavIndentLine({
  weight = "standard",
  rowPadY = SPACE[1],
  rowGap = SPACE[1],
  isLast = false,
}: NavIndentLineProps) {
  const tokens = useTokens();

  const isHairline = weight === "hairline";

  // Bleed: extend through the row's top/bottom padding and the inter-row gap
  // so adjacent segments appear as one unbroken line.
  const marginTop = -rowPadY;
  const marginBottom = isLast ? -rowPadY : -(rowPadY + rowGap);

  return (
    <div
      aria-hidden="true"
      style={{
        // Fixed 18 px slot — matches the icon/indicator slot reservation used
        // by Select (INDICATOR_SLOT = 18), ActionMenu (ROW_SLOT = 18), and the
        // List Row Geometry recipe. Centering the line within the slot aligns
        // it with the parent icon's horizontal center.
        width: NAV_INDENT_LINE_SLOT,
        flexShrink: 0,
        alignSelf: "stretch",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        // Vertical bleed — see module header for explanation.
        marginTop,
        marginBottom,
        pointerEvents: "none",
      }}
    >
      {/* 1px-wide line; the hairline is HALVED with a GPU transform (scaleX 0.5) rather than width:0.5px.
          A bare 0.5px CSS width rounds UP to 1px on non-retina displays (hairline == standard) and
          antialiases inconsistently; scaleX(0.5) composites a genuine sub-pixel line, always exactly half
          of weight=standard, matching Figma Atom.NavIndentLine (weight=hairline 0.5px vs standard 1px). */}
      <div
        style={{
          width: 1,
          background: tokens.hairline,
          borderRadius: 1,
          transform: isHairline ? "scaleX(0.5)" : undefined,
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

