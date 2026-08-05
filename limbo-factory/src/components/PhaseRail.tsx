import { Badge, cn } from "@bidezine/system"
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
 * Reusable factory-line left panel: shows every phase a Limbo component moves
 * through, with sub-phase checklists where available. Generic over any
 * Phase[] — this same component is meant to be reused for the next Limbo
 * occupant after Rail Sidebar, just fed different phase data.
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
          <div key={phase.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => onSelectPhase(phase.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-accent/50"
              )}
            >
              <span className="truncate">{phase.title}</span>
              <StatusBadge status={phase.status} />
            </button>
            {isActive && phase.subPhases && phase.subPhases.length > 0 ? (
              <ul className="mb-1 ml-3 flex flex-col gap-0.5 border-l pl-3">
                {phase.subPhases.map((sub) => (
                  <li key={sub.id} className="flex items-start justify-between gap-2 py-1 text-xs">
                    <span
                      className={cn(
                        "leading-snug",
                        sub.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    >
                      {sub.title}
                      {sub.note ? (
                        <span className="block text-muted-foreground">{sub.note}</span>
                      ) : null}
                    </span>
                    <StatusBadge status={sub.status} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
