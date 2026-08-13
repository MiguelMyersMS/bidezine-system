/**
 * Shared status-color vocabulary for the Sandbox tool itself (not a bidezine design
 * token — this is internal tooling chrome for the transformation-tracking shell, same category as
 * the existing ad-hoc `bg-primary`/`bg-foreground` badge overrides already used throughout
 * ReviewCardShell/ColorTokenLab).
 *
 * Rule of thumb used across the app: a hard "needs a human decision" reads as NEGATIVE — this
 * reuses bidezine's own real `--destructive`/`--destructive-foreground` tokens (see
 * tokens/*.tokens.json), the same ones RisksList already used for "Open" risks, rather than
 * inventing a new color. A softer "worth noting" (non-blocking, but read before moving on) reads
 * as WARNING (amber) — bidezine has no warning token yet, so this uses Tailwind's stock amber
 * palette. Anything already approved/resolved/decided reads as POSITIVE (emerald) — likewise no
 * bidezine success token yet. Neutral/informational states (e.g. "clean equivalent") are
 * unaffected.
 *
 * Deliberately badge-only: earlier revisions also carried a colored left-border + tinted wash
 * for whole cards/rows, but that read as a distracting banner effect rather than a status pill.
 * Cards/rows now keep the design system's own plain elevation (border + shadow-sm, same as any
 * other Card) — only the small badge itself carries the status color.
 */
export const POSITIVE_BADGE = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
export const WARNING_BADGE = "bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950"
export const NEGATIVE_BADGE = "bg-destructive text-destructive-foreground"
