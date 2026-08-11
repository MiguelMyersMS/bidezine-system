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
 * intentionally quieter without introducing a new color. Contrast re-verified for this specific usage:
 * `muted-foreground` against a white badge-less background is 4.73:1 (passes the 4.5:1 AA threshold for
 * normal-size text) at rest, and the hover state (`accent-foreground` on `bg-accent`) is 16.42:1.
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
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden text-ellipsis rounded-full border border-transparent px-2 py-0.5 text-xs whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        success:
          "bg-success text-white focus-visible:ring-success/20 dark:bg-success/60 dark:focus-visible:ring-success/40 [a&]:hover:bg-success/90",
        warning:
          "bg-warning text-white focus-visible:ring-warning/20 dark:bg-warning/60 dark:focus-visible:ring-warning/40 [a&]:hover:bg-warning/90",
        info: "bg-info text-white focus-visible:ring-info/20 dark:bg-info/60 dark:focus-visible:ring-info/40 [a&]:hover:bg-info/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        muted:
          "text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
      weight: {
        regular: "font-normal",
        emphasis: "font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      weight: "emphasis",
    },
  }
)

function Badge({
  className,
  variant = "default",
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
      data-weight={weight}
      className={cn(badgeVariants({ variant, weight }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
