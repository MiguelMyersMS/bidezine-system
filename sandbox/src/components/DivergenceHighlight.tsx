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

/**
 * Dims everything except the subject, using four rects around it rather than an overlay
 * with a hole.
 *
 * `pointer-events: none` on every piece, for the same reason the ring is: M5's own "done
 * when" requires the highlighted region to stay hoverable, clickable and resizable. A mask
 * that swallowed a pointer would satisfy "show me which one" by breaking "let me poke it".
 *
 * A `box-shadow: 0 0 0 100vmax` spread would be one element instead of four, but it paints
 * over the WHOLE viewport including the divergence list on the left — the thing you are
 * reading while you look. Four rects clip to the preview's own box.
 */
function Scrim({ rect, within }: { rect: Rect; within: Rect }) {
  const parts: Rect[] = [
    { top: within.top, left: within.left, width: within.width, height: Math.max(0, rect.top - within.top) },
    {
      top: rect.top + rect.height,
      left: within.left,
      width: within.width,
      height: Math.max(0, within.top + within.height - (rect.top + rect.height)),
    },
    { top: rect.top, left: within.left, width: Math.max(0, rect.left - within.left), height: rect.height },
    {
      top: rect.top,
      left: rect.left + rect.width,
      width: Math.max(0, within.left + within.width - (rect.left + rect.width)),
      height: rect.height,
    },
  ]
  return (
    <>
      {parts.map((p, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none fixed z-40 bg-background/70"
          style={{ top: p.top, left: p.left, width: p.width, height: p.height }}
        />
      ))}
    </>
  )
}

/**
 * What the claim is about, keyed by property type — migration 010's own design constraint:
 * "only the RENDERING varies, keyed by property type. That is what keeps 154 rows from
 * becoming 154 bespoke visualisations."
 *
 * Three types are rendered because three types have rows: `length` (15), `text` (6),
 * `keyword` (3). `color`, `time` and `layer` have ZERO declared rows in the corpus despite
 * 23 colour and 8 motion divergences existing as prose, so a renderer for them would be
 * written against nothing and verified against nothing. They fall through to the generic
 * label — visibly, so the gap shows rather than being papered over.
 */
function Callout({ declaration }: { declaration: Declaration }) {
  const { properties, relation, subjectState, subjects } = declaration
  const names = properties.map((p) => p.property).join(" · ")

  // The DOMINANT type, not `properties[0]`. Properties arrive sorted by name, so taking the
  // first one picked whichever type happened to sort earliest — F-1 read "computed value"
  // because `box-sizing` precedes three length properties it is mostly about. Measured, not
  // reasoned: the live payload is what showed it.
  const counts = new Map<string, number>()
  for (const p of properties) counts.set(p.type, (counts.get(p.type) ?? 0) + 1)
  const [type] = [...counts.entries()].sort((a, z) => z[1] - a[1])[0] ?? []
  const mixed = counts.size > 1

  // `relation` is what makes a claim relational — NOT having two subjects. Two subjects
  // usually means the SAME element on both sides (`side` is bidezine|origin), which is a
  // comparison, not a gap between two things. F-2 has two subjects and no relation; F-4,
  // F-9 and F-11 have a relation and zero subjects, because the runner cannot express them
  // yet (scripts/check-declarations.mjs reports exactly those three).
  const named = subjects.filter((s) => s.side === "bidezine").map((s) => s.label)
  const lead = relation
    ? `${relation}${named.length > 1 ? ` between ${named.join(" and ")}` : ""}`
    : type === "length"
      ? "measured on this element"
      : type === "text"
        ? "text rendering on this element"
        : type === "keyword"
          ? "computed value on this element"
          : "declared on this element"

  return (
    <div className="pointer-events-none absolute top-full left-0 mt-1 max-w-[22rem] rounded-md border bg-popover px-2 py-1.5 text-popover-foreground shadow-md">
      <p className="text-[10px] text-muted-foreground">
        {lead}
        {/* Said out loud rather than picking a winner silently. A row asserting both a
            length and a keyword is genuinely two kinds of claim, and flattening it to one
            noun is how a reviewer decides the wrong question. */}
        {mixed && <span> · {[...counts.keys()].join(" + ")}</span>}
      </p>
      <p className="font-mono text-[11px] leading-tight">{names}</p>
      {/* Stated only when it is not the default. `subject_state` is `rest` on 9 rows and
          NULL on 145 — printing "rest" on everything would be noise pretending to be
          information. */}
      {subjectState && subjectState !== "rest" && (
        <p className="text-[10px] text-muted-foreground">in the {subjectState} state</p>
      )}
    </div>
  )
}

export type Declaration = {
  subjects: { ordinal: number; side: string; anchorId: string | null; selector: string | null; label: string }[]
  properties: { property: string; type: string }[]
  relation: string | null
  subjectState: string | null
}

export function DivergenceHighlight({
  activeRef,
  declaration,
}: {
  activeRef: string | null
  declaration?: Declaration | null
}) {
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

  // The scrim is clipped to the preview stage rather than the viewport, so the list you are
  // reading on the left never dims. A missing stage means no scrim at all rather than a
  // full-screen one — degrading to the plain ring is correct; dimming the whole app because
  // one selector did not match is not.
  const stageEl = document.querySelector("[data-preview-stage]")
  const stage = stageEl?.getBoundingClientRect()
  const within: Rect | null = stage
    ? { top: stage.top, left: stage.left, width: stage.width, height: stage.height }
    : null

  return (
    <>
      {within && <Scrim rect={rect} within={within} />}
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
      {/* Only when the row actually declares something. 7 of 154 do, and inventing a
          callout for the rest would describe a claim nobody has made. */}
      {declaration && declaration.properties.length > 0 && <Callout declaration={declaration} />}
    </div>
    </>
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
