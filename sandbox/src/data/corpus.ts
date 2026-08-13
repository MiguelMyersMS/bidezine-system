import { useEffect, useState } from "react"
import type { DivergenceCategory, DivergenceRow, DivergenceStatus } from "@/data/rail-sidebar"

/**
 * The Sandbox app's read path into the corpus — Milestone 5, step 2.
 *
 * Replaces importing one occupant's divergences from a hand-written TypeScript file with
 * reading N components from the database. `sandbox/server/corpus-api.mjs` holds the
 * `app_rw` credential and serves `/api/corpus`; nothing in this file (or anywhere else
 * that ships to the browser) can reach Fabric directly.
 */

export type CorpusComponent = {
  slug: string
  title: string
  state: string
  divergences: number
  resolved: number
  open: number
  /** Which machine owns this component, or null if unclaimed. */
  owner: string | null
  /** Computed SERVER-side against `.env`, mirroring migration 016's write guard. The
   * browser cannot know which machine it is running on, and a value the browser is told
   * is a value the browser can be wrong about — which, for "may I write here", is the
   * whole question. Courtesy only: the database refuses independently. */
  mayWrite: boolean
}

export type CorpusDivergence = {
  ref: string
  category: string
  originCategory: string | null
  title: string
  detail: string | null
  /** The corpus lifecycle state — `legacy_unverified`, `resolved`, … Deliberately NOT the
   * same thing as the source record's own `status`; see `sourceStatus` below. */
  state: string
  anchorId: string | null
  anchorFile: string | null
  visual: DivergenceRow["visual"] | null
  /** The entire source object, stored verbatim at import. Rendering from this is what
   * makes the DB path reproduce the hand-written file exactly, including any field nobody
   * thought to map into a column — and what makes the two diffable in
   * `scripts/check-corpus-equivalence.mjs`. */
  originRecord: Record<string, unknown> | null

  // ── the review card's own inputs (sandbox/REVIEW-CARD-SPEC.md) ──────────────────
  /** Migration 018. NULL on every row today — the card falls back to `title`/`detail`,
   * which is the normal path rather than a transitional one, since backfill is scoped to
   * the few live rows rather than all 154. */
  reviewLabel: string | null
  reviewPrompt: string | null
  /** The `ref_code` of the system change blocking this row, if any. Drives the `Blocked`
   * badge — deliberately a badge and not a checklist item, since no amount of checking
   * clears it. */
  blockedRef: string | null
  evidenceTotal: number
  evidenceStale: number
  /** Whether `verifier/checks/<slug>/<ref>.json` exists. A FILESYSTEM fact, not a database
   * one — and the distinction between "no check written" and "check not run" is the
   * difference between two different owners. */
  hasCheckSpec: boolean
  /** The gate's own unmet list, from `fn_divergence_unmet` — not re-derived here. Empty
   * means the gate is open. */
  unmet: { requirement: string; detail: string }[]

  // ── migration 010's declaration: which elements, which properties, in which state ──
  /** One entry per element the claim concerns. Two entries means a RELATIONAL claim (a gap
   * between things), which needs a different drawing than a box around one thing. */
  subjects: { ordinal: number; side: string; anchorId: string | null; selector: string | null; label: string }[]
  properties: { property: string; type: PropertyType }[]
  /** `gap`, `pitch`, `containment` … — how two subjects relate, when there are two. */
  relation: string | null
  /** The interaction state the claim holds in. `rest` on 9 rows, NULL on 145 — nothing has
   * ever been declared in hover, active or focus, which is why the highlight does not try
   * to drive one. */
  subjectState: string | null
}

/** Migration 010's own enum. Only `length`, `text` and `keyword` have any rows in the
 * corpus today; `color`, `time` and `layer` are declared here because the database
 * declares them, and get renderers when their first row does. */
export type PropertyType = "length" | "color" | "text" | "time" | "keyword" | "layer"

export type Corpus = {
  components: CorpusComponent[]
  divergences: Record<string, CorpusDivergence[]>
  /** This machine's name from `.env`, or null when unset. Read server-side. */
  thisMachine: string | null
  fetchedAt: string
  /** True when Fabric was unreachable and this came from the on-disk snapshot instead.
   * The app must show this — a stale read presented as live is the same false-green the
   * whole system exists to prevent. */
  stale: boolean
  staleReason?: string
}

