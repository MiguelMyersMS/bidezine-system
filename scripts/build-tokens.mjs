#!/usr/bin/env node
/**
 * DTCG token source  →  CSS custom properties + typed tokens.
 *
 * Reads   tokens/{base,neutral,light,dark}.tokens.json   (DTCG 2025.10 — ADR-001)
 * Writes  src/styles/tokens.css                  (runtime: :root + .dark)
 *         src/tokens.ts                          (authoring: typed names + var() refs)
 *
 * Both outputs are GENERATED. Never hand-edit them, and never add a CSS variable
 * directly to a stylesheet — add it here, in the DTCG source, so the typed surface
 * and the runtime surface can never drift apart. (ADR-006, Step 2.)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

/**
 * Token names allowed to hold a literal `$value` (a DTCG colour object)
 * instead of a `{neutral-N}` alias reference, in tokens/light.tokens.json
 * and tokens/dark.tokens.json. Every semantic colour not on this list must
 * be a reference — that is the point of the neutral ramp: no semantic
 * holds a literal by accident. Each entry names the reason it is still a
 * literal today and the phase expected to remove it.
 */
const LITERALS_ALLOWED = new Set([
  // Chromatic — non-zero chroma, out of scope for the achromatic neutral
  // ramp. Removed only if/when a chromatic ramp tier is introduced; no such
  // phase exists yet.
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
  "destructive-soft",
  "destructive-soft-foreground",
  "success-soft",
  "success-soft-foreground",
  "warning-soft",
  "warning-soft-foreground",
  "info-soft",
  "info-soft-foreground",

  // Dark-mode alpha-on-white overlays (shadcn's own values: white at 10%/15%
  // alpha over --background) — not a ramp stop, and converting to one would
  // change compositing behaviour, not just re-point a reference. Kept
  // literal indefinitely; no removal phase.
  "border",
  "input",

  // Chart series colours are an intentional `var(--color-blue-N)` passthrough
  // to the Tailwind palette, not a `{name}` alias or a literal oklch() value —
  // still fails the `{name}`-only alias test, so it needs the same escape
  // hatch. Out of scope for the neutral ramp; no removal phase.
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",

  // --sidebar-*/--sidebar-rail-* family — untouched since the drift-fix
  // commit (only sidebar-foreground was corrected there). Out of scope for
  // phase 0; removed in a future sidebar-family alias-conversion phase.
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "sidebar-rail-active",
  "sidebar-rail-active-hover",
  "sidebar-rail-border-strong",
  "sidebar-rail-divider",
  "sidebar-rail-foreground",
  "sidebar-rail-foreground-disabled",
  "sidebar-rail-foreground-hover",
  "sidebar-rail-foreground-subtle",
  "sidebar-rail-hover",
  "sidebar-rail-pressed",
  "sidebar-rail-surface",
])

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (name) =>
  JSON.parse(readFileSync(join(root, "tokens", `${name}.tokens.json`), "utf8"))

/** Strip DTCG metadata keys ($description etc.) to leave just the tokens. */
const entries = (doc) =>
  Object.entries(doc).filter(([key]) => !key.startsWith("$"))

/** Render a DTCG colour object as a CSS colour. */
function colorToCss(value, name) {
  if (typeof value === "string") return value // hex passthrough
  const { colorSpace, components, alpha } = value
  const a = alpha === undefined || alpha === 1 ? null : alpha

  if (colorSpace === "oklch") {
    const ch = components.join(" ")
    return a === null ? `oklch(${ch})` : `oklch(${ch} / ${a})`
  }
  if (colorSpace === "srgb") {
    // sRGB passthrough for colours authored as rgba() rather than oklch.
    const ch = components.map((c) => Math.round(c * 255)).join(" ")
    return a === null ? `rgb(${ch})` : `rgb(${ch} / ${a})`
  }
  throw new Error(`Token "${name}": unsupported colorSpace "${colorSpace}".`)
}

const dim = (d) => `${d.value}${d.unit}`

/**
 * Resolve a DTCG alias reference, e.g. `"{neutral-900}"`, to the referenced
 * token's own `$value`. Semantics hold references, not literals — the neutral
 * ramp (tokens/neutral.tokens.json) is the only referenceable tier today, so
 * this looks the name up there. A non-alias string (hex passthrough, or the
 * `var(--color-blue-300)` chart passthrough) has no braces and returns as-is.
 */
