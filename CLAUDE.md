# @bidezine/system — AI Context

## The one rule

> **`reference/shadcn-ui/` is the ONLY design source this project may consult.**

No other design system exists for this project. If a task, skill, or agent wants to compare against,
harvest from, or reference any other component library, the answer is no. There is nothing else to look
at, and nothing outside this repo to go and find.

## What this project is

Take shadcn/ui's components from the vendored source, ship them, and **deploy them to a site that
verifies the deployment faithfully reproduces the source.** Once that baseline is proven, adjustments
are made from there.

So the order is deliberate:

1. **Reproduce** — pull components in unchanged; tokens hold shadcn's own values.
2. **Verify** — deploy the site, compare it against shadcn's own rendering.
3. **Adjust** — only after the baseline is trustworthy.

Adjusting before verifying makes it impossible to tell a deliberate change from a porting mistake.

## Handoff protocol — `HANDOFF.md`

> **Sandbox Milestone 8 changed what this file is for. Read this before the rules below.**
>
> **Ownership is no longer prose.** Which machine owns which component, what state it is in, how much of
> its evidence is stale, and every hand-over that ever happened are rows in `sandbox.machine`,
> `sandbox.component.owner_machine_id` and `sandbox.ownership_transfer`. Run **`node scripts/machines.mjs`**
> — that is now the authoritative answer to "who is working on what", and it is the first thing to run
> when picking up work, before reading anything below.
>
> It is **enforced, not documented**: `usp_resolve_divergence` and `usp_promote_component` require the
> calling machine to name itself and refuse when it is not the owner (migration 016); ownership moves
> only through `usp_transfer_component`, which demands a stated reason and writes an audit row
> (migration 015). One caveat, stated because it matters: all three machines share one `app_rw` service
> principal, so the machine name is asserted by the caller rather than proven by the connection. This
> stops the ACCIDENT — a session reading a stale file and helpfully finishing another machine's work —
> which is exactly the failure the "only edit your own section" rule below exists to prevent. It does
> not stop a caller that lies.
>
> **`HANDOFF.md` survives for the residue the database has nowhere to put**: "I was midway through X,
> and Y looked wrong." That is not a component, a divergence or an ownership record. The rules below
> still govern that residue — in particular the one-section-per-machine rule, which is unchanged. What
> has changed is that this file is no longer where you look to find out what another machine OWNS.

`HANDOFF.md` (repo root) exists specifically because chat sessions in this environment have, more than
once, become corrupted mid-conversation (every new message failing) with real, uncommitted work still
sitting in the working tree — and a pasted chat transcript as the recovery mechanism is fragile: a new
session reading a stale or partial transcript has previously caused already-fixed work to be silently
reverted or re-derived incorrectly. `HANDOFF.md` replaces "paste the old chat" with "read one small,
always-current file, then verify it against the real repo."

**The one rule: `HANDOFF.md` is a snapshot of current truth, never a log.** Unlike `SANDBOX-PROTOCOL-LOG.md`
or the divergence logs in `rail-sidebar.ts` (which are deliberately append-only historical records —
never delete or rewrite an old entry there), `HANDOFF.md` holds no history at all. Every session that
touches it must **overwrite** the relevant section in place, not add a new dated entry underneath the old
one. If a fact in it becomes stale (a task finishes, a plan changes), replace that fact — don't leave the
old one there "for the record." History belongs in the append-only logs; `HANDOFF.md` only ever describes
right now.

**The second rule: one section per machine — only ever edit your own.** `HANDOFF.md` carries one top-level
section per machine (Laptop A, Laptop B, PC), each with its own Baseline / Active task / What's done /
What's next / Blockers. Read all of them — they tell you which files the other machines are in, which is
how you stay room-by-room — but **write only to the section for the machine you are running on.** Never
edit, summarise, tidy or "fix" another machine's section, even when it looks stale: you cannot verify
another machine's working tree from here, and overwriting it destroys the only record that machine has.
Because all three machines work `main` directly, `HANDOFF.md` is the one file every session is required to
touch; the `---` dividers between machine sections exist to hold those edits far enough apart that git
merges them automatically instead of raising a conflict. Keep them.

**Required update points — update `HANDOFF.md` in the SAME commit as the work it describes, not after:**
1. **Starting a new task or resuming an interrupted one** — update your machine's "Active task" to describe
   what's being worked on and why, in enough detail that a fresh session could continue without any other context.
2. **Completing a meaningful unit of work** — move it out of your machine's "Active task" into that same
   machine's "What's done," overwriting that subsection's own prior content to describe the CURRENT end
   state (not "also did X" appended to what was already there — rewrite the whole subsection to reflect
   where things stand now). Update your machine's "Baseline" to the new commit/tag if one was made.
3. **When a task is fully finished and there is nothing in progress** — collapse your machine's subsections
   back to their empty/minimal state (see the template below) except its "Baseline," which should point at the final
   commit/tag. Do not leave completed-task detail sitting in "What's done" indefinitely — once it's
   durably recorded in the real logs (`SANDBOX-PROTOCOL-LOG.md`, a divergence log, commit messages), it no
   longer needs to live in `HANDOFF.md` too. `HANDOFF.md` empty and clean is the correct end state, not a
   failure to document — it means "there is nothing to hand off."

**Template (this is what a fully-clean `HANDOFF.md` looks like — one block per machine, `---` between):**
```markdown
## Laptop A (main)

**Baseline** — branch `main`, last verified commit `<hash>`, tag `<tag, if one exists>`, working tree
clean and pushed to `origin/main`.

### Active task
_None. Nothing in progress._

### What's done (current state — not a history)
_(only if there's something a new session needs to know that isn't yet durably logged elsewhere)_

### What's next
_Nothing queued. Awaiting new instructions._

### Open questions / blockers
_None._

---

## Laptop B

_(the same five subsections, owned and written only by Laptop B)_

---

## PC

_(the same five subsections; until the machine is set up, this section reads "Not connected yet.")_
```

**Recovery workflow for a NEW/replacement chat session (do this before touching any code):**
0. **Determine which machine you're on before touching `HANDOFF.md`.** Check `MACHINE_NAME`
   in the local, gitignored `.env` (see `.env.example`) — the `SessionStart` hook in
   `.claude/settings.json` also prints this identity automatically at the start of every session. This
   tells you exactly which `## <name>` section in `HANDOFF.md` you're allowed to write to,
   without having to ask the user or guess from conversation context. If `.env` has no `MACHINE_NAME` set
   (first time on this machine), ask the user which machine this is ("Laptop A", "Laptop B", or "PC")
   before writing anything to `HANDOFF.md`, then set `MACHINE_NAME` in `.env` so future
   sessions on this machine don't have to ask again.
1. Read `HANDOFF.md` in full — every machine's section, not just your own. Your own section is the one you
   are resuming; the others tell you which files are currently being touched elsewhere, so you can stay
   out of them.
2. Run `git log --oneline -10`, `git status`, and `git tag` (or check the specific tag `HANDOFF.md`
   names) to confirm the baseline claimed in **your machine's** section is real, current, and the working
   tree matches what it describes (clean vs. dirty, pushed vs. ahead/behind). Another machine's baseline
   being stale is expected and is not yours to correct.
3. If your machine's section names an "Active task" or specific files, open those files and confirm the live code
   actually matches what's described — never assume a prior session's own claim of "done" or "verified" is
   still accurate without checking the real, current source (this is the same rule Primitive Fidelity
   Checklist item 5 already states for any other "resolved" record in this project).
4. Only after that verification, resume work — and if the prior chat's own claims turn out to be wrong or
   incomplete, treat that as a real finding to report, not something to silently patch over.

## Layout

