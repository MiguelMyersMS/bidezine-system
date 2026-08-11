import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Status variants (`success` / `warning` / `info`) are a bidezine Adjustment, not a shadcn/ui port —
 * shadcn's own upstream source (`reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/badge.tsx`) has no
 * status-badge concept at all, only `destructive`. This addition maps the *concept* of a semantic
 * positive/caution/informational status pill (present in other design systems, e.g.
 * `limbo-factory/src/reference/origin-design-system/gallery/Badge.tsx`'s `positive`/`warning`/`info`
 * variants) onto bidezine's own token-authoring and styling conventions — it does not copy any literal
 * color value from that reference, and does not adopt its variant names, sizing tiers, or two-span
 * truncation structure. See `tokens/light.tokens.json` / `tokens/dark.tokens.json` for the new
 * `success`/`warning`/`info` (+ `-foreground`) tokens this relies on.
 *
 * Styling contract mirrors the existing `destructive` variant exactly, for consistency with bidezine's
 * own established solid-fill badge convention (not origin's subtle/pastel-fill convention):
 * solid `bg-{status}` + hardcoded `text-white` in light mode, `dark:bg-{status}/60` (blended toward the
 * dark surface, same treatment `destructive` already uses) in dark mode. `{status}-foreground` tokens
 * exist for schema parity with `destructive-foreground` (every semantic color token gets a `-foreground`
 * companion) and for future components that may need an explicit foreground rather than hardcoded white,
 * but are not consumed by Badge itself, matching shadcn's own real precedent — its `destructive` badge
 * variant hardcodes `text-white` too, never reads `--destructive-foreground`.
 *
 * Each new color was authored fresh in OKLCH and verified for WCAG AA contrast against white text in
 * light mode (`success` 4.94:1, `warning` 4.91:1, `info` 5.17:1 — all pass the 4.5:1 AA threshold for
 * normal-size text, matching `destructive`'s own 4.76:1). Dark mode intentionally does not re-verify
 * against a flat white background in isolation: `destructive`'s own dark-mode fill is only 2.89:1
 * against white measured the same way, because the real rendered color is `/60` opacity blended over the
 * dark page background, not evaluated as an opaque swatch — the new variants follow that same accepted,
 * shipped precedent rather than a stricter standard.
 *
 * There is deliberately no `neutral` variant: bidezine's existing `secondary` and `outline` variants
 * already cover a neutral/muted badge need without introducing a redundant token.
 *
 * `muted` (bidezine Adjustment): a lower-prominence badge for contexts that need a badge to visually
 * recede rather than draw attention — e.g. an inline count or status pill on a dense navigation surface
 * (the Rail Sidebar was the motivating case) where a solid-fill badge would compete with the
 * surrounding content. Structured like `ghost` (no fill at rest, `bg-accent`/`text-accent-foreground` on
 * hover when composed via `asChild`) but sets `text-muted-foreground` at rest instead of inheriting
 * `currentColor` — reusing the same `--muted-foreground` token already used for description/secondary
 * text elsewhere in the system (e.g. `Breadcrumb`, `Field`'s description text), so it reads as
 * intentionally quieter without introducing a new color. Contrast depends on the host surface this badge
 * sits on, since `muted` has no background fill of its own — verified against every surface it's realistically
 * placed on: `muted-foreground` reaches 4.73:1 on a plain white/`--background` surface, 4.53:1 on `--sidebar`
 * (the Rail Sidebar's own surface — barely clears the 4.5:1 AA threshold for normal-size text), and only
 * 4.34:1 on `--muted` (fails 4.5:1 AA). **Do not place a `muted` badge directly on a `bg-muted` surface** —
 * verify contrast against the actual host background before use, the same way this doc comment does, rather
 * than assuming the white-background figure applies everywhere. The hover state (`accent-foreground` on
 * `bg-accent`) is a comfortable 16.42:1 regardless of host surface, since hover replaces the background outright.
 *
 * Accessibility notes for consumers (not enforced by the component, since color usage is a per-instance
 * choice):
 * - Status badges convey meaning via color. Do not rely on color alone — pair with a text label (as in
 *   `<Badge variant="success">Active</Badge>`) or a leading icon for colorblind/low-vision users, not an
 *   unlabelled color chip.
 * - `Badge` renders a plain, non-interactive `<span>` by default and is not part of tab order. If used
 *   with `asChild` to render an interactive element (e.g. a linked status filter), the existing
 *   `focus-visible:` ring in the base recipe below applies automatically to every variant, status
 *   variants included — no extra work needed.
 * - Truncation: the base recipe adds `text-ellipsis` alongside the pre-existing `overflow-hidden
 *   whitespace-nowrap` so long badge text degrades gracefully (`"…"`) instead of hard-clipping when a
 *   consumer constrains badge width (e.g. `className="max-w-24"`), rather than deforming the pill shape.
 * - Minimum size: `w-fit shrink-0` (unchanged) keeps the pill from ever compressing below its own
 *   padding + text at any single character of content, so a status badge never collapses to an
 *   unreadable sliver even inside a shrinking flex row.
 *
 * `weight` (bidezine Adjustment, independent of `variant`): shadcn's own upstream `badge.tsx` hardcodes
 * `font-medium` unconditionally in its base recipe — that remains this component's default (`weight`
 * defaults to `"emphasis"`, i.e. `font-medium`), so every existing Badge usage keeps rendering exactly as
 * before and stays faithful to shadcn's own Reproduce baseline. `weight="regular"` (`font-normal`) is a
 * new opt-in, lighter alternative for contexts where a solid-fill status badge (`success`/`warning`/
 * `info`/`destructive` in particular) reads as too visually heavy next to surrounding body text set in
 * the same `font-normal` weight used elsewhere in the system (e.g. `Breadcrumb`, `Field`'s description
 * text) — pick `weight="regular"` for lower-emphasis inline status labels, and leave the default
 * (`"emphasis"`) for badges that need to visually stand out (e.g. a prominent count or an alert-level
 * status). This is a font-weight-only axis — it does not change color, size, or padding, and combines
 * with every `variant` value.
 *
 * **Guidance for an AI composing NEW Badge usage** (this does not change the prop's own default, which
 * stays `"emphasis"` for backward compatibility — see above): prefer `weight="regular"` unless the
 * surrounding context, a specific pill's semantic weight, or an explicit user instruction calls for the
 * bolder `"emphasis"` look. `"emphasis"` is a fully supported, valid choice — never disallowed — but it
 * should be a deliberate pick (the content genuinely needs to stand out: an alert-level status, a
 * prominent unread count) rather than the unexamined default for every new badge a task happens to add.
 * The Rail Sidebar's own panel-tree badges (`PanelBadge` in `FunctionalRailSidebar.tsx`) are the reference
 * example of this guidance in practice: `variant="muted" weight="regular"` by default (see L-6 in
 * `limbo-factory/src/data/rail-sidebar.ts`), reserving other variants/weights for when a badge's own
 * content or an explicit instruction specifically warrants it.
 *
 * `tone` (bidezine Adjustment, independent of `variant` and `weight`): a third orthogonal axis, opt-in via
 * `tone="soft"` (default remains `"solid"`, i.e. every existing usage of `success`/`warning`/`info`/
 * `destructive` renders exactly as before). `soft` is a lighter, tinted-background + saturated-text
 * treatment for the same four status colors, for contexts where a solid white-on-filled-color pill is too
 * visually loud (dense tables/lists with many badges, or badges sitting directly next to plain body text).
 * `default`/`secondary`/`outline`/`ghost`/`muted`/`link` do not participate in `tone` — they already have
 * their own established neutral/low-emphasis treatment and don't need a second "soft" register, so `tone`
 * is a silent no-op for those six (documented here rather than throwing, matching how e.g. `weight` is
 * already a no-op-in-effect for `link`, which has no font-weight-sensitive fill).
 *
 * **This is deliberately NOT implemented as `bg-{status}/N` opacity blended over the page background.**
 * An earlier variant of this system (`muted`, see above) uses that alpha-blend approach and, as a direct
 * result, has host-surface-dependent contrast — its own doc comment has to warn "do not place on
 * `bg-muted`" because the same badge measures differently depending on what's behind it. `soft` instead
 * uses eight brand-new, fully **opaque** tokens (`{status}-soft` / `{status}-soft-foreground` in
 * `tokens/light.tokens.json` / `tokens/dark.tokens.json`) — same hue angle as the existing solid
 * `{status}`/`{status}-foreground` tokens, but independently tuned L/C values, not a derived tint. Because
 * the background is opaque, the badge's own contrast is fixed and does not depend on the page/card/sidebar
 * surface behind it — this was the whole reason for the new tokens rather than reusing an alpha trick.
 *
 * Why new tokens were required, not just reusing the existing solid `{status}` color as text on a tinted
 * background: the solid tokens were tuned to hit ~4.9–5.2:1 against a *pure white* background (for
 * white-on-filled-color text). Verified numerically: even the lightest realistic tint of that same color
 * as its own background drops contrast below 3.5:1–4.4:1 for 3 of the 4 colors — there is no tint level
 * where the solid color re-passes AA against a tinted version of itself. A soft badge therefore needs a
 * separately-tuned, darker/more saturated text shade, which is exactly what `{status}-soft-foreground`
 * is — this mirrors the same "darker-shade text on pastel background" convention other systems use for
 * soft/subtle badges (e.g. a 700-text-on-50-bg register), reimplemented in bidezine's own OKLCH-authored
 * token vocabulary rather than copied from any external source.
 *
 * All eight pairs were verified for WCAG contrast (own script, OKLCH → linear sRGB → gamma sRGB →
 * WCAG relative luminance, not eyeballed) and all clear 7:1 (AAA for normal text, well above the 4.5:1 AA
 * floor), in both light and dark mode:
 * - light: destructive 7.05:1, success 7.04:1, warning 7.06:1, info 7.11:1
 * - dark: destructive 7.04:1, success 9.13:1, warning 8.31:1, info 7.24:1
 * Hover (`asChild` only) darkens the soft background slightly (`hover:bg-{status}-soft/90`) — the same
 * `/90`-on-hover convention the solid variants already use above, so this isn't a new pattern; contrast at
 * rest (the figures above) is what's guaranteed, hover is a transient interaction cue.
 *
 * Combines with every axis: `<Badge variant="success" tone="soft" weight="regular">` is valid and renders
 * the lightest, quietest version of a success pill; `tone="soft"` + `weight="emphasis"` (the default) is
 * the lighter-background equivalent of today's bold solid badges.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden text-ellipsis rounded-full border border-transparent px-2 py-0.5 text-xs whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // default/secondary/outline/ghost/muted/link have no solid/soft distinction (no fill to
        // lighten, or already low-emphasis) so their color classes live directly here and apply
        // regardless of `tone`. destructive/success/warning/info instead resolve to "" here — their
        // actual color classes are supplied entirely via the compoundVariants below, keyed on
        // (variant, tone), so a solid-vs-soft pair never has two conflicting bg-*/text-* utilities
        // present in the same class string at once.
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "",
        success: "",
        warning: "",
        info: "",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        muted:
          "text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
      tone: {
        // No shared classes — every actual visual difference lives in the compoundVariants below,
        // scoped per status color. For variant values that don't declare a compoundVariant match
        // (default/secondary/outline/ghost/muted/link), `tone` is a no-op: those variants render
        // identically regardless of `tone`, since they already have their own low-emphasis/neutral
        // treatment and don't need a second "soft" register.
        solid: "",
        soft: "",
      },
      weight: {
        regular: "font-normal",
        emphasis: "font-medium",
      },
    },
    compoundVariants: [
      {
        variant: "destructive",
        tone: "solid",
        class:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
      },
      {
        variant: "success",
        tone: "solid",
        class:
          "bg-success text-white focus-visible:ring-success/20 dark:bg-success/60 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/90",
      },
      {
        variant: "warning",
        tone: "solid",
        class:
          "bg-warning text-white focus-visible:ring-warning/20 dark:bg-warning/60 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/90",
      },
      {
        variant: "info",
        tone: "solid",
        class:
          "bg-info text-white focus-visible:ring-info/20 dark:bg-info/60 dark:focus-visible:ring-info/40 [a&]:hover:bg-info/90",
      },
      {
        variant: "destructive",
        tone: "soft",
        class:
          "bg-destructive-soft text-destructive-soft-foreground [a&]:hover:bg-destructive-soft/90",
      },
      {
        variant: "success",
        tone: "soft",
        class:
          "bg-success-soft text-success-soft-foreground [a&]:hover:bg-success-soft/90",
      },
      {
        variant: "warning",
        tone: "soft",
        class:
          "bg-warning-soft text-warning-soft-foreground [a&]:hover:bg-warning-soft/90",
      },
      {
        variant: "info",
        tone: "soft",
        class: "bg-info-soft text-info-soft-foreground [a&]:hover:bg-info-soft/90",
      },
    ],
    defaultVariants: {
      variant: "default",
      tone: "solid",
      weight: "emphasis",
    },
  }
)

function Badge({
  className,
  variant = "default",
  tone = "solid",
  weight = "emphasis",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-tone={tone}
      data-weight={weight}
      className={cn(badgeVariants({ variant, tone, weight }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
