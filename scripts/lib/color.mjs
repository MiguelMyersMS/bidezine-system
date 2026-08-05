/**
 * OKLCH ↔ sRGB.
 *
 * Our DTCG source stores colours in OKLCH (perceptually uniform, and what the
 * generated CSS ships). The Figma Variables API only accepts sRGB channels in
 * 0–1, so this is the one place the two representations meet. Keeping the
 * conversion here — rather than hand-entering hex into Figma — is what makes
 * "Figma and code read from one token source" literally true.
 *
 * The reverse direction (hexToOklch) exists for the opposite real workflow:
 * a human picks/eyedrops a color in Figma (which only speaks Hex/RGB/HSL/HSB —
 * no OKLCH mode) and hands it over as a hex code to become a new bidezine
 * token candidate. Converting it here, once, keeps every candidate value
 * consistent with how tokens/*.tokens.json is actually authored, instead of
 * each conversion being separate unverified guesswork.
 *
 * Matrices: Björn Ottosson's Oklab reference implementation.
 */

/** Gamma-encode one linear-light channel to sRGB. */
function encodeGamma(channel) {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))

/**
 * @param {number} L lightness, 0–1
 * @param {number} C chroma
 * @param {number} H hue in degrees
 * @returns {{r: number, g: number, b: number}} sRGB channels, 0–1
 */
export function oklchToSrgb(L, C, H) {
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // Oklab → LMS (cube roots)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  // LMS → linear sRGB
  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return {
    r: clamp01(encodeGamma(rLin)),
    g: clamp01(encodeGamma(gLin)),
    b: clamp01(encodeGamma(bLin)),
  }
}

/** Debug helper — sRGB 0–1 triple to #rrggbb. */
export function toHex({ r, g, b }) {
  const byte = (n) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${byte(r)}${byte(g)}${byte(b)}`
}

/** #rrggbb (or #rgb) to sRGB 0–1 triple. */
export function fromHex(hex) {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = [...h].map((c) => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`fromHex: not a valid hex color "${hex}"`)
  const int = parseInt(h, 16)
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  }
}

/** Inverse gamma — sRGB channel (0–1) to linear light. */
function decodeGamma(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4)
}

/**
 * sRGB → OKLCH.
 * @param {number} r 0–1
 * @param {number} g 0–1
 * @param {number} b 0–1
 * @returns {{L: number, C: number, H: number}} L 0–1, C ≥0, H degrees 0–360
 */
export function srgbToOklch(r, g, b) {
  const rLin = decodeGamma(r)
  const gLin = decodeGamma(g)
  const bLin = decodeGamma(b)

  // linear sRGB → LMS
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  // LMS → Oklab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.sqrt(a * a + bLab * bLab)
  let H = (Math.atan2(bLab, a) * 180) / Math.PI
  if (H < 0) H += 360

  return { L, C, H }
}

/**
 * Convenience wrapper for the Figma-hex → bidezine-token-candidate workflow.
 * @param {string} hex e.g. "#1c2024"
 * @param {number} [precision] decimal places for L/C/H (default 3)
 * @returns {{L: number, C: number, H: number, css: string}} css is a ready-to-paste oklch() string
 */
export function hexToOklch(hex, precision = 3) {
  const { r, g, b } = fromHex(hex)
  const { L, C, H } = srgbToOklch(r, g, b)
  const round = (n) => Number(n.toFixed(precision))
  const Lr = round(L)
  const Cr = round(C)
  const Hr = round(H)
  return { L: Lr, C: Cr, H: Hr, css: `oklch(${Lr} ${Cr} ${Hr})` }
}
