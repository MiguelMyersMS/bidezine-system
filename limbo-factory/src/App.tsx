import { useLayoutEffect, useRef, useState } from "react"
import { Badge, ScrollArea, Separator, Tabs, TabsContent, TabsList, TabsTrigger, cn } from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { BlockingQuestionCard, DivergenceCategoriesAccordion, RisksList } from "@/components/DivergenceView"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ColorTokenLab } from "@/components/ColorTokenLab"
import { RailNavStatusPreview } from "@/components/FullRailPreview"
import { LogoImportSlot } from "@/components/LogoImportSlot"
import { NEGATIVE_BADGE, POSITIVE_BADGE, POSITIVE_BORDER, POSITIVE_WASH } from "@/lib/status-colors"
import {
  railSidebarPhases,
  blockingQuestions,
  divergenceCategories,
  notableRisks,
  proposedDarkRailTokens,
  BIDEZINE_LOGO_PATH,
  BIDEZINE_LOGO_VIEWBOX,
} from "@/data/rail-sidebar"

// Label shown in the URL field for the pre-filled default — not a real URL, just a recognizable
// stand-in so LogoImportSlot knows to render the inline SVG (currentColor, theme-responsive)
// instead of falling back to <img> for a genuine user-supplied link.
const BIDEZINE_LOGO_DEFAULT_LABEL = "(bidezine mark — built in, renders as inline SVG)"

/**
 * Limbo Factory Line — the reusable transformation-tracking shell.
 *
 * Left panel: every phase + sub-phase a Limbo component moves through (see
 * LIMBO-PROTOCOL-LOG.md). Right panel: the active phase's content. Today this
 * only has real content wired up for Rail Sidebar's "Human Decisions" phase
 * (limbo/rail-sidebar/INTAKE-REPORT.md) — the shell itself (App + PhaseRail)
 * is what's meant to be reused for the next Limbo occupant.
 */
export function App() {
  const [activePhaseId, setActivePhaseId] = useState("human-decisions")
  const activePhase = railSidebarPhases.find((p) => p.id === activePhaseId) ?? railSidebarPhases[0]

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-[320px] shrink-0 border-r bg-card">
        <PhaseRail
          phases={railSidebarPhases}
          activePhaseId={activePhaseId}
          onSelectPhase={setActivePhaseId}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Rail Sidebar
            </p>
            <h1 className="text-lg font-semibold">{activePhase.title}</h1>
            <p className="text-sm text-muted-foreground">{activePhase.description}</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activePhaseId === "human-decisions" ? (
            <div className="h-full p-6">
              <HumanDecisionsPhase />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 pr-8">
                <PlaceholderPhase />
              </div>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  )
}

function QuadrantLayout({
  children,
  right,
}: {
  children: React.ReactNode
  right: (height: number) => React.ReactNode
}) {
  return (
    <div className="grid h-full grid-cols-2 gap-6">
      <div className="h-full min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 pr-3">{children}</div>
        </ScrollArea>
      </div>
      <div className="flex h-full items-center justify-center overflow-hidden rounded-lg bg-card p-4">
        <FillHeight render={right} />
      </div>
    </div>
  )
}

/**
 * Measures the available stage height (after padding) and renders its child at exactly that
 * height, so a fixed-size example — like the RailNav preview — always fills the y-axis instead
 * of overflowing through the padding (too tall) or floating with extra gaps (too short).
 */
function FillHeight({ render }: { render: (height: number) => React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer) return

    const recalc = () => setHeight(outer.clientHeight)

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(outer)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={outerRef} className="flex h-full w-full items-center justify-center">
      {height > 0 ? render(height) : null}
    </div>
  )
}

