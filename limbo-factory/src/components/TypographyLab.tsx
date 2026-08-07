import type { CSSProperties } from "react"
import { Badge, Card, CardContent, cn } from "@bidezine/system"
import { NEGATIVE_BADGE, POSITIVE_BADGE } from "@/lib/status-colors"

type TypeStatus = "approved" | "aligned" | "decision"

type TypeComparison = {
  role: string
  originToken: string
  originSpec: string
  originStyle: CSSProperties
  systemToken: string
  systemSpec: string
  systemClassName: string
  status: TypeStatus
  note: string
}

const originFamily = "'Inter', system-ui, -apple-system, sans-serif"

const typeComparisons: TypeComparison[] = [
  {
    role: "Global sans family",
    originToken: "FONT_FAMILY",
    originSpec: "Inter, system-ui, -apple-system, sans-serif",
    originStyle: { fontFamily: originFamily, fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
    systemToken: "--font-sans",
    systemSpec: "Inter, ui-sans-serif, system-ui, sans-serif",
    systemClassName: "font-sans text-sm",
    status: "approved",
    note: "D-1 implemented at the design-token source. Apps inherit Inter through font-sans.",
  },
  {
    role: "Page/header title",
    originToken: "headingM",
    originSpec: "18px / 500 / 1.3",
    originStyle: { fontFamily: originFamily, fontSize: 18, fontWeight: 500, lineHeight: 1.3 },
    systemToken: "text-lg font-semibold",
    systemSpec: "18px / 600 / normal",
    systemClassName: "font-sans text-lg font-semibold",
    status: "approved",
    note: "Approved: keep the current bidezine header title mapping.",
  },
  {
    role: "Panel/card title",
    originToken: "headingS",
    originSpec: "16px / 500 / 1.3",
    originStyle: { fontFamily: originFamily, fontSize: 16, fontWeight: 500, lineHeight: 1.3 },
    systemToken: "text-base font-medium",
    systemSpec: "16px / 500 / Tailwind line-height",
    systemClassName: "font-sans text-base font-medium",
    status: "aligned",
    note: "Rail panel titles already map closely to the origin headingS role.",
  },
  {
    role: "Body",
    originToken: "bodyM",
    originSpec: "14px / 400 / 1.55",
    originStyle: { fontFamily: originFamily, fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
    systemToken: "text-sm",
    systemSpec: "14px / 400 / Tailwind line-height",
    systemClassName: "font-sans text-sm",
    status: "aligned",
    note: "This is the cleanest one-to-one mapping in the current system.",
  },
  {
    role: "Compact body",
    originToken: "bodyS",
    originSpec: "13px / 400 / 1.5",
    originStyle: { fontFamily: originFamily, fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
    systemToken: "text-xs",
    systemSpec: "12px / 400 / Tailwind line-height",
    systemClassName: "font-sans text-xs",
    status: "approved",
    note: "Approved for compact secondary/menu text only. Main panel option rows use Body/text-sm.",
  },
  {
    role: "Medium label",
    originToken: "labelM",
    originSpec: "13px / 500 / 1.4",
    originStyle: { fontFamily: originFamily, fontSize: 13, fontWeight: 500, lineHeight: 1.4 },
    systemToken: "text-xs font-medium",
    systemSpec: "12px / 500 / Tailwind line-height",
    systemClassName: "font-sans text-xs font-medium",
    status: "approved",
    note: "Approved: use the current text-xs font-medium mapping for medium labels.",
  },
  {
    role: "Large label / active row",
    originToken: "labelL",
    originSpec: "14px / 500 / 1.55",
    originStyle: { fontFamily: originFamily, fontSize: 14, fontWeight: 500, lineHeight: 1.55 },
    systemToken: "text-sm font-medium",
    systemSpec: "14px / 500 / Tailwind line-height",
    systemClassName: "font-sans text-sm font-medium",
    status: "aligned",
    note: "Current active-row text maps cleanly to origin labelL.",
  },
  {
    role: "Caption",
    originToken: "caption",
    originSpec: "12px / 400 / 1.5",
    originStyle: { fontFamily: originFamily, fontSize: 12, fontWeight: 400, lineHeight: 1.5 },
    systemToken: "text-xs",
    systemSpec: "12px / 400 / Tailwind line-height",
    systemClassName: "font-sans text-xs",
    status: "aligned",
    note: "The size and weight match; exact line-height remains utility-defined.",
  },
  {
    role: "Strong caption / badge",
    originToken: "captionStrong",
    originSpec: "12px / 600 / 1.5",
    originStyle: { fontFamily: originFamily, fontSize: 12, fontWeight: 600, lineHeight: 1.5 },
    systemToken: "text-xs font-semibold",
    systemSpec: "12px / 600 / Tailwind line-height",
    systemClassName: "font-sans text-xs font-semibold",
    status: "aligned",
    note: "Use this for dense badges and compact emphatic labels.",
  },
  {
    role: "Large metric",
    originToken: "numberL",
    originSpec: "28px / 500 / 0.835 / tabular",
    originStyle: {
      fontFamily: originFamily,
      fontSize: 28,
      fontWeight: 500,
      lineHeight: 0.835,
      fontVariantNumeric: "tabular-nums",
    },
    systemToken: "text-3xl font-medium tabular-nums",
    systemSpec: "30px / 500 / Tailwind line-height / tabular",
    systemClassName: "font-sans text-3xl font-medium tabular-nums",
    status: "approved",
    note: "Approved: use the current text-3xl font-medium tabular-nums mapping.",
  },
]

const statusLabel: Record<TypeStatus, string> = {
  approved: "approved",
  aligned: "aligned",
  decision: "needs decision",
}

export function TypographyLab() {
  const approvedCount = typeComparisons.filter((t) => t.status !== "decision").length
  const decisionCount = typeComparisons.length - approvedCount

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-md border bg-card p-6 shadow-sm">
        <Badge className={POSITIVE_BADGE}>{approvedCount} aligned</Badge>
        {decisionCount > 0 ? <Badge className={NEGATIVE_BADGE}>{decisionCount} needs decision</Badge> : null}
        <p className="text-xs text-muted-foreground">
          Inter is now the system sans family. Named origin type roles are compared against the
          bidezine utility mappings currently used by the rail and the design system.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {typeComparisons.map((item) => (
          <Card key={item.role}>
            <CardContent className="flex flex-col gap-4 px-6 py-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.role}</p>
                  <Badge
                    className={cn(
                      "w-fit text-[9px]",
                      item.status === "decision" ? NEGATIVE_BADGE : POSITIVE_BADGE,
                    )}
                  >
                    {statusLabel[item.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TypeSpec
                  label="Origin"
                  token={item.originToken}
                  spec={item.originSpec}
                  style={item.originStyle}
                />
                <TypeSpec
                  label="bidezine"
                  token={item.systemToken}
                  spec={item.systemSpec}
                  className={item.systemClassName}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TypeSpec({
  label,
  token,
  spec,
  className,
  style,
}: {
  label: string
  token: string
  spec: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words font-mono text-xs">{token}</p>
        <p className="break-words font-mono text-[10px] text-muted-foreground">{spec}</p>
      </div>
      <p className={cn("truncate", className)} style={style}>
        Human Decisions
      </p>
      <p className={cn("text-muted-foreground", className)} style={style}>
        Every divergence flagged by Intake lands here for review.
      </p>
    </div>
  )
}
