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

**Ownership and the gate disable the ON direction ONLY.** A resolved row's switch stays live for
anyone, including an observer on a machine that does not own the component. Migration 016 gates
`usp_resolve_divergence` and `usp_promote_component` and pointedly does *not* gate reopen: reporting a
false completion is exactly the job of someone who did not do the work. Collapsing approve and reopen
into one control makes this easy to lose — the first implementation disabled the switch wholesale for
a foreign component and silently removed the one action an observer is supposed to keep. It was caught
only because `verify-machines-ui.mjs`'s "Reopen stays ENABLED" assertion had nothing left to bind to.

**Ownership must be re-read, not remembered.** It is a component fact fetched once with the corpus, so
it goes stale the moment another machine claims the component — and a stale `mayWrite: true` leaves the
approve control live for something this app can no longer write. `useCorpus` refetches on
`visibilitychange`, which covers the realistic case (returning to a tab after someone else took the
component) without polling Fabric for a fact that changes a few times a month. The database refuses
either way; the point is not offering a control that is going to fail.

All ceremony is on OFF, where the action is rare and permanent. ON is one deliberate click.

---

## 3.9 One format, and one copy of each fact

**Every reviewable thing uses the same card shell** (`ReviewCardShell`). Consolidating seven tabs into
one view is only half the job — putting three visual languages under one tab is a tab bar with extra
steps, which is what the first attempt shipped. A divergence, a blocking question and a risk are all
"a thing with an id, a state, a human-readable ask, and detail you open when deciding", so only the
body differs:

| slot | divergence | question | risk |
|---|---|---|---|
| ref | `F-3` | `Q1` | `R-1` |
| badge | gate-derived | decided / awaiting you | all items done / not |
| pill | its corpus category | `question` | `risk` |
| progress | gate checklist, `n/4` | options, one chosen | action items, `n/m done` |
| body | evidence, decision surface, imported record | the options | action items, **as links** |

**Questions and risks carry no approve control, and the card says so** rather than leaving it to be
inferred. They are not corpus rows: there is no gate to compute a control from and no approval record
to write. A card that looks gated and is not is worse than one that plainly states it is not.

**A citation is a link, never a restatement — this is the de-duplication.** A risk's action items cite
the divergences that satisfy them: 25 distinct ids across the register (`A-1`, `F-3`, `H-1`…`H-6`,
`M-13`…`M-19`, and more), every one already a card in the same view. Repeating their content inside the
risk would put the same decision on screen twice with two chances to drift apart. `RefLink` renders each
citation as a control that selects the cited card and scrolls it into view — which also highlights it in
the live component, since that is the reason to follow a reference at all. One copy, cited from wherever
it is relevant.

`DivergenceView.tsx` (`BlockingQuestionCard`, `RisksList`, `DivergenceCategoriesAccordion`) was deleted
rather than left unused. Same reasoning the protocol log records for `FullRailPreview`: inert code that
still renders a superseded format is code someone can silently re-wire back in.

## 3.8 Two tabs, not seven

The app had seven tabs. **Four of them read hardcoded per-occupant arrays** out of
`sandbox/src/data/rail-sidebar.ts` while three read the corpus — so the bar was two systems side by
side pretending to be one, and component #2 would have arrived to four tabs that were empty or wrong.
Worse, deciding a colour happened on one screen and recording that decision on another, correlated by
hand: the same defect as the evidence panel replacing the preview, one level up.

**Review** is everything about this component that needs a human. **Machines** is the workspace — the
only view that genuinely is not about a component, and a different altitude.

Where the four went:

| Was | Now |
|---|---|
| Source records | A per-card **Imported record** disclosure, rendering `origin_record` verbatim. Safe to move: `check-corpus-equivalence.mjs` imports `getCorpus` directly and never reads the DOM — **verified before deleting**, because if it had read the rendered view this would have silently removed half of a 154/154 check. |
| Color token lab | A per-card decision surface, shown on `color` rows. |
| Typography lab | The same, on `typography` rows. |
| Blocking questions · Notable risks | Their own sections inside Review, above and below the buckets. |

**The labs are keyed by `category` exactly as the reveal renderers are keyed by `property_type`** —
the same architecture, already proven. The colour lab still shows the component's *whole* candidate
set rather than the row's own, because **no divergence-to-token relation exists**: `divergence_property`
records which CSS properties a row concerns and nothing records which proposed tokens it concerns. It
is labelled as component-wide rather than quietly implying otherwise. Adding that relation is the
obvious next migration.

**Questions and risks are NOT in the buckets, and that separation is honest rather than cosmetic.**
Bucketing is computed from the gate; neither of these is in the corpus, so neither has a gate, a
checklist, or an approval that means anything. Putting them in "Waiting on you" would create things
that look identical to a gated row and are not.

