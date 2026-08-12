import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
} from "@bidezine/system"
import type { DecisionQuestion, DivergenceCategory, RiskNote } from "@/data/rail-sidebar"
import { isRiskResolved } from "@/data/rail-sidebar"
import { VisualCompare } from "@/components/CompareVisuals"
import { NEGATIVE_BADGE, POSITIVE_BADGE, WARNING_BADGE } from "@/lib/status-colors"

/** decision = negative/destructive (a hard blocker — needs a human, don't miss it); note =
 * amber/warning (a softer, non-blocking item still worth reading before moving on); clean =
 * existing secondary look, unchanged (nothing to decide at all); resolved = emerald/positive (a
 * decision item that's now settled by an already-answered blocking question) — distinct from
 * clean (there WAS a decision to make) and from decision/note (nothing left to decide).
 * Deliberately distinct at a glance per the user's explicit badge-differentiation request. */
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  clean: { label: "Clean equivalent", className: "bg-secondary text-secondary-foreground" },
  decision: { label: "Needs human decision", className: NEGATIVE_BADGE },
  note: { label: "Worth noting", className: WARNING_BADGE },
  resolved: { label: "Decided", className: POSITIVE_BADGE },
}

export function BlockingQuestionCard({ question }: { question: DecisionQuestion }) {
  const resolved = Boolean(question.resolution)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">Q{question.priority}</Badge>
          <CardTitle>{question.title}</CardTitle>
          {question.resolution ? (
            <Badge className={cn("ml-auto", POSITIVE_BADGE)}>Resolved</Badge>
          ) : (
            <Badge className={cn("ml-auto", NEGATIVE_BADGE)}>Needs your decision</Badge>
          )}
        </div>
        <CardDescription>Blocks: {question.blocks}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {question.visual ? (
          <div className="rounded-md border bg-muted/30 p-3">
            <VisualCompare visual={question.visual} />
          </div>
        ) : null}
        {question.resolution ? (
          <div className="rounded-md border bg-card p-3 shadow-sm">
            <p className="text-xs font-medium text-foreground">
              Decided: {question.resolution.chosenLabel}
            </p>
            {question.resolution.note ? (
              <p className="mt-1 text-xs text-muted-foreground">{question.resolution.note}</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border bg-card p-3 shadow-sm">
            <p className="text-xs font-medium text-foreground italic">
              Awaiting your decision — nothing auto-decided here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DivergenceCategoriesAccordion({
  categories,
  anchoredRefs,
  activeRef,
  onHighlight,
  onReview,
  reviewingRef,
}: {
  categories: DivergenceCategory[]
  /** Refs genuinely present in the live DOM right now — see `useAnchoredRefs`. A row offers a
   * Highlight control if and only if it appears here, so the list can never advertise a region it
   * cannot actually show. */
  anchoredRefs: Set<string>
  activeRef: string | null
  onHighlight: (ref: string | null) => void
  /** M6: open this row's evidence bundle. Optional so the component still renders in
   * contexts that have no widget mounted. */
  onReview?: (ref: string | null) => void
  reviewingRef?: string | null
}) {
  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((cat) => {
        const decisionCount = cat.rows.filter((r) => r.status === "decision").length
        const cleanCount = cat.rows.filter((r) => r.status === "clean").length
        const resolvedCount = cat.rows.filter((r) => r.status === "resolved").length
        return (
          <AccordionItem key={cat.id} value={cat.id}>
            <AccordionTrigger>
              <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span>
                  {cat.id} — {cat.name}
                </span>
                <span className="flex gap-1">
                  {decisionCount > 0 ? (
                    <Badge className={NEGATIVE_BADGE}>{decisionCount} need decision</Badge>
                  ) : null}
                  {resolvedCount > 0 ? (
                    <Badge className={POSITIVE_BADGE}>{resolvedCount} decided</Badge>
                  ) : null}
                  {cleanCount > 0 ? <Badge variant="secondary">{cleanCount} clean</Badge> : null}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                {cat.rows.map((row) => {
                  const badge = STATUS_BADGE[row.status]
                  const anchored = anchoredRefs.has(row.id)
                  const isActive = activeRef === row.id
                  return (
                    // Was a raw <div> wearing Card's own classes (`rounded-md border bg-card
                    // shadow-sm`) — a hand-rolled approximation of a primitive this file already
                    // imports and uses elsewhere, which is the violation CLAUDE.md's "no
                    // hand-rolled components" rule names. Swapped to the real Card while adding the
                    // highlight control, rather than layering new behaviour onto a fake one.
                    <Card key={row.id} className={cn("gap-2 py-4", isActive && "ring-2 ring-ring")}>
                      <CardHeader className="gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium">
                            {row.id} — {row.what}
                          </CardTitle>
                          <Badge className={cn("shrink-0", badge.className)}>{badge.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {anchored ? (
                            /* Only rendered for rows with a real `data-divergence` anchor on
                               screen. The absence of this control on the other ~147 rows is not an
                               oversight — it is an honest readout of how much of the corpus is
                               actually tied to rendered markup, which is the gap M5's anchoring
                               work exists to close. */
                            <Button
                              type="button"
                              size="sm"
                              variant={isActive ? "secondary" : "outline"}
                              aria-pressed={isActive}
                              onClick={() => onHighlight(isActive ? null : row.id)}
                            >
                              {isActive ? "Highlighting" : "Highlight in preview"}
                            </Button>
                          ) : null}
                          {onReview ? (
                            /* M6. Offered on EVERY row, not only anchored ones: a row with no
                               evidence is exactly the case the gate exists to refuse, and hiding
                               the widget there would hide the refusal too. */
                            <Button
                              type="button"
                              size="sm"
                              variant={reviewingRef === row.id ? "secondary" : "outline"}
                              aria-pressed={reviewingRef === row.id}
                              onClick={() => onReview(reviewingRef === row.id ? null : row.id)}
                            >
                              {reviewingRef === row.id ? "Reviewing" : "Evidence & approval"}
                            </Button>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">{row.detail}</p>
                        {row.visual ? (
                          <div className="rounded-md border bg-muted/30 p-3">
                            <VisualCompare visual={row.visual} />
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

export function RisksList({ risks }: { risks: RiskNote[] }) {
  return (
    <div className="flex flex-col gap-2">
      {risks.map((risk) => {
        const resolved = isRiskResolved(risk)
        const doneCount = risk.actionItems.filter((i) => i.done).length
        return (
          <Card key={risk.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant={resolved ? undefined : "destructive"} className={resolved ? POSITIVE_BADGE : undefined}>
                  {resolved ? "Resolved" : "Open"} — {risk.id}
                </Badge>
                <CardTitle className="text-sm">{risk.title}</CardTitle>
                <span className="ml-auto text-xs text-muted-foreground">
                  {doneCount}/{risk.actionItems.length} done
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{risk.detail}</p>
              <div className="flex flex-col gap-1.5">
                {risk.actionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <Checkbox checked={item.done} disabled className="mt-0.5" />
                    <p className={cn("text-xs", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                      {item.text}
                      {item.refs?.length ? (
                        <span className="ml-1 text-muted-foreground">
                          ({item.refs.join(", ")})
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
