import { Badge, Button, cn } from "@bidezine/system"
import type { Phase, PhaseStatus } from "@/data/phases"

const STATUS_LABEL: Record<PhaseStatus, string> = {
  done: "Done",
  in_progress: "In progress",
  pending: "Pending",
  blocked: "Blocked",
}

const STATUS_VARIANT: Record<PhaseStatus, "default" | "secondary" | "outline" | "destructive"> = {
  done: "default",
  in_progress: "secondary",
  pending: "outline",
  blocked: "destructive",
}

function StatusBadge({ status }: { status: PhaseStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="shrink-0">
      {STATUS_LABEL[status]}
    </Badge>
  )
}

/**
 * Reusable factory-line left panel: a flat, single-level list of every phase
 * a Limbo component moves through — no nested sub-phase checklist. Generic
 * over any Phase[] — this same component is meant to be reused for the next
 * Limbo occupant after Rail Sidebar, just fed different phase data.
 */
export function PhaseRail({
  phases,
  activePhaseId,
  onSelectPhase,
}: {
  phases: Phase[]
  activePhaseId: string
  onSelectPhase: (id: string) => void
}) {
  return (
    <nav aria-label="Transformation phases" className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="mb-2 px-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Factory line
        </p>
      </div>
      {phases.map((phase) => {
        const isActive = phase.id === activePhaseId
        return (
          <Button
            key={phase.id}
            type="button"
            variant="ghost"
            onClick={() => onSelectPhase(phase.id)}
            className={cn(
              "h-auto w-full justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-normal",
              isActive
                ? "bg-accent text-accent-foreground font-medium hover:bg-accent"
                : "text-foreground"
            )}
          >
            <span className="truncate">{phase.title}</span>
            <StatusBadge status={phase.status} />
          </Button>
        )
      })}
    </nav>
  )
}
