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
}

export type Corpus = {
  components: CorpusComponent[]
  divergences: Record<string, CorpusDivergence[]>
  fetchedAt: string
  /** True when Fabric was unreachable and this came from the on-disk snapshot instead.
   * The app must show this — a stale read presented as live is the same false-green the
   * whole system exists to prevent. */
  stale: boolean
  staleReason?: string
}

export type CorpusState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; corpus: Corpus }

export function useCorpus(): CorpusState {
  const [state, setState] = useState<CorpusState>({ status: "loading" })

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
  }, [])

  return state
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
