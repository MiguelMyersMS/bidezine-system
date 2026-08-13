# The divergence review card — specification

> **Owner: the UI/UX agent working `sandbox/src/`.** This file is the contract for the review
> experience. It is a *spec*, not a log: when a decision changes, overwrite it in place.
>
> **Read this before touching `sandbox/src/components/DivergenceView.tsx`, `EvidenceWidget.tsx`
> or `App.tsx`.** It exists because those three files are about to be rebuilt around a different
> idea of what the screen is for, and a session that edits them without this will re-derive the
> old shape.

---

## 1. Why the current screen is being replaced

The evidence widget was built for a divergence that has evidence. A read-only audit of the live
corpus (component `rail-sidebar`, 154 rows) found that almost none do:

| | count |
|---|---|
| Total divergences | 154 |
| Have an anchor (`anchor_id`) | 7 |
| Have a declaration (subjects + properties, migration 010) | 7 |
| Have any evidence row | 7 |
| Have a live review (`invalidated_at IS NULL`) | 3 |
| **Gate open — approvable right now** | **1** |

So for 147 of 154 rows the widget renders empty scaffolding around a two-line to-do list, and
shows the gate's requirement slugs **twice** — once as a list of unmet requirements, once again
as section headers with counts. Two dialects of one fact, neither of which says what happens
next or who owes it.

**The redesign's primary job is therefore not a nicer approval flow** — approval applies to one
row. It is to make 147 rows legible as *not started*, so the handful that are live can be found.

---

## 2. What the human is actually doing

Five roles produce a divergence's state. Only the last is human.

| Role | Produces | Writes |
|---|---|---|
| Intake agent | the divergence row | `agent_rw` |
| Build agent | the implementation + the anchor | git |
| **Runner** (Playwright) | `evidence` | `runner_evidence` — the *only* writer of evidence |
| **Review agent** (a *different* AI) | `review` + citations | `agent_rw` |
| **Human** | `approval`, or `reopen` → `false_completion` | `app_rw` |

Two consequences the UI must reflect:

- **The "independent review" is another AI, not the person at the screen.** Independence is a
  database `CHECK` (`ck_review_independent: author_agent_id <> builder_agent_id`), not a
  convention. There is no separate "do you accept this review?" step — **approving the divergence
  IS accepting the review**, and the card must make that legible.
- **The app cannot author facts, by credential.** `app_rw` has `INSERT` on `approval` and
  `false_completion` and *nothing else* — no grant on `evidence` or `review`. A button that made
  the app produce a measurement or a verdict is not a design option. The card requests nothing
  and measures nothing; it displays and it decides.

---

## 3. The card

Six regions, in this vertical order. Title and review request carry the highest emphasis;
evidence exists to support confidence, never to dominate.

```
┌────────────────────────────────────────────────┐
│ A-1                                     [Open] │  1. ref            2. badge
│ ( Icon )                                       │  3. category pill
│ More Menu Ellipsis                             │  4. label
│ Review whether the overflow menu icon should   │     + review prompt
│ migrate to the Fluent interactive variant.     │
│ [ Reveal in canvas ]                           │  5. canvas link
│ ┌────────────────────────────────────────────┐ │
│ │ ⌄ Evidence checklist                   2/4 │ │  6. checklist
│ └────────────────────────────────────────────┘ │
│ (  ) Approve migration                         │     the switch
└────────────────────────────────────────────────┘
```

### 3.1 Ref code

`divergence.ref_code`. Small, secondary, never changes.

### 3.2 Badge — four states

| Badge | Condition | Tone |
|---|---|---|
| `Open` | anything not covered below | neutral, low emphasis |
| `Blocked` | `blocked_by IS NOT NULL` | destructive / red |
| `Ready` | gate has zero unmet requirements, not yet resolved | positive / green |
| `Resolved` | `state = 'resolved'` | solid / black |

Plus a **`Stale`** marker, shown *alongside* `Resolved`, when any evidence row backing it has
`is_stale = 1`. Resolved-but-stale is a real state in this system: a system change can invalidate
a row's evidence and drop it back out with nobody touching the card (M7). "Approved" is not
"locked forever."

`Blocked` is a badge and **not** a checklist row, deliberately: no amount of checking clears a
block, so listing it among things that can be checked off would be misleading.

### 3.3 Category pill

`divergence.category`, verbatim from the fixed enum — `icons · color · typography ·
layout-sizing · spacing · motion · elevation · z-index · scroll · structure · content ·
component-gap · naming-api · radius · interaction-state`.