**Why they were not simply imported as divergences — a correction to an earlier plan.** They do not
fit. A question carries enumerated `options` with one chosen; a risk carries `actionItems` with done
flags and cross-references to divergence ids. `divergence` has neither shape, so an import would
flatten both into prose — losing exactly what makes them useful, and breaking M4's own rule that an
import is lossless or it is not done. Some risks are not divergences at all: `R-5b` (a token-collision
check deferred to promotion) is one, but `R-3c`/`R-11c` ("no dedicated Independent Audit agent has run
against the whole component") is a **process gap about the component's own state machine**, and forcing
it into a `divergence` row would pollute the corpus that M9's ranking depends on. Giving them a real
home is a schema question for the milestone owner.

## 3.10 Writing a review prompt — the protocol

> **This is not about making one component's cards read well.** Every occupant's cards are the same
> card, so a reviewer who has worked one component must be able to work the next without relearning how
> to read it. A prompt written in a different register is a second dialect on a screen whose whole
> purpose is having one. Follow the structure even where a looser sentence would read slightly better in
> isolation — the consistency IS the feature.

### The field

`divergence.review_prompt`, `NVARCHAR(280)`. The cap is deliberate and is the enforcement: a column that
cannot hold an essay will never hold one. If a prompt does not fit, the prompt is wrong — not the cap.

### What it is, and what it is not

**It is the ask.** One agent-authored statement addressed to the person deciding: what needs deciding
here, and why it needs them rather than a rule.

**It is not the record.** `detail` holds the imported rationale and resolution history — what was decided
and why, written afterwards. That never appears on a card. A human acting on a row does not need an
account of a settled decision, and can ask for one. Rendering history as the description is exactly the
defect this protocol exists to prevent; it made 169 cards look described when none were.

**It is not evidence.** An agent writes it, so it asserts nothing about correctness and satisfies no gate
requirement. It shapes what a human looks at; it never stands in for what a machine measured.

### The structure — three sentences, in this order, always

1. **What is being decided**, named in the component's own terms: the element and its state.
   *"What a rail row looks like on hover."*
2. **Why it needs a human** — the specific reason, not a generic one. Skip this sentence only if there is
   genuinely no such reason, which is itself worth noticing.
   *"Origin overlays white at 10%; bidezine has no equivalent, so this has to be a fixed colour rather
   than an overlay."*
3. **The proposal, last, always prefixed `Proposed`** — the exact token, value or candidate.
   *"Proposed `--sidebar-rail-hover`: oklch(0.301 0 0) light, oklch(0.191 0 0) dark."*

Sentence 3 is last so the same information sits in the same place on every card in every component. A
reader learns where to look once.

### Hard rules

- **Never restate the ref, the category or the title.** Each is already its own slot. Repeating them
  spends the cap on something the reader can already see.
- **No history verbs.** "was approved", "was revised", "resolved as", "originally". If a sentence needs
  one, it belongs in `detail`.
- **Every quoted value is read from the source, never retyped.** Same rule as icon path data
  (`CLAUDE.md` checklist item 18): a plausible wrong value passes every automated check and is caught
  only by eye.
- **No proposal, no sentence 3.** Do not invent a candidate to make a card feel complete. A row whose
  value nobody has proposed is a row waiting on that work, and the card should show the ask alone.
- **If sentence 2 cannot be written in one clause, stop.** Either the reason is not understood yet, or
  the row does not actually need a human — both are findings, not things to pad around.
- **Absence is stated, never substituted.** A row with no prompt renders "No review description written
  yet". It must never fall back to `detail`, a title, or a generated placeholder.

### Anti-patterns, each observed rather than imagined

| Anti-pattern | What it looked like |
|---|---|
| Template-composed prose | *"Approve the rail's rail background"* — a slot filled with a string that already contained the noun |
| Boilerplate repeated per row | one shared "so the value is a judgement, not a mapping" clause pushed **8 of 9** drafts over the 280 cap |
| History as description | `review_prompt ?? detail` — every card opened with an account of a settled decision |
| Inventing to fill the shape | quoting a value nobody proposed, so the card reads finished and the work is invisible |

### Per-category shape

Sentence 1 names a different thing per category. Keep these consistent across occupants:

| category | sentence 1 names | sentence 3 proposes |
|---|---|---|
| `color` | the element and its interaction state | the CSS var and its light/dark values |
| `typography` | the text role and which property is in question | the type token or the property value |
| `layout-sizing` · `spacing` | the element and which dimension | the value, with its unit |
| `icons` | which icon, in which state | the Fluent slug, or `custom` and its base |
| `motion` | what animates and what triggers it | duration and easing |
| `elevation` · `z-index` | the surface and what it must sit above | the token or the level |

### Verification, before any prompt is written to the corpus

1. **Length.** Every draft under 280. Check programmatically; do not eyeball it.
2. **Value fidelity.** Every value quoted in a prompt must equal the value in its source. Diff them with
   a script — this is the check that catches a retyped digit.
3. **No history verbs.** Grep the drafts for the words above.
4. **Staleness is a standing risk worth its own check.** A prompt quoting a value goes silently wrong the
   moment that value changes, and nothing currently notices. Until a check exists, any change to a
   proposed value requires regenerating every prompt that cites it — treat that as part of the change,
   not as follow-up.

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
