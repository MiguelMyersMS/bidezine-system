import { useLayoutEffect, useRef, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ChevronDownIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@bidezine/system"
import { NEGATIVE_BADGE, POSITIVE_BADGE, WARNING_BADGE } from "@/lib/status-colors"

/**
 * The one card format — see `sandbox/REVIEW-CARD-SPEC.md` §3.
 *
 * ── There is exactly one kind of card now, and that took two goes ───────────────────
 * The first attempt gave blocking questions and risks their own card components, sharing
 * this shell but carrying no gate, no checklist and no approval control — because they
 * lived in a TypeScript file rather than the corpus. They looked like review cards and
 * could not be reviewed. Reported directly: everything has to go through the SAME process.
 *
 * The fix was not to give them convincing controls. A control that looks gated and is not
 * is the exact failure this system exists to refuse, and faking one here would have put it
 * in the one screen built to prevent it. The fix was to make them real rows — `Q1`–`Q4`
 * and `R-1`–`R-10` are ordinary divergences in the corpus now, so they get the real
 * checklist against the real gate and the real switch, by being the same thing rather than
 * by resembling it.
 *
 * The earlier objection — that `options` and `actionItems` have no column — was wrong, and
 * `origin_record` is why: it holds each source object verbatim, which is how M4 imported
 * 154 rows without flattening anything. Nothing was lost; it renders in the card's own
 * Imported record disclosure.
 *
 * So this shell has one consumer (`ReviewCard`). It stays a separate component anyway,
 * because the slot ORDER is the contract a human reads — ref, status, category, title,
 * description, reveal, checklist, control — and a second occupant's card must not be free
 * to reinvent it.
 */

export type ShellBadge = { label: string; tone?: "positive" | "negative" | "warning" | "muted" }

const TONE: Record<string, string | undefined> = {
  positive: POSITIVE_BADGE,
  negative: NEGATIVE_BADGE,
  warning: WARNING_BADGE,
}

export function ReviewCardShell({
  refCode,
  relations,
  badges,
  pill,
  label,
  prompt,
  detail,
  examples,
  selected,
  onSelect,
  attrs,
  children,
  actions,
}: {
  refCode: string
  /** Links to the rows this one is bound to — see `relations` on `CorpusDivergence`. */
  relations?: React.ReactNode
  badges: ShellBadge[]
  pill: string
  label: string
  /** The lead — what this row is about, in one or two sentences. */
  prompt?: string | null
  /** The long rationale, shown only once the description is expanded. One slot, two
   * depths: the lead answers "what am I being asked", the body answers "why". Keeping
   * them in one slot is what stops this becoming a ninth section. */
  detail?: string | null
  /**
   * The Current/Proposal comparison, revealed by the same control that unclamps the
   * description. One disclosure governs both, so the card keeps its eight slots rather than
   * growing a ninth — and a reviewer opens one thing to see everything about the claim.
   */
  examples?: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  /** Extra data-* attributes so checks can scope to a card without a class-name guess. */
  attrs?: Record<string, string>
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const text = prompt ?? ""
  const body = detail && detail !== text ? detail : ""

  /**
   * Whether the description is ACTUALLY clipped — measured, never guessed.
   *
   * ── The bug this replaces ──────────────────────────────────────────────────────────
   * The control used to appear when `text.length > 200`. The clamp is `line-clamp-3`,
   * which is three lines at whatever width the card happens to have — so the two
   * disagreed the moment the window was not the width they were tuned at. Reported from
   * a real screenshot, then measured at a 316px description: **40 of 169 cards were
   * clipped with no way to expand**, including eight of the eleven rows asking for a
   * decision. A card that ends mid-sentence with no control is not a small styling
   * defect; it is a review surface that cannot be reviewed.
   *
   * `detail` is not passed by `ReviewCard` (resolution history does not belong on a
   * card), so `body` is empty in practice and the test reduced to the character count
   * plus `examples` — and `examples` only exists for icon/colour/type visuals. Every row
   * with a `shape`, `motion`, `elevation` or `zindex` visual therefore had nothing but
   * the 200-char guess standing between it and being unreadable.
   *
   * This is the same defect class as `SC.UNCONDITIONAL-SCROLLBAR-GAP` and L-26: a
   * width-dependent condition decided from a static value. CLAUDE.md's scroll protocol
   * already requires the fix — gate on a live `scrollHeight > clientHeight` reading,
   * re-checked on resize. It applies here for the same reason.
   */
  const textRef = useRef<HTMLParagraphElement>(null)
  const [clipped, setClipped] = useState(false)

  useLayoutEffect(() => {
    const el = textRef.current
    // While expanded the clamp is gone, so nothing overflows and this would read false —
    // which would remove the control that collapses it again. Measure only when clamped;
    // `expanded` keeps the control alive on its own, below.
    if (!el || expanded) return
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, expanded])

  const expandable = expanded || clipped || body.length > 0 || !!examples

  return (
    <Card
      {...attrs}
      onClick={onSelect}
      className={cn(
        "gap-3 py-4 transition-colors",
        onSelect && "cursor-pointer",
        selected && "border-foreground ring-1 ring-foreground",
      )}
    >
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          {/* The ref, and the rows this one is bound to. Relations live in the IDENTITY
              slot rather than becoming a ninth section: "which row is this, and what is it
              part of" is one question, and a subject with its satellites is one piece of
              work counted three times until you can see the link. */}
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <code className="text-xs text-muted-foreground">{refCode}</code>
            {relations}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {badges.map((b) => (
              <Badge
                key={b.label}
                className={b.tone ? TONE[b.tone] : undefined}
                variant={b.tone && TONE[b.tone] ? undefined : "secondary"}
              >
                {b.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Badge variant="outline" className="font-normal">
            {pill}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm font-medium">{label}</p>

        {/* Description and disclosure are SIBLINGS, not nested. An earlier version put the
            examples inside the `text ?` branch, so a row with a comparison but no written
            description — which is most rows carrying one — would have shown neither the
            blocks nor a control to reveal them. The absence of a description must not
            suppress everything else the card knows. */}
        {text ? (
          <>
            <p ref={textRef} className={cn("text-xs text-muted-foreground", !expanded && "line-clamp-3")}>{text}</p>
            {expanded && body ? (
              <p className="mt-2 text-xs whitespace-pre-line text-muted-foreground">{body}</p>
            ) : null}
          </>
        ) : (
          // Stated, not substituted. The old fallback rendered the imported resolution
          // history here, which made 169 cards look described while none of them were —
          // and put an account of a settled decision where the ask belongs.
          <p className="text-xs text-muted-foreground italic">
            No review description written yet — nobody has said what needs deciding here or why.
          </p>
        )}

        {/* `min-w-0` because THIS is the grid item.
            `CardHeader` is a CSS grid, and a grid item's default `min-width: auto` sizes it
            to its content's min-content. The comparison block's spec line carries
            `truncate`, whose `white-space: nowrap` makes min-content the WHOLE string — so
            an untruncated spec sized the grid column, every sibling in the header stretched
            to match, and the card's own description painted past its border.
            Putting `min-w-0` on the block's own wrapper is not enough: the item has to be
            allowed to shrink, not just its child. Measured on G-1 at a 300px card — header
            children 444px, overflowing by 161px. */}
        {expanded && examples ? <div className="min-w-0">{examples}</div> : null}

        {expandable ? (
          <div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((v) => !v)
              }}
            >
              {expanded ? "Hide details" : "Show details"}
            </Button>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {children}
        {actions}
      </CardContent>
    </Card>
  )
}

/** The collapsible progress section every card type uses, so `2/4` on a divergence and
 * `2/2 done` on a risk sit in the same place and read the same way. */
export function ShellProgress({
  title,
  count,
  children,
}: {
  title: string
  count: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-between px-2 text-xs font-normal"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex items-center gap-1">
            <ChevronDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            {title}
          </span>
          <span className="text-muted-foreground">{count}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