**Do not invent friendlier category names.** The enum is the corpus retrieval key
(`SANDBOX-SPEC.md` §5.3); changing it is a migration. Finer-grained precision — *is this the gap,
the elevation, the animation?* — comes from the review prompt (§3.4) and the declared properties
(§5), not from splitting the enum.

Real distribution, for layout sanity: `component-gap` 51, `color` 23, `structure` 22,
`typography` 12, `layout-sizing` 11, `icons` 9, `motion` 8, `spacing` 7, `radius` 4,
`interaction-state` 3, `z-index` 2, `elevation` 1, `scroll` 1.

### 3.4 Label and review prompt

Two fields, both added by migration 018, both **nullable**, both currently **empty on every row**:

- `review_label NVARCHAR(80)` — the human headline.
- `review_prompt NVARCHAR(280)` — why a human is needed, not what the divergence is.

**Fallback is mandatory and is the normal case today.** When `review_label IS NULL`, render
`divergence.title`, clamped to two lines. When `review_prompt IS NULL`, render an excerpt of
`divergence.detail`, clamped to three lines, with an expand affordance.

Do not assume either field is short. Measured across all 154 rows:

- `title`: AVG 120, P95 400, MAX 400 — the column is `NVARCHAR(400)` and titles are *hitting the
  cap*, so they are truncated sentences, not names. This is exactly why `review_label` exists.
- `detail`: AVG 1,358, MAX 5,773; 104 rows exceed 280 characters, 72 exceed 1,000, 7 exceed 4,000.

**Backfill is deliberately not done.** Only the 7 live rows warrant a hand-written label and
prompt; a headline for a not-started row is debt. The fallback path is therefore permanent, not
temporary scaffolding.

### 3.5 Reveal in canvas

**One rule, no exceptions:** the control is present **if and only if** the checklist's
*"Located in the component"* row is checked. That row is on the card, so a missing control always
has its reason visible one line below it. No silent absences, nothing to remember.

Behaviour is specified in §5.

### 3.6 The checklist

Four counted rows, then one uncounted terminal line.

| Row | Gate requirement(s) it covers | Sub-line when incomplete |
|---|---|---|
| Located in the component | `anchor_id` present | — |
| Measured | *has a check spec* + `evidence.present` | "no check written yet" **or** "check exists, not yet run" |
| Still current | `evidence.current` | "the code changed after this was measured" |
| Checked by a second agent | `review.present`, `review.cites_evidence`, `review.citations_support` | names which of the three failed |
| **Ready for approval** *(not counted)* | all of the above | — |

Four rows cover six gate requirements plus the check-spec gap. Rationale for each merge:

- **`review.*` collapse to one row.** To a human, "no review", "the review cites nothing" and
  "the review cites failing evidence" are one answer: *it has not been independently checked.*
  Which of the three failed is detail-on-demand.
- **Check spec folds into "Measured".** "Nobody wrote a check" and "nobody ran it" both mean *no
  measurement exists*. The distinction matters only for who to nudge, so it lives in the sub-line.
  This is the most common failure state in the corpus by far — 147 of 154 rows sit here.
- **"Ready for approval" is not counted.** It is the conjunction of the other four, so counting it
  would make the denominator carry a row that can never be the only one missing. It renders as a
  distinct terminal line (green), not as a fifth checkbox.

#### The chain rule — this one is load-bearing

**Rows render in order, and every row after the first incomplete one renders LOCKED, never
passed — regardless of what the gate reports for it.**

This is not styling. `evidence.current` is *vacuously satisfied* for 147 rows: its SQL joins on
`anchor_file`, which is `NULL` on those rows, so it emits no unmet row and reads as met. Confirmed
by the audit — `evidence.current` blocks **zero** divergences while `evidence.present` blocks 147.
A card that rendered the gate's output naively would show **"Still current ✓"** on 147 rows that
have never been measured at all.

The chain rule makes that structurally impossible. Downstream checks are locked, not green.

#### Collapsed / expanded

Collapsed shows `Evidence checklist   2/4`. Expanded shows the rows. Collapsed is the default in
list contexts; expanded is the default for the selected card.

### 3.7 The switch

A real `Switch` (`src/ui/switch.tsx`). Labelled *Approve migration*.

**Disabled by computation until the gate is clean** — the same guarantee the current widget has:
`app_rw` is `DENY`'d `UPDATE` on `divergence.state`, so the only path to `resolved` is
`usp_resolve_divergence`, which recomputes the gate itself. The switch being off is a courtesy;
pressing it anyway could not succeed. It is additionally disabled when the component is owned by
another machine (`ownership.mayWrite === false`), with the owner named in the tooltip.