function resolveAlias(value, name) {
  if (typeof value !== "string") return value
  const m = /^\{([\w.-]+)\}$/.exec(value)
  if (!m) return value
  const ref = primitives[m[1]]
  if (!ref) throw new Error(`Token "${name}": unknown reference "${value}".`)
  return ref.$value
}

/** Render one DTCG $value as a CSS value. */
function toCss(token, name) {
  const { $type: type, $value: rawValue } = token
  const value = resolveAlias(rawValue, name)

  switch (type) {
    case "color":
      return colorToCss(value, name)
    case "dimension":
    case "duration":
      return dim(value)
    case "fontWeight":
    case "number":
      return String(value)
    case "cubicBezier":
      return `cubic-bezier(${value.join(", ")})`
    case "shadow": {
      // One or more layers, comma-separated, exactly as CSS box-shadow expects.
      const layers = Array.isArray(value) ? value : [value]
      return layers
        .map(
          (l) =>
            `${dim(l.offsetX)} ${dim(l.offsetY)} ${dim(l.blur)} ${dim(l.spread)} ${colorToCss(l.color, name)}`
        )
        .join(", ")
    }
    case "fontFamily":
      return (Array.isArray(value) ? value : [value])
        .map((f) => (f.includes(" ") ? `"${f}"` : f))
        .join(", ")
    default:
      throw new Error(`Token "${name}": unsupported $type "${type}".`)
  }
}

/**
 * A `typography` composite cannot be one CSS variable, so it expands into one
 * variable per sub-property. The composite still lives in the source as a single
 * named role — which is what makes the Figma text style and the CSS agree.
 */
function expandTypography(name, token) {
  const v = token.$value
  const fam = (Array.isArray(v.fontFamily) ? v.fontFamily : [v.fontFamily])
    .map((f) => (f.includes(" ") ? `"${f}"` : f))
    .join(", ")
  return [
    `  --${name}-font-family: ${fam};`,
    `  --${name}-font-size: ${dim(v.fontSize)};`,
    `  --${name}-line-height: ${dim(v.lineHeight)};`,
    `  --${name}-font-weight: ${v.fontWeight};`,
    `  --${name}-letter-spacing: ${dim(v.letterSpacing)};`,
  ].join("\n")
}

const block = (doc) =>
  entries(doc)
    .map(([name, token]) =>
      token.$type === "typography"
        ? expandTypography(name, token)
        : `  --${name}: ${toCss(token, name)};`
    )
    .join("\n")

const base = read("base")
const neutral = read("neutral")
const light = read("light")
const dark = read("dark")

/** Name → token lookup for every alias `{...}` a semantic can reference. */
const primitives = Object.fromEntries(entries(neutral))

// ── Parity gate ────────────────────────────────────────────────────────────
// A token that exists in one mode but not the other renders as "unset" there,
// silently falling back to an inherited value. Fail the build instead.
const lightNames = entries(light).map(([n]) => n)
const darkNames = entries(dark).map(([n]) => n)
const missingInDark = lightNames.filter((n) => !darkNames.includes(n))
const missingInLight = darkNames.filter((n) => !lightNames.includes(n))

if (missingInDark.length || missingInLight.length) {
  const lines = [
    "Token parity check FAILED — light and dark must declare the same names.",
    ...missingInDark.map((n) => `  missing in dark.tokens.json:  ${n}`),
    ...missingInLight.map((n) => `  missing in light.tokens.json: ${n}`),
  ]
  console.error(lines.join("\n"))
  process.exit(1)
}

// ── No-literal gate ────────────────────────────────────────────────────────
// Every colour semantic in light/dark.tokens.json must reference the neutral
// ramp — a literal oklch() there is either unreviewed drift or a value that
// can't be re-themed by re-pointing a reference. LITERALS_ALLOWED is the sole,
// explicit escape hatch; dropping a name from it without converting the token
// fails the build just as loudly as introducing a brand-new literal would.
const ALIAS_RE = /^\{[\w.-]+\}$/
function findLiteralColors(doc) {
  return entries(doc)
    .filter(([, token]) => token.$type === "color")
    .filter(([, token]) => typeof token.$value !== "string" || !ALIAS_RE.test(token.$value))
    .map(([name]) => name)
    .filter((name) => !LITERALS_ALLOWED.has(name))
}

const literalsInLight = findLiteralColors(light)
const literalsInDark = findLiteralColors(dark)

