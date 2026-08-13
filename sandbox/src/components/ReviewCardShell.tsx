import { useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from "@bidezine/system"
import { NEGATIVE_BADGE, POSITIVE_BADGE, WARNING_BADGE } from "@/lib/status-colors"
import type { DecisionQuestion, RiskNote } from "@/data/rail-sidebar"
import { isRiskResolved } from "@/data/rail-sidebar"

/**
 * The one card format every reviewable thing uses — see `sandbox/REVIEW-CARD-SPEC.md` §3.
 *
 * Consolidating seven tabs into one view is only half the job: putting three different
 * visual languages under one tab is a tab bar with extra steps. A divergence, a blocking
 * question and a risk are all "a thing with an id, a state, a human-readable ask, and some
 * detail you open when deciding" — so they get one shell, and only the body differs.
 *
 * What each type puts in the same slots:
 *
 * | slot     | divergence            | question                  | risk                     |
 * |----------|-----------------------|---------------------------|--------------------------|
 * | ref      | `F-3`                 | `Q1`                      | `R-1`                    |
 * | badge    | gate-derived          | decided / awaiting you    | all items done / not     |
 * | pill     | its corpus category   | `question`                | `risk`                   |
 * | progress | gate checklist, n/4   | options, one chosen       | action items, n/m done   |
 * | body     | evidence + surfaces   | the options               | action items, as links   |
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
  prompt?: string | null
  selected?: boolean
  onSelect?: () => void
  /** Extra data-* attributes so checks can scope to a card without a class-name guess. */
  attrs?: Record<string, string>
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const text = prompt ?? ""

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

        {text && (
          <div>
            <p className={cn("text-xs text-muted-foreground", !expanded && "line-clamp-3")}>{text}</p>
            {/* Real rationale on a real row reaches 5,773 characters. An excerpt with an
                expand is the only honest way to show that without burying the decision. */}
            {text.length > 200 && (
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

/**
 * A reference to another card, rendered as a link to it rather than as restated text.
 *
 * This is the de-duplication. A risk's action items cite the divergences that satisfy them
 * — 25 distinct ids across the register (`A-1`, `F-3`, `H-1`…`H-6`, `M-13`…`M-19`, and
 * more) — every one of which is already a card in the same view. Repeating their content
 * inside the risk would put the same decision on screen twice with two chances to drift.
 * Citing and linking keeps one copy.
 */
function RefLink({ refCode, onGoTo }: { refCode: string; onGoTo?: (ref: string) => void }) {
  const known = /^[A-Z]-\d+/.test(refCode)
  if (!known || !onGoTo) return <Badge variant="outline" className="font-mono text-[10px]">{refCode}</Badge>
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-5 px-1.5 font-mono text-[10px]"
      onClick={(e) => {
        e.stopPropagation()
        onGoTo(refCode)
      }}
    >
      {refCode}
    </Button>
  )
}

/**
 * A blocking question, in the shared format.
 *
 * Not in the corpus, so it has no gate and no approve control — its "progress" is whether
 * one of its options has been chosen. Stated on the card rather than implied, because a
 * card that looks gated and is not is worse than one that plainly says it is not.
 */
export function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: DecisionQuestion
  selected?: boolean
  onSelect?: () => void
}) {
  const decided = !!question.resolution
  const chosen = question.options.find((o) => /CHOSEN/.test(o.label))
  return (
    <ReviewCardShell
      attrs={{ "data-review-card": question.id.toUpperCase(), "data-card-kind": "question" }}
      refCode={question.id.toUpperCase()}
      badges={[decided ? { label: "Decided", tone: "positive" } : { label: "Awaiting you", tone: "negative" }]}
      pill="question"
      label={question.title}
      prompt={question.context}
      selected={selected}
      onSelect={onSelect}
    >
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Blocks:</span> {question.blocks}
      </p>
      <ShellProgress title="Options" count={decided ? "decided" : "open"}>
        <ul className="flex flex-col gap-2">
          {question.options.map((o) => {
            const isChosen = o === chosen
            return (
              <li key={o.label} className={cn("flex items-start gap-2 text-xs", !isChosen && "text-muted-foreground")}>
                {isChosen ? (
                  <CircleCheckIcon filled className="mt-0.5 size-3.5 shrink-0" />
                ) : (
                  <CircleIcon className="mt-0.5 size-3.5 shrink-0" />
                )}
                <span className="flex flex-col gap-0.5">
                  <span className={cn(isChosen && "font-medium text-foreground")}>{o.label}</span>
                  {o.detail && <span className="text-muted-foreground">{o.detail}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </ShellProgress>
      {/* No approve control, and the absence is stated. These are not corpus rows, so
          there is no gate to compute one from and no approval record to write. */}
      <p className="text-[11px] text-muted-foreground">
        Not a corpus row — no gate, and no approval is recorded when this is decided.
      </p>
    </ReviewCardShell>
  )
}

/** A risk, in the shared format. Its action items cite other cards rather than restating
 * them — see `RefLink`. */
export function RiskCard({
  risk,
  selected,
  onSelect,
  onGoTo,
}: {
  risk: RiskNote
  selected?: boolean
  onSelect?: () => void
  onGoTo?: (ref: string) => void
}) {
  const done = risk.actionItems.filter((i) => i.done).length
  const total = risk.actionItems.length
  const resolved = isRiskResolved(risk)
  return (
    <ReviewCardShell
      attrs={{ "data-review-card": risk.id, "data-card-kind": "risk" }}
      refCode={risk.id}
      badges={[resolved ? { label: "Cleared", tone: "positive" } : { label: "Open", tone: "warning" }]}
      pill="risk"
      label={risk.title}
      prompt={risk.detail}
      selected={selected}
      onSelect={onSelect}
    >
      <ShellProgress title="Action items" count={`${done}/${total} done`}>
        <ul className="flex flex-col gap-2">
          {risk.actionItems.map((item) => (
            <li key={item.id} className={cn("flex items-start gap-2 text-xs", item.done && "text-muted-foreground")}>
              {item.done ? (
                <CircleCheckIcon filled className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <CircleIcon className="mt-0.5 size-3.5 shrink-0" />
              )}
              <span className="flex flex-col gap-1">
                <span>{item.text}</span>
                {item.refs && item.refs.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">satisfied by</span>
                    {item.refs.map((r) => (
                      <RefLink key={r} refCode={r} onGoTo={onGoTo} />
                    ))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </ShellProgress>
      <p className="text-[11px] text-muted-foreground">
        Not a corpus row — no gate. Its action items cite the divergences that satisfy them rather than
        repeating them.
      </p>
    </ReviewCardShell>
  )
}
