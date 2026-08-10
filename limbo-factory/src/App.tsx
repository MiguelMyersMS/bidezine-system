import { useLayoutEffect, useRef, useState } from "react"
import { Badge, ScrollArea, Separator, Tabs, TabsContent, TabsList, TabsTrigger, cn, useScrollAreaOverflow } from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { BlockingQuestionCard, DivergenceCategoriesAccordion, RisksList } from "@/components/DivergenceView"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ColorTokenLab } from "@/components/ColorTokenLab"
import { TypographyLab } from "@/components/TypographyLab"
import { RailNavStatusPreview } from "@/components/FullRailPreview"
import { LogoImportSlot } from "@/components/LogoImportSlot"
import { NEGATIVE_BADGE, POSITIVE_BADGE } from "@/lib/status-colors"
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
            <div className="h-full p-[10px]">
              <HumanDecisionsPhase />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <PlaceholderPhaseGutter>
                <PlaceholderPhase />
              </PlaceholderPhaseGutter>
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  )
}

/**
 * Reads the enclosing `ScrollArea`'s real overflow state via React Context (`useScrollAreaOverflow`)
 * so the extra end-side gutter beyond the base `p-6` is only reserved when content actually
 * overflows — not a bare unconditional `pr-8`, which would leave dead space here every time this
 * placeholder's short static text fits without scrolling (see the L-26 note on
 * `PanelTreeScrollGutter` in FunctionalRailSidebar.tsx for the full root-cause writeup of why this
 * must be Context-based rather than a CSS `group-data-*` selector).
 */
function PlaceholderPhaseGutter({ children }: { children: React.ReactNode }) {
  const { scrollableY } = useScrollAreaOverflow()
  return <div className={cn("p-6", scrollableY ? "pr-8" : "pr-6")}>{children}</div>
}

/**
 * Reads the enclosing `ScrollArea`'s real overflow state via React Context (`useScrollAreaOverflow`)
 * so the quadrant's left column only reserves scrollbar clearance when its content genuinely
 * overflows — matching the same Context-based pattern used throughout this session's L-26 fix
 * rather than a bare unconditional gutter or a CSS `group-data-*` selector (see the note on
 * `PanelTreeScrollGutter` in FunctionalRailSidebar.tsx for the full root-cause writeup).
 */
function QuadrantScrollGutter({ children }: { children: React.ReactNode }) {
  const { scrollableY } = useScrollAreaOverflow()
  return (
    <div className={cn("flex flex-col gap-4 px-[8px]", scrollableY && "pr-4")}>
      {children}
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
    <div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-0 overflow-hidden">
      <div className="h-full min-h-0 min-w-0 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <QuadrantScrollGutter>{children}</QuadrantScrollGutter>
        </ScrollArea>
      </div>
      <div className="box-border h-full min-h-0 min-w-0 w-full px-[8px]">
        <div className="box-border flex h-full min-h-0 w-full items-center justify-start overflow-hidden rounded-lg p-6">
          <FillHeight render={right} />
        </div>
      </div>
    </div>
  )
}

/**
 * Measures the available stage height (after padding) and renders its child at exactly that
 * height, so a fixed-size example — like the RailNav preview — always fills the y-axis instead
 * of overflowing through the padding (too tall) or floating with extra gaps (too short).
 *
 * QA finding (see divergence row L-38): horizontal centering here (`justify-center`, on both this
 * wrapper and its parent stage box in `QuadrantLayout` above) centered the ENTIRE Rail+Panel
 * composite as one unit. Origin's real `RailNav.tsx` never does this — the rail's own `<aside>` is
 * `flexShrink: 0` and sits at a fixed position in the page's own flex row; only the panel/content
 * next to it flexes. When the composite's total rendered width exceeded the available stage width
 * (rail + gap + panel + shadow insets + invisible filler panel, easily wider than a half-quadrant
 * column), `justify-center` centered the oversized row and the ancestor's `overflow-hidden` clipped
 * the overflow from BOTH edges equally — chopping off the narrow, leftmost Rail almost entirely
 * while the much wider Panel (sitting nearer the middle of the oversized row) stayed fully visible.
 * Confirmed via a live screenshot: the 54px icon rail was invisible except for a sliver of the
 * resize handle, with the Panel filling the whole stage. Fixed by anchoring the composite to the
 * start of the row (`justify-start`) instead of centering it, so the Rail's own position is
 * invariant to the Panel's width — matching Origin's real anchored-rail contract.
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
    <div ref={outerRef} className="flex h-full w-full items-center justify-start">
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
    <Tabs
      defaultValue="blocking"
      className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden"
    >
      <div className="-mx-[10px] -mt-[10px] mb-[10px] flex items-center justify-between gap-4 border-b px-6 py-4">
        <TabsList>
          <TabsTrigger value="blocking">Blocking questions</TabsTrigger>
          <TabsTrigger value="colorlab">Color token lab</TabsTrigger>
          <TabsTrigger value="typelab">Typography lab</TabsTrigger>
          <TabsTrigger value="categories">Full divergence list</TabsTrigger>
          <TabsTrigger value="risks">Notable risks</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <RailSourceToggle value={railSource} onChange={setRailSource} />
          <ThemeToggle />
        </div>
      </div>

      <TabsContent value="blocking" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
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

      <TabsContent value="colorlab" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          {(() => {
            const approvedCount = proposedDarkRailTokens.filter((t) => t.approved !== false).length
            const pendingCount = proposedDarkRailTokens.length - approvedCount
            return (
              <div className="flex items-center gap-2 rounded-md border bg-card p-6 shadow-sm">
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

      <TabsContent value="typelab" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          <TypographyLab />
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="categories" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          <DivergenceCategoriesAccordion categories={divergenceCategories} />
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="risks" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
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
