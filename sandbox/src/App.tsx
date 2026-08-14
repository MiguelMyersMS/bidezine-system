import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
  ToggleGroup,
  ToggleGroupItem,
  cn,
  useScrollAreaOverflow,
} from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DivergenceHighlight } from "@/components/DivergenceHighlight"
import { NoPreviewRegistered, PREVIEW_REGISTRY, hasPreview } from "@/components/PreviewRegistry"
import { MachineSwitcher } from "@/components/MachineSwitcher"
import { ReviewQueue } from "@/components/ReviewQueue"
import { useCorpus, type CorpusComponent, type CorpusDivergence } from "@/data/corpus"
import { NEGATIVE_BADGE, POSITIVE_BADGE } from "@/lib/status-colors"
import {
  railSidebarPhases,
  proposedDarkRailTokens,
} from "@/data/rail-sidebar"

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
            // Which component's rows are actually on screen. Refs are unique per
            // component, NOT globally — `__dbg__`'s only row is `D-1`, and so is one of
            // rail-sidebar's — so a check scoped by ref alone silently verifies the wrong
            // component's card and passes. Named here so a verifier can scope to the
            // component rather than infer it.
            <div className="h-full p-[10px]" data-active-component={slug}>
              <HumanDecisionsPhase
                slug={slug}
                rows={corpus.corpus.divergences[slug] ?? []}
                component={active}
                thisMachine={corpus.corpus.thisMachine}
                onChanged={corpus.reload}
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
        {/* `data-preview-stage` bounds the dimming scrim DivergenceHighlight draws. Clipping
            it here rather than to the viewport keeps the divergence list on the left at full
            contrast — it is what you are reading while looking at what it points to. */}
        <div
          data-preview-stage
          className="box-border flex h-full min-h-0 w-full items-center justify-start overflow-hidden rounded-lg p-6"
        >
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

/**
 * Origin vs. adjusted, on the real `ToggleGroup` primitive.
 *
 * This was two raw `<button>` elements styled to look like a segmented control — a
 * standing "no hand-rolled components" violation that `CLAUDE.md` explicitly does not
 * waive for sandbox tooling, recorded in `HANDOFF.md` and left alone by two sessions
 * because it sat in the middle of files nobody owned. A hand-rolled approximation drifts
 * from the real recipe in ways invisible to code review — here it had no focus-visible
 * ring and no disabled handling at all.
 *
 * `type="single"` with a guard on empty: `ToggleGroup` deselects on a second click of the
 * active item, which for a two-way source switch would leave the preview showing neither.
 */
