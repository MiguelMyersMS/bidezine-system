# shadcn-Foundation ("v2") — Founding Plan & Laptop-A Handoff

**Status:** Proposed — awaiting Miguel's go + one decision (site scope, see §10)
**Authored:** 2026-08-02 by Blair on **Laptop B**, for **Miguel on Laptop A** to execute.
**Branch:** `feat/shadcn-foundation` (Laptop B never commits to `master` — this is a PR branch).
**Companion artifact:** a Figma reference-guide frame on the **atoms Page** of the *Single shape*
file (see §11). This markdown is the text twin of that frame.
**Founding decision record:** `docs/decisions/ADR-006-shadcn-foundation.md`.

> **One-line summary.** We stop building the design system from scratch (currently ~4% done) and
> instead **start a fresh "v2" on shadcn/ui's modern foundation** (Tailwind/CVA styling + CSS-variable
> theming + Radix behavior), **re-skin it to our tokens/ideology room-by-room**, keep **our package
> distribution model**, and wrap it in **our existing protocols** (spec kernel, evidence/deploy waves,
> atomic design). shadcn is MIT-licensed, so this is fully permitted; we keep a `NOTICE` file and
> deepen ownership over time by rewriting internals.

---

## 1. Why we're doing this

- **Their system is 100% built; ours is ~4%.** Starting from a complete, accessible, battle-tested
  component set is a massive head start over building behavior + a11y from a blank file.
- **They are genuinely ahead on two architectural axes** (styling strategy and theming — see §3). We
  are behind there *because* of our "no build step" premise, not by accident.
- **This IS our own method.** `PRIMITIVES-FIRST-METHOD.md` already says "borrow proven primitives
  (Radix first), own the look via tokens." shadcn is literally Radix + a token skin — so this is the
  fullest expression of the method we already adopted, applied to the whole system at once.
- **Our protocols survive.** Spec kernel, evidence/deploy waves, atomic levels, and (a revised)
  Figma-first flow all still apply. Most protocols carry over; a few reverse; three are new (see §9).
- **Timing.** At 4% our sunk cost is near-zero. The cost of switching foundations only rises from
  here. If we're going to do it, **now** is the cheapest it will ever be.

**What this is NOT:** it is not "we're almost done." shadcn gives us a finished *skeleton* (behavior +
a11y + variant structure). The real project — re-skinning every component to our tokens, bringing each
into Figma, verifying parity, running each through the evidence wave — is still ahead. It's a large
*acceleration*, not a shortcut to a finished product.

---

## 2. The core distinction that keeps coming up

Everything hinges on separating **"borrow behavior" from "borrow styling."** We borrow shadcn's
**behavior** (Radix — focus traps, keyboard nav, ARIA, state). We do **not** paste its **styling**
(Tailwind classes / CVA look). Anything we take is **re-cast in our tokens** and shipped through our
pipeline. This is the guardrail against the single biggest risk: **mold contamination** — a helper
(especially the incoming 3rd person) copy-pasting shadcn's Tailwind straight into the DS and silently
fracturing the system.

---

## 3. The foundation — four independent axes

"Our architecture vs theirs" is not one choice; it's four. Here is the honest scorecard and the v2 pick:

