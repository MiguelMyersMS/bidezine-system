import { useMemo, useState } from "react"
import {
  Badge,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@bidezine/system"
import { ReviewCard, cardStatus, type CardStatus } from "@/components/ReviewCard"
import type { CorpusDivergence } from "@/data/corpus"

/**
 * The divergence list, organised by who owes the next move — see
 * `sandbox/REVIEW-CARD-SPEC.md` §4.
 *
 * ── Why this is not the category accordion any more ─────────────────────────────────
 * Categories answer "what kind of thing is this?". With 147 of rail-sidebar's 154 rows
 * having no anchor, no evidence and no review, the question a human actually has is
 * "is this mine yet?" — and under the old grouping all 154 rows looked identical, so the
 * single row whose gate is open was indistinguishable from the 147 nobody has started.
 *
 * Category survives as a FILTER rather than as the primary axis. It is a good scan handle
 * and it is the corpus retrieval key; it is just not the first question.
 */

type Bucket = {
  id: string
  title: string
  blurb: string
  match: (status: CardStatus, row: CorpusDivergence) => boolean
}

/**
 * The four buckets are exhaustive and mutually exclusive over `cardStatus`, and must stay
 * that way: `ready` and stale-`resolved` land in "waiting on you", `blocked` in "blocked",
 * `open` in "waiting on a machine", fresh-`resolved` in "done". A row matching two buckets
 * would be reviewed twice; a row matching none would vanish from the only list that shows
 * it. Neither failure announces itself — the totals just quietly stop adding up.
 */

const BUCKETS: Bucket[] = [
  {
    id: "yours",
    title: "Waiting on you",
    blurb: "Every requirement is met, or an approved row's evidence has gone stale. These are decisions.",
    match: (status, row) => status === "ready" || (status === "resolved" && row.evidenceStale > 0),
  },
  {
    id: "blocked",
    title: "Blocked",
    blurb: "Parked on an open system change. No amount of measuring or reviewing moves these.",
    match: (status) => status === "blocked",
  },
  {
    id: "machines",
    title: "Waiting on a machine",
    blurb:
      "Something is owed by an agent or the runner — a check to write, a measurement to take, an independent review to do.",
    match: (status) => status === "open",
  },
  {
    id: "done",
    title: "Done",
    blurb: "Resolved, with current evidence behind it.",
    match: (status, row) => status === "resolved" && row.evidenceStale === 0,
  },
]

/**
 * How far along the chain a row has got, used to sort within "waiting on a machine".
 *
 * Without this, the one row that only needs a review sits somewhere among 146 rows that
 * have not been started — which is the same "everything looks identical" problem the
 * bucketing exists to solve, just one level down.
 */
function progress(row: CorpusDivergence) {
  const unmet = new Set(row.unmet.map((u) => u.requirement))
  let n = 0
  if (row.anchorId) n++
  if (row.hasCheckSpec) n++
  if (!unmet.has("evidence.present")) n++
  if (!unmet.has("review.present")) n++
  return n
}

export function ReviewQueue({
  slug,
  rows,
  mayWrite,
  owner,
  thisMachine,
  selectedRef,
  onSelect,
  onReveal,
  onChanged,
  decisionSurface,
}: {
  slug: string
  rows: CorpusDivergence[]
  mayWrite: boolean
  owner: string | null
  thisMachine: string | null
  selectedRef: string | null
  onSelect: (ref: string) => void
  onReveal: (ref: string) => void
  onChanged: () => void
  decisionSurface?: (row: CorpusDivergence) => React.ReactNode
}) {
  const [category, setCategory] = useState<string>("all")

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort(),
    [rows],
  )

  const filtered = useMemo(
    () => (category === "all" ? rows : rows.filter((r) => r.category === category)),
    [rows, category],
  )

  const buckets = useMemo(
    () =>
      BUCKETS.map((b) => ({
        ...b,
        rows: filtered
          .filter((r) => b.match(cardStatus(r), r))
          .sort((a, z) => progress(z) - progress(a) || a.ref.localeCompare(z.ref)),
      })),
    [filtered],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {rows.length} divergence{rows.length === 1 ? "" : "s"}
        </p>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger size="sm" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {buckets.map((bucket) => (
        <section key={bucket.id} className="flex flex-col gap-2" data-bucket={bucket.id}>
          <Separator />
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium">{bucket.title}</h3>
            <Badge variant="outline">{bucket.rows.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{bucket.blurb}</p>

          {bucket.rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nothing here</EmptyTitle>
                {/* Stated rather than left blank: an empty "waiting on you" is the normal,
                    correct state most of the time, and an unexplained blank reads like a
                    loading failure. */}
                <EmptyDescription>
                  {bucket.id === "yours"
                    ? "No divergence is currently waiting on a decision from you."
                    : "No divergence is in this state."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            bucket.rows.map((row) => (
              <ReviewCard
                key={row.ref}
                slug={slug}
                row={row}
                selected={selectedRef === row.ref}
                mayWrite={mayWrite}
                owner={owner}
                thisMachine={thisMachine}
                onSelect={() => onSelect(row.ref)}
                onReveal={() => onReveal(row.ref)}
                onChanged={onChanged}
                decisionSurface={decisionSurface}
              />
            ))
          )}
        </section>
      ))}
    </div>
  )
}