| Path | What |
|---|---|
| `reference/shadcn-ui/` | The vendored shadcn repo (MIT). **Read-only.** Never imported, never edited, never shipped. |
| `tokens/*.tokens.json` | DTCG token source — shadcn's values, unmodified. **The only place tokens are authored.** |
| `scripts/build-tokens.mjs` | Emits `src/styles/tokens.css` + `src/tokens.ts`. Both are generated and gitignored. |
| `scripts/figma-variables.mjs` | Emits a Figma payload from the same source, so Figma and code cannot drift. |
| `src/ui/` | Components, as they are pulled in. Ported one at a time; see `site/` for the rollout order. |
| `dist/` | Build output — JS + `.d.ts` + CSS. Consumers import this. |
| `site/` | Showcase site (separate consumer app) deployed to bs.bidezine.systems. Imports `@bidezine/system` like any real consumer — never reaches into `src/` or `reference/` directly. |
| `icons/manifest.json` | Icon authoring source — every symbol name mapped to a Fluent slug (or a `custom` derived SVG). **The only place icon mappings are authored.** |
| `scripts/build-icons.mjs` | Emits `src/icons/generated.tsx` from the manifest. Generated and gitignored. Fails loudly if a manifest entry doesn't resolve. |
| `origin/` | **Quarantined source material** — the self-contained copy of whatever foreign system a component is being ported from, one folder per occupant. **Never imported by, and never compiled into, any bidezine app.** Where an occupant needs to actually *run* for comparison, it does so as its own standalone project under `origin/<occupant>/app/` — its own `package.json`, `tsconfig.json` and bundle — which a bidezine app embeds with `<iframe src>` and nothing more. Formerly `limbo/`. |
| `scripts/check-quarantine.mjs` | Executable enforcement of the boundary above. Fails the build on any import from `src/`, `site/src/`, `sandbox/src/` (or the tooling trees) that reaches into `origin/`, including a relative `../../origin/...` climb that would otherwise resolve fine. Also fails if the two duplicated halves of the origin embed contract drift apart. |
| `sandbox/` | Local dev environment (port 4199) for components mid-transformation, built entirely from real `@bidezine/system` components. Never merged into `dist/` or shipped. Formerly `limbo-factory/`. Governed by `docs/SANDBOX-SPEC.md`; `SANDBOX-PROTOCOL-LOG.md` is its append-only history. |
| `HANDOFF.md` | Live, always-current session state snapshot — NOT a log. Overwritten in place on every update; collapses to an empty template when nothing is in progress. Since Sandbox M8 it no longer carries ownership — `node scripts/machines.mjs` does. See "Handoff protocol" above. |
| `scripts/machines.mjs` | Who owns which component, its progress, and every audited ownership hand-over. The authoritative answer to "what is that machine working on", replacing the prose that used to live in `HANDOFF.md`. |

## Rules that matter

**No hand-rolled components, ever.** If a real `@bidezine/system` component exists for what you're
building — a badge, a button, a checkbox, a card, anything — import and use it. Never approximate its
look with a raw `<span>`/`<div>`/`<button>` styled with matching Tailwind classes. A hand-rolled
approximation *will* drift from the real component's actual recipe (missing flex/centering rules, missing
focus/aria states, missing disabled handling) in ways that are invisible in code review and only become
obvious once a human looks at the rendered result. This applies everywhere in this repo, including
tooling/dev apps like `sandbox/` — not just `site/` and `src/ui/` consumers. This is the direct,
load-bearing extension of the one design-source rule above: if the one true source is `reference/shadcn-ui/`,
then every rendered instance of that source must be the real ported component, never a hand re-derivation
of its styling.

**Tokens are authored in `tokens/`, nowhere else.** `src/styles/tokens.css` and `src/tokens.ts` carry a
generated banner and are overwritten by `npm run tokens`. Never hand-write a CSS variable.

**The light/dark parity gate is not optional.** A token defined in one mode only does not error — it
silently inherits, so the component looks right in one theme and subtly wrong in the other. The emitter
fails the build instead.

**Tailwind must never scan `reference/`.** It is committed, and Tailwind v4's auto-detection only skips
git-ignored paths — so left alone it would compile the entire vendored site's utilities into our
stylesheet. `src/styles/system.css` pins `source(none)` plus one explicit `@source`. Do not remove either.

**A build step is required.** Tailwind and CSS variables cannot exist without one. `npm run build`
compiles source → `dist/`; consumers import the built output, not raw TS.

**Runtime dependencies are externalised.** Bundling Radix would ship a second copy of its React context
into any consumer that also uses Radix — which silently breaks portals and focus traps, the exact
behaviour we adopted it for.

**SVG icons must be rendered as inline `<svg>`, never as `<img>`.** An SVG file embedded via `<img src>`,
`<img src="data:image/svg+xml,...">`, or `background: url(...)` is opaque to CSS — `currentColor` and
`fill` have no effect on it, so the icon silently ignores theme switches. Only an `<svg>` element in
the DOM responds to those properties. This is why the icon pipeline emits React components (inline SVG)
rather than static asset references.

## Iconography protocol

> **This design system uses Fluent UI System Icons — regular style, fill-based inline SVG,
> `viewBox="0 0 20 20"` — and nothing else.**

