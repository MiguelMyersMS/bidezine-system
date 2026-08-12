import { useCallback, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
  cn,
} from "@bidezine/system"
import { NEGATIVE_BADGE, POSITIVE_BADGE, WARNING_BADGE } from "@/lib/status-colors"

/**
 * Milestone 6 — the evidence bundle and the approval gate.
 *
 * ── The one requirement that shapes everything else ─────────────────────────────────
 * M6's acceptance criteria include "approving a typical divergence takes about a minute",
 * and the spec is explicit that this is a hard requirement rather than a nicety: if the
 * bundle is a wall of text it gets rubber-stamped within two weeks, and blind trust has
 * been rebuilt with extra ceremony. So the default view is deliberately compact —
 * expected vs actual side by side, screenshots shown rather than linked, the gate's
 * verdict as a single line — and the long-form material (raw runner output, full review
 * claims) is one click away rather than on screen by default.
 *
 * ── The toggle is not "disabled in the UI" ──────────────────────────────────────────
 * `app_rw` is DENIED `UPDATE` on `divergence.state` (migration 002). The only path to
 * `resolved` is `usp_resolve_divergence`, which recomputes the gate itself and throws with
 * the full unmet list if anything is missing. The button below being greyed out is a
 * COURTESY; pressing it anyway cannot succeed. That distinction is the milestone — a
 * toggle enabled by an actor is a checkbox, a toggle enabled by computation is a gate.
 */

type GateUnmet = { requirement: string; detail: string }

type Evidence = {
  id: number
  kind: string
  passed: boolean
  stale: boolean
  commit: string
  commitAt: string
  runId: string
  artifactHash: string | null
  spec: { state?: string; expect?: Record<string, unknown>; _why?: string } | null
  raw: string
  expected: Record<string, unknown> | null
  measured: Record<string, unknown> | null
  failures: string | null
  artifactPath: string | null
}

type Review = {
  id: number
  author: string
  builder: string
  verdict: "pass" | "fail"
  claim: string
  commit: string
  createdAt: string
  cites: number[]
}

export type Bundle = {
  divergence: {
    ref: string
    state: string
    title: string
    detail: string | null
    anchorId: string | null
    reopenedCount: number
  }
  gate: { ready: boolean; unmet: GateUnmet[] }
  evidence: Evidence[]
  reviews: Review[]
  approvals: { approval_id: number; approved_by: string; approved_at_commit: string; note: string | null; created_at: string }[]
  falseCompletions: { false_completion_id: number; requirement_type: string; reason: string; discovered_by: string; created_at: string }[]
  headCommit: string
  /** M8. Optional so an older/cached payload cannot break the widget — see `mayWrite`. */
  ownership?: { thisMachine: string | null; owner: string | null; mayWrite: boolean }
  error?: string
}

/** The gate's own vocabulary, reused verbatim. `false_completion.requirement_type` is
 * meant to line up with the gate's checks so M9's "which requirement is falsified most
 * often" ranking works — offering a free-text box here would fragment that into a
 * taxonomy nobody can query. */
const REQUIREMENT_TYPES = [
  "evidence.present",
  "evidence.current",
  "review.present",
  "review.cites_evidence",
  "review.citations_support",
  "divergence.blocked",
  "other",
]

