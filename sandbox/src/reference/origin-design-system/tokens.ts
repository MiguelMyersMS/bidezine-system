// Design System — Color palette and semantic tokens.
// Source of truth for all color values across projects.
// Components use useTokens() hook from ./theme.ts. Never reference PALETTE directly.

// ── Layer 1: Palette (Radix Colors — never import in components) ──
// Source: @radix-ui/colors (MIT) · https://www.radix-ui.com/colors
// Each step has a defined use case:
//   1-2: backgrounds  3-5: component bg  6-8: borders  9-10: solid  11-12: text
export const PALETTE = {
  // Slate Light
  slate1:  "#fcfcfd",
  slate2:  "#f9f9fb",
  slate3:  "#f0f0f3",
  slate4:  "#e8e8ec",
  slate5:  "#e0e1e6",
  slate6:  "#d9d9e0",
  slate7:  "#cdced6",
  slate8:  "#b9bbc6",
  slate9:  "#8b8d98",
  slate10: "#80838d",
  slate11: "#60646c",
  slate12: "#1c2024",

  // Slate Dark
  slateDark1:  "#111113",
  slateDark2:  "#18191b",
  slateDark3:  "#212225",
  slateDark4:  "#272a2d",
  slateDark5:  "#2e3135",
  slateDark6:  "#363a3f",
  slateDark7:  "#43484e",
  slateDark8:  "#5a6169",
  slateDark9:  "#696e77",
  slateDark10: "#777b84",
  slateDark11: "#b0b4ba",
  slateDark12: "#edeef0",

  // Indigo Light (Radix Indigo — accent blue)
  indigo3:  "#edeef9",
  indigo4:  "#e0e2f5",
  indigo9:  "#3e63dd",
  indigo10: "#3358d4",
  indigo11: "#3a5bc7",
  indigo12: "#1f2d5c",

  // Indigo Dark
  indigoDark3:  "#1f2768",
  indigoDark4:  "#252d72",
  indigoDark9:  "#3e63dd",
  indigoDark10: "#5472e4",
  indigoDark11: "#849dff",
  indigoDark12: "#d6e1ff",

  // Red Light
  red3:  "#feebec",
  red9:  "#e5484d",
  red11: "#ce2c31",

  // Red Dark
  redDark3:  "#3b1219",
  redDark9:  "#e5484d",
  redDark11: "#ff9592",

  // Amber Light
  amber3:  "#fff7c2",
  amber9:  "#ffc53d",
  amber11: "#ab6400",

  // Amber Dark
  amberDark3:  "#302008",
  amberDark9:  "#ffc53d",
  amberDark11: "#ffca16",

  // Green Light
  green3:  "#e6f6eb",
  green9:  "#30a46c",
  green11: "#218358",

  // Green Dark
  greenDark3:  "#132d21",
  greenDark9:  "#30a46c",
  greenDark11: "#3dd68c",

  // Pure
  white: "#ffffff",
  black: "#000000",

  // On-dark overlays
  onDark85:       "rgba(255,255,255,0.85)",
  onDark70:       "rgba(255,255,255,0.7)",
  onDark50:       "rgba(255,255,255,0.5)",
  onDark40:       "rgba(255,255,255,0.4)",
  onDark20:       "rgba(255,255,255,0.2)",
  onDark05:       "rgba(255,255,255,0.05)",
  slateDark65:    "#3e4348",
  darkHover:      "rgba(255,255,255,0.10)",
  darkActive:     "rgba(255,255,255,0.20)",
  darkPressed:    "rgba(255,255,255,0.15)",
  darkHairline:   "rgba(255,255,255,0.08)",
  darkBorder:     "rgba(255,255,255,0.12)",
  darkBorderHigh: "rgba(255,255,255,0.6)",

  // Shadows (slate12-based alpha)
  shadow4:        "rgba(28,32,36,0.04)",
  shadow6:        "rgba(28,32,36,0.06)",
  shadow8:        "rgba(28,32,36,0.08)",
  shadow10:       "rgba(28,32,36,0.10)",
  shadow14:       "rgba(28,32,36,0.14)",
  shadow16:       "rgba(28,32,36,0.16)",
  shadow18:       "rgba(28,32,36,0.18)",
  shadow25:       "rgba(28,32,36,0.25)",
} as const;

