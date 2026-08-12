import { useEffect, useState } from "react"

/**
 * M5 step 3 — click a divergence, see the exact region light up in the live component.
 *
 * Two constraints shape the whole design, and both come straight from M5's own "done when" list:
 *
 * 1. **"You can hover, click and resize that region and watch the behaviour."** So the highlight
 *    must never intercept a pointer. It is rendered as a separate, `position: fixed`,
 *    `pointer-events: none` overlay rather than by adding an outline to the anchored element
 *    itself.
 * 2. **The component under review must not be perturbed by being looked at.** Styling the anchored
 *    element directly would change its own computed style and box — the exact properties
 *    `verifier/run-checks.mjs` measures. A highlight that altered the subject would make the
 *    evidence and the UI disagree about the same element. Drawing beside it, never on it, keeps
 *    the measurement honest.
 */

/** Where the overlay is drawn, in viewport coordinates — the same space `getBoundingClientRect`
 * reports, which is why the overlay is `position: fixed` rather than absolutely positioned inside
 * some ancestor whose own offsets would have to be subtracted back out. */
type Rect = { top: number; left: number; width: number; height: number }

function rectOf(ref: string): Rect | null {
  const matches = document.querySelectorAll(`[data-divergence="${ref}"]`)
  // Ambiguity is treated exactly as the runner treats it: a failure, not something to resolve by
  // taking the first match. Highlighting whichever element happened to come first is how a human
  // ends up confidently looking at the wrong subject.
  if (matches.length !== 1) return null
  const r = matches[0].getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null // present but not rendered (e.g. display:none)
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export function DivergenceHighlight({ activeRef }: { activeRef: string | null }) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!activeRef) {
      setRect(null)
      return
    }

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setRect(rectOf(activeRef)))
    }
    measure()

    // The region moves for reasons that are not re-renders of this component: the panel is
    // resizable by drag, the rail re-flows its own pinned/stashed split via ResizeObserver, and
    // the surrounding quadrant scrolls. Each of those is watched rather than assumed away —
    // `scroll` with capture:true because the scrolling element is a descendant ScrollArea
    // viewport, not the window, so a non-capturing window listener would never fire.
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)

    const target = document.querySelector(`[data-divergence="${activeRef}"]`)
    const ro = target ? new ResizeObserver(measure) : null
    if (target && ro) ro.observe(target)

    // Catches the anchored element being unmounted or replaced entirely — a tree row inside a
    // collapsed group, for instance, genuinely leaves the DOM.
    const mo = new MutationObserver(measure)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-divergence", "style", "class"] })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
      ro?.disconnect()
      mo.disconnect()
    }
  }, [activeRef])

  if (!activeRef || !rect) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      {/* `--ring` rather than a new colour: it is this system's own existing token for "this is the
          element being attended to", already used by every focus-visible state. Per CLAUDE.md
          checklist item 26, reuse the token that already means this rather than inventing one. */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: "0 0 0 2px var(--ring), 0 0 0 6px color-mix(in oklab, var(--ring) 25%, transparent)" }}
      />
      <span
        className="absolute -top-5 left-0 rounded-sm px-1 text-[10px] font-medium leading-4 whitespace-nowrap"
        style={{ background: "var(--ring)", color: "var(--background)" }}
      >
        {activeRef}
      </span>
    </div>
  )
}

/**
 * Which divergence refs are actually anchored in the live DOM right now.
 *
 * Read from the DOM rather than kept as a hand-maintained list, so it cannot drift: a row is
 * offered as highlightable if and only if something on screen genuinely carries its attribute.
 * That also makes anchoring coverage visible in the UI for free — the gap between 154 rows and the
 * handful that light up is the real state of the work, not something to be reported separately.
 */
export function useAnchoredRefs(): Set<string> {
  const [refs, setRefs] = useState<Set<string>>(new Set())

  useEffect(() => {
    let frame = 0
    const scan = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const found = new Set<string>()
        for (const el of document.querySelectorAll("[data-divergence]")) {
          const v = el.getAttribute("data-divergence")
          if (v) found.add(v)
        }
        setRefs((prev) => {
          if (prev.size === found.size && [...prev].every((r) => found.has(r))) return prev
          return found
        })
      })
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-divergence"] })
    return () => {
      cancelAnimationFrame(frame)
      mo.disconnect()
    }
  }, [])

  return refs
}
