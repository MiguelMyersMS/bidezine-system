import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
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

export function DivergenceCategoriesAccordion({ categories }: { categories: DivergenceCategory[] }) {
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
                  return (
                    <div
                      key={row.id}
                      className="rounded-md border bg-card p-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">
                          {row.id} — {row.what}
                        </p>
                        <Badge className={cn("shrink-0", badge.className)}>{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{row.detail}</p>
                      {row.visual ? (
                        <div className="mt-2 rounded-md border bg-muted/30 p-3">
                          <VisualCompare visual={row.visual} />
                        </div>
                      ) : null}
                    </div>
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