// ── Layer 2: Semantic tokens ──
export const TOKENS_LIGHT = {
  // ── Text ──
  ink:        PALETTE.slate12,
  textMuted:  PALETTE.slate11,
  textSubtle: PALETTE.slate9,
  // Disabled semantics — distinctly fainter than textSubtle so unavailable UI
  // reads as unavailable without using CSS opacity.
  textDisabled: PALETTE.slate8,
  iconDisabled: PALETTE.slate8,
  // `onDark` — foreground on a PERMANENTLY dark surface (the rail, dark overlays). Always white.
  onDark:     PALETTE.white,
  // `onInk` — foreground on the `ink` FILL, which INVERTS per mode (dark in light, light in dark).
  // So onInk inverts too: white here / near-black in dark. Use this (NOT onDark) for text/icons on
  // a filled `ink` surface (e.g. the selected NavRow), so it stays legible in both themes.
  onInk:      PALETTE.white,

  // ── Backgrounds ──
  bg:         PALETTE.slate3,
  bgSubtle:   PALETTE.slate2,
  surface:    PALETTE.white,
  hoverBg:    PALETTE.slate3,
  activeBg:   PALETTE.slate4,
  bgStrong:   PALETTE.slate5,
  // focusOverlay — focus-state background. On LIGHT it equals hoverBg (slate3), so the light render is
  // unchanged. The darkAtom decorator remaps focusOverlay -> darkActiveBg (onDark20 = 0.2), so on a dark
  // surface focus matches Figma's distinct focus fill (0.2), separate from hover (0.1). Surface-aware
  // "split dark-only" fix (owner 2026-07-03): button atoms use tokens.focusOverlay for focus bg.
  focusOverlay: PALETTE.slate3,
  // pressedOverlay — pressed-state background. LIGHT = bgStrong (slate5, unchanged). The darkAtom
  // decorator remaps it -> darkPressedBg (onDark15 = 0.15), matching Figma's pressed fill (distinct
  // from active/focus 0.2). Same surface-aware split as focusOverlay.
  pressedOverlay: PALETTE.slate5,
  segmentedTrack: PALETTE.slate5,

  // ── Borders ──
  hairline:     PALETTE.slate6,
  // faintMark — faint mark/thumb fill (scrollbar thumb+arrows, carousel rest-mark). LIGHT = hairline
  // (slate6, unchanged). The darkAtom decorator remaps it -> onDarkFaint (onDark40 = 0.4), matching
  // Figma's faint dark marks (distinct from hairline->onDarkDisabled 0.2). Surface-aware, like focusOverlay.
  faintMark:    PALETTE.slate6,
  border:       PALETTE.slate7,
  borderStrong: PALETTE.slate8,

  // ── Surface-aware dark-atom tokens (LIGHT value = what the component paints today, so the light
  //    render is unchanged; the darkAtom decorator remaps each to the Figma-exact dark value). ──
  onDarkFaintest:    PALETTE.onDark05,   // decorator target for faintFill (0.05); parallels onDarkFaint
  hoverInk:          PALETTE.slate12,    // hover icon/label; darkAtom -> onDarkHover (onDark85, 0.85)
  faintFill:         PALETTE.slate2,     // faintest state bg (disabled/off); darkAtom -> onDark05 (0.05)
  // TriggerButton hover/disabledSelected bg. Figma Atom.TriggerButton (579:2363) uses slate3 (hover) and
  // slate4 (disabledSelected) on LIGHT; Figma AtomDark.TriggerButton (663:3169) collapses BOTH to onDark05
  // (the dark palette is coarser — no distinct dark hover/active tier at 0.05). Surface-aware split like
  // focusOverlay: LIGHT value = the Figma-light grey; the darkAtom decorator remaps each -> onDarkFaintest
  // (onDark05). This is why they are NOT plain hoverBg/activeBg (those remap to onDark10 / onDark20).
  triggerHoverBg:            PALETTE.slate3,  // Figma-light hover #F0F0F3; darkAtom -> onDark05
  triggerDisabledSelectedBg: PALETTE.slate4,  // Figma-light disabledSelected #E8E8EC; darkAtom -> onDark05
  // ChevronCircleCarousel pill bg. Figma Atom.ChevronCircleCarousel (1268:4522) paints ONE white pill for
  // default/hover/focus on LIGHT, but Figma AtomDark.ChevronCircleCarousel (1294:4353) varies the fill per
  // state — 0.05 / 0.10 / 0.15 white. A single token cannot express both, and plain `surface` remaps to
  // darkSurface (opaque #1C2024), which renders a near-black pill on a near-black surface. Surface-aware
  // split, same shape as triggerHoverBg: LIGHT = the Figma-light white; darkAtom remaps each to its
  // Figma-dark alpha tier. Owner-approved 2026-07-31 (Figma-exact on both surfaces, no deviation).
  carouselPillBg:      PALETTE.white,   // rest;  darkAtom -> onDarkFaintest (onDark05, 0.05)
  carouselPillHoverBg: PALETTE.white,   // hover; darkAtom -> darkHoverBg    (onDark10, 0.10)
  carouselPillFocusBg: PALETTE.white,   // focus; darkAtom -> darkPressedBg  (onDark15, 0.15)
  // CalendarDay selected / in-month-range BAND. Figma Atom.CalendarDay (1259:5274) distinguishes the
  // selected/in-range band (slate4) from the out-of-month range band (slate3) on LIGHT; Figma
  // AtomDark.CalendarDay (1294:4382) collapses BOTH to onDark10 (0.10) — the coarser dark palette again.
  // Plain `activeBg` remaps to onDark20 (0.20), which over-inks the dark ribbon. Surface-aware split so
  // LIGHT keeps the slate4/slate3 distinction. Owner-approved 2026-07-31.
  calendarBandBg:            PALETTE.slate4,  // Figma-light selected/in-range band; darkAtom -> onDark10
  interactiveBorder: PALETTE.slate6,     // interactive stroke; LIGHT = hairline (slate6, unchanged); darkAtom -> onDarkSubtle (onDark50, 0.5)
  onSelected:        PALETTE.white,      // content on a selected fill; darkAtom -> ink (#1C2024) [inverts]
  dismissInk:        PALETTE.slate9,     // dismiss (✕) glyph; LIGHT = textSubtle (#8B8D98, unchanged);
                                          // darkAtom -> onDarkSubtle (onDark50, 0.5) — Figma dismiss wants 0.5,
                                          // distinct from the tag label which wants 0.7 (textSubtle->onDarkMuted)
  onSelectedMuted:   PALETTE.slate8,     // MUTED content on a selected/white fill (opaque grey #B9BBC6);
                                          // NOT decorator-remapped, so it stays opaque on the darkAtom white
                                          // pill where alpha-white greys would be invisible (togglebutton on-default icon)
  trendGood:         PALETTE.green9,     // favorable trend; darkAtom -> onDark (#FFF, monochrome)
  trendBad:          PALETTE.red9,       // unfavorable trend; darkAtom -> onDarkSubtle (0.5, monochrome)

  // ── Shadows ──
  shadowSubtle:  PALETTE.shadow4,
  shadowLight:   PALETTE.shadow6,
  shadowMedium:  PALETTE.shadow10,
  shadowStrong:  PALETTE.shadow14,
  shadowHeavy:   PALETTE.shadow16,
  shadowDeep:    PALETTE.shadow18,
  shadowOverlay: PALETTE.shadow25,

  // ── Accent (Radix Indigo) ──
  accent:        PALETTE.indigo9,
  accentHover:   PALETTE.indigo10,
  // accentPressed reads more saturated than accentHover so a pressed-and-
  // released CTA reads as "I was squeezed" rather than collapsing to the
  // hover state. Light: darker than accent/accentHover. Dark: lighter
  // (Radix dark-scale convention where more intense = lighter against
  // the dark surface).
  accentPressed: PALETTE.indigo11,
  accentSubtle:  PALETTE.indigo3,
  accentText:    PALETTE.indigo11,

  // ── Status ──
  statusRed:         PALETTE.red9,
  statusAmber:       PALETTE.amber9,
  statusGreen:       PALETTE.green9,
  statusRedText:     PALETTE.red11,
  statusAmberText:   PALETTE.amber11,
  statusGreenText:   PALETTE.green11,
  statusRedSubtle:   PALETTE.red3,
  statusAmberSubtle: PALETTE.amber3,
  statusGreenSubtle: PALETTE.green3,

  // ── Dark surface (rail — same in both themes) ──
  darkSurface:      PALETTE.slate12,
  onDarkMuted:      PALETTE.onDark70,
  onDarkSubtle:     PALETTE.onDark50,
  onDarkFaint:      PALETTE.onDark40,
  onDarkDisabled:   PALETTE.onDark20,
  onDarkHover:      PALETTE.onDark85,
  darkHoverBg:      PALETTE.darkHover,
  darkActiveBg:     PALETTE.darkActive,
  darkPressedBg:    PALETTE.darkPressed,
  darkHairline:     PALETTE.darkHairline,
  darkBorder:       PALETTE.darkBorder,
  darkBorderStrong: PALETTE.darkBorderHigh,

  // Dark-atom OPAQUE text greys (Figma AtomDark). Unlike the alpha-white onDark* above,
  // these are opaque, so a glyph/label renders the EXACT Figma grey on ANY dark-atom pill —
  // translucent (0.05) OR opaque white — where alpha-white washes out or vanishes.
  darkTextMuted:    "#b5b8bc",   // muted glyph (e.g. ToggleButton on/default handle #B5B8BC)
  darkTextSubtle:   "#8e9093",   // subtle glyph/label (e.g. label-off #8E9093, off/pressed grip)
  darkTextDisabled: "#4e5054",   // disabled/faint glyph (e.g. off/default handle #4E5054)

  // ── Overlay ──
  backdrop: "rgba(0,0,0,0.40)",
};