function RailSourceToggle({
  value,
  onChange,
}: {
  value: "origin" | "bidezine"
  onChange: (value: "origin" | "bidezine") => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5 text-xs">
      <button
        type="button"
        aria-pressed={value === "origin"}
        onClick={() => onChange("origin")}
        className={cn(
          "rounded-sm px-2 py-1 font-medium transition-colors",
          value === "origin" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Origin
      </button>
      <button
        type="button"
        aria-pressed={value === "bidezine"}
        onClick={() => onChange("bidezine")}
        className={cn(
          "rounded-sm px-2 py-1 font-medium transition-colors",
          value === "bidezine" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Adjusted
      </button>
    </div>
  )
}

function HumanDecisionsPhase() {
  const [railSource, setRailSource] = useState<"origin" | "bidezine">("bidezine")
  const renderRailNav = (height: number) => (
    <RailNavStatusPreview source={railSource} tokens={proposedDarkRailTokens} height={height} />
  )

  return (
    <Tabs defaultValue="blocking" className="flex h-full w-full flex-col gap-0">
      <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 border-b px-6 py-4">
        <TabsList>
          <TabsTrigger value="blocking">Blocking questions (4)</TabsTrigger>
          <TabsTrigger value="colorlab">Color token lab (10)</TabsTrigger>
          <TabsTrigger value="categories">Full divergence list (13 categories)</TabsTrigger>
          <TabsTrigger value="risks">Notable risks (9)</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <RailSourceToggle value={railSource} onChange={setRailSource} />
          <ThemeToggle />
        </div>
      </div>

      <TabsContent value="blocking" className="min-h-0">
        <QuadrantLayout right={renderRailNav}>
          {blockingQuestions.map((q) => (
            <BlockingQuestionCard key={q.id} question={q} />
          ))}
          <div className="rounded-md border p-4">
            <p className="mb-2 text-sm font-medium">Logo import (Q3's standing rule)</p>
            <LogoImportSlot
              defaultUrl={BIDEZINE_LOGO_DEFAULT_LABEL}
              defaultSvgPath={BIDEZINE_LOGO_PATH}
              defaultViewBox={BIDEZINE_LOGO_VIEWBOX}
            />
          </div>
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="colorlab" className="min-h-0">
        <QuadrantLayout right={renderRailNav}>
          {(() => {
            const approvedCount = proposedDarkRailTokens.filter((t) => t.approved !== false).length
            const pendingCount = proposedDarkRailTokens.length - approvedCount
            return (
              <div className={cn("flex items-center gap-2 rounded-md border border-l-4 p-3", POSITIVE_BORDER, POSITIVE_WASH)}>
                <Badge className={POSITIVE_BADGE}>{approvedCount} approved</Badge>
                {pendingCount > 0 ? <Badge className={NEGATIVE_BADGE}>{pendingCount} needs decision</Badge> : null}
                <p className="text-xs text-muted-foreground">
                  {pendingCount > 0
                    ? `${approvedCount} candidates have final sign-off, composed and reviewed together in the full rail shape below. ${pendingCount} candidate(s) still await your decision.`
                    : `All ${approvedCount} candidates have final sign-off, composed and reviewed together in the full rail shape below — including select-hover (--sidebar-rail-active-hover), approved last, extending the same hover→pressed→active ramp one further step. Ready to be authored into tokens/base.tokens.json at Build time.`}
                </p>
              </div>
            )
          })()}
          <ColorTokenLab tokens={proposedDarkRailTokens} />
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="categories" className="min-h-0">
        <QuadrantLayout right={renderRailNav}>
          <DivergenceCategoriesAccordion categories={divergenceCategories} />
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="risks" className="min-h-0">
        <QuadrantLayout right={renderRailNav}>
          <RisksList risks={notableRisks} />
        </QuadrantLayout>
      </TabsContent>
    </Tabs>
  )
}

function PlaceholderPhase() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        This phase doesn't have content wired up yet — it comes after the Human Decisions phase resolves.
      </p>
      <Separator />
      <p className="text-xs text-muted-foreground">
        See limbo/rail-sidebar/INTAKE-REPORT.md and LIMBO-PROTOCOL-LOG.md for the full protocol this
        factory line implements.
      </p>
    </div>
  )
}
