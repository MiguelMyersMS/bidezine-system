// Design System — Status colors, elevation, z-index, motion, focus, disabled, input, form helpers.
// Import: import { statusColors, elevation, Z, MOTION, FOCUS, DISABLED, INPUT } from "@miguel/design-system/status"

import type React from "react";
import type { TokenSet } from "./tokens";

// ── Semantic status mapping ──
// Maps bucket names to token keys.
// Usage: `const c = statusColors("abnormal", tokens);`
export function statusColors(bucket: string, t: TokenSet) {
  switch (bucket) {
    case "abnormal":   return { solid: t.statusRed,   text: t.statusRedText,   subtle: t.statusRedSubtle   };
    case "borderline": return { solid: t.statusAmber,  text: t.statusAmberText, subtle: t.statusAmberSubtle };
    case "normal":
    default:           return { solid: t.statusGreen,  text: t.statusGreenText, subtle: t.statusGreenSubtle };
  }
}

// ── Elevation system (shadow composites) ──
// 5 levels: flat → overlay. Call with useTokens() result.
export function elevation(t: TokenSet) {
  return {
    flat:    `0 1px 0 ${t.shadowSubtle}`,
    low:     `0 1px 3px ${t.shadowLight}`,
    mid:     `0 2px 8px ${t.shadowMedium}`,
    high:    `0 4px 24px ${t.shadowStrong}, 0 1px 4px ${t.shadowSubtle}`,
    overlay: `0 8px 40px ${t.shadowStrong}, 0 2px 8px ${t.shadowLight}`,
  };
}

// ── Z-index layers ──
// Ordered low→high. STRUCTURAL nav (sticky, rail) sits below FLOATING layers
// (dropdown, overlay, modal, toast). Portaling a menu to <body> escapes an ancestor's
// DOM subtree but NOT the z-index race — a floating layer must ALSO out-rank structural
// nav to paint above it, so `dropdown` is deliberately > `rail` (fixes menus rendering
// behind the side rail / sticky bands — 2026-07-23).
export const Z = {
  base:     1,
  sticky:   20,   // page sticky headers / slicer bands
  rail:     30,   // side nav rail: above the sticky band so its elevation shadow is never truncated
  dropdown: 40,   // portaled menus / selects / popovers — ABOVE structural nav (was 10, below rail)
  overlay:  50,   // scrims / backdrops
  modal:    100,  // dialogs
  toast:    200,
} as const;

// ── Motion tokens ──
export const MOTION = {
  // Durations (ms)
  fast:    120,
  base:    150,
  medium:  200,
  slow:    350,
  reveal:  700,

  // Easing
  ease:       "ease",
  easeOut:    "ease-out",
  expressive: "cubic-bezier(0.22,1,0.36,1)",
} as const;

// ── Focus / accessibility ──
export const FOCUS = {
  width: 2,
  offset: 2,
  style: (t: TokenSet): React.CSSProperties => ({
    outline: `2px solid ${t.accent}`,
    outlineOffset: 2,
  }),
} as const;

// Global <style> block — inject once at app root to set :focus-visible defaults
export const FOCUS_GLOBAL_CSS = (t: TokenSet, darkAccent: string) => `
  *:focus { outline: none; }
  *:focus-visible {
    outline: 2px solid ${t.accent};
    outline-offset: 2px;
  }
  [data-dark-surface] *:focus-visible,
  [data-dark-surface]:focus-visible {
    outline-color: ${darkAccent};
  }
`;

// ── Disabled / loading state tokens ──
// Uses the explicit disabled semantic tokens (`textDisabled` from theme) so
// disabled UI reads as unavailable via color, not CSS opacity. The legacy
// `opacity` constant is retained for non-text uses (e.g., decorative overlays).
export const DISABLED = {
  opacity: 0.4,
  cursor: "not-allowed" as const,
  style: (t: TokenSet): React.CSSProperties => ({
    color: t.textDisabled,
    cursor: "not-allowed",
    pointerEvents: "none",
  }),
} as const;

// ── Form control constants ──
export const INPUT = {
  height:   36,
  heightSm: 32,
  paddingX: 12,
  paddingY: 8,
  radius:   8,
} as const;

// ── Select geometry constants ──
// Single source of truth for Select-family dropdown trigger height, per the
// "Dropdown Triggers" contract in AGENTS.md. Single, multi-summary, and
// multi-pills triggers MUST all read SELECT.triggerHeight. New trigger
// variants that need a different height require a new constant + explicit
// user authorization (e.g., `triggerHeightCompact`).
export const SELECT = {
  triggerHeight: 40,
  triggerPaddingX: 8,    // SelectTrigger/InputTrigger Region.Trigger horizontal padding — now uniform SPACE[2] (Figma 299:4077 / 590:3553, updated 2026-07-27; was 10)
  // SelectTriggerCompact (pill variant, Figma 577:2189) is an explicitly-authorized new
  // trigger branch per the Dropdown Triggers Hard Rule — it does NOT reuse triggerHeight.
  triggerHeightCompact: 48,  // SelectTriggerCompact Region.Trigger hug height = 6 + Region.Input(4+28+4=36) + 6
  triggerCompactPad: 6,      // SelectTriggerCompact Region.Trigger uniform padding — off the SPACE grid; never approximate to SPACE[1]/SPACE[2]
  pillPaddingX: 8,
  pillPaddingY: 2,
  searchPaddingX: INPUT.paddingX,
  searchPaddingY: 4,
} as const;

// ── Scroll Region Convention ──
// Standardized pattern for bounded scroll areas (menus, popovers, dialogs,
// panels, command palettes, or any container with capped height + scrollable
// content).  Two-layer structure:
//
//   Outer shell  — owns visual styling (bg, border, shadow, radius, padding).
//                  Sets `overflow: hidden`, `display: flex`, `flex-direction: column`.
//   Inner scroll — owns scrolling.  `overflow-y: auto`, `flex: 1`, `min-height: 0`.
//                  Uses `SCROLL.className` for thin themed scrollbar.
//                  Gets conditional `paddingRight: SPACE[2]` when scrollbar visible.
//
// Usage:
//   import { SCROLL } from "@miguel/design-system/status";
//
//   // 1. Inject <style>{SCROLL.css(tokens)}</style> once per component tree.
//   // 2. Apply `className={SCROLL.className}` to the inner scrollable div.
//   // 3. Use a ResizeObserver to detect scrollability:
//   //      scrollable = el.scrollHeight > el.clientHeight
//   //      style={{ paddingRight: scrollable ? SPACE[2] : 0 }}

/** CSS class name for the standard thin scrollbar. */
const DS_SCROLL_CLASS = "ds-scroll-region";

export const SCROLL = {
  /** Class name to apply to the inner scrollable container. */
  className: DS_SCROLL_CLASS,

  /** Generate scoped CSS for the scrollbar. Call with current token set. */
  css: (t: TokenSet): string => `
    .${DS_SCROLL_CLASS} {
      scrollbar-width: thin;
      scrollbar-color: ${t.hairline} transparent;
    }
    .${DS_SCROLL_CLASS}::-webkit-scrollbar {
      width: 4px;
    }
    .${DS_SCROLL_CLASS}::-webkit-scrollbar-track {
      background: transparent;
    }
    .${DS_SCROLL_CLASS}::-webkit-scrollbar-thumb {
      background: ${t.hairline};
      border-radius: 4px;
    }
    .${DS_SCROLL_CLASS}::-webkit-scrollbar-thumb:hover {
      background: ${t.borderStrong};
    }
  `,
} as const;