if (literalsInLight.length || literalsInDark.length) {
  const lines = [
    'No-literal gate FAILED — every color $type not in LITERALS_ALLOWED must be a "{name}" alias.',
    ...literalsInLight.map((n) => `  literal in light.tokens.json: ${n}`),
    ...literalsInDark.map((n) => `  literal in dark.tokens.json:  ${n}`),
  ]
  console.error(lines.join("\n"))
  process.exit(1)
}

// ── Theme presets ──────────────────────────────────────────────────────────
// Optional alternate palettes (tokens/themes/*.tokens.json), shadcn/ui's own
// preset themes ported unmodified. Each file nests its tokens under top-level
// "light"/"dark" keys (unlike base/light/dark.tokens.json, which are flat) so
// one file can hold a whole preset. Selected via <html data-theme="name">,
// composed with the existing .dark class for the dark variant.
let themeFileNames = []
try {
  themeFileNames = readdirSync(join(root, "tokens", "themes"))
    .filter((f) => f.endsWith(".tokens.json"))
    .map((f) => f.replace(/\.tokens\.json$/, ""))
    .sort()
} catch {
  // tokens/themes/ is optional — no presets yet is not an error.
}

const themes = themeFileNames.map((name) => {
  const doc = JSON.parse(
    readFileSync(join(root, "tokens", "themes", `${name}.tokens.json`), "utf8")
  )
  const themeLightNames = Object.keys(doc.light)
  const themeDarkNames = Object.keys(doc.dark)
  const missingD = themeLightNames.filter((n) => !themeDarkNames.includes(n))
  const missingL = themeDarkNames.filter((n) => !themeLightNames.includes(n))
  if (missingD.length || missingL.length) {
    const lines = [
      `Theme "${name}" parity check FAILED — light and dark must declare the same names.`,
      ...missingD.map((n) => `  missing in dark:  ${n}`),
      ...missingL.map((n) => `  missing in light: ${n}`),
    ]
    console.error(lines.join("\n"))
    process.exit(1)
  }
  return { name, light: doc.light, dark: doc.dark }
})

const themeVarBlock = (tokens) =>
  Object.entries(tokens)
    .map(([name, token]) => `  --${name}: ${toCss(token, name)};`)
    .join("\n")

const themeCss = themes
  .map(
    (t) => `
[data-theme="${t.name}"] {
${themeVarBlock(t.light)}
}

[data-theme="${t.name}"].dark {
${themeVarBlock(t.dark)}
}
`
  )
  .join("")

// ── Emit CSS ───────────────────────────────────────────────────────────────
const banner = `/* GENERATED by scripts/build-tokens.mjs from tokens/*.tokens.json — DO NOT EDIT. */`

const css = `${banner}

:root {
${block(base)}
${block(neutral)}
${block(light)}
}

.dark {
${block(dark)}
}
${themeCss}`


// ── Emit typed tokens ──────────────────────────────────────────────────────
// A typography composite has no single CSS variable, so the typed surface lists
// its five sub-properties instead — matching exactly what the CSS emits.
const TYPO_PARTS = ["font-family", "font-size", "line-height", "font-weight", "letter-spacing"]
const allNames = [
  ...entries(base).flatMap(([n, t]) =>
    t.$type === "typography" ? TYPO_PARTS.map((p) => `${n}-${p}`) : [n]
  ),
  ...entries(neutral).map(([n]) => n),
  ...lightNames,
]

const ts = `${banner}

/** Every design token this system exposes as a CSS custom property. */
export const tokenNames = [
${allNames.map((n) => `  "${n}",`).join("\n")}
] as const

export type TokenName = (typeof tokenNames)[number]

/**
 * Typed \`var()\` references, for the rare place a token is needed from TS
 * (inline styles, canvas, chart libraries) rather than a Tailwind utility.
 */
export const token: Record<TokenName, string> = {
${allNames.map((n) => `  "${n}": "var(--${n})",`).join("\n")}
}

/**
 * Available alternate theme presets (excluding the base default), selected
 * via \`<html data-theme="name">\`. Populated from tokens/themes/*.tokens.json.
 */
export const themeNames = [
${themes.map((t) => `  "${t.name}",`).join("\n")}
] as const

export type ThemeName = (typeof themeNames)[number]
`

mkdirSync(join(root, "src", "styles"), { recursive: true })
writeFileSync(join(root, "src", "styles", "tokens.css"), css)
writeFileSync(join(root, "src", "tokens.ts"), ts)

console.log(
  `tokens: ${allNames.length} emitted → src/styles/tokens.css, src/tokens.ts (light/dark parity OK)`
)