**ON direction — no confirmation dialog.** Approve is the most frequent action in the system, and
`SANDBOX-SPEC.md` §9 names approval fatigue as the most likely way the whole system fails; M6's
acceptance criterion is roughly a minute per divergence. A dialog dismissed fifty times becomes
reflexive within a week, which *builds* the rubber stamp it was meant to prevent. The misclick it
would guard against is already covered twice over: the switch cannot move on an unready row, and
the action is reversible via the off direction.

**OFF direction — a form, not a confirmation.** It writes a `false_completion` row, which the spec
calls the highest-signal data the system produces and which is the entire input to M9's ranking.
Two mandatory inputs:

- **reason** — free text, `NOT NULL` in schema.
- **which requirement was falsely passed** — from the fixed enum (`evidence.present`,
  `evidence.current`, `review.present`, `review.cites_evidence`, `review.citations_support`,
  `divergence.blocked`, `other`). **Label these in human language on screen; store the slug.**
  Free text here would fragment M9's ranking into something unqueryable.

**The switch cannot be flipped back, and showing that is the point.** Reopening sets
`invalidated_at` on the review (migration 007), and the gate only counts reviews where that is
`NULL`. So the instant it turns off, `review.present` goes unmet and the gate closes. The switch
must immediately render **disabled**, and the checklist must visibly drop from 4/4 to 3/4 with
"Checked by a second agent" reverting to locked. The person sees the consequence of their action
land in the same frame. The off-state label reads *"Reopened — needs a new review before this can
be approved again."*

**Never flip optimistically.** Bind `aria-checked` to the server's answer after the write
completes, not to local state. A switch that announces a state change to a screen reader before
the write lands is announcing something that may not be true.

All ceremony is on OFF, where the action is rare and permanent. ON is one deliberate click.

---

## 4. The list — three buckets, not thirteen categories

Category accordions answer *"what kind of thing is this?"*. With 147 of 154 rows not started, the
question a human actually has is **"is this mine yet?"**

| Bucket | Rule | Today |
|---|---|---|
| **Waiting on you** | gate open, or resolved-and-stale | 1 row |
| **Waiting on a machine** | anything with unmet requirements, not blocked | ~152 rows |
| **Blocked** | `blocked_by IS NOT NULL` | 0 rows |
| **Done** | resolved, not stale | 0 rows |

Category remains available as a filter *within* a bucket — it is a good scan handle, just not the
primary axis. Sort within "waiting on a machine" by how far along the chain a row has got, so the
nearly-ready rows surface above the untouched ones.

---

## 5. Reveal in canvas — the property renderers

Migration 010 exists for exactly this, and its header records the complaint that caused it:

> *"when I was going through all these divergences it was really tough to understand what each
> card was referring to... I end up always guessing if my decision was right because I never had a
> proper visual indication of what exactly each item was about."*

and states the design constraint this section must honour:

> *"The shape is deliberately uniform across every category. A colour row, a gap row and a motion
> row all reduce to the same sentence — these subjects, in this state, differ on these properties
> — and only the RENDERING varies, keyed by property type. That is what keeps 154 rows from
> becoming 154 bespoke visualisations."*

The schema is already there: `divergence_subject` (one **or two** elements, so a gap *between*
things is expressible), `divergence_property` typed
`length | color | text | time | keyword | layer`, plus `divergence.relation` and
`divergence.subject_state`. **What is missing is only the rendering layer.**

### 5.1 Build three renderers, not six

The enum has six types. The corpus has three:

| type | rows | example properties |
|---|---|---|
| `length` | 15 | height, width, gap, row-gap, padding-left/right, max-height, bottom |
| `text` | 6 | font-size, line-height, text-overflow, white-space |
| `keyword` | 3 | overflow, box-sizing, flex-shrink |
| `color` | **0** | — |
| `time` | **0** | — |
| `layer` | **0** | — |

`color`, `time` and `layer` have **zero declared rows** — despite 23 `color` divergences, 8
`motion`, 2 `z-index` and 1 `elevation` existing as prose. Building those renderers now is
speculative work against no data. Add each one when its first row is declared.

### 5.2 Renderer contracts

All three dim the rest of the preview and isolate the subject. Only the callout differs.

- **`length`** — draw the measured span itself with its endpoints, labelled with expected vs
  actual. For a two-subject relation (`divergence.relation`), draw *between* the two subjects, not
  around one. One row in the corpus is relational today; the renderer must handle it from the
  start, since retrofitting a one-element highlight into a two-element one means rewriting it.
- **`text`** — isolate the text node, show the property and both values (e.g. `line-height:
  expected 20px · actual 14px`). Do not paraphrase the value.
- **`keyword`** — outline the subject and state the computed keyword plainly
  (`overflow: hidden`). There is nothing spatial to draw; the value *is* the finding.

