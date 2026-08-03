#!/usr/bin/env node
/**
 * DTCG token source → a Figma Variables payload (stdout, JSON).
 *
 * Third emitter off the same source as src/styles/tokens.css and src/tokens.ts,
 * so Figma Variables and code tokens cannot drift: change tokens/*.tokens.json,
 * re-run, re-push. See docs/process/TOKEN-PIPELINE.md.
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

const entries = (doc) =>
  Object.entries(doc).filter(([key]) => !key.startsWith("$"))

/** Root font size — converts our rem dimensions to the px Figma expects. */
const REM_PX = 16

/**
 * Figma variable scopes, by token role.
 *
 * Lives here rather than in the push script so a re-push is deterministic and
 * reviewable in git — scoping is part of the token contract, not an ad-hoc
 * decision made at write time.
 */
const FILL_TOKENS = new Set([
  "background",
  "card",
  "popover",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
])

function scopesFor(name, resolvedType) {
  if (resolvedType === "FLOAT") {
    if (name.startsWith("radius")) return ["CORNER_RADIUS"]
    if (name.startsWith("font-size")) return ["FONT_SIZE"]
    if (name.startsWith("line-height")) return ["LINE_HEIGHT"]
    if (name.startsWith("font-weight")) return ["FONT_WEIGHT"]
    throw new Error(`Token "${name}": no FLOAT scope rule.`)
  }
  if (resolvedType === "STRING") return ["FONT_FAMILY"]

  // Derived alpha steps inherit their base token's role.
  const base = name.replace(/-\d+$/, "")
  if (base !== name) return scopesFor(base, "COLOR")

  if (name === "ring") return ["STROKE_COLOR", "EFFECT_COLOR"]
  if (name === "border" || name === "input") return ["STROKE_COLOR"]
  if (name === "backdrop") return ["FRAME_FILL", "SHAPE_FILL"]
  // Note the leading check: bare `foreground` is a text colour too, not just
  // the `*-foreground` pairs.
  if (name === "foreground" || name.endsWith("-foreground")) {
    return ["TEXT_FILL", "SHAPE_FILL"]
  }
  if (FILL_TOKENS.has(name)) return ["FRAME_FILL", "SHAPE_FILL"]
  throw new Error(
    `Token "${name}": no scope rule. Add one to scopesFor() rather than falling back to ALL_SCOPES.`
  )
}

function colorValue(token, name) {
  const { $value: value } = token
  if (typeof value === "string") {
    throw new Error(`Token "${name}": hex passthrough not supported for Figma.`)
  }
  const { colorSpace, components, alpha } = value
  if (colorSpace !== "oklch") {
    throw new Error(`Token "${name}": unsupported colorSpace "${colorSpace}".`)
  }
  const [L, C, H] = components
  const rgb = oklchToSrgb(L, C, H)
  return { ...rgb, a: alpha === undefined ? 1 : alpha }
}

const base = read("base")
const light = read("light")
const dark = read("dark")

const variables = []

// Mode-independent tokens: same value in both Figma modes.
for (const [name, token] of entries(base)) {
  if (token.$type === "dimension" || token.$type === "fontWeight") {
    const px =
      token.$type === "fontWeight"
        ? token.$value
        : token.$value.unit === "rem"
          ? token.$value.value * REM_PX
          : token.$value.value
    variables.push({
      name,
      resolvedType: "FLOAT",
      light: px,
      dark: px,
      scopes: scopesFor(name, "FLOAT"),
    })
  } else if (token.$type === "fontFamily") {
    const stack = Array.isArray(token.$value) ? token.$value : [token.$value]
    variables.push({
      name,
      resolvedType: "STRING",
      light: stack[0],
      dark: stack[0],
      scopes: scopesFor(name, "STRING"),
    })
  }
}

// Colour tokens: one variable, two modes.
const darkByName = Object.fromEntries(entries(dark))
for (const [name, token] of entries(light)) {
  if (token.$type !== "color") continue
  const darkToken = darkByName[name]
  if (!darkToken) throw new Error(`Token "${name}": missing dark value.`)

  const l = colorValue(token, name)
  const d = colorValue(darkToken, name)

  variables.push({
    name,
    resolvedType: "COLOR",
    light: l,
    dark: d,
    scopes: scopesFor(name, "COLOR"),
    // Carried for eyeballing only; Figma consumes the channels above.
    hex: { light: toHex(l), dark: toHex(d) },
  })
}

// ── Derived alpha steps ────────────────────────────────────────────────────
// Computed from each base token's OWN channels, so a step can never drift from
// its base. Figma-only: Tailwind expresses this natively in code as `bg-x/90`.
const alphaConfig = JSON.parse(
  readFileSync(join(root, "tokens", "alpha.config.json"), "utf8")
)
const byName = Object.fromEntries(variables.map((v) => [v.name, v]))

for (const [baseName, steps] of Object.entries(alphaConfig)) {
  if (baseName.startsWith("$")) continue
  const base = byName[baseName]
  if (!base) {
    throw new Error(`alpha.config.json: unknown base token "${baseName}".`)
  }
  if (base.resolvedType !== "COLOR") {
    throw new Error(`alpha.config.json: "${baseName}" is not a colour token.`)
  }

  for (const { step, usedBy, scopes } of steps) {
    const name = `${baseName}-${step}`
    const alpha = step / 100
    // `bg-input/30` is a FILL even though `input` itself is a stroke token, so a
    // step may override the role it inherits from its base.
    variables.push({
      name,
      resolvedType: "COLOR",
      // Same channels as the base; only alpha differs. Multiplied by the base's
      // own alpha so deriving from an already-translucent token stays correct.
      light: { ...base.light, a: base.light.a * alpha },
      dark: { ...base.dark, a: base.dark.a * alpha },
      scopes: scopes ?? scopesFor(name, "COLOR"),
      derivedFrom: baseName,
      usedBy,
      hex: base.hex,
    })
  }
}

const payload = { collection: "bidezine/tokens", modes: ["Light", "Dark"], variables }

process.stdout.write(
  JSON.stringify(payload, null, process.argv.includes("--pretty") ? 2 : 0)
)
