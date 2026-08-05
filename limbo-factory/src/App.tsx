import { useState } from "react"
import { ScrollArea, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from "@bidezine/system"
import { PhaseRail } from "@/components/PhaseRail"
import { BlockingQuestionCard, DivergenceCategoriesAccordion, RisksList } from "@/components/DivergenceView"
import { railSidebarPhases, blockingQuestions, divergenceCategories, notableRisks } from "@/data/rail-sidebar"

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
        <header className="border-b px-6 py-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Limbo — Rail Sidebar (RailNav)
          </p>
          <h1 className="text-lg font-semibold">{activePhase.title}</h1>
          <p className="text-sm text-muted-foreground">{activePhase.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">Owner: {activePhase.owner}</p>
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
          Contamination risks and structural conflicts flagged by the Intake agent — not per-item
          decisions, but things to keep in mind once Build starts.
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