// Widen type so dark can use different literal values
export type TokenSet = { [K in keyof typeof TOKENS_LIGHT]: string };

export const TOKENS_DARK: TokenSet = {
  // ── Text ──
  ink:        PALETTE.slateDark12,
  textMuted:  PALETTE.slateDark11,
  textSubtle: PALETTE.slateDark9,
  textDisabled: PALETTE.slateDark8,
  iconDisabled: PALETTE.slateDark8,
  onDark:     PALETTE.white,
  onInk:      PALETTE.slateDark1,   // #111113 — near-black on the light `ink` fill in dark mode (inverse of light onInk)

  // ── Backgrounds ──
  bg:         PALETTE.slateDark2,
  bgSubtle:   PALETTE.slateDark3,
  surface:    PALETTE.slateDark4,
  hoverBg:    PALETTE.slateDark5,
  activeBg:   PALETTE.slateDark5,
  bgStrong:   PALETTE.slateDark6,
  focusOverlay: PALETTE.slateDark6,   // dark THEME focus bg (distinct from the darkAtom-surface remap)
  pressedOverlay: PALETTE.slateDark6, // dark THEME pressed bg
  segmentedTrack: PALETTE.slateDark1,

  // ── Borders ──
  hairline:     PALETTE.slateDark6,
  faintMark:    PALETTE.onDark40,   // dark faint mark = rgba(255,255,255,0.4). Surface-aware: light=slate6.
                                      // Components reading TOKENS_DARK directly (CarouselMark) land 0.4 here;
                                      // decorator-path components (Scrollbar) get faintMark->onDarkFaint (also 0.4).
  border:       PALETTE.slateDark7,
  borderStrong: PALETTE.slateDark8,

  // ── Surface-aware dark-atom tokens (dark-THEME values; darkAtom decorator overrides on the atom surface) ──
  onDarkFaintest:    PALETTE.onDark05,
  hoverInk:          PALETTE.slateDark12,
  faintFill:         PALETTE.slateDark3,
  // Dark-THEME values (full dark mode). Match the prior faintFill dark value (slateDark3) so a
  // full-dark-theme consumer render is unchanged; the darkAtom decorator overrides both -> onDark05 on the
  // atom surface (Figma-dark exact). See TOKENS_LIGHT for the surface-aware rationale.
  triggerHoverBg:            PALETTE.slateDark3,
  triggerDisabledSelectedBg: PALETTE.slateDark3,
  // Dark-THEME values (full dark mode). Each MIRRORS the token the component painted before this split,
  // so a full-dark-theme consumer render is byte-unchanged: the carousel pill was `surface` (slateDark4)
  // and the calendar band was `activeBg` (slateDark5). The darkAtom decorator overrides all four -> the
  // Figma-dark alpha tiers on the atom SURFACE. Same discipline as triggerHoverBg above — a surface-aware
  // split must not silently restyle full dark mode.
  carouselPillBg:      PALETTE.slateDark4,   // was tokens.surface
  carouselPillHoverBg: PALETTE.slateDark4,   // was tokens.surface
  carouselPillFocusBg: PALETTE.slateDark4,   // was tokens.surface
  calendarBandBg:      PALETTE.slateDark5,   // was tokens.activeBg
  interactiveBorder: PALETTE.slateDark7,
  onSelected:        PALETTE.slateDark1,
  dismissInk:        PALETTE.slateDark9,
  onSelectedMuted:   PALETTE.slateDark8,
  trendGood:         PALETTE.greenDark9,
  trendBad:          PALETTE.redDark9,

  // ── Shadows (stronger in dark mode) ──
  shadowSubtle:  "rgba(0,0,0,0.10)",
  shadowLight:   "rgba(0,0,0,0.15)",
  shadowMedium:  "rgba(0,0,0,0.25)",
  shadowStrong:  "rgba(0,0,0,0.35)",
  shadowHeavy:   "rgba(0,0,0,0.40)",
  shadowDeep:    "rgba(0,0,0,0.50)",
  shadowOverlay: "rgba(0,0,0,0.60)",

  // ── Accent (Radix Indigo) ──
  accent:        PALETTE.indigoDark9,
  accentHover:   PALETTE.indigoDark10,
  accentPressed: PALETTE.indigoDark11,
  accentSubtle:  PALETTE.indigoDark3,
  accentText:    PALETTE.indigoDark11,

  // ── Status ──
  statusRed:         PALETTE.redDark9,
  statusAmber:       PALETTE.amberDark9,
  statusGreen:       PALETTE.greenDark9,
  statusRedText:     PALETTE.redDark11,
  statusAmberText:   PALETTE.amberDark11,
  statusGreenText:   PALETTE.greenDark11,
  statusRedSubtle:   PALETTE.redDark3,
  statusAmberSubtle: PALETTE.amberDark3,
  statusGreenSubtle: PALETTE.greenDark3,

  // ── Dark surface (rail) — use Radix dark scale for consistent tint ──
  darkSurface:      PALETTE.slateDark1,
  onDarkMuted:      PALETTE.slateDark11,
  onDarkSubtle:     PALETTE.slateDark9,
  onDarkFaint:      PALETTE.slateDark8,
  onDarkDisabled:   PALETTE.slateDark65,
  onDarkHover:      PALETTE.slateDark12,
  darkHoverBg:      PALETTE.slateDark3,
  darkActiveBg:     PALETTE.slateDark4,
  darkPressedBg:    PALETTE.slateDark5,
  darkHairline:     PALETTE.slateDark3,
  darkBorder:       PALETTE.slateDark5,
  darkBorderStrong: PALETTE.slateDark8,

  // Dark-atom opaque text greys (dark-THEME values; opaque so glyphs land the exact grey)
  darkTextMuted:    PALETTE.slateDark11,   // #b0b4ba
  darkTextSubtle:   PALETTE.slateDark9,    // #696e77
  darkTextDisabled: PALETTE.slateDark65,   // #3e4348

  // ── Overlay ──
  backdrop: "rgba(0,0,0,0.60)",
};