| Axis | Ours (today) | shadcn's | Honest verdict | **v2 picks** |
|---|---|---|---|---|
| **Behavior** | Radix | Radix | Tie — both correct | **Radix** (unchanged) |
| **Styling** | inline `CSSProperties` (no classes) | Tailwind + CVA variants | **Theirs is more capable** — inline styles can't do `:hover`, `:focus-visible`, media queries, `@keyframes`, pseudo-elements natively (why we have `FOCUS_GLOBAL_CSS`, `cssTransition`, etc.) | **Utility CSS + CVA** |
| **Theming** | JS token objects via React context (`useTokens()`) | CSS custom properties (`--vars`) | **Theirs is more modern/performant** — CSS vars switch themes with zero React re-render and work in plain CSS/pseudo-elements | **CSS variables, authored from one typed DTCG token source** |
| **Distribution** | package (install & `import`) | copy-in (CLI copies source) | **Ours is right for our use case** — internal multi-app, central tokens, governance (Rule #8) | **Package (unchanged for now)**; copy-in is a *later, optional* decision |

**Net:** we adopt their styling + theming (the two axes where they're ahead), keep Radix (tie), and
keep our package distribution (where we're right).

---

## 4. The one real price: a build step (Rule #1 reverses)

The two upgrades we want — **Tailwind/CVA** and **CSS variables** — *cannot exist without a build
step*. Tailwind works by scanning code and generating a CSS file (that generation is a build step);
CSS variables must ship as a real `.css` file (producing it is a build step). Inline `CSSProperties`
is the *only* styling that needs no build — which is exactly why we're stuck with it today.

- **Today (no build):** we ship raw `.ts`/`.tsx`; the consumer's Vite compiles it.
- **v2 (build step):** *we* run one command that compiles source → `dist/` (JS + `.d.ts` + **CSS**);
  the consumer imports the finished output.

Plain-English: today we hand each app a **box of parts** to assemble (and the fancy features can't be
included at all); v2 means we **assemble it once in our workshop** so every app just uses it and the
modern features become possible. Cost: one extra "build" command before publish + a build config to
maintain. **This is normal** for design systems — the raw-TS "no build" approach is the unusual one.
We already have a precedent: `dist-browser/ds.umd.js` (`npm run build:umd`) is a build step; we'd just
make building the normal path. **CLAUDE.md Rule #1 gets rewritten** (and with it the consumer Vite
`optimizeDeps` guidance).

---

## 5. Ownership & attribution (MIT)

- **Requires (essentially one thing):** keep the copyright + license notice for shadcn's code we ship —
  a single `NOTICE` / `THIRD-PARTY-LICENSES` file (also credits Radix + other MIT deps).
- **Does NOT require:** open-sourcing our system, using their name/license, sharing changes back, or
  asking permission. We can put **our own license** on v2 (even proprietary), sell it, keep it closed —
  as long as that third-party notice stays.
- **Trademark, not copyright, is the only real limit:** we can't market v2 *as* "shadcn." We're
  `@miguel/design-system`, so this is already a non-issue.
- **Ownership deepens automatically.** Re-skinning makes the *look* ours now; rewriting a component's
  internals room-by-room sheds even the notice on that part over time. We choose the endpoint later.

---

## 6. Dual source of truth (the most important reframe)

A naïve "reverse-engineer into Figma, then Figma is the only truth" would throw away the behavioral
value that's the whole reason to start from shadcn — **Figma cannot represent focus traps, keyboard
nav, or ARIA.** So:

> **Two sources of truth with clean ownership.**
> **Figma owns the *look*** (tokens, layout, variants, states-as-visuals).
> **Code owns the *behavior*** (Radix — a11y, keyboard, focus).
> **Code Connect binds** a Figma component to its real code component so they stay in sync.

This keeps GR4's design-driven instinct for everything visual while protecting behavior. Our Figma
tooling already supports this (`/figma-code-connect`).

---

## 7. The pipeline (Phases 0–4)

| Phase | What | Key move (why it's the "best" version) |
|---|---|---|
| **0 — Copy in as reference** | Clone shadcn source into a vendored `reference/shadcn-ui/` folder; keep `LICENSE`/`NOTICE`; fence it out of the published package. | Read-only, committed → travels to all machines, **zero merge conflicts** (nobody edits it). This is study material, **not** the v2 codebase. |
| **1 — Extract, don't "audit"** | Parse tokens → **one DTCG token file**; parse CVA configs → variant matrices; parse the **registry** dependency graph → first-pass atomic classification. | Most of what we need is **machine-readable**. Treat it as a *compiler* problem, not a human squinting at components. Fast + accurate. |
| **2 — One token source into Figma** | Push the DTCG tokens into Figma as **Figma Variables**; author the library from shadcn code via `/figma-generate-library`. | Figma is *generated from the same token source the code uses* — identical look, one source, both directions. |
| **3 — Bind, then Figma is visual truth** | `/figma-code-connect` binds each Figma component to its code counterpart. | Design→code flow (GR4) for the visual layer; behavior stays owned by code and *bound*, not redrawn. |
| **4 — Re-skin through our waves** | Re-skin each component to our tokens; ship via evidence/deploy waves. | This is where "shadcn's" becomes "ours." |

**Do NOT run Phases 1–4 across all ~50 components as a waterfall.** Prove the whole pipeline on ONE
slice first (see §8), then fan out (much of the fan-out parallelizes with our workflow/agent tooling).

---

## 8. The golden path — a "modal-form" slice (walks ALL atomic levels)

A single atom (e.g. Button) would leave the entire molecule/organism half of the pipeline untested.
The smallest slice that honestly exercises **atoms + molecules + organisms + Radix behavior + nested
Code Connect** at once is a **modal form**:

> **Dialog** *(organism)* → containing a **Field / Input / Label** *(molecule + atoms)* → with
> **Button** *(atom)* actions.

What it proves:
- **Atoms** — Button (rich CVA variant matrix → tests variant extraction), Input, Label
- **Molecule** — Field / form-row (composes Label + Input → tests composition + registry-graph classification)
- **Organism** — Dialog (Radix focus trap, portal, escape, ARIA → tests the *behavioral* binding a single atom could never prove)
- **Nesting** — Dialog → Field → Input and Dialog → Button → tests **nested Code Connect**
- **Real usefulness** — it's an actual thing a user builds, so it doubles as a usability proof

**Slice #2:** **Combobox** — shadcn documents it as *Popover + Command + Button composed*, so it
forces deep same-family composition (a good second test after the modal form).

**Outliers the golden path will NOT de-risk** (each carries a heavy external dep and behaves unlike
the rest — expect a *separate* mini-slice for each): **Chart** (Recharts/D3), **Data Table**
(TanStack), **Calendar / Date Picker** (react-day-picker), **Carousel** (embla), **Sidebar** (app-scale).

---

## 9. The 63 shadcn components, by atomic level

(First-pass classification — the registry dependency graph finalizes it in Phase 1.)

| Level | Components |
|---|---|
| **Atoms** (leaf, no composition) | Button, Input, Textarea, Label, Badge, Checkbox, Switch, Toggle, Slider, Progress, Separator, Skeleton, Spinner, Avatar, Kbd, Aspect Ratio, Native Select, Typography |
| **Molecules** (compose atoms) | Card, Alert, Field, Item, Breadcrumb, Button Group, Toggle Group, Radio Group, Input Group, Input OTP, Empty, Pagination, Tabs, Accordion, Collapsible, Tooltip, Hover Card |
| **Organisms** (compose molecules + Radix behavior) | Dialog, Alert Dialog, Drawer, Sheet, Popover, Dropdown Menu, Context Menu, Menubar, Navigation Menu, Command, Combobox, Select, Scroll Area, Resizable, Toast |
| **Special outliers** (heavy external deps — own mini-pipelines) | Data Table, Chart, Calendar, Date Picker, Carousel, Sidebar |

*(Newer additions — Attachment, Bubble, Marker, Message, Message Scroller — to be classified in Phase 1.)*

---

## 10. ⚠️ DECISION NEEDED FROM MIGUEL — site scope

**Question:** For the `reference/shadcn-ui/` copy, do we want **(a) only the Components**, or **(b) the
entire site from the repo** — Home, Docs, Components, Blocks, Charts, Discovery, Typeset, and Create —
in its current form, **plus any future updates** if/when they land upstream?

- **Blair's vote: (b) — the ENTIRE site from the repo, kept current with upstream.** Rationale: the
  Blocks, Charts, and Create sections are exactly where the *composition patterns* and outlier
  handling live; having the whole thing costs little (it's a read-only vendored folder) and gives us
  the full reference, not a slice of it.

**Miguel — please answer (a) or (b) before Phase 0 runs.**

---

## 11. Protocols that change

| Protocol | Change |
|---|---|
| **Rule #1** (no build step) | **Reversed** — build step required |
| **Styling ideology** | inline `CSSProperties` → utility CSS + CVA variants |
| **Token architecture** | JS-context tokens → CSS variables, authored from one DTCG source |
| **GR4** (Figma sole truth) | → **dual truth**: Figma owns look, code owns behavior, Code Connect binds |
| **Consumer Vite `optimizeDeps` guidance** | Rewritten (v2 ships built output, not raw TS) |
| **NEW — import protocol** | code → extract → spec → Figma bootstrap (a one-time *reverse* of our normal flow) |
| **NEW — token pipeline** | shadcn CSS vars → DTCG → Figma Variables + code, kept in sync |
| **NEW — attribution** | keep `NOTICE`; deepen ownership by rewriting over time |
| **Evidence / deploy waves** | **Kept** — but "capture" now compares against Figma *and* behavior |
| **Companion Figma frame (#1)** | atoms Page of *Single shape*, left of node `1473-926` — the visual reference guide |

---

## 12. STEP-BY-STEP for Laptop A (Miguel + Claude)

Execute in order. Each step is a natural commit point (push small + often — two-laptop rule).

**Step 0 — Get current & answer the scope question.**
- In the VSC integrated terminal: `git fetch origin` → `git checkout feat/shadcn-foundation` → `git pull`.
- Read this whole doc + the Figma frame (§11).
- **Claude's REQUIRED first action:** before touching anything, ask Miguel the §10 site-scope
  question (components-only vs entire site) and **WAIT** for his answer. Do not start Phase 0 until
  it's answered.

**Step 1 — Reference folder (Phase 0).**
- Clone shadcn into `reference/shadcn-ui/` (scope per §10). Keep its `LICENSE`; add root
  `THIRD-PARTY-LICENSES` / `NOTICE`.
- Fence it out of the package: `package.json` `files` allowlist + `.npmignore` + tsconfig excludes so
  it never ships in `@miguel/design-system`.
- Confirm it opens/browses (live `ui.shadcn.com` for casual browsing; the clone for study).

**Step 2 — Stand up the v2 foundation.**
- New v2 surface on the modern foundation: **Tailwind v4 + CSS-variable tokens + CVA**, with a
  **build step** producing `dist/` (JS + `.d.ts` + CSS). Keep **package** distribution.
- Wire the DTCG token source (extends ADR-001) so it emits **both** CSS variables (runtime) and typed
  tokens (authoring).

**Step 3 — Extraction (Phase 1), scoped to the golden path first.**
- Extract only what the modal-form slice needs: tokens (→ DTCG), the CVA variant matrices for
  Button/Field/Input/Label/Dialog, and the registry dependency sub-graph for those components.

**Step 4 — Golden path: the modal-form slice, end-to-end.**
1. Pull `dialog`, `field` (or `form`), `input`, `label`, `button` from shadcn into v2.
2. Map to atomic levels + tokens (from Step 3).
3. **Figma (Phase 2):** author the modal-form at all three levels via `/figma-generate-library`, tokens
   as Figma Variables.
4. **Bind (Phase 3):** `/figma-code-connect` for each of the 5 components (test nested binding on Dialog).
5. **Re-skin (Phase 4):** replace shadcn styling with our tokens.
6. **Verify:** run the slice through `/evidence-pipeline` (behavior contract tests per ADR-005 — the
   Dialog focus trap/escape/portal must be *behaviorally* verified, not assumed).

**Step 5 — Retrospective & protocol updates.**
- Capture what actually broke/changed; update CLAUDE.md (Rule #1, styling, tokens, GR4) and the three
  new protocols (§11). File follow-ups in `docs/followups/`.

**Step 6 — Slice #2 (Combobox), then fan out.**
- Repeat for Combobox; then fan out demand-driven (top-down), parallelizing with workflow/agent tooling.
- Handle the §8 outliers as separate mini-slices.

---

## 13. Open decisions still outstanding

1. **§10 site scope** — Miguel to answer (a/b). *(Blair: b)*
2. **Golden path confirm** — modal-form slice first, Combobox second. *(Recommended; Miguel confirm)*
3. **Reference storage** — vendored `reference/shadcn-ui/` folder. *(Recommended over submodule for
   3-machine simplicity — no extra commands, no conflicts)*
4. **v2 location** — new folder/repo vs in-place `src-v2/`? *(Recommend a clean v2 surface; current
   system becomes legacy/harvest per PRIMITIVES-FIRST §9/§11)*

---

## 14. Two-laptop / three-machine handoff — how Miguel picks this up

Blair (Laptop B) pushes `feat/shadcn-foundation`. Then, on **Laptop A**, Miguel does two things:

**① In the VSC integrated terminal (bottom panel, `Terminal → New Terminal`):**
```
git fetch origin
git checkout feat/shadcn-foundation
git pull
```

**② Start a NEW chat with Claude in VSC and paste this prompt:**
```
Read docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md in full. I'm Miguel on Laptop A.
Before doing anything else, ask me the §10 site-scope question (components-only vs
entire site) and wait for my answer. Then execute from Step 0.
```
*(Optional: run `/session-start` first to orient, then paste the prompt above.)*

That single doc carries the entire plan, the decisions, and the step-by-step — so a brand-new chat
picks up exactly where we left off, on any of the three machines.
