import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  cn,
} from "@bidezine/system"
import { ReviewCardShell, type ShellBadge } from "@/components/ReviewCardShell"
import { BLOCK_KINDS, ComparisonBlocks } from "@/components/CompareVisuals"
import type { CorpusDivergence } from "@/data/corpus"

/**
 * The divergence review card — see `sandbox/REVIEW-CARD-SPEC.md`, which is the contract
 * this file implements. Read it before changing anything here; the decisions below were
 * argued rather than assumed, and several look arbitrary without their reasons.
 *
 * ── Why this replaced the evidence widget ───────────────────────────────────────────
 * The widget was built for a divergence that HAS evidence. Of rail-sidebar's 154 rows, 7
 * have an anchor, 7 have evidence, 3 have a live review, and exactly one has an open
 * gate. So for 147 rows it rendered empty scaffolding around a two-line to-do list, and
 * stated the gate's requirements twice — once as unmet slugs, once as section headers
 * with counts. This card's primary job is making a not-started row legible AS not-started.
 */

// ── the gate's own vocabulary, labelled for a human ────────────────────────────────
// The slug is what gets stored (`false_completion.requirement_type`); the label is what
// gets read. Both halves matter: M9's entire work queue is "which requirement type is
// falsified most often", which a free-text box would fragment into something unqueryable
// — and a human being asked to classify their own reopen should not have to read database
// identifiers to do it.
const REQUIREMENT_CHOICES = [
  { slug: "evidence.present", label: "The measurement was missing or did not really assert anything" },
  { slug: "evidence.current", label: "The measurement was out of date — the code had moved on" },
  { slug: "review.present", label: "The independent check had not really happened" },
  { slug: "review.cites_evidence", label: "The independent check cited no evidence" },
  { slug: "review.citations_support", label: "The independent check cited evidence that does not support it" },
  { slug: "divergence.blocked", label: "It depended on a system change that is still open" },
  { slug: "other", label: "Something else" },
]

type ChecklistRow = {
  label: string
  done: boolean
  /** Shown only when this row is the first incomplete one — the one actually owed. */
  reason: string
}

/**
 * The four rows, derived from the gate's OWN unmet list plus two facts the gate does not
 * express (an anchor, and whether a check spec exists on disk).
 *
 * Four rows cover six gate requirements. The three `review.*` requirements collapse into
 * one because, to a human, "no review", "cites nothing" and "cites failing evidence" are
 * one answer: it has not been independently checked. Which of the three failed is
 * detail-on-demand, carried in `reason`.
 */
/**
 * Whether this row resolves to a real anchor in the markup — its own, or one its subject
 * names.
 *
 * ONE definition, used by both the "Located in the component" checklist row and the
 * presence of the Reveal control, because those two must never disagree. The spec's rule is
 * that Reveal appears if and only if that checklist row is checked, so a missing control
 * always has its reason visible one line below — two separate conditions is how that
 * guarantee quietly breaks. (`CLAUDE.md` checklist item 20: one boolean, one mechanism.)
 *
 * The subject's anchor matters because `data-divergence` holds one value per element while
 * several rows can concern the same element — B-2 and B-7 are the same button in the same
 * state, one claiming its background and the other its foreground. Neither owns the
 * attribute; both point at F-2's.
 */
/**
 * Categories whose divergences are code facts rather than anything rendered.
 *
 * They get no canvas control and no inline example, and the pill says so, because the
 * useful thing to tell a reviewer before they open a card is what kind of judgement it
 * will ask for. `structure` here is "inline CSS-in-JS", "a `useTokens()` hook", "a direct
 * Radix import" — real decisions with nothing to look at.
 *
 * Display only. The stored enum value is untouched: it is the corpus retrieval key M9's
 * ranking reads, and relabelling it for a human would fragment that.
 */
const CODE_CATEGORIES = new Set(["structure", "naming-api"])

/**
 * The category as a human reads it. `component-gap` → `Component gap`.
 *
 * A display transform, never a stored one. Capitalising alone would give `Component-gap`,
 * so the hyphen goes too — these are slugs chosen to be queryable, not to be read.
 */
export function categoryLabel(category: string): string {
  const words = category.replace(/-/g, " ")
  const human = words.charAt(0).toUpperCase() + words.slice(1)
  return CODE_CATEGORIES.has(category) ? `Code · ${human}` : human
}

