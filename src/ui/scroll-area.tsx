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
 * The inner gutter must be CONDITIONAL, not a fixed always-on class.
 *
 * A gutter reserved unconditionally (a bare `pe-2` on the inner content, present whether or not
 * there's actually anything to scroll) leaves dead empty space on the scrollbar's side any time the
 * content happens to fit without overflowing — visible, unnecessary, and easy to miss in a quick
 * screenshot check since it just looks like "a bit of extra padding," not an obvious bug. The
 * origin design system this pattern was ported from names this exact anti-pattern explicitly
 * (`SC.UNCONDITIONAL-SCROLLBAR-GAP`) and guards against it with a real overflow measurement
 * (`el.scrollHeight > el.clientHeight`, re-checked via `ResizeObserver`), applying the gutter only
 * when that's true. `ScrollArea` below reproduces that check itself and exposes it through
 * `useScrollAreaOverflow()` (a React Context hook) — call it inside a consumer's own content
 * wrapper and apply the gutter conditionally in JS: `className={cn(scrollableY && "pe-2")}`.
 *
 * Use the Context hook, NOT a CSS `group`/`data-*` attribute selector, for this. `Root` DOES also
 * carry `data-scrollable-y`/`data-scrollable-x` DOM attributes (handy for tests/debugging), but a
 * Tailwind `group-data-[scrollable-y=true]/scroll-area:` variant compiles to a plain CSS descendant
 * combinator (`:is(:where(.group\/scroll-area)[data-scrollable-y=true] *)`) that matches ANY
 * ancestor sharing that class+attribute — not specifically the *nearest* one. Every `ScrollArea`
 * instance shares the same `group/scroll-area` class name, so nesting one `ScrollArea` inside
 * another (e.g. a component demo's own `ScrollArea` living inside this site's page-level
 * `ScrollArea`, which is almost always scrollable) leaks the OUTER instance's overflow state into
 * the INNER one's conditional class, even though they're functionally unrelated. This was a real,
 * shipped bug: every migrated component's conditional gutter silently stayed "on" everywhere on the
 * showcase site, masked only because it was never tested with a genuinely non-scrollable outer page.
 * React Context does not have this problem — a `useContext` call always resolves to the *nearest*
 * enclosing `Provider`, which is exactly the semantics this needs.
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
 *
 * Internal implementation note — why `Viewport`'s own direct child is forced to `!block`.
 *
 * Radix's `ScrollAreaViewport` renders exactly one direct child of its own: an internal, unstyled
 * div with an INLINE `style={{ minWidth: '100%', display: 'table' }}` (see
 * `@radix-ui/react-scroll-area`'s own source — this div is not exposed as a prop/slot we can
 * configure, only reachable via a `[&>div]` child selector on `Viewport`'s own className). Radix
 * chose `display: table` deliberately: a table-formatting-context box computes its own preferred
 * width from its content's max-content size (the same algorithm an actual `<table>` uses to size
 * its columns), which is what lets `ScrollArea` support a genuinely wide, horizontally-scrollable
 * child (e.g. a wide `<table>` or `<pre>`) — the table wrapper grows to that content's natural
 * width even when it exceeds the viewport, and the *viewport's own* `overflowX: scroll` (set
 * whenever a horizontal `ScrollBar` is rendered) then lets the user scroll to see the overflow.
 *
 * This system's own `ScrollArea` (this file) never renders a horizontal `ScrollBar` — grep
 * confirms zero real usages of `<ScrollBar orientation="horizontal">` anywhere in `src/ui/*.tsx` —
 * so `context.scrollbarXEnabled` is always `false` here and the Viewport's inline style is always
 * `overflowX: 'hidden'`. That makes the table wrapper's whole reason for existing moot for every
 * real consumer of this component: instead of enabling a deliberate horizontal-scroll experience,
 * it silently lets any row wider than the viewport (e.g. a flex row with a `shrink-0` trailing
 * badge next to a `truncate` label, once the label has already shrunk to its own zero-width floor)
 * grow the whole table 20+px past the viewport's real clientWidth — content that then gets
 * invisibly clipped by `overflowX: hidden` with NO ellipsis and NO scrollbar, because clipping
 * happens at the OUTER viewport edge, not at each row's own boundary the way a normal block
 * layout would clip/truncate. Confirmed live via Playwright + `getBoundingClientRect`: a rail-nav
 * row ("Sport and fitness" + an "Update" badge) measured `scrollWidth: 242` against the viewport's
 * own `clientWidth: 222` — a real 20px horizontal overflow, with the badge's right edge landing
 * directly under the vertical scrollbar's own track, exactly matching a user report of "rows get
 * truncated overlapping the scrolling area."
 *
 * Fixed by forcing that internal wrapper's `display` from `table` to `block` via a `[&>div]:!block`
 * child selector (the `!` compiles to `!important`, which DOES win over Radix's own inline
 * `style="display: table"` per the CSS cascade — author `!important` outranks a plain inline
 * style). A block box's width is simply its containing block's content-box width (the Viewport,
 * itself `w-full`) — not a function of its children's content — so every row's own `truncate`/
 * `overflow-hidden` now clips/ellipsizes against that same fixed, correct width instead of the
 * table wrapper silently growing to accommodate whichever row happens to be widest. Radix's own
 * inline `minWidth: '100%'` is left untouched (harmless once `display` is `block`; it still just
 * guarantees the wrapper doesn't shrink below its container). If a future consumer genuinely needs
 * horizontal scrolling (rendering a horizontal `ScrollBar`), do NOT reuse this shared `ScrollArea`
 * as-is for that case — the forced `!block` here is only correct because zero real consumers rely
 * on the table wrapper's content-based width today; revisit this note first.
 */
type ScrollAreaOverflow = { scrollableY: boolean; scrollableX: boolean }

const ScrollAreaOverflowContext = React.createContext<ScrollAreaOverflow>({
  scrollableY: false,
  scrollableX: false,
})

/**
 * Reads the nearest enclosing `ScrollArea`'s real overflow state — use this (not a CSS `group-data-*`
 * selector) to conditionally apply the scrollbar-side gutter on a `ScrollArea`'s own inner content.
 * See the "two-layer scroll region" note above for why the CSS-selector approach is unsound whenever
 * `ScrollArea` instances nest (which happens site-wide here, since every page's own content already
 * lives inside a page-level `ScrollArea`).
 */
function useScrollAreaOverflow(): ScrollAreaOverflow {
  return React.useContext(ScrollAreaOverflowContext)
}

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [scrollableY, setScrollableY] = React.useState(false)
  const [scrollableX, setScrollableX] = React.useState(false)

  React.useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const check = () => {
      setScrollableY(node.scrollHeight > node.clientHeight)
      setScrollableX(node.scrollWidth > node.clientWidth)
    }

    check()
    // Watch both the viewport itself (its own box can resize) and its content (the content can
    // grow/shrink — e.g. items added/removed, search filtering — without the viewport resizing).
    const observer = new ResizeObserver(check)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => observer.disconnect()
  }, [children])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-scrollable-y={scrollableY}
      data-scrollable-x={scrollableX}
      className={cn("relative flex flex-col", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="min-h-0 w-full flex-1 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-focus focus-visible:ring-ring/50 focus-visible:outline-1 [&>div]:!block"
      >
        <ScrollAreaOverflowContext.Provider value={{ scrollableY, scrollableX }}>
          {children}
        </ScrollAreaOverflowContext.Provider>
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

export { ScrollArea, ScrollBar, useScrollAreaOverflow }
