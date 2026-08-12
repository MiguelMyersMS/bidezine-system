import { useCallback, useEffect, useState } from "react"
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Label,
  Button,
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
 * Milestone 8 — watch another machine, and be unable to write to it.
 *
 * ── This is an observer, and it is one all the way down ─────────────────────────────
 * The read-only-ness is NOT a property of this component. `/api/machines` runs as
 * `app_rw`, which is DENIED `UPDATE` on `component.owner_machine_id` (migration 015) and
 * refused by `usp_resolve_divergence` when the machine it names is not the owner
 * (migration 016). Switching the Select below changes what you are LOOKING at; it changes
 * nothing about what you are allowed to do, because nothing here was ever what decided
 * that. `db/verify-ownership.mjs` drives the refusal against the real principals.
 *
 * That distinction is the same one M6 makes about the Approve button: a control disabled
 * by an actor is a checkbox, a control disabled by computation is a gate. Here the gate is
 * one layer further down still — the credential itself.
 *
 * ── Which machine this is, is not a question the browser can answer ─────────────────
 * `thisMachine` comes from the server reading `.env`. A client-side value would have to be
 * handed to the browser first, and a value the browser is told is a value the browser can
 * be wrong about — which for "am I allowed to write here" is the whole question.
 *
 * ── No scroll region of its own, deliberately ──────────────────────────────────────
 * CLAUDE.md's checklist item 8 asks that every scroll-bearing element be a recorded
 * decision rather than a default. This component owns none. It renders inside
 * `QuadrantLayout`'s left column, which already composes the real `ScrollArea` with the
 * conditional gutter the scroll-region protocol requires (`QuadrantScrollGutter`) — so the
 * list simply grows and that column scrolls it. Adding a second scroll composition here,
 * for one tab, is how two of them drift apart.
 */

type ComponentSummary = {
  slug: string
  /** Null when unclaimed. Sent back as `from` on a transfer, so the database can refuse a
   *  caller working from a stale reading of who owns this. */
  owner: string | null
  title: string
  state: string
  promotedCommit: string | null
  total: number
  resolved: number
  blocked: number
  stale: number
}

type MachineRow = {
  name: string
  isPrimary: boolean
  isThisMachine: boolean
  components: ComponentSummary[]
}

type Transfer = {
  slug: string
  from: string | null
  to: string | null
  note: string
  at: string
  by: string
}

type Payload = {
  thisMachine: string | null
  unidentified: boolean
  machines: MachineRow[]
  unowned: ComponentSummary[]
  transfers: Transfer[]
  error?: string
}

/** A component's headline state, as a badge whose colour means the same thing it means
 * everywhere else in this app (see lib/status-colors). */
function StateBadge({ component }: { component: ComponentSummary }) {
  const tone =
    component.state === "promoted"
      ? POSITIVE_BADGE
      : component.state === "blocked" || component.state === "reopened"
        ? NEGATIVE_BADGE
        : undefined
  return (
    <Badge className={cn("shrink-0", tone)} variant={tone ? undefined : "secondary"}>
      {component.state}
    </Badge>
  )
}

/**
 * The only reachable path to an ownership change.
 *
 * The note is required and the control cannot be submitted without one — the same shape
 * the reopen flow uses for its reason, and for the same reason: `usp_transfer_component`
 * demands a stated reason, and an audit row reading "" is an audit trail in name only.
 *
 * `from` is what this screen last rendered, sent as-is. If another machine moved the
 * component since this page loaded, the database refuses with 409 rather than silently
 * overwriting — which is the one failure `HANDOFF.md` structurally could not detect, since
 * a file read at session start says nothing about what changed during the session.
 */
