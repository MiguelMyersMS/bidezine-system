/**
 * Shared status-color vocabulary for the Limbo Factory Line tool itself (not a bidezine design
 * token — this is internal tooling chrome for the transformation-tracking shell, same category as
 * the existing ad-hoc `bg-primary`/`bg-foreground` badge overrides already used throughout
 * DivergenceView/ColorTokenLab).
 *
 * Rule of thumb used across the app: a hard "needs a human decision" reads as NEGATIVE — this
 * reuses bidezine's own real `--destructive`/`--destructive-foreground` tokens (see
 * tokens/*.tokens.json), the same ones RisksList already used for "Open" risks, rather than
 * inventing a new color. A softer "worth noting" (non-blocking, but read before moving on) reads
 * as WARNING (amber) — bidezine has no warning token yet, so this uses Tailwind's stock amber
 * palette. Anything already approved/resolved/decided reads as POSITIVE (emerald) — likewise no
 * bidezine success token yet. Neutral/informational states (e.g. "clean equivalent") are
 * unaffected.
 */
export const POSITIVE_BADGE = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
export const WARNING_BADGE = "bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950"
export const NEGATIVE_BADGE = "bg-destructive text-destructive-foreground"

export const POSITIVE_BORDER = "border-l-emerald-600 dark:border-l-emerald-500"
export const WARNING_BORDER = "border-l-amber-500 dark:border-l-amber-400"
export const NEGATIVE_BORDER = "border-l-destructive"

export const POSITIVE_WASH = "bg-emerald-500/5"
export const WARNING_WASH = "bg-amber-500/5"
export const NEGATIVE_WASH = "bg-destructive/5"