function RailSourceToggle({
  value,
  onChange,
}: {
  value: "origin" | "bidezine"
  onChange: (value: "origin" | "bidezine") => void
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (next === "origin" || next === "bidezine") onChange(next)
      }}
      aria-label="Preview source"
    >
      <ToggleGroupItem value="origin" className="px-3 text-xs">
        Origin
      </ToggleGroupItem>
      <ToggleGroupItem value="bidezine" className="px-3 text-xs">
        Adjusted
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function HumanDecisionsPhase({
  slug,
  rows,
  component,
  thisMachine,
  onChanged,
}: {
  slug: string
  rows: CorpusDivergence[]
  component: CorpusComponent | null
  thisMachine: string | null
  onChanged: () => void
}) {
  const [railSource, setRailSource] = useState<"origin" | "bidezine">("bidezine")

  // `toCategories` is no longer called here. It still exists and is still exercised — by
  // `scripts/check-corpus-equivalence.mjs`, which imports `getCorpus` directly and diffs
  // the result against the frozen snapshot. That check reads the API, never the DOM, so
  // removing the accordion that used to render it costs the check nothing. Verified before
  // deleting, because if it HAD read the rendered view, this would have silently removed
  // half of a 154/154 check.

  /**
   * The preview is the one genuinely per-occupant piece; everything above is data.
   *
   * ── It is no longer swapped out for an evidence panel, and that is the point ───────
   * M6 mounted the evidence bundle HERE, replacing the preview — so opening a row's
   * evidence hid the very component the evidence was about. Under the review-card spec
   * the evidence lives on the card in the left column instead, and the component stays on
   * screen permanently. That is the single largest usability change in the rebuild: the
   * whole reason to have a live component next to the list is to look at it WHILE
   * deciding, which the old arrangement made impossible at exactly the moment it mattered.
   */
  // The declaration of whichever row is selected — its subject_state is what the preview
  // is asked to hold. Null when nothing is selected or the row declares no state, which is
  // every row today.

  const preview = PREVIEW_REGISTRY[slug]
  const renderRailNav = (height: number) =>
    preview ? (
      preview({ source: railSource, tokens: proposedDarkRailTokens, height, forcedState: activeDeclaration?.subjectState && activeRef ? { ref: activeDeclaration.subjects.find((sub) => sub.side === "bidezine" && sub.anchorId)?.anchorId ?? activeRef, state: activeDeclaration.subjectState } : null })
    ) : (
      <NoPreviewRegistered slug={slug} />
    )

  // M5 step 3. Selection lives here rather than inside the list because the list and the preview
  // are siblings in QuadrantLayout — the overlay has to be mounted outside the scrolling left
  // column to sit above the rail on the right.
  const [activeRef, setActiveRef] = useState<string | null>(null)

  // The declaration of whichever row is selected — its `subject_state` is what the preview
  // is asked to hold. Null when nothing is selected, or when the row declares no state,
  // which is every row today.
  //
  // Declared HERE, below `activeRef`, and that placement is load-bearing rather than
  // stylistic: an earlier version sat above the `useState` and read `activeRef` during
  // render, which is a temporal dead zone and threw "Cannot access 'activeRef' before
  // initialization" — a completely blank app, no tabs, no error visible except in the
  // console. `renderRailNav` gets away with referencing it either way because it is a
  // closure called later; this is not.
  const activeDeclaration = rows.find((r) => r.ref === activeRef) ?? null

  return (
    <>
      {/* Mounted at the phase root, outside QuadrantLayout's scrolling left column, because it is
          `position: fixed` and must be able to draw over the preview on the right. It is
          `pointer-events: none`, so the highlighted region stays fully hoverable, clickable and
          resizable — which is M5's own second "done when" criterion, not an afterthought. */}
      <DivergenceHighlight
        activeRef={activeRef}
        declaration={rows.find((r) => r.ref === activeRef) ?? null}
      />
    <Tabs
      // Must name a tab that still exists. This read "blocking" for three commits after the
      // seven-tab consolidation removed that tab — so the app opened with nothing selected
      // and a blank content area until you clicked something. Radix does not warn, and
      // verify-ui never saw it because every check clicks a tab by name first.
      defaultValue="categories"
      className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden"
    >
      <div className="-mx-[10px] -mt-[10px] mb-[10px] flex items-center justify-between gap-4 border-b px-6 py-4">
        {/* Two tabs, not seven. The old bar mixed two altitudes and two data sources: four
            tabs read hardcoded per-occupant arrays while three read the corpus, so
            component #2 would have arrived to four tabs that were empty or wrong. Worse,
            deciding a colour happened on one screen and recording the decision on another,
            correlated by hand.

            Review is everything about THIS component that needs a human. Machines is the
            workspace — a different altitude, and the only thing that genuinely is not about
            a component. */}
        <TabsList>
          <TabsTrigger value="categories">Review</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <RailSourceToggle value={railSource} onChange={setRailSource} />
          <ThemeToggle />
        </div>
      </div>

      {/* The review queue. Selecting a card highlights its region in the live component to
          the right; the component is never replaced, so the two stay synchronised for the
          whole decision rather than only until the evidence is opened. */}
      <TabsContent value="categories" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          <ReviewQueue
            slug={slug}
            rows={rows}
            mayWrite={component?.mayWrite ?? false}
            owner={component?.owner ?? null}
            thisMachine={thisMachine}
            selectedRef={activeRef}
            onSelect={setActiveRef}
            onReveal={setActiveRef}
            onChanged={onChanged}
            onGoTo={(ref) => {
              // Follow an edge: select the row it names and bring it into view. A subject
              // and its satellites are one piece of work, so moving between them has to be
              // one click — that is the whole reason the relation is on screen rather than
              // only in the schema.
              setActiveRef(ref)
              document.querySelector(`[data-review-card="${ref}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })
            }}
          />
        </QuadrantLayout>
      </TabsContent>

      {/* M8. Mounted inside QuadrantLayout like every other tab rather than as a full-width
          view of its own: the left column already implements the scroll-region protocol
          correctly (its own ScrollArea plus QuadrantScrollGutter's conditional gutter), and
          a second, parallel scroll composition built for one tab is how those two drift. */}
      <TabsContent value="machines" className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
        <QuadrantLayout right={renderRailNav}>
          <MachineSwitcher />
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
