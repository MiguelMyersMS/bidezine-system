import { useEffect, useState } from "react"

/**
 * Explicit overflow-fit contract for a vertical, single-column list of equal-height rows (see
 * divergence row M-6 in rail-sidebar.ts for the full history/root-cause writeup).
 *
 * This hook answers exactly one question — "given the container's current pixel height, how many
 * rows can physically render without clipping?" — and nothing else. It deliberately does NOT decide
 * how a caller should use that number (e.g. whether the last visible slot must be reserved for an
 * overflow trigger button): that's app-specific business logic and stays in the consumer.
 *
 * Explicit contract (replaces the previous implicit assumptions):
 * 1. Rows are located via `rowSelector` — an explicit, author-chosen `data-*` attribute selector
 *    (e.g. `"[data-rail-row]"`), never a generic tag selector like `"button"`. A tag selector
 *    silently matches the FIRST element of that tag in the container, which may not be a real row
 *    at all once the container's children change (e.g. an overflow-trigger button rendered before
 *    any real row). An explicit marker makes the measured element unambiguous and self-documenting.
 * 2. `maxVisible` is a hard ceiling (default 7): even when a taller container could physically fit
 *    more rows, the returned count never exceeds this value. This turns "how many rows show" into an
 *    explicit, testable contract instead of an implicit "whatever fits today" behavior that silently
 *    changes if the container is ever resized larger.
 * 3. The returned count is always `>= 1` (via `Math.max(1, ...)`) — a container that can't fit even
 *    one full row still renders one, rather than silently rendering zero rows with no visible error.
 * 4. Recalculated on every `ResizeObserver` tick against `containerRef`'s element, so this contract
 *    self-corrects on window resize / parent layout changes / font-size changes, not just once at
 *    mount.
 *
 * This hook intentionally has no opinion about scrolling: per the overflow-fit contract (M-6), the
 * container this hook measures should never itself need to scroll — items that don't fit are the
 * caller's responsibility to stash into an overflow affordance (e.g. a "More" menu). If more space is
 * genuinely needed for the STASHED items, the standard shared-primitive scrolling mechanism already
 * fulfils that (see e.g. `DropdownMenuContent`, which already caps at
 * `--radix-dropdown-menu-content-available-height` and composes a real `ScrollArea` internally per
 * CLAUDE.md's Scroll region protocol) — no bespoke scrolling logic is needed here.
 */
export function useOverflowFit({
  containerRef,
  rowSelector,
  itemCount,
  maxVisible = 7,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  rowSelector: string
  itemCount: number
  maxVisible?: number
}): { fitCount: number } {
  const [fitCount, setFitCount] = useState(Math.min(itemCount, maxVisible))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const recalc = () => {
      const rowEl = container.querySelector<HTMLElement>(rowSelector)
      if (!rowEl) return
      const rowHeight = rowEl.getBoundingClientRect().height
      const rowGap = parseFloat(getComputedStyle(container).rowGap || "0") || 0
      const usableHeight = container.clientHeight
      if (rowHeight <= 0) return

      // Walk one row at a time (rather than a single divide-by-constant formula) so the result
      // reads as its own, independently-derived count rather than an approximation.
      let count = 0
      let consumed = 0
      const ceiling = Math.min(itemCount, maxVisible)
      while (count < ceiling) {
        const next = consumed + (count === 0 ? rowHeight : rowHeight + rowGap)
        if (next > usableHeight) break
        consumed = next
        count += 1
      }
      setFitCount(Math.max(1, count))
    }

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, rowSelector, itemCount, maxVisible])

  return { fitCount }
}