// Backward compat — static reference for non-theme-aware code
export const TOKENS = TOKENS_LIGHT;

// ── Typography system ──
// 9 tokens + 3 modifiers. Spread via style={{ ...TYPE.bodyM, color: tokens.ink }}.
export const FONT_FAMILY = "'Inter', system-ui, -apple-system, sans-serif";
const FONT_DISPLAY = "'DM Sans', 'Inter', system-ui, sans-serif";
const FONT_DISPLAY_L = "'Raleway', 'Inter', system-ui, sans-serif";

export const TYPE = {
  displayXl: { fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 700, lineHeight: 1.0, letterSpacing: -1, fontVariantNumeric: "tabular-nums" as const },
  displayL:     { fontFamily: FONT_DISPLAY_L, fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.4 },
  displayL400:  { fontFamily: FONT_DISPLAY_L, fontSize: 28, fontWeight: 400, lineHeight: 1.1, letterSpacing: -0.4 },
  // numberL — LARGE METRIC NUMBER in the UI font. Inter Medium 28px with a TIGHT line-height (0.835 =
  // 23.4/28) and tabular-nums so big figures pack cleanly and align in columns. This is NOT a display
  // heading (those are DM Sans / Raleway) and NOT a heading (Inter is the UI font) — it is the reusable
  // token for prominent inline metrics like the MetricCard trend-row primaries ("+23%", "$120K").
  // Added 2026-07-15 from Figma (trend number was raw Inter Medium 28, no style) — see docs/audits/font-audit.md.
  numberL:      { fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: 500, lineHeight: 0.835, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" as const },
  headingL:  { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.3 },
  headingM:  { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.2 },
  headingS:  { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: 500, lineHeight: 1.3, letterSpacing: 0 },
  bodyM:     { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 400, lineHeight: 1.55, letterSpacing: 0 },
  bodyS:     { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
  labelL:    { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500, lineHeight: 1.55, letterSpacing: 0 },
  labelM:    { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0 },
  caption:       { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 },
  captionStrong: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, lineHeight: 1.5, letterSpacing: 0 },
  strong:    { fontWeight: 700 as const },
  medium:    { fontWeight: 500 as const },
  light:     { fontWeight: 400 as const },
} as const;
