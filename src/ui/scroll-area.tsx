"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Authoring note — the "two-layer scroll region" pattern.
 *
 * Unlike a native `overflow-y-auto` scrollbar (which the browser reserves its own layout space
 * for automatically), `ScrollBar` below is an absolutely-positioned overlay (`position: absolute`,
 * anchored to `Root`'s own edge) — it does not participate in flex/grid sizing and can silently
 * overlap whatever content sits at that same edge if nothing accounts for it.
 *
 * Whenever a consumer composes `ScrollArea` inside its own padded container, use two layers, not
 * one:
 *   1. An OUTER element that owns the container's own padding (uniform on all sides) and the
 *      `flex-1 overflow-hidden` sizing/clipping — `ScrollArea`'s own `Root` does not set an
 *      `overflow` of its own, so a flex parent needs this outer wrapper (or `ScrollArea` itself,
 *      if it's the direct flex child) to get CSS flexbox's "automatic minimum size: 0" treatment;
 *      without it, the scroll region grows to fit its content instead of clipping to the
 *      available space.
 *   2. An INNER content wrapper (the direct child rendered inside `ScrollArea`) that reserves an
 *      EXTRA gutter on the scrollbar's own side (e.g. a wider `pr-*` than the other sides) so real
 *      content never sits flush against — or under — the scrollbar thumb.
 *
 * Verify both relationships with real measurements after wiring this up, not a screenshot glance:
 * the gap between the outer container's own edge and the scrollbar, AND the gap between the
 * scrollbar and the inner content, are two independent relationships that must each be checked
 * (a fix for one does not verify the other).
 */
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
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
