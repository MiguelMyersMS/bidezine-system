# The Sandbox — specification

> **Status:** Milestones 1–4 are built and verified against the live database. M5 is in progress.
>
> **Supersedes the name "Limbo".** Renamed at M5: `limbo-factory/` → `sandbox/`, `limbo/` → `origin/`,
> `LIMBO-PROTOCOL-LOG.md` → `SANDBOX-PROTOCOL-LOG.md`. Paths and forward-looking prose were renamed;
> **historical entries were not** — those record what was true when written, and rewriting them would be
> the history-rewriting `CLAUDE.md` forbids. `sandbox/src/data/rail-sidebar.ts` was additionally left
> byte-identical because it is stored verbatim in `sandbox.divergence.origin_record`.

---

## 1. The goal, in one paragraph

Today, whether a component was correctly ported into `@bidezine/system` is established by an AI saying so.
The Sandbox replaces that claim with a system that **cannot record work as done unless it is provably
done** — where evidence is produced by machines rather than asserted by agents, where "done" is a state
transition with entry requirements rather than a checkbox, and where the human approves against a
one-minute evidence bundle rather than by reading code. As a by-product, every decision it captures
becomes a queryable corpus that makes each subsequent component cheaper to port than the last.

Three outcomes, in priority order:

1. **No false green.** Nothing can be marked resolved without machine-produced evidence and an
   independent review that cites it.
2. **Compounding learning.** Decisions accumulate in a queryable store that agents retrieve from
   mid-session, so component #12 inherits everything learned on components #1–11.
3. **Proof of the design system.** The Sandbox app is itself built entirely from `@bidezine/system`.
   A real tool with real state, used daily, will surface defects a showcase site never will.

---

## 2. The problems being solved

Each is observed, not hypothetical. Every one has a milestone that closes it.

| # | Problem | Evidence it is real | Closed by |
|---|---|---|---|
| P1 | Agents mark work done without doing it; another agent discovers the gap later. | `CLAUDE.md` checklist item 26: an approved concept (`FOOTER_MAX_HEIGHT`) was documented as resolved but never wired into code. | M1, M6 |
| P2 | Evidence itself can be fabricated — plausible numbers that were never measured. | Checklist item 18: SVG path data was reasoned from memory, was syntactically valid, and was completely wrong. Passed typecheck, build, and a live smoke test. | M2 |
| P3 | Documentation is free-form prose, so no machine and no agent can verify it is complete. | `DivergenceRow` today is `{id, what, status, detail, visual?}` — no owner, no commit pin, no evidence link, no category on the row itself. | M1, M4 |
| P4 | Learning lives in a ~15,000-word `CLAUDE.md` that every session pays for in full, most of it irrelevant to the task at hand. | 27 checklist items, all loaded on every task regardless of scope. | M3 |
| P5 | System-wide changes are discovered inside component work, lose their provenance, and silently invalidate everything already verified. | The font family and the entire move to Fluent icons both originated in Rail Sidebar work. Nothing marked prior verification stale when they landed. | M7 |
| P6 | Cross-machine state is a hand-maintained markdown file whose only concurrency control is a `---` divider that helps git auto-merge. | `HANDOFF.md`, and the rule "only ever edit your own section." | M8 |
| P7 | Only one rule in the project is executable; it is the only one that has never regressed. | The light/dark token parity gate fails the build. Every other rule is prose, and every other rule has been violated at least once *after* being written down. | M9 |

---

## 3. Invariants

These hold at every milestone. A design decision that breaks one of these is wrong regardless of how
convenient it is.

1. **Agents propose and implement. Agents never attest.** Producing a claim about correctness is not an
   agent capability.
2. **Evidence is machine-produced; judgment is human-produced.** Anything objectively checkable is
   measured by a runner. Anything subjective is decided by Miguel. Nothing in between.
3. **"Done" is a state transition with entry requirements**, not a field an actor sets.
4. **The approval gate is computed, never written.** No role in the system has permission to set it
   directly.
5. **Records pin to commits; anchors live in code.** A record that cannot be tied to a commit and a
   rendered element is not verifiable.
