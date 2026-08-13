import { useState } from "react"
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
  badges,
  pill,
  label,
  prompt,
  detail,
  selected,
  onSelect,
  attrs,
  children,
  actions,
}: {
  refCode: string
  badges: ShellBadge[]
  pill: string
  label: string
  /** The lead — what this row is about, in one or two sentences. */
  prompt?: string | null
  /** The long rationale, shown only once the description is expanded. One slot, two
   * depths: the lead answers "what am I being asked", the body answers "why". Keeping
   * them in one slot is what stops this becoming a ninth section. */
  detail?: string | null
  selected?: boolean
  onSelect?: () => void
  /** Extra data-* attributes so checks can scope to a card without a class-name guess. */
  attrs?: Record<string, string>
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const text = prompt ?? ""
  // Only worth an expand control if there is genuinely more to read — either the lead is
  // long enough to be clamped, or a body exists behind it.
  const body = detail && detail !== text ? detail : ""
  const expandable = body.length > 0 || text.length > 200

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
          <code className="text-xs text-muted-foreground">{refCode}</code>
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

        {text ? (
          <div>
            <p className={cn("text-xs text-muted-foreground", !expanded && "line-clamp-3")}>{text}</p>
            {expanded && body && (
              <p className="mt-2 text-xs whitespace-pre-line text-muted-foreground">{body}</p>
            )}
            {/* Real rationale on a real row reaches 5,773 characters. An excerpt with an
                expand is the only honest way to show that without burying the decision. */}
            {expandable && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-6 px-2 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((v) => !v)
                }}
              >
                {expanded ? "Show less" : "Read the full rationale"}
              </Button>
            )}
          </div>
        ) : (
          // Stated, not substituted. The old fallback rendered the imported resolution
          // history here, which made 169 cards look described while none of them were —
          // and put an account of a settled decision where the ask belongs.
          <p className="text-xs text-muted-foreground italic">
            No review description written yet — nobody has said what needs deciding here or why.
          </p>
        )}
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
