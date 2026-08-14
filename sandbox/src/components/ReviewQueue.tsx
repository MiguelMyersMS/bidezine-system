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
import { registerOf } from "@/lib/register"

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
 * The buckets are exhaustive and mutually exclusive over `cardStatus`, and must stay that
 * way: `ready` and stale-`resolved` land in "waiting on you", `blocked` in "blocked",
 * `open` splits between "needs your decision" and "waiting on a machine" by REGISTER,
 * fresh-`resolved` in "done". A row matching two buckets would be reviewed twice; a row
 * matching none would vanish from the only list that shows it. Neither failure announces
 * itself — the totals just quietly stop adding up, which is why
 * `verify-review-cards.mjs` asserts the partition rather than trusting this comment.
 *
 * ── Why `open` splits ───────────────────────────────────────────────────────────────
 * It used to be one bucket, and that hid every decision the corpus contains. All 11
 * `decide` rows report `evidence.present` and `review.present` unmet — same as the 150
 * nobody has started — so the queue filed them together and reported "Waiting on you: 0"
 * while eleven cards said Decide.
 *
 * A `decide` row cannot be measured into existence: nothing produces H-2's duration or
 * G-1's radius step except somebody choosing. Waiting for evidence first waits forever.
 * See `registerOf` for the full asymmetry.
 */

const BUCKETS: Bucket[] = [
  {
    // First, above even "Waiting on you": these block their own chains entirely. A ready
    // row is one click from done; an undecided row has nothing downstream of it at all.
    id: "decide",
    title: "Needs your decision",
    blurb:
      "Nothing can be measured until someone chooses. These do not wait on evidence — evidence waits on them.",
    match: (status, row) => status === "open" && registerOf(row) === "decide",
  },
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
      "Something is owed by an agent or the runner — a check to write, a measurement to take, an independent review to do. Nothing here needs a decision first.",
    // The complement of the decide bucket above, so the two together still cover every
    // `open` row exactly once. Written as an explicit negation rather than relying on
    // array order, so reordering the list cannot silently drop rows out of both.
    match: (status, row) => status === "open" && registerOf(row) !== "decide",
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
  onGoTo,
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
  /** Follow a relation to the row it names. */
  onGoTo?: (ref: string) => void
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
                  {bucket.id === "decide"
                    ? // Distinct from "yours" on purpose. These two empty states mean
                      // different things — nothing left to CHOOSE versus nothing left to
                      // APPROVE — and one sentence covering both is how the old single
                      // "waiting on you" bucket came to report zero while eleven rows
                      // were asking to be decided.
                      "Nothing is waiting on a choice. Every open row can proceed without you."
                    : bucket.id === "yours"
                      ? "No divergence is currently ready for your approval."
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
                onGoTo={onGoTo}
              />
            ))
          )}
        </section>
      ))}
    </div>
  )
}
