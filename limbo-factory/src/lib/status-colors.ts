/**
 * Shared status-color vocabulary for the Limbo Factory Line tool itself (not a bidezine design
 * token — this is internal tooling chrome for the transformation-tracking shell, same category as
 * the existing ad-hoc `bg-primary`/`bg-foreground` badge overrides already used throughout
 * DivergenceView/ColorTokenLab). bidezine's own token set has no success/warning family yet
 * (checked tokens/*.tokens.json — only background/foreground/primary/secondary/muted/accent/
 * destructive exist), so these use Tailwind's stock emerald/amber palettes rather than inventing
 * new shipped design tokens.
 *
 * Rule of thumb used across the app: anything still needing a human call (a decision, or a
 * worth-noting item) reads as WARNING (amber); anything already approved/resolved/decided reads
 * as POSITIVE (emerald). Neutral/informational states (e.g. "clean equivalent") are unaffected.
 */
export const POSITIVE_BADGE = "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
export const WARNING_BADGE = "bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950"

export const POSITIVE_BORDER = "border-l-emerald-600 dark:border-l-emerald-500"
export const WARNING_BORDER = "border-l-amber-500 dark:border-l-amber-400"

export const POSITIVE_WASH = "bg-emerald-500/5"
export const WARNING_WASH = "bg-amber-500/5"
