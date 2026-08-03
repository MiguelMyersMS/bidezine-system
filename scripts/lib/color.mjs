/**
 * OKLCH → sRGB.
 *
 * Our DTCG source stores colours in OKLCH (perceptually uniform, and what the
 * generated CSS ships). The Figma Variables API only accepts sRGB channels in
 * 0–1, so this is the one place the two representations meet. Keeping the
 * conversion here — rather than hand-entering hex into Figma — is what makes
 * "Figma and code read from one token source" literally true.
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
