/**
 * Generic Sandbox phase model — reusable for every component that
 * passes through the Sandbox, not just Rail Sidebar. A "phase" maps 1:1 to a gate
 * in SANDBOX-PROTOCOL-LOG.md's agent roster; sub-phases are the granular
 * checklist items within a phase (e.g. individual blocking decisions).
 */

export type PhaseStatus = "done" | "in_progress" | "pending" | "blocked"

export interface SubPhase {
  id: string
  title: string
  status: PhaseStatus
  note?: string
}

export interface Phase {
  id: string
  title: string
  status: PhaseStatus
  /** Which protocol agent role owns this phase (see SANDBOX-PROTOCOL-LOG.md). */
  owner: string
  description: string
  subPhases?: SubPhase[]
}

/**
 * The 8 standing phases every Sandbox component moves through, in order.
 * Only `subPhases` content differs per-component (set on a copy of this array
 * or by a data file like rail-sidebar.ts) — the phase list itself is the
 * reusable shell.
 */
export const STANDARD_PHASES: readonly Omit<Phase, "subPhases" | "status">[] = [
  {
    id: "intake",
    title: "Intake / Dissection",
    owner: "Intake / Dissection agent",
    description:
      "Read the source component and its documentation in full; produce the component/experience inventory and the itemized divergence list. Read-only — never resolves anything.",
  },
  {
    id: "human-decisions",
    title: "Human Decisions",
    owner: "Human (you)",
    description:
      "Every divergence flagged by Intake that isn't cleanly pairable to an existing bidezine equivalent is decided here, one item at a time. AI never auto-decides this phase.",
  },
  {
    id: "build",
    title: "Transformation / Build",
    owner: "Build agent",
    description:
      "Ports the component into bidezine idioms — tokens, Fluent icons, real bidezine sub-components — executing only the decisions already recorded in the Human Decisions phase.",
  },
  {
    id: "escalation-check",
    title: "Escalation / Divergence-check",
    owner: "Escalation agent",
    description:
      "Independent from Build. Confirms every divergence flagged by Intake was actually resolved by a recorded human decision, not silently auto-resolved during Build.",
  },
  {
    id: "audit",
    title: "Independent Audit",
    owner: "Audit agent",
    description:
      "Independent from Build. Re-verifies tokens (color/font/spacing), Fluent-only icons, and real-bidezine-component usage from scratch — never trusts Build's self-report.",
  },
  {
    id: "final-review",
    title: "Final Human Review",
    owner: "Human (you)",
    description:
      "The non-delegable terminal gate. Your inspection is what ultimately matters, regardless of what any AI gate concluded.",
  },
  {
    id: "promotion",
    title: "Promotion into bidezine system",
    owner: "—",
    description:
      "Move the approved component from the Sandbox into src/ui/, register it in nav-manifest.ts and the real showcase, like any other component.",
  },
  {
    id: "close-out",
    title: "Close out protocol log",
    owner: "—",
    description:
      "Fold durable lessons from the run into CLAUDE.md, then delete the temporary SANDBOX-PROTOCOL-LOG.md.",
  },
]
