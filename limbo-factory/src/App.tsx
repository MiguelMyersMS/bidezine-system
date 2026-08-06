import { useState } from "react"
import { Badge, ScrollArea, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { BlockingQuestionCard, DivergenceCategoriesAccordion, RisksList } from "@/components/DivergenceView"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ColorTokenLab } from "@/components/ColorTokenLab"
import { RailPreview } from "@/components/RailPreview"
import { LogoImportSlot } from "@/components/LogoImportSlot"
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
      <aside className="w-80 shrink-0 border-r bg-card">
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
              Limbo — Rail Sidebar (RailNav)
            </p>
            <h1 className="text-lg font-semibold">{activePhase.title}</h1>
            <p className="text-sm text-muted-foreground">{activePhase.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">Owner: {activePhase.owner}</p>
          </div>
          <ThemeToggle />
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            {activePhaseId === "human-decisions" ? <HumanDecisionsPhase /> : <PlaceholderPhase />}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}

function HumanDecisionsPhase() {
  return (
    <Tabs defaultValue="blocking" className="w-full">
      <TabsList>
        <TabsTrigger value="blocking">Blocking questions (4)</TabsTrigger>
        <TabsTrigger value="colorlab">Color token lab (10)</TabsTrigger>
        <TabsTrigger value="categories">Full divergence list (13 categories)</TabsTrigger>
        <TabsTrigger value="risks">Notable risks (9)</TabsTrigger>
      </TabsList>

      <TabsContent value="blocking" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          These 4 questions gate the most downstream work. Everything in the "Full divergence list" tab
          cascades from these answers.
        </p>
        {blockingQuestions.map((q) => (
          <BlockingQuestionCard key={q.id} question={q} />
        ))}
        <div className="rounded-md border p-4">
          <p className="mb-2 text-sm font-medium">Q3 — Logo import (standing rule)</p>
          <LogoImportSlot
            defaultUrl={BIDEZINE_LOGO_DEFAULT_LABEL}
            defaultSvgPath={BIDEZINE_LOGO_PATH}
            defaultViewBox={BIDEZINE_LOGO_VIEWBOX}
          />
        </div>
      </TabsContent>

      <TabsContent value="colorlab" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Resolve this tab before category B (and several of category C) in "Full divergence list" —
          those rows' "after" column depends on the tokens approved here. Use the theme toggle above to
          check both light and dark before approving.
        </p>
        <div className="flex items-center gap-2 rounded-md border p-3">
          <Badge className="bg-primary text-primary-foreground">9/10 approved</Badge>
          <p className="text-xs text-muted-foreground">
            9 candidates have final sign-off, composed and reviewed together in the full rail shape
            below (including two follow-up hex-based revisions to hover/pressed/border). A 10th
            candidate — select-hover, for hovering an already-selected row — was just proposed and
            is awaiting your decision; hover the "Projects" row in the preview to see it live.
          </p>
        </div>
        <RailPreview tokens={proposedDarkRailTokens} />
        <ColorTokenLab tokens={proposedDarkRailTokens} />
      </TabsContent>

      <TabsContent value="categories" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Every icon, color, spacing, layout, radius, motion, elevation, z-index, focus/scrollbar,
          sub-component, and structural pattern found in RailNav, reconciled against our current system.
        </p>
        <DivergenceCategoriesAccordion categories={divergenceCategories} />
      </TabsContent>

      <TabsContent value="risks" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Contamination risks and structural conflicts flagged by the Intake agent, each with a concrete
          action-item checklist. A risk turns from red to green once every item is done.
        </p>
        <RisksList risks={notableRisks} />
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