### 5.3 Interaction state — not yet

`divergence.subject_state` is `rest` on 9 rows and `NULL` on 145. **Nothing has ever been declared
in hover, active or focus.** Driving the preview into a state is expressible in the schema and has
no data behind it. Do not build it until a row declares one.

---

## 6. Accessibility

- Status, checklist progress and approval state must never be conveyed by colour alone — badge
  text and the check/lock glyphs carry the meaning independently.
- The switch's `aria-checked` reflects server truth only (§3.7).
- The checklist is a list, and locked rows are `aria-disabled` with their reason in the accessible
  name — a lock with no stated reason is a dead end for a screen reader.
- Full keyboard path: select card → expand checklist → reveal in canvas → approve.

---

## 7. Success criteria

Adapted from `SANDBOX-SPEC.md` M6, which makes the first of these a hard requirement rather than
an aspiration:

1. **Approving a live divergence takes about a minute.** If the bundle becomes a wall of text it
   will be rubber-stamped within two weeks and blind trust will have been rebuilt with extra
   ceremony.
2. A not-started row is identifiable as such **without opening it**.
3. Locating the affected element is one interaction, or the control is absent with its reason
   visible.
4. No screen shows a vacuous pass (§3.6).
5. Reopening is never accidental, and never possible without a reason and a requirement type.

---

## 8. Notes for the milestone owner

Things this work assumes, changes, or leaves open — read before picking up any adjacent milestone.

- **Migration 018** adds `review_label` / `review_prompt`. Nullable, unpopulated, no grants
  changed (table-level `UPDATE` on `sandbox.divergence` already covers new columns for `app_rw`
  and `agent_rw`). The card works without them via the fallback in §3.4, so nothing here is
  blocked on the migration landing.
- **Backfill is outstanding and deliberately scoped**: the 7 live rows only, hand-written and
  human-reviewed. Not 154.
- **`sandbox/server/corpus-api.mjs` gains the two columns** in the divergence bundle payload, and
  `blocked_by` / `is_stale` if not already surfaced, for §3.2's badges.
- **`App.tsx`'s `RailSourceToggle` renders two raw `<button>` elements** — a standing
  "no hand-rolled components" violation already recorded in `HANDOFF.md`. It is in this work's
  path and will be replaced with a real primitive as part of it.
- **The evidence widget no longer replaces the preview pane.** Today opening a row's evidence
  swaps out the very component the evidence is about. Under this spec the component stays on
  screen permanently and the card holds the evidence — which is the single largest usability
  change here.
- **Still unaddressed, and not this work's to fix**: `evidence.current` is vacuously satisfied for
  147 rows because `anchor_file` is NULL on them. §3.6's chain rule stops the UI from *displaying*
  a false pass, but the gate itself still reports one. That is a corpus/gate matter.

### 8.1 The two committed checks this rebuild will break

`sandbox/verify-readonly.mjs` and `sandbox/verify-machines-ui.mjs` live in `sandbox/` but outside
`sandbox/src/`, and both assert the *current* API and widget contracts:

- **`verify-readonly.mjs`** mounts `corpusApiMiddleware` directly and asserts specific routes and
  status codes — 403 for an ownership refusal versus 409 for a gate refusal, classified by error
  number (51006 / 51001).
- **`verify-machines-ui.mjs`** drives the real DOM and asserts an "Evidence & approval" button, an
  expandable accordion, and an Approve control that is disabled with the ownership reason in its
  title.

**The UI agent owns updating both, in the same change that breaks them.** A test broken by a
rebuild is the rebuilder's to re-point, not a thing to hand back.

**Neither may be deleted, skipped, or weakened to make CI green.** `verify-readonly.mjs` is the
only proof that M8's read-only claim holds at the HTTP layer — it was committed specifically
because it had previously existed only as a one-off script in a session transcript. Two assertions
in particular must survive in substance however the markup changes:

1. **403 versus 409 stays distinguishable**, keyed to the error number rather than message prose.
   The two refusals call for opposite responses — "this is not yours" versus "come back when the
   evidence is there" — and collapsing them sends someone to produce evidence for a component they
   can never write to.
2. **The Approve control is disabled, with the ownership reason stated, when the component belongs
   to another machine.** This is the *only* check guarding `mayWrite`'s deliberate fail-open
   (`ownership?.mayWrite ?? true`): if the ownership block ever drops out of the payload, every
   Approve control silently re-enables and nothing else in the suite notices. Under §3.7 the
   control becomes a `Switch` rather than a `Button`, so the selector changes — the assertion must
   not.

Re-point them to the new contract; do not re-scope them to something easier to satisfy.
