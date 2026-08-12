import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  Badge,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  useScrollAreaOverflow,
} from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { BlockingQuestionCard, DivergenceCategoriesAccordion, RisksList } from "@/components/DivergenceView"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ColorTokenLab } from "@/components/ColorTokenLab"
import { TypographyLab } from "@/components/TypographyLab"
import { LogoImportSlot } from "@/components/LogoImportSlot"
import { DivergenceHighlight, useAnchoredRefs } from "@/components/DivergenceHighlight"
import { NoPreviewRegistered, PREVIEW_REGISTRY, hasPreview } from "@/components/PreviewRegistry"
import { EvidenceWidget } from "@/components/EvidenceWidget"
import { toCategories, useCorpus, type CorpusComponent, type CorpusDivergence } from "@/data/corpus"
import { NEGATIVE_BADGE, POSITIVE_BADGE } from "@/lib/status-colors"
import {
  railSidebarPhases,
  blockingQuestions,
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
 * Sandbox — the reusable transformation-tracking shell.
 *
 * Left panel: every phase + sub-phase a Sandbox component moves through (see
 * SANDBOX-PROTOCOL-LOG.md). Right panel: the active phase's content. Today this
 * only has real content wired up for Rail Sidebar's "Human Decisions" phase
 * (origin/rail-sidebar/INTAKE-REPORT.md) — the shell itself (App + PhaseRail)
 * is what's meant to be reused for the next Sandbox occupant.
 */
export function App() {
  const [activePhaseId, setActivePhaseId] = useState("human-decisions")
  const activePhase = railSidebarPhases.find((p) => p.id === activePhaseId) ?? railSidebarPhases[0]

  // M5 step 2: the occupant is no longer hard-coded. Components, their divergences and
  // their categories all come from the corpus; only the preview pane is per-occupant code
  // (see PreviewRegistry).
  const corpus = useCorpus()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const components = corpus.status === "ready" ? corpus.corpus.components : []
  // Default to the first component the corpus actually reports, rather than to a name
  // written into this file — that default is the last thing tying the shell to one occupant.
  const slug = activeSlug ?? components[0]?.slug ?? null
  const active = components.find((c) => c.slug === slug) ?? null

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
        {corpus.status === "ready" && corpus.corpus.stale ? (
          <StaleCorpusBanner fetchedAt={corpus.corpus.fetchedAt} reason={corpus.corpus.staleReason} />
        ) : null}

        <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {active?.title ?? (corpus.status === "loading" ? "Loading corpus…" : "No component")}
            </p>
            <h1 className="text-lg font-semibold">{activePhase.title}</h1>
            <p className="text-sm text-muted-foreground">{activePhase.description}</p>
          </div>
          <ComponentPicker components={components} activeSlug={slug} onSelect={setActiveSlug} />
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {corpus.status === "error" ? (
            <CorpusError message={corpus.message} />
          ) : corpus.status === "loading" ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Reading the corpus…</p>
            </div>
          ) : activePhaseId === "human-decisions" && slug ? (
            <div className="h-full p-[10px]">
              <HumanDecisionsPhase
                slug={slug}
                rows={corpus.corpus.divergences[slug] ?? []}
              />
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

/** Switches the Sandbox between occupants. Lists exactly what the corpus reports —
 * including anything without a registered preview — so the app and the store can never
 * disagree about which components exist. */
function ComponentPicker({
  components,
  activeSlug,
  onSelect,
}: {
  components: CorpusComponent[]
  activeSlug: string | null
  onSelect: (slug: string) => void
}) {
  if (components.length === 0) return null
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-muted-foreground">Component</span>
      <Select value={activeSlug ?? undefined} onValueChange={onSelect}>
        <SelectTrigger size="sm" className="w-[240px]">
          <SelectValue placeholder="Select a component" />
        </SelectTrigger>
        <SelectContent>
          {components.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.title} — {c.divergences} divergence{c.divergences === 1 ? "" : "s"}
              {hasPreview(c.slug) ? "" : " (no preview)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Shown whenever the corpus came from the on-disk snapshot instead of Fabric.
 *
 * The banner is the part that matters, not the fallback. Serving cached rows keeps the
 * tool usable through an outage; serving them *silently* would let a stale read be
 * mistaken for a live one, which is the same false-green this whole system exists to
 * refuse. It states the age of the data and the reason the live read failed.
 */
function StaleCorpusBanner({ fetchedAt, reason }: { fetchedAt: string; reason?: string }) {
  return (
    <div className="flex items-start gap-2 border-b bg-destructive/10 px-6 py-2">
      <Badge className={NEGATIVE_BADGE}>Stale</Badge>
      <p className="text-xs text-muted-foreground">
        Fabric was unreachable, so this is the last cached snapshot, taken{" "}
        <strong>{new Date(fetchedAt).toLocaleString()}</strong>. Read-only — anything you see may
        have changed since.
        {reason ? <span className="ml-1 opacity-70">({reason})</span> : null}
      </p>
    </div>
  )
}

function CorpusError({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium">The corpus could not be read</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          There is no cached snapshot to fall back to either. An empty list is deliberately not
          shown — it would be indistinguishable from a corpus that genuinely has no rows.
        </p>
      </div>
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

function HumanDecisionsPhase({ slug, rows }: { slug: string; rows: CorpusDivergence[] }) {
  const [railSource, setRailSource] = useState<"origin" | "bidezine">("bidezine")

  // Divergences now come from the corpus. The categories are rebuilt from each row's
  // verbatim source record, so this renders exactly what the hand-written data file
  // rendered — which is also what `scripts/check-corpus-equivalence.mjs` proves, and what
  // step 4 needs before that file can be deleted.
  const categories = useMemo(() => toCategories(rows), [rows])

  // The preview is the one genuinely per-occupant piece; everything above is data.
  const preview = PREVIEW_REGISTRY[slug]
  const renderRailNav = (height: number) =>
    reviewingRef ? (
      <div className="h-full w-full" style={{ height }}>
        <EvidenceWidget slug={slug} refCode={reviewingRef} />
      </div>
    ) : preview ? (
      preview({ source: railSource, tokens: proposedDarkRailTokens, height })
    ) : (
      <NoPreviewRegistered slug={slug} />
    )

  // M5 step 3. Selection lives here rather than inside the list because the list and the preview
  // are siblings in QuadrantLayout — the overlay has to be mounted outside the scrolling left
  // column to sit above the rail on the right.
  const [activeRef, setActiveRef] = useState<string | null>(null)
  const anchoredRefs = useAnchoredRefs()

  // M6. Opening a row's evidence bundle replaces the preview pane rather than opening a
  // dialog over it: the bundle is what the minute of review is spent on, and a modal would
  // put it on top of the very component the evidence is about. Highlighting the same row in
  // the preview stays available by switching back.
  const [reviewingRef, setReviewingRef] = useState<string | null>(null)

  // The origin pane is a quarantined iframe in its own document, so nothing here can reach inside
  // it to measure an anchor — and it carries none by design, being reference material rather than
  // the translation under review. Clearing on switch avoids leaving a highlight stranded over a
  // pane it does not describe.
  useEffect(() => {
    if (railSource === "origin") setActiveRef(null)
  }, [railSource])

  return (
    <>
      {/* Mounted at the phase root, outside QuadrantLayout's scrolling left column, because it is
          `position: fixed` and must be able to draw over the preview on the right. It is
          `pointer-events: none`, so the highlighted region stays fully hoverable, clickable and
          resizable — which is M5's own second "done when" criterion, not an afterthought. */}
      <DivergenceHighlight activeRef={activeRef} />
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
          <DivergenceCategoriesAccordion
            categories={categories}
            anchoredRefs={anchoredRefs}
            activeRef={activeRef}
            onHighlight={setActiveRef}
            onReview={setReviewingRef}
            reviewingRef={reviewingRef}
          />
        </QuadrantLayout>
      </TabsContent>

      <TabsContent value="risks" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          <RisksList risks={notableRisks} />
        </QuadrantLayout>
      </TabsContent>
    </Tabs>
    </>
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
        See origin/rail-sidebar/INTAKE-REPORT.md and SANDBOX-PROTOCOL-LOG.md for the full protocol this
        factory line implements.
      </p>
    </div>
  )
}