export function EvidenceWidget({ slug, refCode, onChanged }: { slug: string; refCode: string; onChanged?: () => void }) {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "refused" | "error"; text: string } | null>(null)
  const [reopening, setReopening] = useState(false)
  const [reason, setReason] = useState("")
  const [requirementType, setRequirementType] = useState(REQUIREMENT_TYPES[0])

  const load = useCallback(async () => {
    const res = await fetch(`/api/divergence/${slug}/${encodeURIComponent(refCode)}`, { cache: "no-store" })
    const body = await res.json()
    // Ignore a response that arrived after the user moved on. Without this, a slow reply
    // for the previous row can land last and be shown under the current row's name.
    if (body?.divergence?.ref && body.divergence.ref !== refCode) return
    setBundle(body)
  }, [slug, refCode])

  useEffect(() => {
    setMessage(null)
    setReopening(false)
    // Clear FIRST. The bundle takes a few seconds to assemble (several queries plus the
    // commit lookup), and without this the widget kept rendering the PREVIOUS row's
    // evidence, gate verdict and Approve state under the newly-selected row's heading —
    // caught by measuring, not by reading. In a tool whose entire purpose is deciding
    // whether something is proven, showing one row's evidence while the operator believes
    // they are looking at another is the worst failure it could have: every control stays
    // live, so an Approve pressed in that window acts on a row nobody was reading.
    setBundle(null)
    load()
  }, [load])

  if (!bundle) return <p className="p-4 text-sm text-muted-foreground">Loading evidence…</p>
  if (bundle.error) return <p className="p-4 text-sm text-muted-foreground">{bundle.error}</p>

  const { divergence, gate, evidence, reviews, approvals, falseCompletions, ownership } = bundle
  const resolved = divergence.state === "resolved"

  // Defaults to TRUE when the server sent no ownership block, so an older payload shape
  // cannot silently disable every Approve button in the app. The database is the thing
  // that actually refuses; this layer failing open is a cosmetic bug, whereas failing
  // closed would look exactly like the gate being broken.
  const mayWrite = ownership?.mayWrite ?? true
  const ownershipReason = !ownership?.thisMachine
    ? "This Sandbox has no MACHINE_NAME set, so the database refuses any write that would have to name a machine."
    : `${ownership.owner} owns this component. Approving it is refused by the database, not by this button.`

  async function act(verb: "approve" | "reopen", body: object) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/divergence/${slug}/${encodeURIComponent(refCode)}/${verb}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const out = await res.json()
      if (out.error) {
        setMessage({ kind: res.status === 409 ? "refused" : "error", text: out.error })
      } else {
        setMessage({ kind: "ok", text: verb === "approve" ? `Approved by ${out.approvedBy}.` : `Reopened by ${out.discoveredBy}.` })
        setReopening(false)
        setReason("")
      }
      await load()
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* ── the one-line verdict, first, because it is what the minute is spent on ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {divergence.ref} — {divergence.title}
          </p>
          <p className="text-xs text-muted-foreground">
            state <code>{divergence.state}</code>
            {divergence.anchorId ? <> · anchored at <code>{divergence.anchorId}</code></> : null}
            {divergence.reopenedCount > 0 ? <> · reopened {divergence.reopenedCount}×</> : null}
          </p>
        </div>
        <Badge className={cn("shrink-0", gate.ready ? POSITIVE_BADGE : NEGATIVE_BADGE)}>
          {gate.ready ? "Gate open" : `${gate.unmet.length} requirement${gate.unmet.length === 1 ? "" : "s"} unmet`}
        </Badge>
      </div>

      {!gate.ready ? (
        <div className="rounded-md border bg-muted/30 p-3">
          {/* The refusal IS the to-do list. Showing the requirement slug alongside the
              prose keeps the UI speaking the same vocabulary as the gate and as
              false_completion.requirement_type. */}
          {gate.unmet.map((u) => (
            <p key={u.requirement} className="text-xs">
              <code className="font-medium">{u.requirement}</code>{" "}
              <span className="text-muted-foreground">{u.detail}</span>
            </p>
          ))}
        </div>
      ) : null}

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pr-3">
          {/* ── evidence: expected vs actual, side by side ── */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Evidence ({evidence.length})
            </p>
            {evidence.length === 0 ? (
              <p className="text-xs text-muted-foreground">None. Nothing has been measured.</p>
            ) : (
              evidence.slice(0, 6).map((e) => <EvidenceCard key={e.id} evidence={e} />)
            )}
            {evidence.length > 6 ? (
              <p className="text-xs text-muted-foreground">
                {evidence.length - 6} older evidence row(s) not shown — the newest run is what the gate reads.
              </p>
            ) : null}
          </section>

          {/* ── reviews ── */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Independent review ({reviews.length})
            </p>
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                None. The gate will not open without a passing review by someone other than the builder —
                the database refuses to record one otherwise.
              </p>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </section>

          {approvals.length > 0 ? (
            <section className="flex flex-col gap-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Approvals</p>
              {approvals.map((a) => (
                <p key={a.approval_id} className="text-xs text-muted-foreground">
                  <strong>{a.approved_by}</strong> at <code>{a.approved_at_commit.slice(0, 8)}</code> ·{" "}
                  {new Date(a.created_at).toLocaleString()}
                  {a.note ? ` — ${a.note}` : ""}
                </p>
              ))}
            </section>
          ) : null}

          {falseCompletions.length > 0 ? (
            <section className="flex flex-col gap-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                False completions
              </p>
              {falseCompletions.map((f) => (
                <p key={f.false_completion_id} className="text-xs">
                  <Badge className={cn("mr-1", WARNING_BADGE)}>{f.requirement_type}</Badge>
                  <span className="text-muted-foreground">
                    {f.reason} — {f.discovered_by}, {new Date(f.created_at).toLocaleString()}
                  </span>
                </p>
              ))}
            </section>
          ) : null}
        </div>
      </ScrollArea>

      {message ? (
        <p
          className={cn(
            "rounded-md border p-2 text-xs",
            message.kind === "ok" && "bg-muted/30",
            message.kind !== "ok" && "bg-destructive/10",
          )}
        >
          {message.kind === "refused" ? "The gate refused this. " : null}
          {message.text}
        </p>
      ) : null}

      <Separator />

      {/* ── the two human acts ── */}
      {reopening ? (
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Which requirement was falsely passed?</Label>
          <Select value={requirementType} onValueChange={setRequirementType}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUIREMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs">Reason (required — it becomes the false-completion record)</Label>
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
              onClick={() => act("reopen", { requirementType, reason })}
            >
              Reopen and record
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setReopening(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            // M8: two independent reasons this cannot succeed, and they are NOT the same
            // refusal. A closed gate says "come back when the evidence is there"; foreign
            // ownership says "this is not yours, and no amount of evidence changes that".
            // Both are enforced by the database (migrations 002 and 016) — this is still
            // the courtesy layer M6's comment above describes, now with a second reason.
            disabled={busy || !gate.ready || resolved || !mayWrite}
            onClick={() => act("approve", {})}
            title={
              !mayWrite
                ? ownershipReason
                : gate.ready
                  ? "Records the approval and moves this to resolved"
                  : "The gate is closed. Pressing this cannot succeed — the database refuses the transition."
            }
          >
            {resolved ? "Resolved" : "Approve"}
          </Button>
          {/* Reopen stays available to an observer on purpose. Migration 016 does not gate
              it: reporting a false completion is exactly the job of someone who did not do
              the work, and a read-only observer that cannot raise a concern is a silent
              bystander. */}
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setReopening(true)}>
            Reopen…
          </Button>
          <span className="text-xs text-muted-foreground">
            against <code>{bundle.headCommit.slice(0, 8)}</code>
          </span>
          {!mayWrite && (
            <Badge variant="secondary" className="ml-auto">
              {ownership?.owner ? `owned by ${ownership.owner}` : "no machine identity"}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

/** Measured numbers side by side with what was expected — the deliverable rendered as
 * what it actually is, rather than as a description of it. */
function EvidenceCard({ evidence: e }: { evidence: Evidence }) {
  const [showRaw, setShowRaw] = useState(false)
  const keys = [...new Set([...Object.keys(e.expected ?? {}), ...Object.keys(e.measured ?? {})])]

  return (
    <Card className="gap-2 py-3">
      <CardHeader className="gap-1 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium">
            #{e.id} · {e.kind} · {e.spec?.state ?? "rest"}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            {e.stale ? <Badge className={WARNING_BADGE}>stale</Badge> : null}
            <Badge className={e.passed ? POSITIVE_BADGE : NEGATIVE_BADGE}>{e.passed ? "pass" : "fail"}</Badge>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          measured at <code>{e.commit?.slice(0, 8)}</code> · run {String(e.runId).slice(0, 8)}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-3">
        {keys.length > 0 ? (
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left font-normal">property</th>
                <th className="text-left font-normal">expected</th>
                <th className="text-left font-normal">actual</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const exp = (e.expected ?? {})[k]
                const got = (e.measured ?? {})[k]
                const agree = JSON.stringify(exp) === JSON.stringify(got)
                return (
                  <tr key={k} className={cn(!agree && exp !== undefined && "text-destructive")}>
                    <td className="pr-2 align-top font-mono">{k}</td>
                    <td className="pr-2 align-top font-mono">{exp === undefined ? "—" : String(exp)}</td>
                    <td className="align-top font-mono">
                      {got === undefined ? "—" : typeof got === "number" ? got.toFixed(2) : String(got)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : null}

        {/* Screenshots adjacent, not linked away — M6 asks for the artefact itself. */}
        {e.artifactPath ? (
          <img
            src={`/api/artifact/${e.artifactPath.split("/").pop()}`}
            alt={`screenshot for evidence ${e.id}`}
            className="max-h-40 w-auto rounded-sm border bg-background object-contain"
          />
        ) : null}

        {e.failures ? <pre className="whitespace-pre-wrap text-[11px] text-destructive">{e.failures}</pre> : null}

        <div>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? "Hide" : "Show"} raw runner output
          </Button>
        </div>
        {showRaw ? (
          // The raw text is the record of truth. It stays available verbatim precisely
          // because the table above is a reformatting of it, and a reformatting can lie.
          <pre className="max-h-60 overflow-auto rounded-sm bg-muted/40 p-2 text-[10px] whitespace-pre-wrap">
            {e.raw}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ReviewCard({ review: r }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const short = r.claim.length > 260 && !expanded ? `${r.claim.slice(0, 260)}…` : r.claim
  return (
    <Card className="gap-2 py-3">
      <CardHeader className="gap-1 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-medium">{r.author}</CardTitle>
          <Badge className={cn("shrink-0", r.verdict === "pass" ? POSITIVE_BADGE : NEGATIVE_BADGE)}>
            {r.verdict}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          reviewed <code>{r.commit?.slice(0, 8)}</code> · builder was <code>{r.builder}</code> · cites{" "}
          {r.cites.length ? r.cites.map((c) => `#${c}`).join(", ") : "nothing"}
        </p>
      </CardHeader>
      <CardContent className="px-3">
        <p className="text-[11px] text-muted-foreground">{short}</p>
        {r.claim.length > 260 ? (
          <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-[11px]" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Less" : "Read the whole verdict"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
