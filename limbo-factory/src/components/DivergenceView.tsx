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
  Separator,
} from "@bidezine/system"
import type { DecisionQuestion, DivergenceCategory, RiskNote } from "@/data/rail-sidebar"

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  clean: { label: "Clean equivalent", variant: "secondary" },
  decision: { label: "Needs human decision", variant: "outline" },
  note: { label: "Worth noting", variant: "outline" },
}

export function BlockingQuestionCard({ question }: { question: DecisionQuestion }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">Q{question.priority}</Badge>
          <CardTitle>{question.title}</CardTitle>
        </div>
        <CardDescription>Blocks: {question.blocks}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-foreground">{question.context}</p>
        <Separator />
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <div key={opt.label} className="rounded-md border p-3">
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic">
          Awaiting your decision — nothing auto-decided here.
        </p>
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
        return (
          <AccordionItem key={cat.id} value={cat.id}>
            <AccordionTrigger>
              <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                <span>
                  {cat.id} — {cat.name}
                </span>
                <span className="flex gap-1">
                  {decisionCount > 0 ? (
                    <Badge variant="outline">{decisionCount} need decision</Badge>
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
                    <div key={row.id} className="rounded-md border p-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">
                          {row.id} — {row.what}
                        </p>
                        <Badge variant={badge.variant} className="shrink-0">
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{row.detail}</p>
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
      {risks.map((risk) => (
        <Card key={risk.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{risk.id}</Badge>
              <CardTitle className="text-sm">{risk.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{risk.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
