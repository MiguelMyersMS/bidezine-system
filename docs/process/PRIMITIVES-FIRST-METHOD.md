# Primitives-First Method (V2) — the design-system operating method

**Status: ADOPTED 2026-07-12. Owner: Miguel Myers (miguel@bidezine.com).**
This is the CANONICAL process for all NEW and organism-driven design-system work. It SUPERSEDES the
bottom-up "build every atom from scratch and verify it with a heavy pipeline" method. A fresh session MUST
read this file IN FULL before touching design-system work — it is written for a reader with ZERO prior
context on purpose. If you are a new chat/agent: read this top to bottom, then read the memory entry
`project_primitives_first_method`, then continue the pilot or the next screen using "THE BUILD LOOP" below.

---

## 0. Why this exists (the reasoning — DO NOT SKIP; this is the part that gets lost)

The old method built the design system **bottom-up and from scratch**: hand-build every atom (button,
toggle, slicer, dropdown, menu…) pixel-by-pixel from Figma, hand-author a ~400-line spec for each, and run
a heavy multi-agent evidence pipeline to verify AI didn't lie or drift. It produced correct components but
was **catastrophically slow** — months on primitives, while the actual app (analytics reporting) was never
started. Three root causes were diagnosed on 2026-07-11/12:

1. **Speculative bottom-up.** Building every atom "because a design system should have them" manufactures
   parts for a machine that doesn't exist yet. Most were never needed by a real screen.
2. **From-scratch tax.** Re-deriving behavior that the ecosystem already solved (truncation rules, keyboard
   nav, focus traps, date-range logic) — all hand-specified — when battle-tested libraries define every
   state/option/behavior already.
3. **Heavy verification to compensate for AI-built behavior.** The evidence pipeline (evidence bundles,
   3 independent reviewers, signed verdicts, fail-closed governors) exists because AI historically skipped
   protocols, made unilateral calls, and marked things "done" falsely — blowing up at deploy time. That
   rigor was rational, but it was paying to verify AI's from-scratch reconstructions of solved problems.

**The reframe:** borrow proven code, own the look, let real screens drive what gets built, and put the
human where the human is irreplaceable (coherence/taste). This makes the system faster AND more reliable,
because there is far less AI-generated behavior to distrust.

---

## 1. The three pillars

1. **Demand-driven / top-down.** A real screen pulls components into existence. Design the screen-level
   organism first; it tells you which molecules/atoms must exist. Build ONLY those. Never speculative.
2. **Borrow behavior, own the look.** Proven primitives (Radix et al.) supply states/keyboard/a11y/logic.
   YOUR design tokens supply every pixel of look. **Coherence is enforced by the token layer, not by AI
   taste** — this is the anti-"mismatched AI app" mechanism. No raw primitive styling ever ships.