function TransferControl({
  component,
  machines,
  onDone,
}: {
  component: ComponentSummary
  machines: string[]
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/component/${component.slug}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: component.owner, to, note }),
      })
      const out = await res.json()
      if (out.error) setError(out.error)
      else {
        setOpen(false)
        setNote("")
        onDone()
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {component.owner ? "Hand over…" : "Claim…"}
      </Button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Select value={to ?? undefined} onValueChange={setTo}>
          <SelectTrigger size="sm" className="w-[170px]">
            <SelectValue placeholder="Machine" />
          </SelectTrigger>
          <SelectContent>
            {machines
              .filter((m) => m !== component.owner)
              .map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <Label className="text-xs">Reason (required — it becomes the audit record)</Label>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Why is this moving?" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || !to || !note.trim()} onClick={submit}>
          Transfer
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ComponentCard({
  component,
  readOnly,
  machines,
  onChanged,
}: {
  component: ComponentSummary
  readOnly: boolean
  machines: string[]
  onChanged: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-sm">{component.title}</CardTitle>
          <p className="truncate text-xs text-muted-foreground">{component.slug}</p>
        </div>
        <StateBadge component={component} />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {component.resolved}/{component.total} resolved
        </Badge>
        {component.blocked > 0 && <Badge className={NEGATIVE_BADGE}>{component.blocked} blocked</Badge>}
        {/* Stale evidence is M7's own signal, surfaced here because "what is that machine
            actually up to" is incomplete without "and how much of it needs re-running". */}
        {component.stale > 0 && <Badge className={WARNING_BADGE}>{component.stale} stale evidence</Badge>}
        {component.promotedCommit && (
          <Badge variant="outline" className="font-mono text-[11px]">
            {component.promotedCommit.slice(0, 8)}
          </Badge>
        )}
        {readOnly && (
          <Badge variant="secondary" className="ml-auto">
            observing
          </Badge>
        )}
      </CardContent>
      {/* Available whoever is observing. A machine that has been offline for a week would
          otherwise hold its components hostage, and a deadlock nobody can clear from
          outside is worse than a taking that leaves a record — migration 016's header
          makes the same argument for why transfer itself is not ownership-gated. */}
      <CardContent>
        <TransferControl component={component} machines={machines} onDone={onChanged} />
      </CardContent>
    </Card>
  )
}

export function MachineSwitcher() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [observed, setObserved] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/machines", { cache: "no-store" })
    setPayload(await res.json())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Default to looking at yourself. Done in an effect rather than as initial state because
  // which machine this is arrives with the payload — there is nothing to default TO until
  // the server has answered.
  useEffect(() => {
    if (payload && observed === null) setObserved(payload.thisMachine ?? payload.machines?.[0]?.name ?? null)
  }, [payload, observed])

  if (!payload) return <p className="p-4 text-sm text-muted-foreground">Reading machines…</p>
  if (payload.error) return <p className="p-4 text-sm text-muted-foreground">{payload.error}</p>

  const allMachines = payload.machines.map((m) => m.name)
  const active = payload.machines.find((m) => m.name === observed) ?? null
  const readOnly = !!active && !active.isThisMachine

  return (
    <div className="flex flex-col gap-4 p-1">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">
              This machine:{" "}
              {payload.thisMachine ?? <span className="text-muted-foreground">not identified</span>}
            </CardTitle>
            {payload.unidentified && (
              // Worth its own state rather than looking like an ordinary observer: a Sandbox
              // with no MACHINE_NAME cannot write ANYWHERE, because migration 016 refuses a
              // write that does not name the machine making it.
              <Badge className={NEGATIVE_BADGE}>MACHINE_NAME unset — cannot write anywhere</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="observed-machine" className="text-xs text-muted-foreground">
              Observing
            </Label>
            <Select value={observed ?? undefined} onValueChange={setObserved}>
              <SelectTrigger id="observed-machine" size="sm" className="w-[190px]">
                <SelectValue placeholder="Pick a machine" />
              </SelectTrigger>
              <SelectContent>
                {payload.machines.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                    {m.isThisMachine ? " (this machine)" : ""}
                    {m.isPrimary ? " · primary" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {readOnly && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Read-only.</strong> {active?.name} owns the components below.
              Approving or promoting one of them is refused by the database, not by this screen — the connection
              that drew this page is denied those writes. You can still <strong className="text-foreground">reopen</strong>{" "}
              anything here: reporting a false completion is exactly what an observer is for.
            </p>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">
          {active?.name ?? "—"} · {active?.components.length ?? 0} component
          {active?.components.length === 1 ? "" : "s"}
        </h3>
        {active && active.components.length > 0 ? (
          active.components.map((c) => (
            <ComponentCard key={c.slug} component={c} readOnly={readOnly} machines={allMachines} onChanged={load} />
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nothing claimed</EmptyTitle>
              <EmptyDescription>
                {active?.name ?? "This machine"} owns no components. Ownership moves only through
                <code className="mx-1 font-mono text-xs">sandbox.usp_transfer_component</code>, which records
                who took what, from whom, and why.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {payload.unowned.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Unclaimed · {payload.unowned.length}</h3>
            <p className="text-xs text-muted-foreground">
              Writable by any identified machine. Refusing every write until something is claimed would stall new
              work behind a ceremony that protects nothing yet.
            </p>
            {payload.unowned.map((c) => (
              <ComponentCard key={c.slug} component={c} readOnly={false} machines={allMachines} onChanged={load} />
            ))}
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Ownership history</h3>
        {payload.transfers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No transfers recorded yet.</p>
        ) : (
          payload.transfers.map((t, i) => (
            <Card key={`${t.slug}-${t.at}-${i}`}>
              <CardContent className="flex flex-col gap-1 py-3">
                <p className="text-sm">
                  <code className="font-mono text-xs">{t.slug}</code>{" "}
                  <span className="text-muted-foreground">
                    {t.from ?? "(unowned)"} → {t.to ?? "(unowned)"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{t.note}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(t.at).toLocaleString()} · {t.by}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