6. **Origin material is quarantined.** It renders in isolation and is never importable.
7. **Scope is detected from the diff, not from judgment.** Whether a change is component-local or
   system-wide is determined by which files it touches.
8. **Prose that keeps being violated becomes executable.** The false-completion log ranks which rules
   need to become lint rules or tests.

---

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Sandbox app  (React 19 + Vite 7 + @bidezine/system, per-machine, local) │
│  · origin pane (quarantined iframe)  · translation pane (live component) │
│  · divergence list, click-to-highlight  · evidence + approval widget     │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ read/write (human actions)
                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Fabric SQL Database  —  the operational store                           │
│  roles:  app_rw │ agent_rw (no evidence write) │ runner_evidence (only)  │
└───────▲──────────────────────────────────────────────▲───────────────────┘
        │ query / propose                              │ writes evidence
        │ (never evidence)                             │ (agents cannot)
┌───────┴────────────────────┐            ┌────────────┴────────────────────┐
│  MCP server (TypeScript)   │            │  Verifier runner                │
│  agents reach the corpus   │            │  Node + Playwright, CLI + CI    │
└────────────────────────────┘            └─────────────────────────────────┘

Git  —  code, append-only history, executable enforcements, frozen snapshots at promotion
OneLake mirror → Power BI  —  analytics over the factory line (free with Fabric SQL)
```

### 4.1 What lives where

The division has to be explicit or it will drift.

| Concern | Home | Why |
|---|---|---|
| Component source, tokens, primitives | **Git** | It is the product. |
| Append-only history (`SANDBOX-PROTOCOL-LOG.md` and successors) | **Git** | Immutable, versioned, diffable, survives the DB. |
| Executable enforcements (lint rules, tests, build gates) | **Git** | They must run in CI and travel with the code. |
| Protocol documents (`CLAUDE.md`, this spec) | **Git** | Versioned alongside what they govern. |
| Frozen divergence snapshots, written at promotion | **Git** | Generated from the DB, so the two cannot disagree. |
| Machine identity, ownership, claims | **Fabric SQL** | Live and contended. |
| Component pipeline state and transitions | **Fabric SQL** | Live; the gate is computed from it. |
| Divergence rows while a component is in the Sandbox | **Fabric SQL** | Mutable; authoritative until promotion. |
| Evidence, reviews, approvals, false-completions | **Fabric SQL** | Machine-written, queried, never hand-edited. |
| Decision corpus for retrieval | **Fabric SQL** | Must be queryable mid-session. |
| AI-written markdown | **almost nothing** | Per-component scratch notes during an active task, and nothing else. |

**Divergence rows are the one overlap, and the rule is:** the DB is authoritative while the component is
in the Sandbox; at promotion the DB emits a frozen snapshot committed alongside the component. Live and
mutable in one place, immutable and versioned in the other, generated from a single source so they can
never disagree.

### 4.2 Technology choices and their consequences

| Layer | Technology | Consequence to plan for |
|---|---|---|
| Operational store | **Fabric SQL Database** | Azure SQL underneath → real roles and `GRANT`/`DENY`, which is what invariant 4 depends on. Auth is Entra ID only — **SQL logins are not supported at all**, so every role needs its own service principal. **No offline story** — the app degrades to read-only against a cached snapshot rather than breaking. Consumes Fabric capacity. See §4.3 for platform constraints found the hard way. |
| Analytics | **OneLake mirror → Power BI** | Free with Fabric SQL. Delivers §9's metrics with no extra pipeline. A genuine argument for choosing Fabric over plain Postgres. |
| Agent access | **MCP server**, TypeScript SDK, `mssql`/`tedious` | The only path agents use. Scoped to the `agent_rw` role — structurally cannot write evidence. |
| Verification | **Node + Playwright** | Already the tool used for live measurement in this project. Runs as CLI locally and in CI. Holds the only credential that can write evidence. |
| App | **React 19 + Vite 7 + `@bidezine/system`** | Same stack as `sandbox/` today. No hand-rolled components, per the standing rule. |
| Origin quarantine | **`<iframe srcdoc>` / isolated document** | Origin CSS and JS cannot reach the translation pane. Enforced by a lint rule, not by care. |

### 4.3 Fabric SQL platform constraints — found by running, not by reading

Every item here was discovered by executing something against the real database and
watching it fail. None was visible in the schema, in a permissions listing, or in a
successful migration. They are recorded here so no future session re-derives them.

**`EXECUTE AS` is not supported.** Procedures declared `WITH EXECUTE AS OWNER` are
created without complaint and then fail at call time with *"'EXECUTE AS' statement is not
supported on the 'Microsoft Fabric' platform."* The gate originally depended on it.

The replacement is **ownership chaining**, which is better anyway: every object in the
`sandbox` schema shares one owner, so when a procedure touches a table with the same
owner, SQL Server skips the permission check on that table entirely. A caller denied
`UPDATE` on `divergence.state` can therefore reach it through the gate procedure and
nowhere else — the exact property required, with no impersonation involved.

Two conditions keep that working, and both must be respected when extending the gate:

- **No dynamic SQL.** `EXEC`/`sp_executesql` inside a procedure breaks the chain and the
  caller's own permissions are checked again. There is none today.
- **One owner for the whole schema.** Creating a `sandbox` object as a different
  principal silently breaks the chain for everything that touches it.

**Two independent permission layers, and only one of them is ours.** Fabric item/workspace
RBAC decides whether a principal may *open a connection at all* — a valid database user is
not sufficient, and without at least Viewer the login fails with *"Validation of user's
permissions failed."* SQL `GRANT`/`DENY` then decides what it may *do* once connected.

Verified empirically against `sys.database_role_members` and `sys.database_permissions`:
`app`/`agent`/`runner` belong to no built-in role and hold exactly one permission each
(`CONNECT`). Granting Fabric Viewer conferred no DDL rights — `CREATE TABLE` still failed.
**Fabric's layer cannot override a SQL `DENY`**, which is what makes invariant 4
trustworthy on this platform rather than merely intended.

**Item-level permission grants are not available via the REST API today**, so scoping
access to a single database item is not currently possible. The workspace is therefore
named `bidezine-sandbox` and holds only Sandbox items; non-Sandbox work goes elsewhere.
This is a naming discipline standing in for a missing platform feature — if item-level
sharing ships, prefer it.

**SQL authentication does not exist here.** Entra ID only. Every role needs its own
service principal; there is no password-based fallback for local development.

---

## 5. Domain model

### 5.1 Entities

- **machine** — id, name, owner, `is_primary`. Replaces `HANDOFF.md`'s section-per-machine convention.
- **component** — a Sandbox occupant. Owned by exactly one machine at a time. Has a pipeline state.
- **divergence** — one thing that differs between origin and the bidezine translation. Carries
  `category`, `scope` (`component` | `system`), `tier`, `anchor_id`, `owner_machine`, `state`.
- **system_change** — a change whose blast radius exceeds the component that discovered it. First-class,
  never a divergence row. Component divergences declare a blocking dependency on it.
- **evidence** — typed, machine-produced, written *only* by the runner. Carries the check spec, raw tool
  output, git commit sha, run id, timestamp.
- **review** — an independent agent's verdict. **Must cite evidence rows by id**, and the gate validates
  that the cited rows support the verdict.
- **approval** — a human act. Records who, when, and against which commit.
- **false_completion** — recorded whenever something previously marked resolved is reopened. Attached to
  the requirement type that was falsely passed. This is the highest-signal data the system produces.

### 5.2 State machines

**Component:** `intake → analysis → decisions → build → audit → approved → promoted`
Plus `blocked` (on a `system_change`) and `reopened` (from any later state).

**Divergence:** `open → proposed → decided → implemented → verified → resolved`
Plus `blocked`, `deferred` (requires a named owner), and `reopened`.

**Legacy rows imported in M4 enter at `legacy — provenance unverified`**, which is *before* `verified`.
They carry their existing reasoning so retrieval has substance immediately, but nothing arrives
pre-blessed. Each still has to earn `resolved` through the real gates.

### 5.3 Categories

The category enum is the **retrieval key** — when a new divergence is created in `tokens`, the system
queries every prior resolved `tokens` divergence and pre-fills a proposal with citations. Free-form
categories fragment the corpus and destroy this, so the enum is fixed and changing it is a migration.

The starting enum derives from the categories already in use on Rail Sidebar (A–M): `icons`, `color`,
`typography`, `layout-sizing`, `spacing`, `motion`, `elevation`, `z-index`, `scroll`, `structure`,
`content`, `component-gap`, `naming-api`. Finalised in M4 against the real rows, not before.

### 5.4 The gate

A component may enter `promoted` only when **all** hold:

- every divergence is `resolved`, or `deferred` with a named owner;
- every `resolved` divergence has at least one evidence row whose `verified_at_commit` is **not older
  than the last commit touching the file its anchor points at**;
- an independent `review` exists whose `author_agent_id` differs from the builder's, and whose cited
  evidence rows support its verdict;
- no blocking `system_change` is open;
- no evidence row is marked stale.

The agent does not assert completion. It **attempts the transition**, and the DB either accepts it or
returns the list of what is missing — and that list becomes the agent's to-do list. The system is
self-correcting rather than self-congratulating.

### 5.5 Anchoring

A divergence points at its region via a `data-divergence="L-34"` attribute **in the component's own
markup**, never via a selector string stored in the DB. Selectors rot silently on refactor; an attribute
moves with the code, its deletion is visible in the diff, and orphan detection ("every divergence id must
have a matching attribute in source") becomes a CI query.

### 5.6 Tiering

Not every divergence deserves the full four-transition ceremony, or the system becomes correct and
unusable and gets routed around. But **the tier is not an agent's unilateral call** — "this one's simple"
is the same shape of self-graded claim as "this one's done".

- An agent may *propose* a tier.
- The **fast lane requires** either a cited precedent already `resolved` in the corpus, or human assent.
- No precedent and no human → the full path, by default.
- **System-scope changes never get the fast lane.**

Criteria are deliberately **not** fixed here. They will be derived in M9 from false-completion data:
categories that have never been falsely passed have earned the fast lane. The schema carries `tier` and
`tier_justification` from M1 so this is not a retrofit.

### 5.7 System changes

Detected mechanically: **if the proposed fix touches `tokens/` or `src/ui/`, it is system-scoped.** If it
touches only the sandbox component, it is component-local. No agent decides this.

When a system change lands, every evidence row whose check touches the affected property is marked
**stale**, and components carrying stale evidence drop out of `promoted`. This is only affordable because
evidence is a re-runnable spec rather than a human attestation — re-verification is a batch job, not a
month of re-review. **The verifier runner is not only an anti-fabrication control; it is what makes
system-wide change survivable at all.**

---

## 6. Milestones

Ordering principle: **the invariant before the interface.** M1–M4 produce nothing visible, and that is
deliberate — a UI over a store that can still be lied to is a nicer way to be lied to. M5 is the first
milestone with something to look at. If seeing progress sooner matters more than strict ordering, M5 can
move ahead of M4, at the cost of building the preview against a schema not yet proven by real data.

**Sequencing constraint throughout M1–M4:** `sandbox/` stays running and authoritative. Nothing
in its current working state is touched until M5 swaps the read path.

---

### M1 — The store and the gate

**Problem solved:** P1, P3. Nothing today can *refuse* a false claim of completion.

**What we build**
- Fabric SQL Database provisioned; Entra service principal; migration tooling.
- Full schema per §5 — components, divergences, evidence, reviews, approvals, system changes,
  false-completions, machines.
- **Three database roles with real permissions:** `app_rw`, `agent_rw` (SELECT everything, INSERT
  proposals and notes, **DENY on `evidence`**), `runner_evidence` (INSERT on `evidence` only).
- The gate as a stored procedure returning either acceptance or the list of unmet requirements.

**Technologies:** Fabric SQL Database, T-SQL, Entra ID service principal, a SQL migration runner.

**Done when**
- Attempting a promotion for an incomplete component is refused, with a specific list of what is missing.
- The `agent_rw` role **physically cannot** insert into `evidence` — demonstrated by a failing statement,
  not by inspection.
- Schema migrations run repeatably from a clean database.

**What it looks like:** nothing visible. A database you can query, and an invariant that exists.

---

### M2 — The verifier runner

**Problem solved:** P2. Evidence can be fabricated.

**What we build**
- A **check-spec format**: component, divergence id, anchor, properties to measure, interaction states
  to exercise, expected values where known.
- A runner that resolves the anchor in the live render, exercises each state for real (hover, press,
  focus-visible, disabled, resize), measures, and **writes the result to the DB itself** under the
  `runner_evidence` credential.
- Provenance on every row: run id, git commit sha, the exact spec, and the **raw** tool output — not a
  summary of it.
- Batch mode, for M7's bulk re-verification.

**Technologies:** Node, Playwright, `mssql`/`tedious`, the `runner_evidence` credential.

**Done when**
- An agent can request a check by spec and **cannot** write the result.
- Re-running the same spec reproduces the same numbers.
- Screenshot evidence is produced by the runner with a content hash; an agent cannot attach an arbitrary
  image.
- A deliberately wrong expected value produces a failing evidence row rather than a passing one.

**What it looks like:** a CLI — `npm run verify -- --divergence L-34` — printing measured values and
writing a row you can query.

---

### M3 — The MCP server

**Problem solved:** P4. Agents cannot reach the corpus, so "the AI learns from previous decisions" stays
aspirational.

**What we build**
- An MCP server exposing, at minimum: query decisions by category/component/keyword; read a component's
  state and open divergences; propose a divergence or a resolution; request a check run; read the gate's
  unmet-requirements list.
- Bound to `agent_rw`. Structurally cannot write evidence, cannot set state directly.

**Technologies:** MCP TypeScript SDK, `mssql`/`tedious`, Entra service-principal auth with a defined
token-expiry behaviour.

**Done when**
- From a live session, an agent retrieves prior decisions in a category and **cites them by id** in a
  proposal.
- Any attempt by an agent to write evidence or flip a gate fails at the database, not at the application
  layer.
- A session can answer "what has this project already decided about X" without loading `CLAUDE.md` in
  full.

**What it looks like:** tools available in-session — `sandbox_query_decisions`,
`sandbox_propose_resolution`, `sandbox_request_check`, `sandbox_gate_status`.

---

### M4 — Rail Sidebar as the first occupant

**Problem solved:** the schema is unproven and the corpus is empty. Also the first real test of the
protocol.

**What we build**
- An import of the existing Rail Sidebar divergence rows from
  `sandbox/src/data/rail-sidebar.ts`, landing at `legacy — provenance unverified`.
- Enrichment of what the current shape lacks: category on the row, owner, tier, scope, anchor id,
  evidence links, commit pins.
- The category enum, finalised against real data.
- Rail Sidebar then run through the real gates.

**Technologies:** a one-off TypeScript import script; the M2 runner; the M3 MCP server.

**Done when**
- Every existing row is represented with no field lost — the migration is the schema's proof.
- Any row that does not fit has produced a deliberate schema change, recorded.
- Rail Sidebar's genuine current state is visible in the DB, honestly marked, with nothing
  pre-blessed.

**Why this component:** the answers are already known. If the protocol produces different ones, the
protocol is wrong — which is a test you cannot get from a component seen for the first time.

**What it looks like:** a queryable corpus of ~50 real decisions with real reasoning, and a component
whose state is honest rather than flattering.

---

### M5 — The Sandbox app: preview and anchored divergences

**Problem solved:** verification currently requires reading code.

**What we build**
- `sandbox/` → `sandbox/`, and the Limbo → Sandbox rename across `CLAUDE.md`, the protocol log and
  the directory structure, in one commit.
- Generalisation from one hard-coded occupant to N components read from the DB.
- **Origin pane** — pasted code, screenshot or embed, rendered in an isolated iframe. Origin assets live
  in an excluded directory; **a lint rule fails the build on any import crossing that boundary.**
- **Translation pane** — the live bidezine component, switchable against origin.
- **Divergence list** with click-to-highlight via `data-divergence`, and live interaction — hover, press,
  resize — in the translation pane.

**Technologies:** React 19, Vite 7, `@bidezine/system`, iframe isolation, a custom lint rule for the
quarantine boundary.

**Done when**
- Clicking a divergence highlights the exact region in the live component.
- You can hover, click and resize that region and watch the behaviour, without opening an editor.
- Origin material provably cannot reach the translation pane — demonstrated by a failing build on a
  deliberate cross-boundary import.
- The old `rail-sidebar.ts` data file is deleted only after the DB path returns equivalent content.

**What it looks like:** the two-pane preview with a divergence list beside it, on port 4199.

---

### M6 — The evidence widget and the approval gate

**Problem solved:** P1, and approval-by-trust.

**What we build**
- The task widget: required deliverables for that divergence, each rendered as what it actually is —
  measured numbers as expected-vs-actual side by side, screenshots adjacent rather than linked, the diff
  itself rather than a description of it.
- The **toggle, disabled by computation** from the M1 gate, enabled by no actor.
- Human approval recorded with who, when, and against which commit.
- Reopen, with a required reason — which writes the `false_completion` record.
- **Cascade on reopen:** the component leaves `promoted`, its frozen snapshot is marked stale, and the
  review based on the old state is invalidated.

**Technologies:** React 19 + `@bidezine/system` (no hand-rolled components), the M1 gate procedure.

**Done when**
- The toggle cannot be enabled until requirements are genuinely met — verified by attempting it.
- **Approving a typical divergence takes about a minute.** This is a hard requirement, not a nicety: if
  the bundle is a wall of text it will be rubber-stamped within two weeks, and blind trust will have been
  rebuilt with extra ceremony.
- Reopening a resolved divergence correctly cascades and produces a false-completion record.

**What it looks like:** the widget — deliverables, evidence, an independent review verdict, and a toggle
that will not move until it is real.

---

### M7 — System changes and invalidation

**Problem solved:** P5. The font change and the Fluent migration both came out of one component and
silently invalidated everything already verified.

**What we build**
- `system_change` as a first-class entity with its own higher-ceremony lifecycle and impact assessment
  before approval.
- Blocking dependencies — a component parks visibly in `blocked on SC-3` rather than a session wandering
  off and losing the thread.
- **Diff-based scope detection** in CI: a fix touching `tokens/` or `src/ui/` is escalated automatically.
- **Bulk invalidation** on landing, plus batch re-verification via the M2 runner.

**Technologies:** git diff inspection in CI, the M2 runner in batch mode, T-SQL for the invalidation
sweep.

**Done when**
- Landing a token or primitive change marks affected evidence stale and drops affected components out of
  `promoted`, automatically.
- Re-verifying the whole affected set is one command.
- A component blocked on a system change cannot be promoted, and says so.

**What it looks like:** a stale-evidence surface in the app, and a batch re-run that clears it.

---

### M8 — Multi-machine ownership and visibility

**Problem solved:** P6. `HANDOFF.md`.

**What we build**
- Ownership as a real field. One component per machine; other machines are **read-only observers**.
- A machine switcher — see what Laptop B is working on, live, without being able to write to it.
- **Explicit transfer** as a deliberate action, never implicit.
- Machine renaming, if wanted — this is the right moment, since identity becomes a schema field and all
  three machines change in one coordinated migration.
- `HANDOFF.md` retires or shrinks to a pointer.

**Technologies:** Fabric SQL, the M5 app.

**Done when**
- You can watch another machine's component progress and cannot write to it.
- Transferring a component between machines is an audited event.
- Nothing depends on hand-maintained markdown for cross-machine state.

**What it looks like:** the user switcher you described — switch to Laptop B, observe, switch back.

---

### M9 — Executable enforcement and the learning loop

**Problem solved:** P7, plus the question of whether any of this is actually working.

**What we build**
- A **ranked list from false-completion data**: which requirement types are falsified most often. That
  list is the work queue.
- Conversion of the top offenders from prose into executable checks — the obvious first candidates are
  greps: no non-Fluent icon imports; no raw `overflow-*` in `src/ui/`; every icon component sets
  `isActionIcon`; no `leading-none` on an element also carrying `truncate`; no import crossing the origin
  quarantine.
- **Tier criteria derived from the same data**, per §5.6.
- Power BI over the OneLake mirror: cycle time per component, most-falsified requirement, and the metric
  that matters most — **the percentage of AI-proposed resolutions accepted unmodified**, per category.
- **Cold-build acceptance:** every fifth component, run it with no human decisions offered up front and
  measure how much had to change.

**Technologies:** custom ESLint rules, grep-based CI checks, Playwright suite, Power BI over OneLake.

**Done when**
- `CLAUDE.md`'s prose checklist is measurably shorter because items became enforcements.
- The accept-unmodified rate is a real number you can watch per category.
- A cold build has been run at least once and its delta recorded.

**What it looks like:** a shrinking checklist, a CI that fails on the things that used to need reminding,
and a Power BI report that answers "is this system actually learning?" with a number rather than a
feeling.

---

## 7. What "finished" looks like

A component enters the Sandbox as a screenshot, a URL or a pasted snippet. An agent produces an origin
pane and a first-pass translation, and files divergences — each pre-filled with proposals citing prior
resolved decisions in the same category. You work through them in the app: click a row, see the exact
region highlight, hover and resize it live, decide. The agent implements, requests checks; the runner
measures and writes evidence you did not author and the agent cannot forge. An independent agent reviews,
citing evidence by id. The toggle unlocks. You spend about a minute confirming, and approve.

When every divergence is resolved, the component promotes: a frozen snapshot commits alongside the code,
and the decisions join the corpus that makes the next component cheaper. If a system-wide change lands
later, the affected evidence goes stale automatically, the component drops out of promoted, and one
command re-verifies it.

And roughly every fifth component, you hand an agent only a description and see how much of that it can
now do alone.

---

## 8. Deferred decisions

Recorded so they are decided deliberately rather than by default.

| Decision | Deferred to | Why |
|---|---|---|
| Tier criteria | M9 | Should come from false-completion evidence, not from guesswork. |
| Machine renaming (Alpha/Beta/Gamma or similar) | M8 | Identity becomes a schema field there; renaming earlier breaks Laptop B's local `.env`, which is gitignored and cannot be fixed remotely. |
| Final category enum | M4 | Derived from the real Rail Sidebar rows. |
| Offline degradation detail | M5 | Needs the real app to define what read-only-from-cache means in practice. |
| Per-machine Fabric authentication | M1 | Service principal vs. per-machine identity; affects the audit trail. |
| Limbo → Sandbox rename | M5 | Rides along with the directory move so it is one commit, not a drift. |

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| **Approval fatigue** — the most likely failure. A heavy evidence bundle gets rubber-stamped and blind trust returns with extra steps. | The one-minute review is a hard acceptance criterion in M6, not an aspiration. |
| **Over-ceremony** — every divergence costing four round trips makes the system unusable and it gets routed around. | Tiering (§5.6), with the fast lane gated on precedent rather than agent opinion. |
| **Fabric auth / no offline** | Defined token-expiry behaviour (M1); read-only cached degradation (M5); nothing unrecoverable, since history and frozen snapshots also live in git. |
| **Corpus rot** — records drifting from the code they describe. | Commit pins on evidence, `data-divergence` anchors in markup, orphan detection in CI. |
| **Breaking the working tool mid-flight** | M1–M4 do not touch `sandbox/`; the read path swaps only in M5, after the DB path is proven equivalent. |
| **The reviewer agent fabricating a verdict** | Reviews must cite evidence by id, and the gate validates that the cited rows support the verdict. |
