"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Authoring note — the "two-layer scroll region" pattern.
 *
 * `ScrollBar` below is an absolutely-positioned overlay (`position: absolute`, anchored to `Root`'s
 * own edge) — it does not participate in flex/grid sizing and can silently overlap whatever content
 * sits at that same edge if nothing accounts for it. (This differs from a plain native
 * `overflow-y-auto` scrollbar, which the browser reserves its own layout space for automatically —
 * `scrollbar-gutter: stable` reserves space for that native case, but has no reliable effect on this
 * component's own custom, absolutely-positioned track.)
 *
 * Whenever a consumer composes `ScrollArea` inside its own padded container, use two layers, not
 * one:
 *   1. An OUTER element that owns the container's own padding (uniform on all sides) and makes the
 *      region actually shrink to the available space: give it `min-h-0` (overriding a flex item's
 *      default automatic minimum size) plus a non-`visible` `overflow` so excess content is clipped
 *      rather than spilling past the box. `overflow-hidden` conveniently satisfies both at once
 *      (non-`visible` overflow also zeroes the automatic minimum size), but they're two distinct
 *      requirements if you're composing this some other way. `ScrollArea`'s own `Root` sets no
 *      `overflow` itself, so this has to come from somewhere in the chain.
 *   2. An INNER content wrapper (the direct child rendered inside `ScrollArea`) that reserves an
 *      EXTRA gutter on the scrollbar's own side (e.g. a wider end-side padding than the other sides)
 *      so real content never sits flush against — or under — the scrollbar thumb. Use a logical
 *      end-side utility (`pe-*`), not a fixed physical side, if this ever needs to support RTL.
 *
 * Verify both relationships with real measurements after wiring this up, not a screenshot glance:
 * the gap between the outer container's own edge and the scrollbar, AND the gap between the
 * scrollbar and the inner content, are two independent relationships that must each be checked
 * (a fix for one does not verify the other).
 *
 * Internal implementation note — why `Viewport` is `w-full flex-1 min-h-0`, not `size-full`.
 *
 * `Root` is a flex column and `Viewport` sizes its height via flex-grow, not a percentage height
 * (width still comes from an explicit `w-full`, since flex's default `align-items: stretch` is what
 * used to supply it implicitly — an explicit class is more robust against a consumer overriding
 * `Root`'s own `align-items`). This matters whenever `Root` itself is capped with `max-height` rather
 * than a fixed `height` (exactly the case for a Radix popper/menu content element, whose available
 * height is a dynamic `max-height` CSS var) — a plain CSS percentage height only reliably resolves
 * against an ancestor with a genuinely *definite* height per spec, and a `max-height`-clamped
 * auto-sizing box does not reliably count as definite even when its rendered pixel value is concrete.
 * Verified empirically: with `Viewport` sized via `size-full` (percentage), nesting `ScrollArea` inside
 * a `max-h-(--some-var)` ancestor left `Viewport` at its unclipped natural content height — the
 * surrounding box visually clipped the overflow via `overflow-hidden`, but `Viewport` itself never
 * became internally scrollable (`scrollTop` was inert). Flex-based sizing (`flex-1 min-h-0`) sidesteps
 * that percentage-resolution question entirely by letting the flex algorithm distribute the already-
 * constrained space directly, so it works identically whether the ancestor's height came from an
 * explicit `height` or from a `max-height`-clamped auto box.
 */
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative flex flex-col", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="min-h-0 w-full flex-1 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