/** The fetch result on its own. Kept separate from `CorpusState` because `Omit` over a
 * union collapses it to the keys every member shares — which silently erases `corpus` and
 * `message`, and the error only surfaces at the `setState` call sites. */
type CorpusData =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; corpus: Corpus }

export type CorpusState = CorpusData & {
  /** Refetch after a write. Approving or reopening changes the gate for that row, and
   * often for nothing else — but the answer has to come from the database rather than be
   * patched into local state, because the write may have been refused for a reason this
   * layer cannot see (migration 016's ownership guard, or the gate closing underneath a
   * card that was already on screen). */
  reload: () => void
}

export function useCorpus(): CorpusState {
  const [state, setState] = useState<CorpusData>({ status: "loading" })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/corpus", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json()
        if (cancelled) return
        if (body.error) setState({ status: "error", message: body.error })
        else setState({ status: "ready", corpus: body as Corpus })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", message: String(err?.message ?? err) })
      })
    return () => {
      cancelled = true
    }
  }, [nonce])

  /**
   * Refetch when the tab becomes visible again.
   *
   * Ownership is a COMPONENT fact read once with the corpus, which makes it stale the
   * moment another machine claims the component — and a stale `mayWrite: true` leaves this
   * app's approve control live for something it can no longer write. The database still
   * refuses (migration 016), so this is a courtesy layer either way; but a control that
   * looks available and then fails is worse than one that was never offered, and the whole
   * point of the machine switcher is that ownership moves while you are looking at it.
   *
   * Caught by `verify-machines-ui.mjs`, which hands the component to another machine and
   * asserts the control goes dead — it stayed live, because nothing had told the page.
   *
   * Visibility rather than polling: the realistic case is coming back to a tab after
   * someone else took the component, and a timer would hammer Fabric for a fact that
   * changes a few times a month.
   */
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setNonce((n) => n + 1)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  return { ...state, reload: () => setNonce((n) => n + 1) } as CorpusState
}

/**
 * Groups corpus rows back into the category shape the divergence list renders.
 *
 * The grouping key is `origin_category` (e.g. `"A — Icons"`), not the normalised
 * `category` enum. Both are real, and the distinction matters: the enum is the retrieval
 * key that makes the corpus queryable across components, while `origin_category` is what
 * this component's own author actually wrote and what a human reading the list expects to
 * see. Mapping several source categories onto one enum value is lossless precisely
 * because the original label was kept — so the display can stay faithful while retrieval
 * stays uniform.
 */
export function toCategories(rows: CorpusDivergence[]): DivergenceCategory[] {
  const byCategory = new Map<string, DivergenceCategory>()

  for (const row of rows) {
    const label = row.originCategory ?? row.category
    // "A — Icons" → id "A", name "Icons". A label without the separator becomes its own
    // id and name rather than being dropped.
    const [rawId, ...rest] = label.split("—")
    const id = rawId.trim()
    const name = rest.join("—").trim() || id

    if (!byCategory.has(id)) byCategory.set(id, { id, name, rows: [] })

    const source = (row.originRecord ?? {}) as Partial<DivergenceRow>
    byCategory.get(id)!.rows.push({
      // Render from the verbatim source record where it exists, so this path is
      // indistinguishable from the hand-written file it replaces; fall back to the
      // normalised columns for any row that arrived without one.
      id: source.id ?? row.ref,
      what: source.what ?? row.title,
      status: (source.status as DivergenceStatus) ?? "note",
      detail: source.detail ?? row.detail ?? "",
      visual: source.visual ?? row.visual ?? undefined,
    })
  }

  return [...byCategory.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * The corpus lifecycle state per ref (`legacy_unverified`, `resolved`, …), which is a
 * DIFFERENT thing from the source record's own `status` the badge shows.
 *
 * Worth surfacing both, and this is the first time the app can: the source calls 152 rows
 * "resolved", while the corpus holds every one at `legacy_unverified` because none has
 * been through the gate. That gap is the entire point of how M4 imported them — showing
 * only the source's own claim would reproduce exactly the pre-blessed reading the import
 * was designed to refuse.
 */
export function lifecycleStates(rows: CorpusDivergence[]): Map<string, string> {
  return new Map(rows.map((r) => [r.ref, r.state]))
}