export function anchorOf(row: CorpusDivergence): string | null {
  return row.anchorId ?? row.subjects?.find((s) => s.side === "bidezine" && s.anchorId)?.anchorId ?? null
}

/**
 * Whether the canvas can show this row at all.
 *
 * Two ways to be locatable, and they are not interchangeable:
 *
 * - a **bidezine anchor**, for something the translation renders;
 * - an **origin selector**, for something that exists only in the source system —
 *   `component-gap` rows name origin components with no bidezine equivalent, so the only
 *   honest place to point is origin's own pane.
 *
 * A code-shaped row is never revealable however it is declared. `structure` and
 * `naming-api` describe inline CSS-in-JS, a hook, an import — there is nothing rendered to
 * point at, and showing code on a review card is a standing prohibition. Excluded here
 * rather than left to produce a control that resolves to nothing.
 */
export function revealable(row: CorpusDivergence): boolean {
  if (CODE_CATEGORIES.has(row.category)) return false
  const origin = row.subjects?.some((s) => s.side === "origin" && s.selector)
  return !!anchorOf(row) || !!origin
}

function buildChecklist(row: CorpusDivergence): ChecklistRow[] {
  const unmet = new Set(row.unmet.map((u) => u.requirement))
  const detailFor = (req: string) => row.unmet.find((u) => u.requirement === req)?.detail ?? ""

  const reviewReqs = ["review.present", "review.cites_evidence", "review.citations_support"]
  const failedReview = reviewReqs.find((r) => unmet.has(r))

  return [
    {
      label: "Located in the component",
      done: !!anchorOf(row),
      reason: "No part of the component is marked as the thing this is about, so nothing can be measured or shown.",
    },
    {
      label: "Measured",
      done: !unmet.has("evidence.present"),
      // The most common failure in the corpus by a wide margin, and the two causes have
      // different owners: writing a check is authoring work, running it is the runner's.
      // A checklist that could not tell them apart would send a human to the wrong place
      // 95% of the time.
      reason: row.hasCheckSpec
        ? "A check exists for this row but has not been run, or its last run did not pass."
        : "No check has been written for this row yet, so there is nothing to run.",
    },
    {
      label: "Still current",
      done: !unmet.has("evidence.current"),
      reason: detailFor("evidence.current") || "The code changed after this was last measured.",
    },
    {
      label: "Checked by a second agent",
      done: !failedReview,
      reason: failedReview ? detailFor(failedReview) : "",
    },
  ]
}

/**
 * THE CHAIN RULE — spec §3.6, and the single most load-bearing line in this file.
 *
 * Every row after the first incomplete one renders LOCKED, never passed, regardless of
 * what the gate reports for it.
 *
 * This is not styling. `evidence.current` is VACUOUSLY SATISFIED for 147 rows: its SQL
 * joins on `anchor_file`, which is NULL on them, so it emits no unmet row and reads as
 * met. Measured against the live corpus: `evidence.current` blocks ZERO divergences while
 * `evidence.present` blocks 147. A card that rendered the gate's output directly would
 * show "Still current" as PASSED on 147 rows that have never been measured at all.
 *
 * The gate is still the source of truth for whether a row can be approved — this only
 * governs how its verdict is displayed, and it fails safe: it can under-report progress,
 * never over-report it.
 */
function firstIncomplete(rows: ChecklistRow[]) {
  const i = rows.findIndex((r) => !r.done)
  return i === -1 ? rows.length : i
}

export type CardStatus = "resolved" | "blocked" | "ready" | "open"

export function cardStatus(row: CorpusDivergence): CardStatus {
  if (row.state === "resolved") return "resolved"
  if (row.blockedRef) return "blocked"
  if (row.unmet.length === 0) return "ready"
  return "open"
}

const STATUS_BADGE: Record<CardStatus, ShellBadge> = {
  // Muted/solid: an end state. Matches the divergence being genuinely finished.
  resolved: { label: "Resolved" },
  blocked: { label: "Blocked", tone: "negative" },
  ready: { label: "Ready", tone: "positive" },
  open: { label: "Open" },
}