Source: [microsoft/fluentui-system-icons](https://github.com/microsoft/fluentui-system-icons), consumed
via the `@fluentui/svg-icons` package. No Lucide, Heroicons, FontAwesome, Material Symbols, Tabler, or any
other icon set is ever imported, copied, or referenced — not even "just to check," not even in `site/`
demo content. This is the icon equivalent of the one design-source rule above.

**Pipeline (mirrors the tokens pipeline exactly):**
`icons/manifest.json` (hand-authored: symbol name → Fluent slug, or `custom` derived SVG) →
`scripts/build-icons.mjs` (resolves each slug against the installed package, fails loudly on any miss) →
gitignored `src/icons/generated.tsx` (one React component per icon) → re-exported from `src/index.ts`
alongside components and tokens. **Never hand-edit `generated.tsx`.** Add or change an icon in the
manifest and run `npm run icons`.

**Enforcement — this is the part that needs active AI judgment, not just pipeline plumbing:**

1. **Any icon that is not an official Fluent System Icon must be announced, never silently adopted.**
   If a task, a dependency, a pasted snippet, or existing code introduces (or already contains) an icon
   from any other source, stop and surface it explicitly — name the file, the icon, and where it came
   from — before writing code. Don't fix it quietly and move on; don't leave it in either. The user
   decides whether it's approved as a one-off exception or denied and replaced.
2. **Every icon used for a component or option must be the right icon for that content** — not just
   "a Fluent icon," but a semantically correct one for what it represents. Don't default to a
   near-enough shape to keep moving.
3. **When no Fluent icon is a confident, correct match** — the concept doesn't map cleanly to anything in
   the set, or the surrounding UI has been customized enough that no stock icon reads correctly — **stop
   and ask the user**, offering exactly these three options:
   - **(a) Concept** — describe what the icon needs to communicate and let the user pick or suggest a
     direction, rather than the AI guessing a specific icon.
   - **(b) Exact icon** — the user names the precise Fluent icon/slug to use.
   - **(c) Customized icon** — a derived icon built by modifying an existing Fluent icon as the base
     (same approach used for `AudioLinesIcon`: started from `sound_wave_circle_20_regular`, iterated with
     the user over several rounds to match native 20px stroke weight before being locked into the
     manifest as `custom`). Never invent a from-scratch glyph unrelated to any Fluent source.
4. **New manifest entries must be verified before use** — confirm the target `.svg` file actually exists
   under `node_modules/@fluentui/svg-icons/icons/` (or that a `custom` entry's markup was deliberately
   derived from a named Fluent source) before wiring it into a component. This caught two icons
   (`AlertTriangleIcon`, `ArchiveIcon`) that were missing from the original migration inventory.

## Scroll region protocol — the two-layer pattern

`ScrollArea` (`src/ui/scroll-area.tsx`) is a real, faithful port of shadcn's own component — its
`ScrollBar` is an **absolutely-positioned overlay** (`position: absolute`, anchored to `Root`'s own edge),
not a flex sibling that reserves layout space the way a native `overflow-y-auto` scrollbar automatically
does. Left unaccounted for, this overlay can end up flush against — or overlapping — whatever content or
container edge sits at that same side. This was discovered and fixed the hard way in the Rail Sidebar
transformation (`sandbox/`, divergence rows K-3/L-18/L-21/L-22): a scrollbar that "works" (scrolls
correctly) is not the same as one that doesn't collide with anything next to it.

**Whenever `ScrollArea` is composed inside a padded container, use two layers, not one:**

1. **Outer** — an element that owns the container's own uniform padding (all four sides, not an
   asymmetric subset) and enough of the flex chain to make the region actually shrink to the available
   space instead of growing to fit its content: give it `min-h-0` (overriding the flex item's default
   automatic minimum size) and a non-`visible` `overflow` so the excess is genuinely clipped rather than
   just spilling past the box — `overflow-hidden` conveniently satisfies both at once, since a flex item's
   automatic minimum size is *also* deemed `0` once its own overflow is non-`visible`, but the two are
   distinct requirements (shrink vs. clip) worth knowing separately if you're composing this differently.
   `ScrollArea`'s own `Root` sets no `overflow` of its own, so this has to come from somewhere in the chain.
2. **Inner** — the content wrapper rendered inside `ScrollArea` reserves an *extra* gutter specifically on
   the scrollbar's own side (wider than the padding on the other sides) so real content never sits flush
   against, or under, the scrollbar thumb. **This assumes LTR** (Radix positions a vertical scrollbar on the
   right in LTR, left in RTL) — use a logical end-side padding utility (`pe-*`) if this ever needs to support
   RTL, not a fixed physical side.
3. **Conditional, not unconditional** — that inner gutter must be applied ONLY when the content actually
   overflows, never as a bare always-on utility class. A gutter reserved unconditionally leaves dead empty
   space on the scrollbar's side any time content happens to fit without scrolling — this is easy to miss in
   a screenshot glance (it just looks like "a bit of extra padding"), but is exactly the same defect class the
   origin design system this pattern is ported from explicitly names and guards against
   (`SC.UNCONDITIONAL-SCROLLBAR-GAP`, in `RailNav.tsx`'s own real source), gating its own equivalent gutter on
   a live `el.scrollHeight > el.clientHeight` measurement (`navScrollable`, re-checked via `ResizeObserver`).
   `ScrollArea`'s own `Root` (`src/ui/scroll-area.tsx`) reproduces that exact measurement itself and exposes
   it two ways: as `data-scrollable-y`/`data-scrollable-x` DOM attributes on `Root` (for tests/debugging/
   introspection only), and — the mechanism to actually USE — via **`useScrollAreaOverflow()`**, a React
   Context hook. Call it inside a consumer's own inner content wrapper and apply the gutter conditionally in
   JS: `className={cn(scrollableY && "pe-2")}`.

   **Use the Context hook, never a CSS `group`/`data-*` attribute selector, for this.** An earlier version of
   this exact protocol recommended `group-data-[scrollable-y=true]/scroll-area:pe-2`, which was a real,
   shipped, system-wide bug (logged as **L-26**): that Tailwind variant compiles to a plain CSS descendant
   combinator (`:is(:where(.group\/scroll-area)[data-scrollable-y=true] *)`) that matches **any** ancestor
   sharing that class + attribute — not specifically the *nearest* one. Every `ScrollArea` instance shares the
   same `group/scroll-area` class name, so nesting one `ScrollArea` inside another silently leaks the OUTER
   instance's overflow state into the INNER one's conditional class, even though they're functionally
   unrelated. This is not a hypothetical edge case here: `site/src/components/Layout.tsx` wraps every single
   page's `<main>` content in its own page-level `ScrollArea` (almost always scrollable), so every migrated
   component's demo on the showcase site inherited that outer instance's `true` state regardless of its own
   actual overflow — meaning the "conditional gutter" fix was **silently always-on almost everywhere on the
   real site**, while appearing to work in isolated/unit-style checks that didn't nest `ScrollArea`s. React
   Context does not have this problem: a `useContext` call always resolves to the *nearest* enclosing
   `Provider`, which is exactly the semantics this needs. If you're extending a component that renders its
   gutter-bearing element as a *sibling* of `ScrollArea` rather than a *child* of it (i.e. `ScrollArea` doesn't
   directly wrap the element needing the hook), split out a small child component so `useScrollAreaOverflow()`
   is called from something that actually renders inside `ScrollArea`'s own children — see `CommandListInner`/
   `ComboboxListInner` in `src/ui/command.tsx`/`combobox.tsx`, or `PanelTreeScrollGutter`/`QuadrantScrollGutter`
   in `sandbox/` for worked examples of this split.

**Both relationships need their own explicit measurement** (`getBoundingClientRect` on the real, rendered
DOM, scrollbar actually visible via a genuine scroll interaction — not assumed from a screenshot): the gap
between the *outer container's own edge* and the scrollbar, and the gap between the *scrollbar* and the
*inner content*, are independent relationships. Fixing one does not verify the other — this exact mistake
shipped once in this same transformation (L-21 fixed the outer gap, then immediately broke the inner one
against a sibling above it, corrected in L-22). Additionally, verify the CONDITIONAL behavior itself in both
directions — force content to shrink below the overflow threshold and confirm the gutter actually disappears,
not just that it appears when content is long — a passing "does it show when scrollable" check alone does not
prove the "does it hide when not scrollable" half of the same contract.

**`scrollbar-gutter: stable` is not a substitute for this pattern** — it reserves space for the browser's
own *native* scrollbar; Radix's `ScrollArea` hides the native one and draws its own independent, absolutely-
positioned track, which that CSS property has no reliable effect on.

**§6 — Every `ScrollArea` instance in this system assumes vertical-only overflow; `truncate` on any child
row is only trustworthy because of this.** Radix's `ScrollAreaViewport` always renders exactly one internal,
Radix-controlled child div with inline `style={{ minWidth: '100%', display: 'table' }}` (source:
`node_modules/@radix-ui/react-scroll-area/dist/index.mjs`) — a `display: table` box sizes itself from its
content's max-content width, not from the actual available viewport width, which defeats flexbox's
"automatic minimum size: 0" mechanism that makes `truncate` (overflow-hidden + ellipsis + nowrap) work
correctly inside a flex row. Any row wider than the viewport (a flex row with a `shrink-0` trailing badge
and a `truncate` label, once the label has already shrunk toward zero) silently grows the WHOLE table past
the viewport's real `clientWidth`, and the excess is invisibly clipped by the viewport's own
`overflowX: hidden` — with no ellipsis and no horizontal scrollbar — which can additionally land a trailing
element's edge directly under/behind the vertical scrollbar's track. This was found and confirmed via live
`getBoundingClientRect`/`scrollWidth`/`clientWidth` measurement (not assumed), reproducing a real reported
bug (Rail Sidebar panel-tree rows, `L-50` in `sandbox/src/data/rail-sidebar.ts`) pixel-for-pixel.
**Fixed permanently at the primitive level**: `ScrollAreaPrimitive.Viewport`'s className in
`src/ui/scroll-area.tsx` carries `[&>div]:!block`, forcing that Radix-generated wrapper div to `display:
block !important` (Tailwind's `!` prefix compiles to `!important`, which — per the CSS cascade — DOES
override a plain, non-`!important` inline style) so the wrapper's width simply equals its containing
block's content-box width instead of a function of content, letting every row's own `truncate`/
`overflow-hidden` clip/ellipsize correctly. **This fix is only safe because every real consumer of this
`ScrollArea` in this codebase (`command.tsx`, `combobox.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, and
any rail/panel composition) renders vertical-only content and never mounts `<ScrollBar
orientation="horizontal">`** — confirmed via grep across `src/ui/*.tsx` before applying the fix. **If a
future consumer genuinely needs horizontal scroll** (e.g. a wide `<table>`/`<pre>` inside `ScrollArea`),
that consumer must NOT reuse this shared `ScrollArea` as-is: `[&>div]:!block` would neutralize the exact
mechanism (`display: table` sizing to content width) that real horizontal scroll depends on. Build a
dedicated variant instead of removing the override system-wide. Whenever adding a row-based flex layout
(icon + `truncate` label + `shrink-0` trailing badge/decoration) inside `ScrollArea`, don't assume `truncate`
"just works" because it's a familiar utility — the Viewport it's composed inside changes what `truncate`
can rely on, and this specific defect class was invisible to a normal code read; it only surfaced under a
live, narrowed-width measurement.

**Deliberate shadcn divergence, migrated system-wide:** `Command`, `DropdownMenu`, `ContextMenu`, and
`Combobox` (`src/ui/command.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, `combobox.tsx`) now compose the
real `ScrollArea` primitive per this pattern, on explicit, repeated user instruction. Verified first: shadcn's
own real reference source (`reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/`) uses plain native
`overflow-y-auto`/`overflow-x-auto` in every one of these components, and never composes `ScrollArea` into
any of them — this migration is a deliberate, documented **Adjustment**, not a "Reproduce" fidelity fix; it
should never be presented as matching shadcn's own pattern.

**NOT migrated, for real architectural reasons** (each documented at its own component):
- **`Select`** (`src/ui/select.tsx`) — `SelectContent` uses Radix's own dedicated `SelectPrimitive.Viewport`
  plus `SelectScrollUpButton`/`SelectScrollDownButton`, deeply tied to Select's "item-aligned" positioning
  (aligning the selected item under the trigger). This is a separate, complete scroll system Select owns
  itself; composing `ScrollArea` in would conflict with or discard that behavior.
- **`MessageScroller`** (`src/ui/message-scroller.tsx`) — built entirely on its own dedicated primitive
  (`@shadcn/react/message-scroller`) with its own `Viewport`/hooks that measure that exact DOM node directly
  for auto-scroll-to-bottom and visibility tracking. A second, competing scroll system would very likely
  break that logic.
- **`Attachment`** (`src/ui/attachment.tsx`) — `AttachmentGroup` deliberately uses `scrollbar-none` (fully
  hidden scrollbar) for a horizontal snap-scroll gallery; there is no visible scrollbar to have a collision
  problem with.
- **`Table`** (`src/ui/table.tsx`) — byte-identical to shadcn's own source; wraps a raw `<table>` element,
  which is architecturally atypical to nest inside `ScrollArea`'s `Viewport`. Left on native
  `overflow-x-auto` rather than risk it without dedicated testing.

**API-contract notes for the four migrated components** (surfaced by rubber-duck review, worth knowing if
extending these components further):
- `DropdownMenuContent`/`ContextMenuContent` never exposed Radix's own `asChild` prop to begin with (Radix's
  underlying `Menu.Content` doesn't accept one — verified against `@radix-ui/react-menu`'s own types), so
  nesting `ScrollArea` inside them does not remove a capability that existed before.
- `CommandList`'s and `ComboboxList`'s consumer-facing `className` prop lands on the outer `ScrollArea` (the
  element that actually owns the height cap and clipping) — an independent code-review pass on this
  migration caught an earlier version that merged `className` onto the *inner* scrolling element instead,
  which would have silently swallowed any consumer override of the max-height/overflow behavior (no
  in-repo consumer was relying on the broken behavior, so it was fixed before it mattered).
- `Combobox` does not support Base UI's opt-in `virtualized` mode in composition with `ScrollArea`, since the
  actual scrolling element becomes Radix's private `Viewport`, which `ComboboxList` exposes no ref/props for
  — already noted in `combobox.tsx`'s own comment; restated here since it's a real, not just theoretical, gap.

**Critical primitive-level fix found while migrating (now baked into `ScrollArea` itself, benefits every
consumer):** `ScrollArea`'s `Viewport` used to size itself via `size-full` (a CSS percentage height). This
silently fails whenever `Root` is capped with `max-height` rather than given a fixed `height` — exactly the
case for a Radix popper/menu content element, whose available height is a dynamic `max-height` CSS var. A
CSS percentage height only reliably resolves against an ancestor with a genuinely *definite* height per
spec, and a `max-height`-clamped auto-sizing box does not reliably count as definite even when its rendered
pixel value is concrete. Verified empirically: nesting `ScrollArea` inside a `max-h-(--some-var)` ancestor
left `Viewport` at its full unclipped content height — the surrounding box visually clipped the overflow via
`overflow-hidden`, but `Viewport` itself never became internally scrollable (`scrollTop` was inert, no
scrollbar ever appeared). Fixed by making `Root` a flex column and `Viewport` `w-full flex-1 min-h-0` instead
— flex-based sizing sidesteps the percentage-resolution question entirely by letting the flex algorithm
distribute the already-constrained space directly (an explicit `w-full` on `Viewport` keeps its old
implicit full-width guarantee, since that previously came from `size-full`'s own width percentage, not from
flex's default `align-items: stretch`, which a consumer could override). Re-verified against the pre-existing
fixed-height `ScrollArea` demo (`h-72`) to confirm no regression there.

## Verify by render, not by number

A value can compute correctly and still not appear. Check the rendered result, not just the property.
This has caught more real defects here than any amount of reading.

## Sandbox fidelity — preventing contamination before promotion

A component built in a sandbox (`sandbox/`, or any future Sandbox occupant) can look completely correct
through an entire review pass and still silently diverge from the real primitives, tokens, and behavior it
claims to use — the Rail Sidebar transformation hit the same handful of failure classes repeatedly, each one
invisible to a normal code read or a quick visual glance. Treat every check below as mandatory for **any**
sandbox component before it's considered ready to promote — not a one-off list for Rail Sidebar specifically:

- **A className override is not verified by writing it — verify it against the live DOM.** Tailwind (and
  `tailwind-merge`) resolve conflicting classes by *conflict group*, not by string position: a class
  appearing later in a `className` does not guarantee it wins the compiled stylesheet's cascade. Two real
  bugs shipped this exact way in one session: `pl-7` never actually overrode `Input`'s own `px-3` (the
  search icon overlapped typed text), and `h-[38px] w-[38px]` never actually overrode `Button`'s `size-9`
  icon variant (rail buttons rendered 2px too small, producing asymmetric padding). Rule: when overriding a
  primitive's own built-in sizing/spacing utility, use the *same utility family/shorthand* it already uses
  (`size-[38px]` to override `size-9`, never split into `h-*`/`w-*`) — and confirm the override actually
  took effect with `getComputedStyle`/`getBoundingClientRect` on the live DOM, not by reading the className
  string. If genuinely unsure whether two classes will merge correctly, test `twMerge()` directly first.

- **Removing or suppressing a primitive's built-in interactive state requires wiring its replacement in the
  same change, never after.** A rail button shipped with `hover:bg-transparent` silently killing `Button`'s
  own hover feedback, with no substitute background ever wired in its place — the approved hover/press color
  tokens existed but weren't referenced anywhere in the component. A suppressed state with no successor is a
  regression waiting for a human to discover, not something a review should let through.

- **Never approximate a primitive with hand-rolled markup, in ANY context — including sandbox chrome.** A
  raw `<button>` (or a `<div role="button">`) styled to look like the real `Button` drifts from its actual
  recipe (missing focus-visible ring, missing disabled handling, missing flex/centering rules a reviewer
  won't notice from a screenshot) in ways only a DOM inspection catches. This is the same "no hand-rolled
  components" rule already stated above for `site/`/`src/ui/` — sandbox tooling is not exempt from it.

- **A decision approved as an isolated swatch/value is not yet verified — only composing it into the real,
  full component and re-checking it next to its actual neighbors is.** Multiple color tokens were approved
  as clean-looking isolated values, then had to be revised once actually rendered against their real
  neighboring surfaces exposed contrast/legibility problems no swatch-level review could have caught.
  Re-verify every "resolved" value once the component is fully composed, not only when first proposed.

- **A "resolved" record is only as trustworthy as its last verification against the real, current code —
  spot-check it, don't just trust it.** A written divergence record (a radius value, a doc claiming a
  behavior is implemented) can drift from what the code actually does without anyone noticing, until a
  fresh read catches the gap. Any doc, QA note, or prior record — including this project's own — must be
  checked against the real, current source before being relied on, the same way an *origin* project's docs
  must never be trusted over that origin's own live source file.

- **Faithfully reproducing an origin behavior is not the same as it being correct — flag it, don't silently
  absorb it.** If a ported component reproduces a real bug or awkward interaction that exists identically in
  the origin's own current source, that is not a bidezine-introduced divergence and must not be "fixed"
  unilaterally — but it must be called out explicitly as inherited, with the origin evidence attached, so a
  human can decide whether to diverge from origin to improve it.

- **Overflow, truncation, and wrap rules must be tested with content long enough to actually trigger them.**
  Demo/placeholder text is almost always too short to exercise a `truncate`/`line-clamp`/wrap rule — a
  component can look completely correct through an entire review cycle simply because nothing in the demo
  data was ever long enough to expose a real divergence. Temporarily substitute long test strings and check
  computed style/screenshots before signing off on any text-bearing element's overflow behavior.

Whenever a new failure class like these is found, add it here directly (not only to a component's own
temporary working log) so it protects every future Sandbox occupant, not just the one that exposed it.

## Primitive Fidelity Checklist — mandatory, run proactively, not on request

Every failure class documented above was caught the same way: a human looked at the rendered result and
noticed something was off, then an AI investigation traced it back afterward. Not one was caught by the AI
running its own systematic check *before* presenting work as finished — including the formal "Independent
Audit" gate the Sandbox protocol itself defines, which sat un-run for the component's entire Build phase while
over a dozen of these bugs accumulated underneath it. Reactive verification (checking only what a human
happens to ask about) cannot reach zero; only an exhaustive, repeatable procedure run on every primitive
usage can. This checklist exists to make that procedure concrete instead of aspirational.

**Items marked `→ ENFORCED` are machine-checked by `scripts/check-rules.mjs`, blocking in CI (Sandbox M9).**
They are shorter here because the part you had to remember is applied for you; what remains is the judgement no
grep can make. Their incidents live in `SANDBOX-PROTOCOL-LOG.md`'s flaws log. `ENFORCED` is not "skip it" — the
check catches only the shape it was given.

**Run every item below for every real primitive usage you touch, before calling any change "done" — not
just the property the current task happens to mention:**

*(Items 1–10 cover CSS/style mechanics — className merges, box-model, interactive states, primitive-swap
behavior. Items 11–14 were added after a second, separate wave of findings — element-order/positional
conventions, data-completeness, primitive-default assumptions, and overlay geometry — none of which are CSS
merge problems, and none of which the first ten items would have caught even if followed perfectly. Treat
this as confirmation that the checklist itself must keep widening in *kind*, not just in item count, whenever
a genuinely new failure category is found — not evidence the list is now complete.)*

1. **className-vs-base-recipe merge check.** For any `className` override on a real primitive, find that
   primitive's own base recipe (its `cva`/`buttonVariants`-style source) and run `tailwind-merge` against
   `(baseRecipe, override)` directly — in a scratch `node -e` script, not by inspection — and confirm the
   result contains no leftover conflicting base classes (same property, different value). Do this for every
   variant/size combination actually used, since a conditional variant like `has-[>svg]:px-3` is a *different*
   conflict group than a plain `px-2` and both can silently survive together.

2. **Full box-model parity check**, whenever two elements are claimed (by a divergence row, a design intent,
   or a "should look the same" requirement) to share a visual recipe: pull `getComputedStyle` for **all** of
   height, border-radius, padding (all four sides — don't assume a shorthand covers them identically),
   gap, font-size, font-weight, and line-height on both elements and diff them programmatically. A screenshot
   comparison is a confirmation step *after* this, never a substitute for it — a difference under a few
   pixels or a single mismatched side is usually invisible in a screenshot at normal size.

3. **Every interactive state, simulated live, not read from the className.** For each state a component is
   supposed to support — rest, hover, pressed/active, focus-visible, disabled, selected/checked/expanded —
   trigger it for real (`hover()`, `mouse.down()`/`mouse.up()`, keyboard focus, toggling the relevant prop)
   and read `getComputedStyle` afterward. Never conclude a state "works" because the class exists in the
   source; an inline `style` value, a competing class, or an unreachable state (e.g. `disabled` combined with
   `pointer-events-none` making `hover:` permanently dead) can silently neutralize it.

4. **Alignment claims are measured, not eyeballed.** Any claim that one element "lines up with" or "hangs
   from" another (an icon and a guide line, a label and its indicator) must be checked with
   `getBoundingClientRect` and a numeric diff, not a screenshot glance — a few pixels of drift is exactly the
   kind of thing a static image hides and a real user's eye eventually catches.

5. **When copying an established pattern from elsewhere in bidezine** (another real component, an origin
   source), measure that reference's own actual computed values *first*, before building — target those
   numbers directly, rather than building something "in the spirit of" the reference and discovering the
   mismatch only after comparing it side-by-side afterward.

6. **A single fixed instance is not a swept file.** When any of the above catches a bug, immediately grep
   every other usage of the same primitive/pattern in the file (or component) and run the same check against
   each one — the same conflict-group gap recurring three separate times in one component (a `px-3`-family
   override, a `size-9` override, a second `px-3`-family override on a different element) before a truly
   exhaustive sweep ever ran is exactly the failure this checklist exists to end.

7. **This checklist itself *is* the Independent Audit gate, run continuously.** Don't treat "Independent
   Audit" as a single deferred phase at the very end of Build — run this checklist after every meaningful
   primitive-touching change, in miniature, so issues surface within the same turn they're introduced, not
   dozens of turns later when a human happens to notice.

8. **A plain CSS mechanism standing in for a component is the same violation as hand-rolled markup.** A raw
   `overflow-y-auto` substituting for the real `ScrollArea` is exactly as much a "no hand-rolled components"
   violation as a raw `<button>` standing in for `Button` — just harder to see, because a native browser
   affordance quietly replaces a themeable one instead of leaving visibly wrong markup.
   → **ENFORCED** (`scroll.no-raw-overflow`). It found `SidebarContent` on its first run, months after this
   rule was written and repeatedly quoted. What it cannot decide is whether an exception is *legitimate* —
   every entry in its exception list must carry the architectural reason it was granted.

9. **Swapping to a real primitive can silently change the CSS mechanics an existing behavior depended on —
   re-verify the behavior itself, not just that the primitive rendered.** Replacing a plain `overflow-y-auto`
   div with the real `ScrollArea` broke scrolling entirely: unlike the div, `ScrollArea`'s own Root never sets
   its own `overflow` (it defaults to `visible`), so it never got CSS flexbox's "automatic minimum size: 0"
   treatment the old div relied on to shrink to the parent's available height — it just grew to fit its
   content instead, leaving nothing to scroll. A primitive swap is not "done" once it renders; re-check the
   specific *behavior* (does it actually scroll, resize, focus-trap, etc.) the old code provided.

10. **When multiple instances of the same primitive exist on a page, a verification query must be
    disambiguated — never trust whichever one a bare selector happens to match first.** A `querySelector` or
    `.first()` check that "confirmed" the rail's own scrolling was actually silently testing the surrounding
    page's own, unrelated `ScrollArea` instance, which happened to appear earlier in the DOM — so a real
    regression shipped underneath a verification step that looked successful. Scope every check to the exact
    element in question (an index, a containing selector, a `data-*` attribute unique to that instance), not
    "the first thing on the page matching this primitive."

    **The same failure recurs one level up, at whole-document scale, and is harder to see there — so a
    verification must also assert what the thing under test is NOT.** Verifying the origin quarantine
    (`sandbox/src/components/OriginRailFrame.tsx`), a check reading "an `<aside>` renders inside the origin
    iframe" passed while that iframe was serving a nested copy of **the Sandbox app itself**: Vite's dev
    server applies its SPA history fallback to a bare directory URL, so `/origin/rail-sidebar/` was answered
    with the app's own `index.html` — HTTP 200, no error in the console, no failure anywhere — and the app
    has an `<aside>` too. Three checks "passed" against the wrong document before the frame's real DOM was
    read and found to contain Tailwind utility classes (`bg-card`, `h-screen`) that the origin material,
    being entirely inline-styled, could not possibly have produced. **A positive marker alone is not
    identity: anything generic enough to be worth asserting is generic enough that a substitute can satisfy
    it.** Every identity check must be two-directional — assert a marker only the intended thing can produce
    (`.ds-scroll-region`, its own literal `#1c2024` surface) AND assert the absence of a marker only the
    substitute could produce (any Tailwind class, in that frame) — and when a URL is involved, prefer the
    explicit file path over a directory, because a server's fallback behaviour is exactly the sort of thing
    that differs silently between dev, preview and production. `scripts/verify-origin-quarantine.mjs` is that
    check, written this way on purpose.

11. **A ported UI pattern's structural arrangement (element order, slot position) must be cross-checked
    against bidezine's OWN other real implementations of the same semantic pattern — never inherited from
    origin's layout by default.** A group-toggle row's chevron sat on the LEFT, copied verbatim from origin's
    own source layout, and passed an entire review pass ("does this look plausible") without ever being
    checked against bidezine's own two real "expand/collapse with a chevron" primitives — `AccordionTrigger`
    (chevron last, `justify-between`) and `DropdownMenuSubTrigger`/`ContextMenuSubTrigger`/`MenubarSubTrigger`
    (chevron last, `ml-auto`) — both of which put it at the far right. Before finalizing any element
    order/position for a ported interactive pattern, grep every other real usage of that same semantic
    pattern in `src/ui/*.tsx` and match its convention, treating origin's own arrangement as informative but
    never authoritative over bidezine's own established one.

12. **Porting a data structure from an origin source requires an exhaustive field-by-field diff, not a visual
    read.** Six group nodes silently lost the `icon` field origin's own source data gave every one of them
    (`IconCubeTree`, `IconCalendarClock`, `IconGrid`, `IconCart`, `IconMoney`, `IconPeople`) — the ported
    `GroupNode` type didn't even have an `icon` property, and this was invisible to a normal read because
    nothing errors when a field is simply absent; the row still renders, just without that one piece of
    content. Two of the four *icon components this needed* were already imported into the file, unused —
    itself a sign the port was left mid-way. When porting any tree/list/config data from an origin source,
    literally enumerate every field name present on the origin's own object literals and confirm each one has
    a corresponding field in the ported type and every ported instance — don't rely on the rendered result
    looking complete.

13. **A shared primitive's own base recipe must be checked for the SPECIFIC named concern at hand — never
    assumed to already cover it.** The real `DropdownMenuItem` primitive has no `truncate`/`whitespace-nowrap`
    anywhere in its own base className — a long enough item label would wrap onto a second line, not
    ellipsis-truncate, and this went unnoticed because every label used against it so far happened to be
    short enough to fit. Whenever a requirement names a specific behavior (truncation, disabled handling, a
    focus ring, an ARIA attribute), open the actual primitive's source and confirm that exact behavior is
    present in its base recipe — don't assume a "real, already-shipped" component automatically covers every
    reasonable expectation for it.

14. **A decorative or overlay element's actual geometric footprint must be measured against its neighboring
    content under real interaction — a mechanism "working" is not the same as it not colliding with anything.**
    Radix `ScrollArea`'s scrollbar thumb is an absolutely-positioned overlay, not a flex sibling that reserves
    layout space — confirming that scrolling itself worked (K-3) never established whether the visible thumb
    then overlapped the content sitting at that same edge. A live measurement (scrollbar actually visible via
    a real scroll interaction, `getBoundingClientRect` on both the content edge and the scrollbar track) found
    a literal *negative* gap, i.e. genuine overlap. Any decorative element that overlays content (scrollbars,
    floating badges, absolutely-positioned indicators) needs this same explicit geometric check, not just a
    functional one.

15. **Anything that relies on a component's runtime identity (`.name`, `.displayName`, or a name-based string
    match) must be verified against an actual production/minified build, not just the Vite dev server — dev
    mode preserves function names; a real build routinely does not.** `src/lib/action-icons.tsx`'s own
    `isIconElement()` check has two paths: an explicit `isActionIcon === true` marker, and a fallback checking
    whether `.name`/`.displayName` ends in `"Icon"` — unsafe under minification, as its own code comment
    warns. A hand-rolled icon relying solely on that fallback silently stopped filling on hover the moment it
    was minified, with zero errors, while generated icons kept working in the same bundle. It survived many
    turns of "fixes" because every re-check ran against the dev server.
    → **The marker is ENFORCED** by `scripts/check-rules.mjs` (`icons.action-marker`), blocking in CI.
    **The broader rule is not, and cannot be: verify anything name-dependent against a real build.** That
    generalises well past icons — it is the reason `site/verify-sidebar-scroll.mjs` and the sandbox checks all
    drive production output. **Two known limits of the marker, which the check also cannot see:** it is read
    off `child.type` directly, so it does **not** survive being
    wrapped in `React.memo`/`React.forwardRef`/another HOC afterward — mark the *outermost* wrapper, not just
    the inner function, if one is ever added; and the check is `displayName ?? name` (an *or*, not both), so a
    `displayName` that doesn't end in `"Icon"` silently overrides an otherwise-fine `.name` — the marker is the
    only fully reliable contract, treat the name-suffix fallback as a convenience for simple cases only, never
    as something to depend on for anything wrapped or renamed.

16. **A CSS `group`/`data-*` attribute selector cannot express "nearest ancestor" — if a mechanism needs that
    semantic, it must be React Context, not a Tailwind `group-data-[...]/name:` variant.** A conditional
    scrollbar gutter (checklist item 3 in the Scroll region protocol above) was implemented via
    `group-data-[scrollable-y=true]/scroll-area:pe-2`, which appeared correct in isolated checks but was a
    real, shipped, system-wide bug (**L-26**): that Tailwind variant compiles to a plain CSS descendant
    combinator matching **any** ancestor sharing the group name + attribute, not the nearest one. The instant
    two instances of the same primitive nest (which happens whenever a page-level layout wraps its own content
    in the same primitive a component demo also uses internally — exactly `site/src/components/Layout.tsx`'s
    structure), the outer instance's state silently overrides the inner one's, and every check that doesn't
    specifically construct a nested scenario will pass while the real, deployed site is broken almost
    everywhere. Before reaching for `group-data-*`/`peer-data-*` to read a primitive's own internal state from
    one of its descendants, ask: could two instances of this primitive ever nest on a real page? If yes (and
    for a widely-reused primitive like `ScrollArea`, assume yes), expose the state via a React Context +
    exported hook instead — `useContext` always resolves to the nearest `Provider`, which is the actual
    semantic needed, and a CSS selector of this shape structurally cannot replicate that.

17. **Any fix explicitly described as system-wide, cross-cutting, or "apply this everywhere" must be verified
    by dispatching multiple independent background agents whose findings are then personally re-checked — not
    self-approved by the same agent/pass that made the change.** This was a standing, repeatedly-stated user
    requirement this session ("I thought I was specific on using multiple agents to not rely on one approving
    things for the sake of approving"), and it caught a real gap: a dispatched independent scroll-audit agent's
    own findings needed correction too (it used the same kind of unscoped `document.querySelector` that
    checklist item 10 already warns against, producing at least one unreliable "Defect A" measurement it
    admitted was a proxy). The correct workflow is therefore three-layered, not two: (1) make the fix, (2)
    dispatch independent agents to audit it fresh, (3) personally re-verify the agents' own specific claims
    with fresh, properly-scoped `getBoundingClientRect`/computed-style measurements before reporting anything
    as confirmed — an agent's report is a lead to re-check, not a verdict to relay verbatim.

18. **Icon path data (`d`/`filledD`) must always be copied verbatim from the real Fluent `.svg` source file —
    never reconstructed from memory, reasoning, or "what this icon probably looks like."** While restoring a
    previously-exempted icon's filled variant (**L-27**), a first attempt at `videoSettings`'s `filledD`
    was written by reasoning about the icon's likely filled shape rather than reading
    `node_modules/@fluentui/svg-icons/icons/video_settings_20_filled.svg` directly — it looked plausible (valid
    SVG path syntax, roughly the right silhouette) but did not match Microsoft's real glyph at all. This is a
    uniquely dangerous class of error: a fabricated-but-plausible path passes every automated check (typecheck,
    build, even a live "does it render *something* different on hover" smoke test) and only reveals itself on
    close visual inspection against the real icon — exactly the kind of bug that ships silently. Any time icon
    path data is added or changed, the actual `.svg` file under `node_modules/@fluentui/svg-icons/icons/` must
    be opened and compared character-for-character (or copy-pasted directly) — reasoning about an icon's shape
    is never a substitute for reading its real source.

19. **A provisional, user-facing "decision pending" exemption left unresolved across sessions eventually gets
    reported back as a bug, not a feature — track these to closure, don't let them go stale.** L-20 provisionally
    exempted two icons from hover-fill "pending explicit sign-off" when the user was unavailable to answer a
    three-option question. That exemption then sat for multiple sessions with status `"decision"`, not
    `"resolved"` — and was eventually reported back by the user as exactly the bug it was meant to provisionally
    avoid ("many icons are not filling... this is the fifth time"), because two icons behaving differently from
    every other actionable icon in the same component reads as broken regardless of the underlying rationale.
    When a provisional default is applied because a decision-maker is unavailable, treat it as a tracked,
    time-bound placeholder, not a permanent resolution — the next time the same component/behavior is touched
    for any reason, revisit any open "decision" status items in its own divergence log and resolve them
    conclusively (picking the least-invasive of the already-documented options) rather than leaving them to
    accumulate and resurface as fresh-seeming bug reports.

20. **"Selected/active" emphasis on a row (bold text, filled icon, whatever else marks it as current) must be
    driven from ONE reused state-detection mechanism, never two separate implementations for text vs. icon that
    can silently drift out of sync.** The Rail Sidebar's panel tree (L-28/L-29) bolded a selected leaf's AND its
    ancestor groups' text first, in its own pass — then, in a separate follow-up, needed a second pass to also
    fill their icons, because the leaf row's icon-fill already worked (it reused `Button`'s own built-in
    `aria-pressed` → `useActionIconFill` → `fillActionIcons` wiring) but the newly-added group-row ancestor logic
    was wired up for the text (`className`) only, not also passed through to the icon. The safe pattern, applied
    once found: compute the "is this row on the active path" boolean ONCE, then feed it into the SAME primitive
    mechanism that already drives both text weight and icon fill together (here, that mechanism is `Button`'s own
    `aria-pressed` prop) rather than writing one conditional for the `className` and a second, independent
    conditional for a `filled` prop. Whenever a row/element has multiple visual properties that are all supposed
    to track the same underlying state (selected, active, expanded, on-path, etc.), route all of them through the
    same boolean and the same primitive-level hook, so a future edit to how that state is computed can't update
    one visual property while silently leaving another stale — exactly what happened here across two separate
    commits before the icon half was caught.

21. **Any `overflow-hidden` wrapper sized with zero padding slack around its own children will clip anything meant
    to render OUTSIDE those children's own box — not just scrollbars (item 14's original framing), but focus
    rings, absolutely-positioned badges, dropdown carets, or any other decorative element that legitimately
    extends past its host element's border box.** The Rail Sidebar's nav column (L-31) wrapped its buttons in a
    `<div overflow-hidden>` sized *exactly* to the 38px buttons themselves (confirmed via `getBoundingClientRect`:
    the wrapper's own left/right edges were pixel-identical to a button's) — so every rail button's real, correct
    `focus-visible:ring-[3px]` (`Button`'s own shared convention, untouched and already correct) was invisible,
    clipped by a container with zero slack for it to render into. Before adding `overflow-hidden` to any wrapper,
    or auditing one that already has it, explicitly enumerate everything that's allowed to render outside its
    direct children's own boxes at rest, hover, focus, and every other interactive state — an outline/box-shadow
    ring, a notification dot, a tooltip arrow, anything with a negative margin or absolute positioning — and
    confirm real measured slack (not assumed) exists between the child's own edge and the clipping boundary for
    each one. If a nested wrapper's `overflow-hidden` is redundant with an ancestor's own (as it was here — the
    outer rail column already stretched to the same fixed height and already clipped with real padding), prefer
    removing the tighter, zero-slack one and relying on the looser ancestor instead of trying to add padding to
    the tight one, which risks visually shifting the very layout the wrapper was sized around.

22. **When a real primitive genuinely lacks a concept another real primitive already has (e.g. a "persistently
    selected/current" state), extend the shared primitive itself with the SAME convention, rather than patching
    around the gap at one call site.** `DropdownMenuItem` had zero concept of a persistently-active row (only
    `DropdownMenuCheckboxItem`/`DropdownMenuRadioItem`, a different toggle semantic) — its own `useActionIconFill`
    call didn't even accept an `active` parameter, unlike `Button` and `SidebarMenuButton`, which both already do.
    A rail component needing "this menu item represents the current page/section" had nothing to reuse, and its
    own attempt (an explicit `filled={...}` prop passed directly to an icon child) silently did nothing at all,
    since `fillActionIcons` unconditionally overrides any icon's `filled` value from the primitive's own hover/
    press tracking — a locally-scoped workaround couldn't have worked here even in principle. The fix was to add
    `isActive` to `DropdownMenuItem` itself, mirroring `Button`/`SidebarMenuButton`'s own already-established
    naming and mechanism (one boolean → `data-active` → background + `font-medium` + feeding the same shared
    icon-fill hook), reusing this component's OWN existing `bg-accent`/`text-accent-foreground` tokens (already
    used by its `focus:` state and `DropdownMenuSubTrigger`'s `data-[state=open]:` state) rather than a different
    primitive's separately-scoped palette. Before scoping a fix to one rail/consumer call site, check whether the
    gap is actually in the shared primitive itself, and whether an analogous concept already exists on a sibling
    primitive (`Button`, `SidebarMenuButton`, etc.) that the fix should mirror for consistency — a real per-item
    "selected" indicator is a primitive-level capability question, not a one-off styling patch.

23. **When a second wrapper is added around an element that already has its own padding — for a genuinely
    different reason than the first wrapper's padding exists — audit whether the two now double-count the SAME
    side(s), not just whether each one is independently justified.** The Rail Sidebar's panel tree area (L-33)
    ended up with a `PanelTreeScrollGutter` carrying an unconditional `p-1.5` (6px, all sides — added at L-18,
    when it was the ONLY padding source for the tree) nested inside a separate outer `p-2` (8px, all sides —
    added later at L-21, to solve an entirely unrelated problem: giving the scrollbar clearance from the panel's
    own OUTER edge). Both additions were correct and well-reasoned in isolation at the time each was made, but
    nobody went back and asked whether the earlier one was now redundant with the later one — so the tree's
    left/top/bottom sides silently paid for the same 8px of clearance twice (14px total), while a sibling element
    (the search box above it) that only ever passes through ONE such wrapper stayed at a proper 8px, making the
    tree look conspicuously "too deep" by comparison. The fix is never to just add a THIRD layer of overrides to
    compensate — it's to identify which of the two (or more) existing wrappers is now doing genuinely redundant
    work on a given side, and remove ONLY that redundant contribution, keeping whichever wrapper's reasoning for
    that side still holds (here: the outer `p-2`, since it independently also serves the still-real scrollbar-
    to-panel-edge concern from L-21) while trimming the older one back to only what it's still uniquely
    responsible for (here: nothing on left/top/bottom, but still the conditional right-side scrollbar-to-content
    gutter, which the outer wrapper cannot provide since it isn't inside the scrollable viewport). Whenever a new
    wrapper's padding is added around an already-padded element for a new, different reason, explicitly re-derive
    the ancestor chain's TOTAL effective padding on every side afterward (not just the new wrapper's own value in
    isolation) and compare it against a visually-adjacent sibling that should read as "the same amount of inset."

24. **Never reduce `line-height` below a font's safe descender clearance on an element that also has (or might
    ever gain) `overflow: hidden`/`truncate` — glyphs paint per the font's own ascent/descent metrics regardless
    of line-height, so a line box shrunk to exactly `font-size` (`leading-none`, line-height: 1) WILL clip
    descenders (g/y/p/q/j) the instant anything on that element clips overflow.** It shipped (L-34), and looked
    like it "appeared and disappeared" depending on whether the active label happened to contain a descender.
    → **The `leading-none` + `truncate` combination on one element is ENFORCED** by `scripts/check-rules.mjs`
    (`text.leading-none-truncate`), blocking in CI. **The judgement it cannot make is the general one:** confirm
    via `getComputedStyle` that `line-height` is ≥ the font's own safe default (Tailwind pairs `text-sm`'s 14px
    with 20px/1.43 for exactly this reason) before applying any tight line-height to real, dynamic text — as
    opposed to decorative or icon-only elements, where there is no descender to clip. If two visual states are
    both real text, check whether the origin/reference source actually changes line-height between them at all —
    here it didn't (`bodyM`/`labelL` share `lineHeight: 1.55`, only `fontWeight` differs), which is itself a signal
    that introducing a line-height change was an unforced, avoidable divergence, not something being deliberately
    replicated from a real source.

25. **When wrapping an existing, already-elevated element (a real `shadow-*`/`box-shadow`) in a third-party
    primitive whose own internal implementation applies `overflow: hidden` to its OWN rendered box — not
    something visible in the primitive's own exported className recipe, only in its live inline styles — measure
    the real slack between the elevated element's box and that primitive's clipping boundary before assuming
    the shadow will render fully.** Wrapping the Rail Sidebar's panel (its own real `shadow-md`) in
    `ResizablePanelGroup` (L-35) clipped the shadow on every side, because `react-resizable-panels`' `Group`
    applies its own `overflow: hidden` via an internal inline style (confirmed only via `getComputedStyle` on
    the live rendered node — it is NOT part of bidezine's own `src/ui/resizable.tsx` className recipe, so
    reading that file's source alone would never reveal it), and the panel's box sat with zero slack against
    the group's edges. Unlike a bidezine-authored `overflow-hidden` (e.g. checklist item 21's own case), this
    kind of ancestor clipping can't simply be deleted — it belongs to a vendored library. The fix has to add
    real slack the elevated element's own side: since `ResizablePanel`'s own root node also carries an inline
    `padding: 0px` (confirmed via `getComputedStyle` — a class added directly to `ResizablePanel` cannot
    override an inline style), the slack must live on a plain, nested div INSIDE the primitive's own panel, not
    on the primitive's root itself. If the slack changes what the panel's numeric size props (`minSize`/
    `defaultSize`/`maxSize`) are meant to represent to a consumer or a real source's own instruction (here:
    origin's real 240/300px numbers), compensate by adding the inset back into those props so the VISIBLE
    element still renders at the intended size — the inset should be invisible to anyone reading the resulting
    on-screen dimensions, only present in the underlying layout allocation.

    **CORRECTION (see divergence row L-36):** the first pass at this fix only compensated the WIDTH side of the
    added inset (bumping `minSize`/`defaultSize`/`maxSize`), and forgot HEIGHT entirely — `react-resizable-panels`
    has no min/default/max-height prop for a horizontal group (height is always "100% of the group's own
    cross-axis"), so the padding silently shrank the visible card's height with nothing compensating for it,
    reported directly by the user as "reduce the sidebar entirely." **The general rule this generalizes to:**
    whenever an inset is added to satisfy a clipping ancestor on MULTIPLE sides, verify EVERY affected dimension
    has an equivalent compensation mechanism available, not just the one the primitive's own props happen to
    expose most obviously (width, here) — if a dimension has no such prop (height, in a horizontal
    `react-resizable-panels` group), compensate the CONTAINER instead: make the container itself larger on that
    axis than its own slot (via `calc(100% + 2×inset)` plus matching negative margins to hold its visual
    position), so the contained element keeps its full original size while the container absorbs the extra
    slack invisibly. After any such fix, verify by comparing the affected element directly against its most
    relevant real sibling (here: the panel against the Rail's own height/top/bottom, not just against the
    resizable group's own box) — comparing only against the wrapping primitive can hide a regression that's
    only obvious when checked against the actual visual neighbor a user would notice it drifting from.

26. **Before proposing ANY new/invented VALUE — color, size, spacing, radius, duration, or any other
    constant — for a divergence row, grep bidezine's own real primitives in `src/ui/` for an existing
    convention/token covering that same concept, and reuse it; never accept "that's what origin used" as
    sufficient justification on its own.** This item started narrower (color only) and was broadened after
    a second, structurally identical mistake surfaced in a different category. Four color divergence rows
    (C-6/C-7/C-8/C-9, Rail Sidebar) were originally written up proposing a `--muted` candidate for a
    checked-row tint and brand-new hex values (`#E0E1E6`/`#363A3F`) for a pressed icon-button background —
    flagged directly by the user: "we already have way to manage menus from the design system that we have
    why do we want to diverge and come up with a different color tokens... it seems like you are even
    creating or adding new colors for it." A grep across `src/ui/` for `data-active|data-\[state=checked\]|
    active:` immediately surfaced FOUR existing, working conventions for these exact semantics:
    `DropdownMenuItem`'s own `isActive` prop (`data-[active=true]:bg-accent`), `SidebarMenuButton`'s real CSS
    `active:bg-sidebar-accent`, `NavigationMenuLink`'s `data-[active=true]:bg-accent/50`, and `Toggle`'s
    `data-[state=on]:bg-accent` — every one of them reuses `--accent` (or a sibling token family), sometimes
    at reduced opacity for a softer tint, never a bespoke color. The fix in every case was to extend the
    relevant primitive's own base recipe with the SAME already-established token/mechanism
    (`DropdownMenuCheckboxItem` gained `data-[state=checked]:bg-accent/50` mirroring `NavigationMenuLink`;
    `DropdownMenuItem`/`DropdownMenuCheckboxItem` gained `active:bg-accent active:text-accent-foreground`
    mirroring `SidebarMenuButton`; `Button`'s `ghost` variant gained the identical `active:` rule
    system-wide) — never a per-call-site override with a new value.

    **The same mistake then recurred in a sizing/layout context** (divergence row F-3, Rail Sidebar):
    `PANEL_DEFAULT_WIDTH` mirrored origin's own `LAYOUT.panelW = 300` verbatim, justified only as "one of the
    two real numbers being emulated from origin's own source" — with no bidezine token checked or found to
    back that specific number. The user caught this too, immediately after the color fix, and named the
    pattern explicitly: "we need to stay true to bidezine's protocols and rules and patterns why do we want
    to go back to the origin's 300 pixels." Checking bidezine's own primitives found the answer immediately:
    the `Sidebar` primitive (`src/ui/sidebar.tsx`) already defines a real, native default panel width of
    `16rem`/256px. Fixed by changing `PANEL_DEFAULT_WIDTH` from 300 (origin's number, no bidezine token) to
    256 (bidezine's own native default) — the sizing equivalent of reusing `--accent` instead of inventing a
    hex value. (`PANEL_MIN_WIDTH = 240` was deliberately left unchanged: it is NOT an origin-borrowed value
    merely because it happens to equal origin's own hard-coded 240 — it independently matches bidezine's own
    `min-w-60` token, per divergence row F-8, so no divergence existed there to begin with. `PANEL_MAX_WIDTH
    = 380` was also left unchanged: it has no origin equivalent by name at all and was already documented as
    a demo-reasonable max, not a borrowed number — the check here is to catch VALUES ACTUALLY COPIED FROM
    ORIGIN with no bidezine backing, not to force every constant in a file to trace to a token regardless of
    its actual provenance.)

    This is the direct extension of the project's own "no hand-rolled components" rule to ANY constant, not
    color alone: an origin number kept "because that's what origin used," or an AI-invented value that
    merely looks plausible in isolation, are exactly as much an unforced divergence as a hand-rolled `<div>`
    standing in for a real component — and just as easy to miss in review, since a size/color/duration
    candidate can look "reasonable" without ever being checked against what bidezine's own primitives already
    define for that same concept. Whenever a divergence row proposes keeping or introducing ANY constant,
    the mandatory first check is: does a real bidezine primitive already define an equivalent for this exact
    concept? If yes, reuse it, even when origin's own number is the one already sitting in the code.

    **A third, distinct axis surfaced investigating divergence rows F-5/F-6** (Rail Sidebar nav-tree row
    height): checking a value against a matching primitive's OWN default (the F-3 axis above) is not the same
    check as verifying consistency against a DIFFERENT bidezine component that serves a similar/related
    purpose. The user pushed past "does h-10/min-h-7 match origin's 40px/28px" to ask whether those numbers
    were consistent with bidezine's own real `Sidebar` component (the literal component shown in a screenshot
    of the live site) for row-height/hit-target conventions. Investigation found neither origin number was
    actually adopted in the shipped code (`PanelTree` uses a uniform `h-9`/36px at every depth already, per
    row L-9) — but the real, useful finding was live-measuring bidezine's OWN shipped `Sidebar` demo
    (`localhost:5173/components/sidebar`) via `getBoundingClientRect`: `SidebarMenuButton` (parent row) = 32px,
    `SidebarMenuSubButton` (one nested level) = 28px — a real, hard-coded parent→child shrink, confirmed
    identical in the original shadcn source too. But this convention is a fixed TWO-level hierarchy only — no
    recursive/N-level sub-menu component exists in bidezine or shadcn's own source, and `SidebarMenuSubButton`
    requires a live `SidebarProvider` — so it has no defined answer for a genuinely deep tree (3–5 levels),
    which was this Rail Sidebar's actual requirement. A shrink-with-depth scale mirroring that 32→28 ratio was
    proposed and explicitly rejected by the user (rows become illegibly small / sub-hit-target past a few
    levels), confirming the existing uniform-height choice as correct — but only after the cross-component
    check was actually run, not assumed. **The generalized rule: before approving a divergence row's numeric
    value, check it against (a) whether it matches origin, (b) whether a bidezine primitive already defines a
    native default for that exact same component/concept, AND (c) whether OTHER bidezine components serving a
    similar/related purpose (nav rows, list rows, hit targets) already establish a convention this value
    should be consistent with or deliberately, defensibly diverge from — a numeric coincidence with origin, or
    even with one bidezine primitive's own default, is not sufficient proof of system-wide consistency on its
    own.**

    **A fourth, distinct pitfall surfaced resolving divergence row F-7** (Rail Sidebar footer's 3-icon height
    cap): a user's approval of a divergence row's CONCEPT is not proof the concept was ever actually wired
    into the real component's code — the two must be checked separately. F-7 (`FOOTER_MAX_HEIGHT = 122px`)
    had been approved by the user, but specifically as "the three icon cap" behavior, not as a rubber-stamp of
    origin's literal number. Re-checking the real `FunctionalRailSidebar.tsx` source (not just the divergence
    row's own text) turned up a second, more fundamental gap: the footer's flex column had NO max-height or
    `overflow-hidden` of any kind — the cap had been documented as approved but never actually implemented,
    silently (invisible in this rail's own configuration, since it currently ships only 2 footer items, well
    under the 3-icon threshold that would ever trigger clipping). Fixed by re-deriving the constant from
    bidezine's own already-shipped values (`RAIL_BUTTON_SIZE=38`, the real `size-[38px]` every `RailIconButton`
    already uses, matching origin's `LAYOUT.railButton` exactly; `FOOTER_GAP=4`, the real `gap-1` already on
    the footer's own flex column) rather than origin's bare literal — landing on the identical 122px, but now
    backed by bidezine's own real constants — and applying `overflow-hidden` + `maxHeight` to the actual
    footer container. **The generalized rule: when a divergence row moves from `"decision"` to `"resolved"`
    on a user's approval, always re-open the real component source and confirm the approved behavior is
    actually implemented in code — not just that the row's own detail text describes it — before treating the
    row as closed.** A row can be fully, correctly reasoned about in documentation while the corresponding
    code was never written at all; documentation completeness is not evidence of implementation completeness.

27. **Any custom component placed directly under a Radix `asChild`-enabled trigger (`TooltipTrigger`,
    `DropdownMenuTrigger`, `PopoverTrigger`, etc.) needs BOTH `React.forwardRef` AND full rest-prop forwarding
    — a passing typecheck or build proves neither, only a live hover/focus interaction test does.** `L-1`'s
    own, previously-working "logo tooltip shows unconditionally on hover" contract was silently broken by an
    unrelated color-contract refactor (L-51) that extracted the logo's inline `<a>`/`<div>` markup — which,
    being native DOM elements, accept refs automatically — into a new custom component (`RailLogoSlot`)
    sitting directly under `<TooltipTrigger asChild>`. This broke the tooltip in TWO separate, compounding
    ways, and fixing only one still left it broken: (1) the component was a plain function, not
    `React.forwardRef` — Radix's `asChild`/Slot mechanism clones its child and attaches a `ref` to reach the
    real DOM node for hover/position tracking, and a non-forwarding component silently swallows that ref with
    zero error or warning; (2) even after adding `forwardRef`, the component destructured only its own known
    props (`href`/`colors`/`children`), silently dropping every OTHER prop Radix's Slot clones onto the
    child — `onPointerEnter`/`onPointerLeave`/`onFocus`/`onBlur`/`data-state`, etc. — which is the actual
    mechanism Radix's Tooltip uses to detect hover/focus; the ref reached the DOM correctly after fix (1), but
    Radix's own pointer-tracking handlers still never did. Both fixes were required together: `forwardRef` the
    ref, AND accept/spread `...rest` props onto the rendered element, composing (not overwriting, not
    overwritten by) any event handlers the component already defines internally for its own state (here,
    `onMouseEnter`/`onMouseLeave`/`onMouseDown`/`onMouseUp` driving hover/press color, composed with whatever
    Radix injects on those same event names). Verified only by a live Playwright hover test against the
    running dev server (querying for the actual rendered `[role="tooltip"]`/`[data-radix-popper-content-wrapper]`)
    — `npx tsc --noEmit` passed cleanly through both the broken and the fixed states, proving a clean
    typecheck gives zero signal this ref/prop chain is intact. Whenever extracting inline markup that sits
    directly under an `asChild` trigger into its own named component — for ANY reason, not just a color
    refactor — treat `forwardRef` + full rest-prop forwarding as a mandatory pair, and re-verify the trigger's
    real interactive behavior (hover, focus, click, whatever it drives) live afterward, not just that the
    component renders and typechecks.



## Three machines, one branch

Laptop A, Laptop B, and a PC all work `main` directly. `origin` is the only source of truth — unpushed
work does not travel.

**Who owns what is a query, not a convention** (Sandbox M8): `node scripts/machines.mjs`. One component
belongs to one machine, and the database refuses a foreign machine's attempt to resolve or promote it.

**Pull when you sit down · push when you get up · commit small and often.**
Work room-by-room: one person per file.

## Attribution

shadcn/ui and Radix are MIT-licensed. `THIRD-PARTY-LICENSES.md` stays. We may license our own work as we
choose; the third-party notice covers their portions.
