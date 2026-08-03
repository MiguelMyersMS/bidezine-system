#!/usr/bin/env node
/**
 * DTCG token source → a Figma payload (stdout, JSON).
 *
 * Third emitter off the same source as src/styles/tokens.css and src/tokens.ts,
 * so Figma and code cannot drift: change tokens/*.tokens.json, re-run, re-push.
 * See docs/process/TOKEN-PIPELINE.md.
 *
 * Emits three things, because Figma cannot hold everything as a Variable:
 *   variables    — COLOR / FLOAT / STRING, with Light and Dark modes
 *   effectStyles — shadows, which Figma has no variable type for. Their layer
 *                  colours BIND to colour variables, which is the only way to
 *                  make a Figma effect theme-aware (effect styles have no modes).
 *   unsupported  — tokens with no Figma representation at all (easing curves).
 *
 * Usage:  node scripts/figma-variables.mjs [--pretty]
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import { oklchToSrgb, toHex } from "./lib/color.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const read = (name) =>
  JSON.parse(readFileSync(join(root, "tokens", `${name}.tokens.json`), "utf8"))
const entries = (doc) => Object.entries(doc).filter(([k]) => !k.startsWith("$"))

const REM_PX = 16
const toPx = (d) => (d.unit === "rem" ? d.value * REM_PX : d.value)

/**
 * Figma variable scopes by token role. Lives here, not in the push script, so a
 * re-push is deterministic and reviewable in git.
 *
 * Three families resolve to ALL_SCOPES deliberately: Figma has **no property**
 * a duration, a z-index or a breakpoint can be bound to, so a narrower scope
 * would be a fiction. They exist in Figma as documentation only.
 */
const DOC_ONLY = ["duration-", "z-", "breakpoint-"]
const FILL_TOKENS = new Set([
  "background", "card", "popover", "primary", "secondary", "muted", "accent",
  "destructive", "backdrop",
])

function scopesFor(name, type) {
  if (type === "STRING") return ["FONT_FAMILY"]

  if (type === "FLOAT") {
    if (DOC_ONLY.some((p) => name.startsWith(p))) return ["ALL_SCOPES"]
    if (name.startsWith("radius-")) return ["CORNER_RADIUS"]
    if (name.startsWith("space-")) return ["GAP", "WIDTH_HEIGHT"]
    if (name.startsWith("font-size-")) return ["FONT_SIZE"]
    if (name.startsWith("line-height-")) return ["LINE_HEIGHT"]
    if (name.startsWith("font-weight-")) return ["FONT_WEIGHT"]
    if (name.startsWith("stroke-")) return ["STROKE_FLOAT"]
    if (name.startsWith("opacity-")) return ["OPACITY"]
    throw new Error(`Token "${name}": no FLOAT scope rule.`)
  }

  // COLOR
  if (name.startsWith("shadow-")) return ["EFFECT_COLOR"]
  if (name === "ring") return ["STROKE_COLOR", "EFFECT_COLOR"]
  if (name === "border" || name === "input") return ["STROKE_COLOR"]
  if (name === "foreground" || name.endsWith("-foreground")) return ["TEXT_FILL", "SHAPE_FILL"]
  if (FILL_TOKENS.has(name)) return ["FRAME_FILL", "SHAPE_FILL"]
  throw new Error(`Token "${name}": no COLOR scope rule.`)
}

function colorValue(value, name) {
  const { colorSpace, components, alpha } = value
  const a = alpha === undefined ? 1 : alpha
  if (colorSpace === "oklch") {
    const [L, C, H] = components
    return { ...oklchToSrgb(L, C, H), a }
  }
  if (colorSpace === "srgb") {
    const [r, g, b] = components
    return { r, g, b, a }
  }
  throw new Error(`Token "${name}": unsupported colorSpace "${colorSpace}".`)
}

const base = read("base")
const light = read("light")
const dark = read("dark")
const darkByName = Object.fromEntries(entries(dark))

const variables = []
const unsupported = []

// ── Mode-independent tokens ────────────────────────────────────────────────
for (const [name, t] of entries(base)) {
  switch (t.$type) {
    case "dimension":
    case "duration": {
      const v = t.$type === "duration" ? t.$value.value : toPx(t.$value)
      variables.push({ name, resolvedType: "FLOAT", light: v, dark: v, scopes: scopesFor(name, "FLOAT") })
      break
    }
    case "number":
    case "fontWeight":
      variables.push({ name, resolvedType: "FLOAT", light: t.$value, dark: t.$value, scopes: scopesFor(name, "FLOAT") })
      break
    case "fontFamily": {
      const stack = Array.isArray(t.$value) ? t.$value : [t.$value]
      variables.push({ name, resolvedType: "STRING", light: stack[0], dark: stack[0], scopes: scopesFor(name, "STRING") })
      break
    }
    case "cubicBezier":
      unsupported.push({ name, type: t.$type, reason: "Figma has no representation for an easing curve." })
      break
    default:
      throw new Error(`Token "${name}": unhandled $type "${t.$type}" in base.`)
  }
}

// ── Mode-dependent: colours ────────────────────────────────────────────────
for (const [name, t] of entries(light)) {
  if (t.$type !== "color") continue
  const d = darkByName[name]
  if (!d) throw new Error(`Token "${name}": missing dark value.`)
  const l = colorValue(t.$value, name)
  const dk = colorValue(d.$value, name)
  variables.push({
    name, resolvedType: "COLOR", light: l, dark: dk,
    scopes: scopesFor(name, "COLOR"),
    hex: { light: toHex(l), dark: toHex(dk) },
  })
}

// ── Mode-dependent: shadows → effect styles ────────────────────────────────
// Layer colours are matched back to the shadow-* colour VARIABLES by alpha, so
// the effect binds to a variable and therefore responds to the theme. Without
// that binding a Figma effect style is frozen at one mode's value.
const shadowColourByAlpha = {}
for (const v of variables) {
  if (v.resolvedType === "COLOR" && v.name.startsWith("shadow-")) {
    shadowColourByAlpha[v.light.a.toFixed(4)] = v.name
  }
}

const effectStyles = []
for (const [name, t] of entries(light)) {
  if (t.$type !== "shadow") continue
  const d = darkByName[name]
  const layers = (Array.isArray(t.$value) ? t.$value : [t.$value]).map((l, i) => {
    const dl = (Array.isArray(d.$value) ? d.$value : [d.$value])[i]
    const alphaKey = (l.color.alpha ?? 1).toFixed(4)
    const bindTo = shadowColourByAlpha[alphaKey]
    if (!bindTo) {
      throw new Error(
        `Shadow "${name}" layer ${i}: alpha ${alphaKey} has no matching shadow-* colour variable. ` +
          `Add one, or the Figma effect cannot be theme-aware.`
      )
    }
    return {
      offsetX: toPx(l.offsetX), offsetY: toPx(l.offsetY),
      blur: toPx(l.blur), spread: toPx(l.spread),
      bindTo,
      light: colorValue(l.color, name),
      dark: colorValue(dl.color, name),
    }
  })
  effectStyles.push({ name, layers })
}

const payload = {
  collection: "bidezine/tokens",
  modes: ["Light", "Dark"],
  variables,
  effectStyles,
  unsupported,
}

process.stdout.write(
  JSON.stringify(payload, null, process.argv.includes("--pretty") ? 2 : 0)
)