function statusBadges(row: CorpusDivergence): ShellBadge[] {
  // Resolved-but-stale is a real state: a system change can invalidate the evidence under
  // an approved row and drop it back out with nobody touching this card (M7). "Approved"
  // is not "locked forever", so the marker sits ALONGSIDE the status rather than
  // replacing it.
  const stale: ShellBadge[] = row.evidenceStale > 0 ? [{ label: "Stale", tone: "warning" }] : []
  return [...stale, STATUS_BADGE[cardStatus(row)]]
}

export function ReviewCard({
  slug,
  row,
  selected,
  mayWrite,
  owner,
  thisMachine,
  onSelect,
  onReveal,
  onChanged,
}: {
  slug: string
  row: CorpusDivergence
  selected: boolean
  mayWrite: boolean
  owner: string | null
  thisMachine: string | null
  onSelect: () => void
  onReveal: () => void
  onChanged: () => void
  /**
   * The tool you decide THIS row with, chosen by its category — the colour lab for a
   * `color` row, the type lab for a `typography` one.
   *
   * Injected rather than imported, because the labs operate on per-occupant data
   * (`proposedDarkRailTokens` is Rail Sidebar's, not every component's) and this card has
   * to stay generic — it is the shell's own piece, not the occupant's. Same reason
   * `PREVIEW_REGISTRY` is injected rather than imported here.
   *
   * These were separate tabs. A tab meant deciding a colour on one screen and recording
   * the decision on another, correlating the two by hand — the same defect as the old
   * evidence panel replacing the preview, one level up.
   */
}) {
  const [open, setOpen] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [reason, setReason] = useState("")
  const [requirement, setRequirement] = useState(REQUIREMENT_CHOICES[0].slug)
  const [busy, setBusy] = useState(false)
  const [pendingState, setPendingState] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Clears once the refetched row reports the state the write was aiming at, which is what
  // re-enables the control. Also clears if the row arrives in some OTHER state — another
  // machine got there first, and continuing to block would be waiting for something that
  // is never coming.
  useEffect(() => {
    if (pendingState && row.state === pendingState) setPendingState(null)
  }, [row.state, pendingState])

  const checklist = buildChecklist(row)
  const cut = firstIncomplete(checklist)
  // The fraction is `cut`, NOT a count of `done` flags — the chain rule governs the number
  // as well as the rows. Everything before the first incomplete row is done by definition;
  // anything after it is unknowable, whatever the gate says about it.
  //
  // Found by measuring, not by reading: A-1 rendered "1/4" with nothing done at all,
  // because `evidence.current` is vacuously satisfied for the 147 rows whose `anchor_file`
  // is NULL, and counting raw flags credited that as progress. The rows were correctly
  // locked while the number beside them disagreed — which is worse than either alone,
  // since the number is what gets read at a glance.
  const doneCount = cut
  const status = cardStatus(row)
  const resolved = status === "resolved"
  const ready = status === "ready"

  // Fallbacks are the NORMAL path, not scaffolding: `review_label`/`review_prompt`
  // (migration 018) are NULL on every row today, and backfill is deliberately scoped to
  // the handful of live rows rather than all 154. `title` averages 120 characters and
  // hits its own 400-character cap, so it is clamped rather than trusted to be short.
  const label = row.reviewLabel ?? row.title
  /**
   * The description is the ASK, not the record.
   *
   * `detail` is the imported resolution history — what was decided and why, written after
   * the fact. It answers a question a human is not being asked here, and reading it as the
   * description means every card opens with an account of something already settled.
   * `review_prompt` is the AI-to-human sentence: what needs reviewing, and why it cannot
   * be decided mechanically.
   *
   * When none is authored the card SAYS so rather than falling back to the history. A
   * substitute that reads plausibly is worse than a stated gap — it was the fallback that
   * made 169 cards look described when none of them were.
   *
   * The history is still in the corpus and still queryable; it is just not on the card.
   */
  const prompt = row.reviewPrompt ?? null

  // Two independent reasons approval cannot happen, and they are not the same refusal:
  // a closed gate says "come back when the evidence is there"; foreign ownership says
  // "this is not yours, and no amount of evidence changes that". Both are enforced by the
  // database (migrations 002 and 016) — this is a courtesy layer over them.
  const blockedByOwnership = !mayWrite
  /**
   * Ownership and the gate disable the ON direction ONLY. A resolved row's switch stays
   * live for anyone, including an observer on a machine that does not own the component.
   *
   * That asymmetry is deliberate and load-bearing. Migration 016 gates `usp_resolve_divergence`
   * and `usp_promote_component` and pointedly does NOT gate reopen: reporting a false
   * completion is exactly the job of someone who did not do the work, and a read-only
   * observer who cannot raise a concern is a silent bystander. Collapsing approve and
   * reopen into one control makes that easy to lose — disabling the switch wholesale for a
   * foreign component silently removes the one action an observer is specifically supposed
   * to keep. Found while re-pointing verify-machines-ui.mjs, whose "Reopen stays ENABLED"
   * assertion existed for precisely this and had nothing left to bind to.
   */
  const switchDisabled = busy || pendingState !== null || (!resolved && (!ready || blockedByOwnership))
  const ownershipReason = !thisMachine
    ? "This Sandbox has no MACHINE_NAME set, so the database refuses any write that would have to name a machine."
    : `${owner} owns this component. Approving it is refused by the database, not by this control.`

  /**
   * Stays true from a successful write until the row actually comes back changed.
   *
   * `busy` alone is not enough, and F-3 proved it: it carries TWO approval rows four
   * seconds apart, both against the same commit. `busy` clears when the POST returns, but
   * the corpus refetch that POST triggers takes several more seconds — so the switch
   * re-enabled while still rendering `checked={resolved}` from the PRE-write corpus, and a
   * second deliberate click approved an already-resolved divergence. `usp_resolve_divergence`
   * accepted it, because nothing refuses re-approving a resolved row.
   *
   * Binding `checked` to server truth (§3.7) prevented a LIE about the state; it did not
   * prevent acting on a state that had not caught up. Those are different problems and the
   * second one needed its own answer.
   */
  async function post(verb: "approve" | "reopen", body: object) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/divergence/${slug}/${encodeURIComponent(row.ref)}/${verb}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const out = await res.json()
      setMessage(out.error ?? null)
      if (!out.error) {
        setReopening(false)
        setReason("")
        // The state this write is expected to produce. The control stays disabled until the
        // refetched row actually says so — not until the request came back.
        setPendingState(verb === "approve" ? "resolved" : "reopened")
      }
      // Always refetch, even on refusal: the refusal may itself be the news (the gate
      // closed underneath this card while it was on screen).
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <ReviewCardShell
      attrs={{ "data-review-card": row.ref, "data-card-kind": "divergence", "data-status": status }}
      refCode={row.ref}
      badges={statusBadges(row)}
      pill={categoryLabel(row.category)}
      label={label}
      prompt={prompt}
      examples={
        // Inline comparison for icon / colour / typography only. Everything else belongs in
        // the canvas, where it can be triggered, or in the description — a motion has no
        // static "before" to sit beside an "after", and a code fact has nothing to render.
        row.visual && BLOCK_KINDS.has(row.visual.kind) ? <ComparisonBlocks visual={row.visual} /> : null
      }
      selected={selected}
      onSelect={onSelect}
    >
        {/* ── Reveal in canvas: present IF AND ONLY IF the row is anchored ──────────
            One rule, no exceptions. The reason for an absent control is always visible
            one line below it, as the checklist's own first row — so a missing button is
            never a silent mystery. */}
        {revealable(row) ? (
          <div>
            <Button
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation()
                onReveal()
              }}
            >
              Reveal in canvas
            </Button>
          </div>
        ) : null}

        {row.blockedRef && (
          <p className="text-xs text-muted-foreground">
            Blocked on system change <code>{row.blockedRef}</code>. Nothing on this card can move until
            that lands — no amount of measuring or reviewing clears it.
          </p>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-between px-2 text-xs font-normal"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="flex items-center gap-1">
                <ChevronDownIcon
                  className={cn("size-3.5 transition-transform", open && "rotate-180")}
                />
                Evidence checklist
              </span>
              <span className="text-muted-foreground">
                {doneCount}/{checklist.length}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="flex flex-col gap-1 px-2 pt-2">
              {checklist.map((item, i) => {
                const locked = i > cut
                const current = i === cut
                return (
                  <li
                    key={item.label}
                    aria-disabled={locked || undefined}
                    // `text-muted-foreground` without an opacity modifier, plus a separate
                    // `opacity-60`. The first version used `text-muted-foreground/60`,
                    // which never applied — measured via getComputedStyle, locked rows came
                    // back `oklch(0 0 0)`, identical to active ones. Writing a class is not
                    // the same as it landing in the compiled stylesheet.
                    className={cn(
                      "flex items-start gap-2 text-xs",
                      locked ? "text-muted-foreground opacity-60" : "text-foreground",
                    )}
                  >
                    {/* A locked row shows an empty circle regardless of what the gate says
                        about it — see the chain rule. Rendering a tick here would be the
                        vacuous pass reaching the screen. */}
                    {item.done && !locked ? (
                      <CircleCheckIcon filled className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <CircleIcon className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    <span className="flex flex-col gap-0.5">
                      <span>{item.label}</span>
                      {/* Only the row actually owed explains itself. Every row carrying a
                          reason would restore the wall of text this card replaced. */}
                      {current && item.reason && (
                        <span className="text-muted-foreground">{item.reason}</span>
                      )}
                    </span>
                  </li>
                )
              })}
              <li
                className={cn(
                  "flex items-start gap-2 pt-1 text-xs",
                  ready || resolved
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground opacity-60",
                )}
              >
                {/* NOT counted in the fraction above. It is the conjunction of the four
                    rows, so counting it would put something in the denominator that can
                    never be the only thing missing. It is advice to a human, not a check. */}
                {ready || resolved ? (
                  <CircleCheckIcon filled className="mt-0.5 size-3.5 shrink-0" />
                ) : (
                  <CircleIcon className="mt-0.5 size-3.5 shrink-0" />
                )}
                <span>Ready for approval</span>
              </li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        {message && <p className="rounded-md bg-destructive/10 p-2 text-[11px]">{message}</p>}

        {reopening ? (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <Label className="text-xs">What was wrong?</Label>
            <Select value={requirement} onValueChange={setRequirement}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_CHOICES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-xs">Reason — this becomes the permanent record</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What was wrong, and how was it found?"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={busy || !reason.trim()}
                onClick={() => post("reopen", { requirementType: requirement, reason })}
              >
                Reopen and record
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReopening(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch
              id={`approve-${row.ref}`}
              data-approve-switch={row.ref}
              // `checked` is bound to the SERVER's answer, never to local state. A switch
              // that flips optimistically announces a state change to a screen reader that
              // may not have happened — and here it frequently would not have.
              checked={resolved}
              disabled={switchDisabled}
              onCheckedChange={(next) => {
                // ON is one deliberate click, with no confirmation. Approve is the most
                // frequent action in the system and M6 makes a one-minute review a hard
                // criterion; a dialog dismissed fifty times becomes reflexive and builds
                // the rubber stamp it was meant to prevent. The misclick it would guard
                // against is already covered twice: the control cannot move on an unready
                // row, and the action is reversible through the off direction.
                if (next) void post("approve", {})
                // OFF opens a form rather than acting. It writes a false_completion row —
                // the highest-signal data this system produces — and needs two mandatory
                // inputs a switch has nowhere to collect.
                else setReopening(true)
              }}
              title={
                // Order matters: `resolved` is checked FIRST, so a resolved row owned by
                // another machine describes the reopen it can still do rather than an
                // approval refusal that no longer applies to it.
                resolved
                  ? "Turn off to reopen. That records a false completion and cannot be undone by turning it back on."
                  : blockedByOwnership
                    ? ownershipReason
                    : ready
                      ? "Approve — records the approval and moves this to resolved"
                      : "The gate is closed. This cannot succeed; the database refuses the transition."
              }
            />
            <Label htmlFor={`approve-${row.ref}`} className="text-xs font-normal">
              {/* Reopening invalidates the review (migration 007), so the gate closes in
                  the same frame and this control goes disabled. Saying so is the point —
                  the off position is not a state you can casually leave. */}
              {resolved
                ? "Approved"
                : row.state === "reopened"
                  ? "Reopened — needs a new review before this can be approved again"
                  : "Approve migration"}
            </Label>
            {blockedByOwnership && (
              <Badge variant="secondary" className="ml-auto">
                {owner ? `owned by ${owner}` : "no machine identity"}
              </Badge>
            )}
          </div>
        )}
    </ReviewCardShell>
  )
}