3. **Roles.** AI owns *building/borrowing/speed*. The OWNER owns *coherence, taste, and the audit*. The
   owner sets intent and audits; the owner does NOT author fundamentals. This is the correct division and
   the reason the old plan failed (owner was hand-authoring every atom's fundamentals).

---

## 2. Roles & responsibilities

| | AI (Claude) | Owner (Miguel) |
|---|---|---|
| Intent | — | Designs layout intent (boxes + labels + rough auto-layout groups) in Figma |
| Decompose | Finds needed molecules/atoms; checks EXISTING first | Approves the decomposition |
| Borrow | Researches primitives, proposes with priority + rationale | Approves which to adopt |
| Build | Adopts primitive + re-skins to tokens; reflects into Figma | — |
| Audit | Declares sources + shows the style diff; renders for review | **Coherence/taste audit** — "more space here, this token, this feels off" |
| Align | Updates code + docs + Storybook to the audit | Re-checks; approves |
| Gate | Runs Figma/Storybook/production checks honestly | Final green pass |

---

## 3. The coherence contract (the single most important mechanism)

> **Behavior = borrowed. Look = your tokens. Coherence is a token contract, not a vibe.**

Every borrowed primitive is **headless-preferred** and re-skinned entirely through the design tokens
(`src/tokens.ts` + `src/layout.ts` + `src/status.ts` motion/status): spacing, radius, type, color, motion.
A borrowed calendar and a borrowed select must end up feeling like siblings BECAUSE they wear identical
token clothing. AI must never let a primitive's native styling leak through. The owner's visual audit is
the check that this held.

**In Figma, bind EVERY fill and stroke to a design-token VARIABLE — never a raw hex.** This is not
optional. The file's `design-system` variable collection carries Light + Dark modes; a raw hex is static
and silently breaks the owner's light/dark review (the owner reviews both). When you build or reflect any
node in Figma: discover the variables (`figma.variables.getLocalVariablesAsync()`), match your intended
token by name (`bgSubtle`, `ink`, `hairline`, `surface`, `hoverBg`, `bgStrong`, `borderStrong`,
`textMuted`, `textSubtle`, `accent`, `status*`, …), and bind via
`figma.variables.setBoundVariableForPaint(paint, "color", variable)`. Before calling a Figma asset done,
flip it to the Dark mode once (`setExplicitVariableModeForCollection`) and confirm it re-colors correctly,
then clear the override. Raw hex in a reflected component is a defect, same as a hardcoded color in code.

---

## 4. THE BUILD LOOP (top-down, per organism/screen) — the core procedure

1. **Owner designs layout intent** in Figma — boxes + labels + rough auto-layout groups + hierarchy. Not
   pixel-perfect; intent + relationships.
2. **AI decomposes** the organism into needed molecules/atoms.
3. **AI checks EXISTING first** (reuse before build). Produces a 3-column report per sub-component:
   *what we HAVE* (our sealed atom/molecule) · *what's RICHER out there* (candidate primitive, per §7) ·
   *RECOMMENDATION* (keep / upgrade / build-new + why). **No code changes in this step — it is free.**
4. **Owner reviews** the report and approves keep/upgrade/build per item.
5. **AI builds** approved items: adopt the primitive, re-skin to tokens (§3), keep the SAME prop API if
   replacing an existing atom (drop-in, so consumers don't change).
6. **AI reflects** the built pieces into Figma as real frames, named to the layer convention, and renders
   them. "Here's what I built, here's the primitive I borrowed, here's the style diff."
7. **Owner audits visually** (Figma + Storybook) → coherence feedback.
8. **AI aligns** code + docs (lean spec, §6) + Storybook to the audit; declares sources + shows diffs.
9. **Gates** (§5) → **merge to master** (§8) → consumer (PLG) picks up.
10. Next screen/organism.

---

## 4a. Behavior contracts — the part Figma CANNOT hold (added 2026-07-12, owner-surfaced)

Figma captures layout and visual states. It CANNOT express **behavioral/domain logic** — and much of the
value in the existing components is exactly that logic, invented by the owner because it exists nowhere
else. Examples in RailNav alone: *when the rail is shorter than its icons, the TOP icons collapse into a
three-dot overflow menu while the FOOTER (settings/user) stays pinned*; the priority/order of what gets
buried; the active-in-overflow dot; focus-returns-to-the-rail-button after a panel collapses; seed-once
active-path expansion that never re-opens a user-collapsed group; search force-opens matching groups;
elevation must not be clipped during the panel transition; resize clamp min/viewport-max.

**These behaviors are NEVER borrowed and NEVER assumed. They are the protected contract.** Rule:

- **Before replacing or refactoring ANY existing component, first write its BEHAVIOR CONTRACT** — an
  explicit, enumerated list (in prose + as checkable assertions) of every bespoke behavior it implements,
  read from the code + existing behavior/contract stories (e.g. RailNav already has
  `--expand-collapse-contract`, `--group-collapse-unmount-contract`, `--search-filter-contract`,
  `--elevation-contract`, `--subtitle-wrap-contract` stories that encode some of it). The OWNER audits the
  contract for completeness ("yes, that's all my behaviors") BEFORE any code changes.
- **A borrow may only replace the dumb ENGINE beneath a behavior** (a menu's popup/positioning/a11y), never
  the behavior itself. Every contract item must still hold after the swap.
- **The behavior contract is the regression gate:** after a borrow, every contract assertion is
  re-verified (the contract stories must still pass + the enumerated behaviors re-confirmed in Storybook
  and in the PLG production view). If a borrowed engine can't preserve a behavior, we KEEP ours.

This is where "richer engine in a bespoke shell" is enforced: the shell = your behavior contract (kept);
the engine = the borrowed mechanism (swapped, gated by the contract).

---

## 5. Gates — the definition of DONE (three, in order)

1. **Figma parity** — the Storybook render matches the owner's Figma intent (owner confirms).
2. **Storybook parity** — the component works correctly in isolation. NECESSARY BUT NOT SUFFICIENT:
   Storybook-looks-right does NOT guarantee production (see the elevation-clip + stale-Vite-cache lessons —
   `feedback_elevation_not_clipped_by_overflow`, `project_rayfin_plg_consumer_bridge`). Storybook stays as
   the mid-gate + the owner's visual alignment surface: **the Storybook render for RailNav/Sidebar must
   reflect the Figma design before it is called done.**
3. **Production confirmation** — verified in the ACTUAL deployment (PLG dashboard / Power BI artifact, which
   per `project_plg_viewable_only_in_power_bi` is the only place PLG is truly viewable). This is the FINAL
   gate. Done = all three green.

Guardrails kept from the old system (the honesty core — NON-NEGOTIABLE, do not "optimize" these away):
verify against TRUTH (Figma/rendered pixels/production, never AI's word) · declare every borrowed source +
show the diff (no black boxes) · never mark done without proof · report failures honestly.

---

## 6. Documentation standard (lean)

New specs use `docs/atomic/_TEMPLATE.lean.spec.md` (~40 lines: identity · tier · figma node · composes ·
state contract · tokenMap · a11y · exceptions · verify). For a BORROWED component, the spec also records:
the **source library + version**, the **style diff applied**, and the **prop API** (so the drop-in contract
is explicit). Do NOT write 400-line specs. The evidence-binding change (Dial 1, 2026-07-12,
`scripts/lib/evidence.js` → `renderSourcesForSlug`) means editing a spec no longer re-stales a seal.

---

## 7. Library evaluation list (start Radix, then cast wide — owner directive 2026-07-12)

For each behavior-heavy need, produce a shortlist + a PICK + why. Prefer **headless** (you own the look).
Priority/default order:

1. **Radix Primitives** — default, headless, excellent a11y. Select, DropdownMenu, Dialog, Popover,
   Tooltip, Tabs, Collapsible, Checkbox, Switch, Toggle, ScrollArea.
2. **React Aria (Adobe)** / **Ariakit** — deeper behavior where Radix falls short.
3. **Downshift** / **cmdk** — combobox / command palette / search-filter.
4. **react-day-picker** or **React Aria DatePicker** — calendars / date-range slicers.
5. **TanStack Table** — data tables.
6. **Recharts / visx / nivo** — charts (visx = most control, headless-ish).
7. **Radix Themes `<Text>`** (pattern reference) — for a possible Text primitive (owner noticed there is no
   text-section atom today; the investigation should decide whether one is warranted).

Rules: prefer headless · check license (MIT/Apache) · active maintenance · a11y quality · bundle weight.
DO borrow behavior-heavy/accessibility-heavy things. DO NOT borrow trivial visual atoms (Badge, Pill) —
adding a dependency for 20 lines of tokens is churn, not speed. Keep bespoke domain widgets bespoke.

---

## 8. Master path (where code goes — all work lands on master)

- Work on a **feature branch** (current: `chore/molecule-foundation`; new pilots get their own branch).
- Commit per **reviewed** unit (a component the owner has audited). Push.
- Owner audit → **PR → merge to master**. Master is the source of record.
- **Consumers pick up from master:** PLG/apps depend via `github:miguelmyers/design-system` (CI/remote) or
  `file:../../systems/design-system` (local). After merge, bump/refresh the consumer's dep and bust the
  Vite cache (`.vite`) so the deployment isn't stale (see `project_rayfin_plg_consumer_bridge`).
- Nothing is "done" until it is on master AND confirmed in the PLG production view (§5 gate 3).

---

## 9. Standby policy for the existing (frozen) back-catalog

- Every existing sealed atom/molecule is **FROZEN — status `standby`. NOT deleted.** It remains reusable.
- When a NEW organism needs behavior an existing atom lacks, that atom becomes a **REPLACE candidate**:
  swap its internals for a richer borrowed primitive **behind the same prop API** (drop-in), demand-driven.
- **No big-bang replacement.** Harvest what's good; replace only on demand, only what a real screen forces.
- It is EXPECTED that many from-scratch atoms will eventually be replaced by richer borrowed versions. That
  is fine and intended — but it happens screen-by-screen, not all at once.

---

## 10. THE PILOT: RailNav + Sidebar → production

The first real test. Runs the whole loop on a REAL, already-built, documented, LIVE component.

- **Phase 1 (FREE, no code):** AI decomposes RailNav + Sidebar and produces the §4-step-3 report (have /
  richer / recommendation) for every sub-component (rail buttons, section headers, footer, overflow menu,
  search/filter, expand-collapse disclosure, menu items, toggles, and any text treatment — test the
  "do we need a Text atom?" question here). Owner reviews. This answers "was building from scratch a
  mistake?" with EVIDENCE, at zero risk.
- **Phase 2 (only what the owner approves):**
  - **Step 0 — BEHAVIOR CONTRACT FIRST (§4a).** Before touching code, enumerate RailNav's bespoke behaviors
    (overflow-collapse-when-short with FOOTER PINNED + top icons burying into the three-dot menu; priority
    order; active-in-overflow dot; focus-return-after-collapse; seed-once expansion; search force-open;
    elevation-not-clipped; resize clamp; and the rest) from the code + the existing `--*-contract` stories.
    Owner audits it for completeness. This is the protected regression gate.
  - **Step 1 — borrow the ENGINE behind the API**, re-skin to dark tokens, preserving every contract item.
  - **Step 2 — reflect in Figma, owner visual audit, Storybook-reflects-Figma, re-verify EVERY behavior
    contract item**, then ship all the way to PLG production and confirm in Power BI.

**Cautions (honest):** (a) RailNav is BESPOKE — there is no off-the-shelf "rail nav"; the borrow-wins are
in its behavior-heavy SUB-PARTS (overflow menu → Radix Menu/Popover, search → Downshift/cmdk, expand/
collapse → Radix Collapsible), not the rail shell. Expect "richer engines in a bespoke shell." (b) RailNav
is LIVE in PLG via a symlink — swap behind the API and test the consumer before it lands.

---

## 11. Legacy (being superseded — do not delete yet)

The old `/create-wave`, `/evidence-wave`, `/deploy-wave` and the heavy per-component evidence pipeline
governed the from-scratch bottom-up era. They STILL validly govern the FROZEN sealed back-catalog (§9).
As V2 proves out, MIGRATE/DEPRECATE them so the two methods don't overlap and cause misses:
- Keep them working while the standby back-catalog exists.
- Once the pilot proves V2 and the catalog is largely harvested/replaced, refactor or remove the wave
  commands + the old memory files (marked below) to a single V2 method. **Flag as legacy now; delete later,
  deliberately, not in this session.**

---

## 12. How to start a FRESH session on this (the anti-context-loss procedure)

1. Run `/session-start` (orients on live repo state).
2. Read THIS file in full: `docs/process/PRIMITIVES-FIRST-METHOD.md`.
3. Read memory: `project_primitives_first_method` (the index line is in `MEMORY.md`).
4. Resume from §10 (the pilot) or §4 (the loop) for the next screen. Do NOT restart bottom-up; do NOT
   re-derive this reasoning — it is captured here on purpose.
