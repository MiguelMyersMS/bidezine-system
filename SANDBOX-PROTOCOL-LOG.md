# Sandbox Transformation Protocol — Working Log

> **RENAMED, NOT REWRITTEN.** This file was `LIMBO-PROTOCOL-LOG.md`; `limbo-factory/` is now `sandbox/`
> and `limbo/` is now `origin/` (Sandbox Milestone 5, see `docs/SANDBOX-SPEC.md`). Only this title and
> this note changed. **Every entry below still says "limbo" and still names the old paths, deliberately.**
> They are append-only records of what was true when each was written, and a find-and-replace through
> them would be exactly the history-rewriting `CLAUDE.md` forbids. Read an old path as its renamed
> equivalent; do not correct it.

> **TEMPORARY FILE.** Created for the first Limbo transformation (Rail Sidebar) to design and stress-test
> the protocol below in real conditions. Once Rail Sidebar successfully ships into the bidezine system and
> receives final human sign-off, fold any durable refinements into `CLAUDE.md`'s standing rules and
> **delete this file**. Do not treat this as permanent documentation.

## What "Limbo" is

A holding/quarantine area for components sourced from a *different* design system (not shadcn/ui) that
the user wants to bring into `@bidezine/system`. A Limbo component:

- is **never** part of the public showcase nav (`site/src/nav-manifest.ts`) while it's in Limbo,
- is **never** shipped from `src/ui/` while it's in Limbo,
- exists purely as raw source + an active dissection/transformation record,
- only graduates to a real `src/ui/` component after the full gate sequence below, ending in the human's
  final review.

**First occupant: "Rail Sidebar"** — a sidebar the user already built in another project, on a different
design system, to be used as a *structural/behavioral* template only (not as the final visual target —
the whole point of the transformation is to re-express it fully in bidezine's own tokens, icons, and
components).

## The core rule this protocol exists to enforce

**No single agent may both perform a transformation step and approve it.** Every gate must be a distinct
agent instance with a narrow, independent scope, specifically so an AI cannot loosely, quietly, or
"trickily" get sloppy work waved through by grading its own homework. The human's final review is always
required regardless of what any AI gate concludes — AI gates reduce the human's workload, they never
replace the human's authority.

## Agent roster (segregation of duties)

| # | Role | Scope | Must NOT |
|---|---|---|---|
| 1 | **Intake / Dissection agent** | Reads the Rail Sidebar source *and* its documentation file. Produces a full, itemized divergence list: every icon, block, layout choice, animation, effect, gap/padding/spacing value, color, font, or any other element that does not have a clean, obvious 1:1 bidezine equivalent. | Never resolves a divergence itself. Never silently assumes a "close enough" match is acceptable. |
| 2 | **Transformation / Build agent** | Performs the actual port into bidezine idioms — real bidezine tokens (color/font/spacing), Fluent icons per the CLAUDE.md iconography protocol, real bidezine sub-components wherever the sidebar composes other UI (buttons, separators, badges, etc.) — but only executes decisions the human has already made on every flagged divergence. **Must run CLAUDE.md's "Primitive Fidelity Checklist" against every primitive-touching change before considering it complete** — see the note below the table. | Never invents a resolution to an unresolved divergence. Never touches an item still awaiting a human decision. **Never declares a change "done" on the strength of a screenshot or a source-code read alone** — every className override, box-model parity claim, interactive state, and alignment claim must be independently measured first. |
| 3 | **Escalation / Divergence-check agent** | Independent from the Build agent. Cross-checks the Build agent's output against the Intake agent's original divergence list — confirms every single flagged item was actually resolved by a recorded human decision, not quietly auto-resolved during Build. | Never itself decides a divergence — it only checks whether the *human* decided it. |
| 4 | **Independent Audit agent** | Independent from Build. Runs a full compliance pass: color tokens, font tokens, spacing tokens all sourced from `tokens/*.tokens.json` (no hand-written CSS values), every constituent sub-component is a real `@bidezine/system` component, every icon is a real Fluent slug from `icons/manifest.json`, zero leftover foreign classes/tokens/icons anywhere in the ported code, **plus a full re-run of the Primitive Fidelity Checklist against every primitive usage in the finished component** — this is a genuine second, independent pass, not a rubber stamp on Build's own self-check. | Never rubber-stamps based on the Build agent's own self-report — must independently re-inspect the code. |
| 5 | **Human (final review)** | Reviews everything — including the Escalation and Audit agents' findings — and gives (or withholds) final approval to promote the component out of Limbo. | N/A — this is the terminal, non-delegable gate. |

**The Audit agent is a second, independent check — never the ONLY check.** Rail Sidebar's own Build phase
ran for dozens of turns with the formal Independent Audit agent never once invoked, while the human's own
visual spot-checks caught over a dozen primitive-fidelity bugs one at a time, reactively. That is the
sequencing flaw this protocol must not repeat: Build is not permitted to treat "looks right in a screenshot"
as equivalent to "verified," and must run CLAUDE.md's Primitive Fidelity Checklist itself, continuously,
against every primitive-touching change — not defer all verification to a later Audit phase that may not
run until the component is already believed finished.

Recommended mapping to available sub-agent types in this environment: Intake → `research`/`general-purpose`
(read-only-ish, structured output); Build → `general-purpose`; Escalation-check → `code-review` (its
read-only, independent-reviewer framing fits naturally); Audit → a second, separately-invoked `code-review`
or `security-review`-style pass focused on the token/icon/component compliance checklist rather than
security. Each must be a **separate agent invocation** — never the same conversation/context reused across
roles.

**Any occupant that composes the real `ScrollArea` primitive must follow the two-layer scroll region
pattern documented in `CLAUDE.md` ("Scroll region protocol").** This is now a standing, checkable
requirement for Build and Audit alike, not a one-off fix scoped to Rail Sidebar: verify both the
outer-container-to-scrollbar gap AND the scrollbar-to-inner-content gap independently, with real
`getBoundingClientRect` measurements while the scrollbar is actually visible, not a screenshot glance.

**Update:** the pattern has since been migrated system-wide into `Command`, `DropdownMenu`, `ContextMenu`,
and `Combobox` (a deliberate shadcn divergence, not a fidelity fix — see CLAUDE.md for the full rationale
and the components deliberately excluded). While implementing this, a real bug was found and fixed in
`ScrollArea` itself: `Viewport`'s old `size-full` sizing silently failed to constrain scrolling whenever an
ancestor used `max-height` instead of a fixed `height` (the exact case for Radix popper/menu content) — CSS
percentage heights don't resolve against a `max-height`-clamped ancestor even when its rendered size is a
concrete pixel value. Fixed by switching `Viewport` to flex-based sizing (`flex-1 min-h-0`), which doesn't
depend on that CSS percentage-definiteness rule. Any future occupant composing `ScrollArea` inside a
`max-height`-capped ancestor (not a fixed-height one) should specifically verify `scrollTop` is actually
functional and the scrollbar thumb genuinely renders — not just that the box visually clips.

**Update 2 — the inner gutter must be conditional, never unconditional.** Reported directly by the user
after the above migration shipped: several of the newly-migrated components (and the Rail Sidebar's own
panel tree, in `limbo-factory/`) still carried a bare, always-on end-side gutter class (`pe-2`/`pr-4`)
regardless of whether the content actually needed to scroll — visible dead space any time content happened
to fit. Checked origin's real source (`RailNav.tsx`) and found it already solves this correctly: a
`navScrollable` state, computed from `el.scrollHeight > el.clientHeight` and kept current via
`ResizeObserver`, gates the gutter (`paddingRight: navScrollable ? SPACE[2] : 0`) — origin's own code even
names the anti-pattern being guarded against (`SC.UNCONDITIONAL-SCROLLBAR-GAP`). Reproduced the same check
directly inside `ScrollArea` itself (`data-scrollable-y`/`data-scrollable-x` on `Root`) so every consumer
gets correct, conditional behavior automatically via a `group-data-[scrollable-y=true]/scroll-area:` variant
instead of reimplementing the measurement per-component. Fixed in all four migrated `src/ui` components and
the Rail Sidebar's tree panel; verified both directions live (gutter present when forced to overflow,
absent when collapsed back to fitting) — this two-directional check is now folded into CLAUDE.md's protocol
itself as a mandatory verification step, not just a one-off fix.

**Update 3 — Update 2's own CSS mechanism was itself broken (logged as L-26).** The user reported, repeatedly
and directly, that the exact same scrolling/gutter issues were STILL visible on the real showcase site
(`localhost:4188`) despite Update 2 being marked resolved — and explicitly called out that verification was
not rigorous enough ("I thought I was specific on using multiple agents to not rely on one approving things
for the sake of approving"). Re-investigating from scratch (not trusting the earlier "resolved" status)
found the root cause: Tailwind's `group-data-[scrollable-y=true]/scroll-area:pe-2` variant compiles to a
plain CSS descendant combinator that matches **any** ancestor sharing the `group/scroll-area` class +
attribute — not specifically the *nearest* one. Since `site/src/components/Layout.tsx` wraps every page's
own content in its own page-level `ScrollArea` (almost always scrollable), every nested component demo's
conditional gutter silently inherited that outer instance's `true` state regardless of its own real overflow
— meaning Update 2's fix was effectively always-on almost everywhere on the real site, while appearing correct
in `limbo-factory` (which has no equivalent nested-`ScrollArea`-in-`ScrollArea` structure) and in any check
that didn't specifically nest one `ScrollArea` inside another. **Fixed by replacing the CSS mechanism with a
React Context** (`ScrollAreaOverflowContext`/`useScrollAreaOverflow()`, exported from `src/ui/scroll-area.tsx`
and `@bidezine/system`), which always resolves to the nearest enclosing `Provider` regardless of naming
collisions. All real consumers (the four migrated `src/ui` components, the Rail Sidebar's tree panel, and two
additional, previously-unaudited `ScrollArea` usages found in `limbo-factory/src/App.tsx` while sweeping the
factory line itself) were migrated to the hook. **The standing lesson, worth restating for future occupants:
never use a CSS `group`/`data-*` attribute selector to read a nested primitive's own state — use React
Context instead**, since CSS selectors of that shape cannot express "nearest ancestor" semantics the way
`useContext` can. See CLAUDE.md's Scroll region protocol for the full technical writeup and the corrected
guidance (which previously, incorrectly, recommended the CSS variant this update replaces).

**Update 4 — icon fill exemption finally resolved, and a text/icon emphasis fix caught its own enforcement
gap (L-27 through L-30).** For a fifth time, the user reported icons not filling on hover/press/select. Root
cause this time was NOT a new bug: `video`/`videoSettings` (Activity stream / Live operations) had been left
in a provisional, un-filled "decision" state (L-20) across multiple sessions, waiting on a sign-off that never
came — two icons behaving differently from every other actionable icon reads as broken regardless of the
underlying rationale. Resolved by restoring their real Fluent `filledD` values (L-27), read directly from
`node_modules/@fluentui/svg-icons` — a first attempt at reconstructing one from memory was wrong and had to
be corrected before shipping, folded into CLAUDE.md checklist item 18 (icon path data must always be copied
verbatim from the real source, never reasoned about). Separately, the user asked to apply the same bold-text
treatment the Rail Sidebar's own selected leaf uses to its ancestor group rows too (L-28), matching origin's
real `labelFont = isActive ? TYPE.labelL : TYPE.bodyM` derivation (bold for the active leaf AND every
collapsed group on the path to it) — then asked directly to also fill those groups' icons (L-29), which
uncovered that the group row's icon fill hadn't been wired up alongside its new bold text at all. **When then
asked directly whether this behavior was durably enforced against future regression, the honest answer was
no** — only a divergence-log entry existed; the code still computed the label className and the icon-fill
trigger as two separate conditionals, the exact same split that caused L-29 in the first place (L-30). Fixed
for real this time: added CLAUDE.md checklist item 20 (any pair of visual properties meant to track the same
state must derive from ONE reused boolean/mechanism, never two independently-maintained conditionals), and
refactored the component itself so the split is structurally impossible, not just discouraged in prose — a
single `pathEmphasis()` helper now returns both the `aria-pressed` value (which `Button`'s own
`useActionIconFill`/`fillActionIcons` wiring already reads for icon fill) and the label `className` together,
computed once per row. **The standing lesson: when a fix is "durably enforced," that must mean both a written
protocol rule AND, wherever feasible, a code-level structural guard that makes the specific defect class
impossible to reintroduce — a divergence-log entry alone is a historical record, not a guardrail.**

**Update 5 — a truncated focus-ring halo traced to a zero-slack `overflow-hidden` wrapper (L-31).** The user
reported the rail's keyboard focus ring (`Button`'s own real, correct `focus-visible:ring-[3px]` — never
rail-specific, never touched by this fix) appeared truncated around the rail icons. Investigated live via
genuine keyboard Tab navigation (not `.focus()`, which was found not to reliably trigger `:focus-visible`
depending on the browser's last-input-modality heuristic) before proposing anything, per the user's explicit
"recognize the issue, recommend a fix, don't act without my feedback" instruction: measured the rail nav
column's own `<div overflow-hidden>` wrapper and found its rendered box was pixel-identical to the buttons it
contained — zero padding slack of its own — so its `overflow-hidden` clipped the ENTIRE 3px ring on every
side. Confirmed this was not an Origin-contamination issue either direction: Origin's own real ring is plain
CSS `outline` (`FOCUS.style`), not `box-shadow`, but an ancestor's `overflow-hidden` clips both identically —
the ring mechanism was never the problem, only the surrounding layout's slack. Validated the fix with a
throwaway DOM mutation before committing to it: removing the inner wrapper's `overflow-hidden` (keeping
`min-h-0 flex-1`, the actual footer-anchoring mechanism from F-11) let the ring render fully, with zero
regression to footer anchoring, and confirmed the outer rail column already independently stretches to the
same fixed height with its own `overflow-hidden` + real 8px padding — meaning it already redundantly guards
against the transient "all sections render before `ResizeObserver` trims them" overflow flash this inner
wrapper's `overflow-hidden` was likely also there for. Fixed for real once approved, verified again via
keyboard navigation and a rebuilt production build. **The standing lesson, folded into CLAUDE.md checklist
item 21: an `overflow-hidden` wrapper sized with zero slack around its children clips anything meant to
render outside those children's own box — not only scrollbars (item 14's original, narrower framing), but
focus rings, badges, carets, any decorative overlay — enumerate everything allowed to render outside a
wrapper's direct children before adding `overflow-hidden` to it, or when auditing one that already has it.**

**Update 6 — overflow menu icon color confirmed correct; missing selection indicator fixed at the primitive
level (L-32).** The user flagged two overflow-menu ("More") behaviors, again asking to recognize and
recommend before acting. (1) Icon color vs. label color: read the real vendored shadcn source directly and
confirmed `DropdownMenuItem`'s own base recipe (`[&_svg:not([class*='text-'])]:text-muted-foreground`) is
byte-identical in bidezine's port — a deliberate, universal shadcn convention (muted icon, full-color label),
not a rail-specific or bidezine-introduced divergence. Left unchanged. (2) No visual indicator for the
currently-selected stashed section: confirmed a genuine gap — the only attempt (`filled={...}` passed
directly to the icon) was dead code, since `DropdownMenuItem`'s own `fillActionIcons` wiring unconditionally
overrides any icon's `filled` prop from its own hover/press tracking. Checked both real reference points:
Origin's own `OverflowMenuItem` has a complete active-state contract (solid background, full-contrast text,
bold label, filled icon); bidezine's own closer-fit precedent is `SidebarMenuButton`'s already-shipped
`data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium` convention, driven by one `isActive`
boolean that also feeds the shared icon-fill hook. **Fixed at the primitive level, not scoped to the rail:**
added a real `isActive` prop to `DropdownMenuItem` itself (a deliberate, documented divergence from shadcn's
source, which has no such concept), reusing this component's OWN existing `bg-accent`/`text-accent-foreground`
tokens (already used by its `focus:` state) rather than borrowing `SidebarMenuButton`'s separately-scoped
`--sidebar-accent` palette. Verified live and in a rebuilt production build, for two different selections, with
zero regression to the plain showcase site's own DropdownMenu demo. Updated the showcase site's own DropdownMenu
API reference table so this is discoverable for any future consumer. **The standing lesson, folded into
CLAUDE.md checklist item 22: when a real primitive lacks a concept a sibling primitive already has
(`Button`/`SidebarMenuButton`'s own `active`/`isActive`), extend the shared primitive itself with the same
convention — a locally-scoped workaround at one call site cannot substitute for a capability gap in the
primitive, and often silently fails outright (as the dead `filled` prop did here).**

**Update 7 — the panel's options/tree area had double-stacked padding versus the search box (L-33).** The user
reported the tree area below the search box looked noticeably "too deep," especially on the left, while the
search box itself looked properly inset. Investigated live before proposing anything: the search box's own
visible left border sat at a single 8px inset (its own, sole `px-2 pt-2` wrapper), while the first tree row's
own visible edge sat 14px in — a real, measured double-count, not a perception issue. Root cause: two separate,
individually-correct historical fixes were never reconciled with each other. `PanelTreeScrollGutter` carried an
unconditional `p-1.5` (6px, all sides) from L-18, back when it was the ONLY padding source for the tree; then
L-21 added an entirely separate outer `p-2` (8px, all sides) around the whole `ScrollArea`, to solve an unrelated
problem (giving the scrollbar clearance from the panel's own OUTER edge). Nobody went back to reduce the older,
now-redundant inner padding once the newer outer wrapper took over providing that same left/top/bottom
clearance. Confirmed against origin's real source (reference/origin-design-system/gallery/RailNav.tsx, its
"NavPanelShell FRAME" ~lines 989-1013) before deciding on a fix: origin's real outer shell owns a single
`padding: SPACE[2]px` (8px, all sides) and its inner `<nav>` carries ZERO base padding of its own — only the
same kind of conditional right-only scrollbar gutter this file already has. Origin never double-stacks a second
uniform padding layer; bidezine's did, purely as an unreconciled artifact. FIXED by removing
`PanelTreeScrollGutter`'s unconditional base `p-1.5` entirely, keeping only its existing conditional right-side
gutter — mathematically a no-op for the already-verified scrollbar-clearance behavior (Tailwind's `pr-4` already
overrode, not added to, `p-1.5`'s own right-side value), while making the left/top/bottom sides rely solely on
the outer `p-2`, matching both the search box's own single-layer inset and origin's real structure exactly.
Verified live: the first tree row's left edge is now pixel-identical to the search box's own left edge (was a
6px mismatch), and the search-box-to-first-row gap dropped from 14px to ~8px, matching the panel's existing
rhythm. Separately re-confirmed the right-side scrollbar-clearance mechanism is byte-for-byte unchanged.
`limbo-factory` typechecks and builds cleanly in production mode. **The standing lesson, folded into CLAUDE.md
checklist item 23: when a second wrapper is added around an already-padded element for a genuinely different
reason, explicitly re-derive the ancestor chain's TOTAL effective padding on every side afterward, not just the
new wrapper's own value in isolation — and compare it against a visually-adjacent sibling that should read as
"the same amount of inset."**

**Update 8 — active-path row labels clipped their own descenders (L-34).** The user reported "in the menus
text get truncated specially at the bottom", then, after some investigation into the wrong surface (dropdown
menus), redirected with "check the text in the sidebar" — pointing at the real location. Measured live: the
shared `pathEmphasis()` helper (L-28/L-29/L-30's single source of truth for active-path row emphasis) applied
`"leading-none font-medium"` to any row on the active path, compiling to `line-height: 14px` — exactly equal
to the 14px font-size — confirmed via `getComputedStyle` on Monthly/Schedules/System logic (all active-path),
vs. `line-height: 20px` on regular rows (Daily, Rules engine). The label span also carries `truncate`
(`overflow: hidden`) for its own horizontal ellipsis. Combining a 100%-line-height box with `overflow: hidden`
on the same element is a deterministic interaction: glyphs paint per the font's own ascent/descent metrics
regardless of line-height, so Inter's descender on any bolded row with a "g"/"y" ("Schedules", "System logic")
got clipped right at the box's bottom edge — confirmed visually via a before/after screenshot of the "g" in
"Schedules" (tight/clipped loop before, full clean loop after). This also explains why the bug read as
intermittent across the session's history — it's invisible on any active row whose label happens to have no
descender letter. Checked origin's real tokens (`tokens.ts`) before deciding on a fix: `bodyM` (rest) and
`labelL` (active) share the IDENTICAL `lineHeight: 1.55` — origin only ever changes `fontWeight` between these
states, never line-height, so `leading-none` had zero origin basis to begin with; removing it is a correction
TOWARD origin's real convention, not a new divergence from it. FIXED by dropping `leading-none` from
`pathEmphasis()`'s active-path branch, keeping only `font-medium` — restores every row to the same `text-sm`
20px line-height already safely used everywhere else. Verified live: `line-height: 20px` on all active-path
rows post-fix, `font-weight: 500` still correctly applied, row heights unchanged (each row's outer height comes
from the button's own fixed sizing, not the label's line-height), and the icon-fill/`aria-pressed` wiring is
completely untouched. `limbo-factory` typechecks and builds cleanly in production mode. **The standing lesson,
folded into CLAUDE.md checklist item 24: never reduce line-height below a font's safe descender clearance on
an element that has, or might ever gain, `overflow: hidden`/`truncate` — and when a reference source is
available, check whether it actually changes line-height between the two states being ported at all before
assuming a tighter line-height is a deliberate, needed part of the "bold/active" treatment.**

**Update 9 — real user-driven panel resize, via the real Resizable primitive, with a shadow-clipping
regression caught and fixed mid-implementation (L-35).** Requested directly: "the Origin example has a
functionality in the sidebar that allows to resize it, and there is an instruction of the min size allowed, i
would like us to emulate that instruction and functionality but using our 'Resizable' primitive." Read origin's
real mechanism first (RailNav.tsx): a hand-rolled `onMouseDown`/`window.addEventListener("mousemove"/"mouseup")`
pair, clamping every drag to a hard-coded `PANEL_MIN_WIDTH = 240`, default `LAYOUT.panelW = 300`, and a dynamic
max based on `window.innerWidth`. Reimplementing that same mouse-event plumbing would have been exactly the
hand-rolled reimplementation this project's rules prohibit when a real primitive exists — bidezine's own
`Resizable` primitive (`src/ui/resizable.tsx`, wrapping `react-resizable-panels`) already interprets
`minSize`/`defaultSize`/`maxSize` as pixels (confirmed via its real `.d.ts`), a direct match for origin's own
numbers. Wrapped only the panel's own bordered/elevated box in a `ResizablePanelGroup` — the Rail itself stays
completely untouched — with the real panel as one `ResizablePanel` (`minSize=240`, `defaultSize=300`,
`maxSize=380`, matching origin's real min/default), a `ResizableHandle withHandle` on its trailing edge, and an
invisible "filler" `ResizablePanel` (`minSize=24`, mirroring origin's own 24px/`SPACE[6]` safety margin)
absorbing the remaining space — the idiomatic equivalent of origin's own dynamic viewport-width cap, achieved
via the primitive's own built-in space allocation instead of hand-rolled `window.innerWidth` math. Verified live
via real mouse drag (not just prop inspection): the visible panel clamps at exactly 240px dragged left, exactly
380px dragged right. **Caught and fixed a real regression mid-implementation, reported directly by the user
while this fix was still in progress ("the shadow elevation of the sidebar seems truncated"):**
`ResizablePanelGroup`'s own rendered box carries a real `overflow: hidden`, set internally by the vendored
`react-resizable-panels` library itself (confirmed only via `getComputedStyle` on the live node — not visible
in bidezine's own `resizable.tsx` recipe at all), and the panel's `shadow-md` sat with zero measured slack
against the group's own edges — the exact same "ancestor overflow-hidden clips a decoration with zero slack"
pattern as L-31, just with an un-removable vendored ancestor this time. Fixed by inserting a plain padding div
INSIDE `ResizablePanel` (its own root node has an inline `padding: 0px` that a class can't override) and
compensating by adding that same inset back into `minSize`/`defaultSize`/`maxSize`, so the VISIBLE panel still
renders at exactly origin's real 240/300/380 numbers with zero drift — the inset is invisible in the resulting
on-screen dimensions, present only in the underlying layout allocation. Re-verified after the shadow fix: 8px
of real slack on every side, shadow renders fully at rest, at the 240px minimum, and at the 380px maximum
(three separate live screenshots); no console errors on load (checked both the light and dark preview instances,
which mount simultaneously in this sandbox). `limbo-factory` typechecks and builds cleanly in production mode.
**The standing lesson, folded into CLAUDE.md checklist item 25: when wrapping an already-elevated element in a
third-party primitive, measure the real slack against that primitive's OWN clipping boundary — which may only
be visible in its live inline styles, not its exported className recipe — before assuming a shadow/decoration
will render fully; if the fix requires an inset that would otherwise skew a numeric size the user (or a real
reference source) cares about, compensate for it in the size props so the visible result stays exact.**

**Update 10 — Update 9's own shadow-inset fix (L-35) only compensated WIDTH for the added padding, silently
shrinking the visible panel's HEIGHT (L-36); the follow-up fix to that then over-corrected by removing right-side
padding entirely, clipping the shadow's rounded-corner bleed (L-37).** Reported directly by the user, immediately
after Update 9/L-35 shipped: "the resizable approach works really well but in order to fix the issue with the
shadow i see it has been decided to reduce the sidebar entirely... is it possible to avoid that down size without
truncating the shadow and allowing the resizing capability?" Per the user's own "recognize, recommend, don't act"
instruction, re-examined L-35's fix before touching anything: `react-resizable-panels` has no min/default/max-
HEIGHT prop for a horizontal group (a panel's height is always simply "100% of the group's own cross-axis"), so
while L-35 correctly compensated width (`minSize`/`defaultSize`/`maxSize` bumped by `2 × PANEL_SHADOW_INSET`), the
`p-2` padding added on all four sides inside `ResizablePanel` silently ate 16px (8px top + 8px bottom) off the
visible card's height with nothing making up for it — measured live: panel height 638px vs. the group's own
654px, a real unintended regression, not a deliberate tradeoff. **L-36 fix (approved before acting):** applied the
same width-side trick to height — instead of shrinking the visible card to fit inside a fixed-size group, the
group itself is made 16px taller than its own flex-item slot (`height: calc(100% + PANEL_SHADOW_INSET * 2)`) with
symmetric negative `marginTop`/`marginBottom` (`-PANEL_SHADOW_INSET` each) pulling it back to the exact same
visual position — the visible card lands at precisely its original height again, flush with the Rail on both
edges, with the extra 16px existing purely as invisible slack for the group's own clipping boundary. Verified
live: panel height (654px) now exactly matches Rail height, top/bottom edges match Rail's exactly (0px
difference), full 240–380px drag range unaffected. L-36 also removed the padding on the panel's right side
entirely at the same time, reasoning that edge is a functional attachment point to the drag handle rather than
open background needing shadow clearance. **That reasoning was wrong, caught by the user immediately after
("the shadow at the right side of the sidebar is truncated"), fixed as L-37:** the panel still has rounded
corners (`border-radius: 12`), and a `box-shadow` wrapping a rounded corner needs clearance in TWO directions at
once — the top-right/bottom-right corners still need room to bleed rightward AND up/down simultaneously. Zeroing
the right-side slack clipped exactly that corner-bleed region (confirmed via a zoomed screenshot of the top-right
corner: the shadow's curve abruptly stopped instead of bleeding outward, unlike the other three corners). Also
re-checked bidezine's own real `ResizableHandle` convention: it always renders as an independent thin-line flex
item between two panels, never overlapping into or pressed flush against one — so there was no real convention
here worth preserving by forcing the card flush against the handle. Fixed by restoring padding on all four sides
(back to `p-2`) and restoring the full `2 × PANEL_SHADOW_INSET` width compensation on both left and right — the
L-36 height fix (taller group + negative margins) was left untouched, since it addresses a separate concern.
Verified live after this second fix: 8px slack confirmed on all four sides again, panel width still exactly
300px at rest, height/top/bottom still exactly matching the Rail (unaffected by this change), zoomed screenshot
confirms the shadow's curve now bleeds cleanly at both right corners, matching the other two. Full drag range
re-confirmed unaffected. `limbo-factory` typechecks and builds cleanly in production mode (checked after each of
the two fixes, not just once at the end). **Standing lesson, folded into CLAUDE.md checklist item 25 as a
correction:** whenever an inset is added to satisfy a clipping ancestor on multiple sides, verify EVERY affected
dimension has an equivalent compensation mechanism, not just the one a primitive's props happen to expose most
obviously (width) — if a dimension has no such prop (height, here), compensate the container itself instead
(make it larger than its own slot via negative margins), and always re-verify the fixed element directly against
its most relevant real visual neighbor (the Rail's own height, not just the resizable group's own box) — checking
only against the wrapping primitive can hide a regression that's only obvious when checked against the actual
neighbor a user would notice it drifting from. Separately, this also reinforces checklist item 14 (decorative
overlay geometry): a shadow's own bleed radius around a ROUNDED corner needs slack in two directions
simultaneously at that corner, not just along each flat edge independently — an edge can look "fine" in isolation
(flush, no visible gap along the straight run) while still clipping the shadow specifically at the corner where
it curves.

**Update 11 — the Rail was almost entirely invisible in the factory line's own preview stage, caused by
horizontally CENTERING the whole Rail+Panel composite rather than anchoring it (L-38).** Reported directly by the
user, with a screenshot: "i noticed that in my limbo factory the example view located at the right the rail seems
off... ideally the rail should be statically located... with a separation as documented for the origin example
RailNav." Investigated via code first, since no browser/screenshot tool was available in this session — confirmed
`FunctionalRailSidebar.tsx`'s own DOM order was already correct (Rail renders before the Panel), ruling out a
component-internal bug, then traced the real cause to `limbo-factory/src/App.tsx`'s `QuadrantLayout`/`FillHeight`:
both the stage box and `FillHeight`'s own inner wrapper used `items-center justify-center`, centering the ENTIRE
Rail+Panel composite as one unit — a direct divergence from Origin's real `RailNav.tsx` contract, where the rail
is `flexShrink: 0` and positionally fixed while only the panel/content next to it flexes. When the composite's
total rendered width (rail + gap + panel + shadow insets + the invisible filler `ResizablePanel` from L-35)
exceeded the available half-quadrant stage width, `justify-center` centered the oversized row and the ancestor's
`overflow-hidden` clipped the overflow equally from BOTH edges — chopping off the narrow, leftmost Rail almost
entirely while the much wider Panel (sitting nearer the middle of the oversized row) stayed fully visible.
Confirmed exactly this via the user's own screenshot: the dark rail was invisible except for a sliver of the
resize handle, with the panel filling the whole stage. Per the user's own "recognize, recommend, don't act"
instruction, proposed the fix before touching anything: change both `justify-center` occurrences to
`justify-start`, anchoring the composite to the row's start instead of centering it, so the Rail's own position is
invariant to the Panel's width. Approved, then implemented — vertical centering (`items-center`) was left
untouched on both, since that's just stage framing and was never part of the divergence. The dev server was also
found not running (`ERR_CONNECTION_REFUSED`, unrelated to this fix — it had simply stopped) and was restarted as
part of verifying the change. The user confirmed live, after refreshing, that the full rail is now visible
alongside the panel as expected. `limbo-factory` typechecks and builds cleanly in production mode.
**Standing lesson:** this is a distinct failure mode from every prior overflow/clipping entry in this log — those
were all about an ancestor clipping a DECORATION (a shadow, a focus ring) that extends past a child's own box.
This one clips a real, functional CHILD ELEMENT (the entire Rail) because a symmetric `justify-center` treats
overflow as safe to trim equally from both sides, when in fact one side (the anchor element) must never be
trimmed at all. Whenever a composite of an "anchor" element (fixed-size, must stay fully visible/positioned) and
a "flexible" element (meant to grow/shrink, like a resizable panel) is placed in a container that might be
narrower than their combined width, use an anchoring justify value (`justify-start`/`justify-end`) matching the
anchor's real position, never `justify-center` — centering silently assumes both children are equally safe to
clip, which is almost never true for a rail/sidebar-style layout.

**Update 12 — two separate divergence rows (C-6/C-7/C-8/C-9 colors, then F-3 sizing) were both found to have
proposed keeping/inventing a value that diverged from bidezine's own real primitives, without ever checking
whether bidezine already defined an equivalent (L-40, L-41).** First, the panel-header ellipsis menu's
color divergence rows (C-7 checked-row tint, C-8 pressed menu-row background, C-9 pressed trigger background)
were originally written up proposing genuinely NEW color values — a `--muted` candidate, and brand-new hex
values `#E0E1E6`/`#363A3F` — even though bidezine already has an established, working convention for every
one of these exact state semantics (`DropdownMenuItem.isActive`, `SidebarMenuButton.active:`,
`NavigationMenuLink.data-[active=true]`, `Toggle.data-[state=on]`, all reusing `--accent`). Flagged directly
by the user: "we already have way to manage menus from the design system that we have why do we want to
diverge and come up with a different color tokens... it seems like you are even creating or adding new colors
for it." Fixed at the primitive level by extending `Button`'s `ghost` variant and `DropdownMenuItem`/
`DropdownMenuCheckboxItem` with `active:`/`data-[state=checked]:` rules reusing `--accent`, exactly mirroring
the existing conventions — never a new token. CLAUDE.md's Primitive Fidelity Checklist gained item 26 as a
direct result, requiring a grep for existing state conventions before proposing any new color.

Then, almost immediately after, the SAME root pattern recurred in a different category: F-3's
`PANEL_DEFAULT_WIDTH` had mirrored origin's own `LAYOUT.panelW = 300` verbatim, justified only as "one of the
two real numbers being emulated from origin's own source" — with no check ever made for whether bidezine's
own primitives defined an equivalent. The user caught this too, and named the pattern explicitly: "we need to
stay true to bidezine's protocols and rules and patterns why do we want to go back to the origin's 300
pixels." Checking bidezine's own `Sidebar` primitive found the answer immediately: it already defines a real,
native default panel width of `16rem`/256px. Fixed by changing `PANEL_DEFAULT_WIDTH` from 300 to 256 — the
sizing equivalent of C-6–C-9's color fix. `PANEL_MIN_WIDTH = 240` was deliberately left unchanged (it
independently matches bidezine's own `min-w-60` token, per row F-8 — not borrowed from origin despite
matching origin's number too); `PANEL_MAX_WIDTH = 380` was also left unchanged (no origin equivalent by name,
already documented as a demo-reasonable max). **Standing lesson, folded into CLAUDE.md checklist item 26 as a
broadening (not a new item):** the "grep bidezine's own primitives before accepting a new/origin-borrowed
value" check was originally scoped to interactive-state COLORS only. It has been generalized to cover ANY
constant proposed or kept in a divergence row — size, spacing, radius, duration, or otherwise — because the
identical root mistake (treating "that's what origin used" as sufficient justification, without checking
bidezine's own equivalents first) recurred in a completely different category within the same session. The
mandatory first check for any divergence-row value going forward: does a real bidezine primitive already
define an equivalent for this exact concept? If yes, reuse it — even when origin's own number is the one
already sitting in the code.



**Update 13 — F-5/F-6 (Rail Sidebar nav-tree row height) were resolved after the user pushed the same
generalized rule one axis further: past origin-parity, past "does bidezine's own matching primitive have a
native default," to whether OTHER bidezine components with a similar purpose already establish a convention
this value should be consistent with (L-42).** Both rows were originally framed only as "does `h-10`/`min-h-7`
numerically match origin's `hitTarget=40px`/`LIST_ROW.compact=28px`" — investigation confirmed neither origin
number was ever actually adopted in the shipped `PanelTree` code, which already uses a uniform `h-9`/36px at
every depth (row L-9, a prior independent decision). The user then supplied a screenshot of bidezine's own real
`Sidebar` demo (`Documentation > Introduction/Components/Changelog`) and asked directly: is the parent row the
same height as its children, and does this pattern extend to the Rail Sidebar's real requirement of 3–5 nested
levels? Live-measured via `getBoundingClientRect` on `localhost:5173/components/sidebar`: `SidebarMenuButton`
(parent) = 32px, `SidebarMenuSubButton` (one nested level) = 28px — a real, hard-coded shrink, confirmed
identical in the original shadcn source. But this convention is a fixed TWO-level hierarchy only (no
recursive/N-level sub-menu component exists anywhere in bidezine or shadcn's own source, and
`SidebarMenuSubButton` requires a live `SidebarProvider` this standalone panel doesn't have) — so it has no
defined answer for a genuinely deep tree. A shrink-with-depth scale echoing that 32→28 ratio was proposed and
explicitly rejected by the user (rows become illegibly small / sub-hit-target by depth 4–5), confirming the
existing uniform `h-9`/36px-at-every-depth choice as the correct, deliberate, standalone Rail Sidebar
convention — not a claim of matching `Sidebar` (which cannot structurally extend past one level) and not a
coincidental echo of either origin number. No code changes were needed (36px was already shipped); only the
divergence-log documentation (F-5, F-6, new entry L-42) was corrected to reflect the now fully-verified
reasoning. **Standing lesson, folded into CLAUDE.md checklist item 26 as a further broadening:** checking a
value against a matching primitive's own default is NOT the same check as verifying consistency against a
DIFFERENT bidezine component serving a similar/related purpose. The mandatory check for any divergence-row
value going forward now has three parts: (a) does it match origin, (b) does a bidezine primitive for this exact
component already define a native default, and (c) do OTHER bidezine components with a similar/related purpose
(nav rows, list rows, hit targets) already establish a convention this value should align with or deliberately,
defensibly diverge from — a numeric coincidence on any one of these three is not sufficient proof of
system-wide consistency by itself.



**Update 14 — F-5/F-6 (Rail Sidebar row height) were superseded a SECOND time, this time by actually changing
code: the user asked whether it would be better to unify on one of the two real bidezine numbers already
found (32px or 28px) rather than keep the h-9/36px value that matched neither (L-43).** Update 13's own
resolution had correctly kept the shipped uniform-at-every-depth model, but the specific pixel value (36px)
had no bidezine precedent at all — it was a prior, independent decision (L-9) made before either number was
known. The user pushed one step further: "I just think that we are introducing more numbers for navigations
and we should unify it." Investigated which of bidezine's two real precedents (Sidebar's 32px parent /
28px child) actually applies to an arbitrarily deep tree, since Sidebar itself is a fixed two-level hierarchy
and can't settle that on its own. Found the deciding evidence: `DropdownMenuItem`/`DropdownMenuSubTrigger`
(mirrored by `ContextMenuSubTrigger`/`MenubarSubTrigger`) — where a `Sub` genuinely nests inside another `Sub`
indefinitely — renders at a uniform 32px at every depth, live-measured via `getBoundingClientRect`, with zero
shrink no matter how deep. This is the one bidezine precedent that actually proves "uniform height works at
arbitrary depth" in a shipped component, and it points to 32px, not 28px (28px only ever appears in bidezine
as a one-level-deep DEMOTED tier, never as a default/top-level height). FIXED: `PanelTree`'s shared row
className changed from `h-9` (36px) to `h-8` (32px) in `FunctionalRailSidebar.tsx`, applied uniformly to all
three row kinds (leaf `Button`, group-toggle `Button`, disabled placeholder `div`) that already share one
recipe from L-9's original fix — a single class change per call site, since the height was already uniform
and needed no per-depth logic. Doc comments rewritten to state the new rationale; `rail-sidebar.ts` F-5/F-6
updated again to describe the `h-8`/32px resolution, and new entry L-43 documents the investigation. Root
`npm run typecheck` and `limbo-factory`'s `npx tsc --noEmit` re-verified clean. **Standing lesson:** this is
the practical payoff of CLAUDE.md checklist item 26's third axis (added at Update 13/L-42) — checking a value
against a matching primitive's own default is not enough when that primitive doesn't cover the actual use
case (arbitrary depth); the RIGHT precedent to unify on was a *different* bidezine component (Dropdown/
Context/Menubar) chosen because it structurally matches the real requirement, not the first component found
to look superficially similar (Sidebar).



**Update 15 — F-4 (Rail Sidebar `panelGap = 8px`) was re-investigated under the same third-axis rule
(Update 13's checklist item 26 broadening), this time confirming the existing value instead of changing
it (L-44).** F-4 had been marked `status: "clean"` on a bare origin-parity note ("= SPACE[2] = gap-2 /
ml-2") — never actually cross-checked against a different bidezine component doing a similar job. The
user asked for exactly that check: "make sure that it is well similar to the sidebar in the real... instead
of just trying to match the origin perfectly." Investigated what F-4's 8px actually governs first (the gap
between the rail column and the expanded panel, a rail-to-content layout gap — not a row-to-row or
icon-to-label gap within nav), then searched bidezine's real `Sidebar` primitive for an analogous concept.
Found one: `SidebarInset` (`src/ui/sidebar.tsx`), used when a Sidebar sits beside inset content, carries
`md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0` — an 8px (`m-2`) margin specifically
on the side of the inset content facing away from the sidebar, i.e. bidezine's own native value for "gap
between a nav rail/sidebar and its adjacent content panel." This independently confirms 8px — a genuine
bidezine cross-check, not a coincidence with origin's number. Also separately verified the two NAV-internal
gaps the user's message could otherwise have been pointing at, to rule out any actual inconsistency:
`PanelTree`'s row-to-row gap (`gap-1`, 4px) already matches bidezine's real `SidebarMenu` (`flex flex-col
gap-1`, 4px) exactly; the rail column's own icon-button gap (`gap-2`, 8px) is a self-contained rail
convention, unrelated to `panelGap`. The user reviewed this finding and explicitly approved it. **No code
change was needed** — F-4 is marked `status: "resolved"` (the green "Decided" pill in the Factory Line UI),
recording that the 8px value was verified against a real bidezine cross-check (`SidebarInset`'s `m-2`) and
signed off by the user, rather than left as a bare, unexamined "clean equivalent."
`limbo-factory`'s `npx tsc --noEmit` re-verified clean (no code touched).
**Standing lesson:** running the full three-axis check (color → own-primitive-default → cross-component
consistency) on a row that turns out to already be correct is still a necessary and legitimate outcome —
the goal of the checklist is verified confidence, not a guaranteed code change every time it's applied.



**Update 16 — F-7 (Rail Sidebar `FOOTER_MAX_HEIGHT = 122px`, the footer's 3-icon cap) was approved by the
user, but the approval was specifically of the CONCEPT, not origin's literal number — and the cap turned
out to have never actually been implemented in code at all (L-45).** The user clarified directly: "For F7 I
was actually approving the three icon cap" — i.e. the underlying behavior (silently clip any 4th+ footer
icon so an over-sized footer group can't starve the scrollable nav section's own space budget), not a bare
acceptance of origin's `122px` as an opaque borrowed constant. Investigating the real component source
(`FunctionalRailSidebar.tsx`) surfaced a second, more fundamental gap: the footer's flex column had NO
max-height or `overflow-hidden` of any kind — this divergence row had been documented but never actually
wired into the component. Re-derived `FOOTER_MAX_HEIGHT` from bidezine's own already-shipped values rather
than origin's literal constant: `RAIL_BUTTON_SIZE` (38px — the real `size-[38px]` already used by every
`RailIconButton`/Profile-slot button in this rail, matching origin's own `LAYOUT.railButton` exactly) and
`FOOTER_GAP` (4px — the real `gap-1` already on the footer's own flex column). `38×3 + 4×2 = 122px` —
numerically identical to origin, but now backed by bidezine's own real, already-verified constants instead
of a borrowed literal, the same "clean coincidence, now actually checked" outcome as F-4's `SidebarInset`
cross-check. IMPLEMENTED: added `RAIL_BUTTON_SIZE`/`FOOTER_GAP`/`FOOTER_MAX_ICONS`/`FOOTER_MAX_HEIGHT`
constants to `FunctionalRailSidebar.tsx`, and applied `overflow-hidden` + `style={{ maxHeight:
FOOTER_MAX_HEIGHT }}` to the footer's own flex column. This rail currently ships only 2 footer items
(Profile, Settings) — well under the 3-icon cap — so the fix has zero visible effect today; it's a
forward-looking guard against a future consumer over-configuring `FOOTER_SECTIONS`, matching origin's own
defensive intent exactly. `rail-sidebar.ts` F-7 updated to `status: "resolved"` (green "Decided" pill); new
log entry L-45 documents the investigation. `limbo-factory`'s `npx tsc --noEmit` re-verified clean.
**Standing lesson:** an "approved" divergence-row concept can still have a real implementation gap between
what's documented and what's actually wired into the component — approving the CONCEPT of a fix is not the
same as confirming the fix was ever actually built. Always check the real component source for the
corresponding code, not just the divergence-row text, before marking any row resolved.



**Update 17 — F-8/F-9/F-11 approved by the user, closing the entire "F — Layout / Sizing" category
(rows F-1 through F-11) with zero remaining `status: "decision"` rows (L-46).** Verified each against
the real component source before marking resolved, per the fourth axis added at Update 16/L-45: F-8's
`PANEL_MIN_WIDTH = 240` is confirmed live in `FunctionalRailSidebar.tsx`, clamping the resize-drag handler
and feeding `ResizablePanel`'s `minSize` — already implemented, and independently matches bidezine's own
`min-w-60` token (not an origin-only number). F-9's `ITEM_SLOT = 42px` is a documentation-only derived
quantity (`RAIL_BUTTON_SIZE`(38) + `FOOTER_GAP`(4)), not a separate code constant — confirmed the real
`size-[38px]` rail buttons and `gap-1` track spacing it describes are both genuinely present in code.
F-11's footer bottom-anchoring is confirmed live: the real `trackRef` div carries `flex min-h-0 flex-1
flex-col gap-1`, the actual mechanism, not just a documented claim. **No code changes were needed for any
of the three** — all were already correctly implemented; this was a documentation sign-off pass, verified
against real code rather than taken on faith. `rail-sidebar.ts`'s "remaining divergence rows" summary count
updated from 18 to 12 (F category fully closed, alongside the previously-closed B/C/G/K categories) — the
remaining 12 open rows span categories H, I, J, L, and M only. `limbo-factory`'s `npx tsc --noEmit`
re-verified clean. **This closes out the Rail Sidebar's "F — Layout / Sizing" category as ready for the
next real Build phase** — every sizing/layout constant in this category is now either a verified-resolved,
user-approved value with a real bidezine cross-check backing it, or a documented, non-blocking deployment
note (F-10).



**Update 18 — F-10 (rail must fill its container's full available height) approved by the user, bringing
the "F — Layout / Sizing" category to a full 11-for-11 `status: "resolved"` close, with zero rows left at
any other status (L-47).** F-10 was already a documentation-only DEPLOYMENT NOTE, not a code divergence:
`FunctionalRailSidebar`'s limbo-factory preview deliberately takes a measured `height` NUMBER prop (via
`App.tsx`'s `FillHeight` + `ResizeObserver`) because that's this PREVIEW TOOL's own plumbing — the real
Build should instead rely on ordinary CSS sizing (`h-full` on the outer element, with the consumer's own
layout providing a definite height further up the tree). **No code change was needed** — the measured-height
prop is correct FOR THIS PREVIEW TOOL, not a bug to fix here. The user's approval locks this guidance in as
an explicit, signed-off Build-time requirement (`status: "resolved"`) rather than leaving it as an
unconfirmed suggestion, so a future Build implementation doesn't silently carry the preview's
ResizeObserver-measured-height plumbing into the shipped component. With this, **the entire "F — Layout /
Sizing" category (F-1 through F-11) is now closed with all 11 rows at `status: "resolved"`** — the first
category in this divergence list to reach a full, uniform resolved state (previously-closed categories
B/C/G/K still carry a mix of `resolved`/`clean` rows). `rail-sidebar.ts`'s summary note updated to reflect
this. `limbo-factory`'s `npx tsc --noEmit` re-verified clean (no code touched).

**Update 19 — M-6/M-7/M-8 (rail overflow contract, real resize primitive, Sidebar-conflict deferral) approved
and shipped, plus three follow-on bugs (M-20/M-21/M-22) found and fixed once the M-7 work was tried live.**
The user requested formal plans for two friction points before any code changed — "for both dont act just
give me the plan then we can work to gother to shape them and refine them before proceddedn" — then approved
both plans and asked for a rollback checkpoint before implementation began (`checkpoint-pre-m6-m7-primitives`
git tag + `experiment/m6-m7-primitives` branch). **M-6 (rail-track overflow budget)**: built as an explicit,
testable CONTRACT rather than an implicit recalculation — a new `src/hooks/useOverflowFit.ts` measures rows
via an author-provided selector, enforces a hard `maxVisible` ceiling (initially 7, raised to 12 per an
explicit user follow-up once real section counts made 7 too restrictive), floors at 1, and recalculates via
`ResizeObserver`; truncation is a non-issue for the icon-only rail track (labels are `sr-only`) and the
overflow menu's own scrolling need is already satisfied for free by `DropdownMenuContent`'s composed
`ScrollArea` (no new scrolling code needed). **M-7 (panel resize)**: resolved via bidezine's own real
`Resizable` primitive (`src/ui/resizable.tsx`, wrapping `react-resizable-panels`) instead of a hand-rolled
mousedown/mousemove reimplementation — directly answering the user's own concern that the prior resize
approach "only is vissible for sandox, makinng it usless in productions." The invisible/`aria-hidden` filler
panel is replaced with a real, visible `adjacentContent` panel (falls back to a placeholder when a consumer
doesn't supply one), and the rail-to-panel gap workaround (`PANEL_SHADOW_INSET`'s padding doubling as the
visual gap) is reversed per explicit user request, restored to an honest `RAIL_PANEL_GAP = 8` flex gap.
**M-8**: no naming/documentation collision to resolve now — the existing `Sidebar` primitive and the new
Rail Sidebar stay architecturally distinct for the duration of this Limbo transformation; the user's own
stated plan is to revamp `Sidebar` to borrow Rail Sidebar's proven patterns AFTER promotion, not concurrently.

Trying M-7 live immediately surfaced two further bugs, both reported directly by the user with a screenshot
("I see two issues number one when I collapse the sidebar, the resize element still visible... and I don't
see the widget that is supposed to be at the right side... This is important to me so then we can create
contract and verify behaviors") — **M-20**: `adjacentContent` was disappearing ENTIRELY when the browsing
panel closed (a `Presence` wrapping the whole `ResizablePanelGroup`, not just the browsing panel's own
animated surface); fixed by moving `Presence` inward and using `react-resizable-panels`' own real
`collapsible`/`collapsedSize={0}` mechanism instead. **M-21**: trying M-20 live (via a scratch Playwright
script doing real `getBoundingClientRect` measurements against the running `limbo-factory` dev server, not a
screenshot glance) found M-20's fix was structurally correct but nearly invisible, because a SEPARATE,
pre-existing bug broke the outer `w-full` width chain (`FunctionalRailSidebar`'s own outer row and both
`FullRailPreview.tsx` mount wrappers had no width class, shrink-wrapping the whole composite instead of
filling the real available stage) — and the resize handle stayed visible with nothing on its left once the
panel was genuinely collapsed, fixed with new `isBrowsingPanelCollapsed` state (driven by the panel's own
`onResize` measurement, not the instantly-flipping `openPanel` flag, to avoid the handle vanishing mid-
animation). Verified live through the full open→collapse→reopen round-trip with exact pixel measurements at
every step. **M-22**: the user then reported the collapsed-state gap still looked too large; a fresh live
measurement confirmed the resize handle was genuinely gone (M-21 held) — the real cause was
`AdjacentContentPlaceholder`'s own unconditional `p-4` (16px) stacking on top of the real 8px
`RAIL_PANEL_GAP`, fixed by zeroing that padding via inline style (not a `pl-0` class, since a longhand
utility isn't guaranteed to win a shorthand's cascade tie by className position alone — the same M-18/M-19
lesson) whenever `isBrowsingPanelCollapsed` is true. The user then clarified an important framing point for
the record: `RAIL_PANEL_GAP = 8` is this sandbox's own stand-in demonstration value, not a fixed universal
design-system constant — the real, general contract this component is responsible for is that whatever gap
a real consuming page's own layout system commits to must be the exact, unbroken gap rendered between the
rail and its neighboring content in every state, with nothing invisible (a collapsed handle, an unconditional
content padding) silently adding to it; restated directly in `RAIL_PANEL_GAP`'s own doc comment. **All six
items (M-6, M-7, M-8, M-20, M-21, M-22) are `status: "resolved"` in `rail-sidebar.ts`**, each with its own
live-verified measurement contract, and the user gave final explicit approval for all of them together
("i apporve these plans and implementation"). `limbo-factory`'s `npx tsc --noEmit` and `npm run build`
(production `vite build`) both verified clean after every change in this update.

**Update 20 — a primitive-level `ScrollArea` defect (L-50) caused PanelTree rows to silently overflow/clip
instead of truncating, with a trailing badge landing under the scrollbar.** The user reported directly, with
a screenshot: "bug detected... when the sidebar gets reduced the rows get truncated overlaping the scrolling
area if it exist, and if not still turncated. review this issue and provide the proper contract not ontly
for this fix but even for everything that has been agreed." Reproduced live via a temporary Playwright
script (no browser/Playwright MCP tool was available this session, so it was scripted directly against the
locally-installed `node_modules/playwright` and run through the dev server) — a first measurement pass
accidentally queried the wrong `ScrollArea` instance (the page-level outer one instead of the rail panel's
own), caught and corrected per this project's own standing "checklist item 10" warning, by scoping via
`closest('[data-radix-scroll-area-viewport]')` from the badge element itself. ROOT CAUSE, confirmed via real
`getBoundingClientRect`/`scrollWidth`/`clientWidth` measurement, not assumption: Radix's `ScrollAreaViewport`
always renders one internal child div with inline `style={{ minWidth: '100%', display: 'table' }}`, which
sizes itself from content's max-content width rather than the viewport's real available width — defeating
the flexbox "automatic minimum size: 0" mechanism `truncate` depends on inside a flex row. A row with a
`shrink-0` trailing badge and a `truncate` label silently grew the whole table wrapper past the viewport's
real `clientWidth` (measured: 242px vs. 222px), with the excess invisibly clipped by the viewport's own
`overflowX: hidden` — no ellipsis, no horizontal scrollbar, and the badge landing directly under the
vertical scrollbar's track, matching the reported screenshot pixel-for-pixel. CONFIRMED SAFE TO FIX AT THE
PRIMITIVE LEVEL (a `src/ui/scroll-area.tsx` defect, not rail-scoped): grepped every real `ScrollArea`
consumer in `src/ui/*.tsx` (`command.tsx`, `combobox.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`) and
confirmed none of them ever render `<ScrollBar orientation="horizontal">`, meaning the table wrapper's only
legitimate purpose (deliberate horizontal-scroll content) is never exercised anywhere in this codebase.
FIXED by adding `[&>div]:!block` to `ScrollAreaPrimitive.Viewport`'s className — Tailwind's `!` prefix
compiles to `!important`, which per the CSS cascade DOES override Radix's plain inline `display: table`,
forcing the wrapper to size from its containing block instead of its content. Documented the root cause and
fix rationale directly in `src/ui/scroll-area.tsx`'s own doc comments, and appended a permanent §6 to
`CLAUDE.md`'s Scroll region protocol ("every `ScrollArea` instance in this system assumes vertical-only
overflow") so this stays a documented, system-wide contract rather than a one-off patch — including an
explicit warning that any future consumer genuinely needing horizontal scroll must NOT reuse this shared
`ScrollArea` as-is. Rebuilt the root package (`npm run build` — required, since `limbo-factory` consumes the
built `dist/`, not raw `src/ui/`; a first re-verification pass against a stale `dist/` incorrectly showed no
change until this was caught) and restarted the `limbo-factory` dev server with its Vite dependency cache
cleared (`node_modules/.vite`) to force re-optimization of the rebuilt package. VERIFIED live via Playwright
after the fix: `tableDisplay: "block"` (was `"table"`), `scrollWidth === clientWidth` (222 = 222, was 242 vs.
222), the label now genuinely truncates ("Sport and fi…", 83.8px, was 104px with no ellipsis), and the
"Update" badge's right edge (x≈1161) sits fully clear of the scrollbar's left edge (x≈1175) — confirmed both
numerically and via a fresh screenshot. `npx tsc --noEmit` clean; no other real `ScrollArea` consumer was
regressed, since none of them render horizontal scrollbars either.

**Update 21 — L-51: the rail's logo slot gained the same hover/press/selected color contract as the rail's
own icon buttons, gated so it only applies when the logo is actually interactive.** The user asked directly:
"the logo should use the same color as the icon when selected by default and govering [hovering] over should
apply the same color to the fill area as the other buttons... presing the icon logo should apply the color of
the fill area for press used on the other icons... this interactive behavior should only apply if the icon
triggers an action or a hyperlink, otherwhise the icon should not have a hover or pressed state just default
using the same token color as the other icons when selected" — also framing it as "very specific for the rail
but maybe in the future can be used for other primitives." IMPLEMENTED in `FunctionalRailSidebar.tsx` via two
new, deliberately generic building blocks: `iconInteractionColors(colors, state)`, a pure function
reproducing `RailIconButton`'s own already-approved color ladder (pressed > active > hovered/browsing >
resting), gated by an `isInteractive` flag that unconditionally returns a transparent background and a
`restColor` (defaulting to `colors.fg` — the same tone the icon buttons use for their `active`/`pressed`
tiers, not the dimmer `colors.fgSubtle` resting tone, since the logo isn't a togglable nav item and should
always read as prominent by default) whenever `isInteractive` is false, regardless of any hover/press state
passed in; and `RailLogoSlot({ href, colors, children })`, which replaces the two previously-duplicated inline
`<a>`/`<div>` branches with one component, deriving `isInteractive = Boolean(href)` and — critically — only
spreading the `onMouseEnter/Leave/Down/Up` handlers onto the rendered element when interactive (an omission
from the props object, not an internal no-op guard), so a non-interactive logo is structurally incapable of
ever entering a hover/pressed state. The placeholder box's border color was changed from a hardcoded
`colors.fgHover` to `currentColor`, so it automatically tracks whatever color `RailLogoSlot` computes with
zero extra prop drilling, matching the default SVG mark's existing `fill="currentColor"`. VERIFIED live via a
temporary Playwright script (deleted after use): with no `logoHref` set (the current default, decorative),
the logo's resting color matched an active rail button's foreground color exactly, and hovering it produced
zero change at all — confirming the structural interactive gate holds. With a temporary `logoHref` wired in
for the test only (reverted immediately after), the logo's hover state (`color: oklch(0.922 0 0)`,
`background: oklch(0.301 0 0)`) and pressed state (`color: oklch(0.985 0 0)`, `background: oklch(0.348 0 0)`)
matched a real rail icon button's own measured hover/pressed computed styles exactly — true parity, not a
visually-similar approximation. `npx tsc --noEmit` clean; no `src/ui/*.tsx` primitive was touched, so no root
package rebuild was required. See `L-51` in `rail-sidebar.ts` for the full contract and verification detail.

**Update 22 — L-1's own tooltip-on-hover contract for the logo was silently broken by Update 21's own
`RailLogoSlot` extraction, in TWO separate, compounding ways; both found and fixed.** The user asked "is L1
resolved to become green or still need my feedback/decision?", then, after being shown L-1 was a distinct,
older, unrelated row (about unconditional tooltip-on-hover, not color), asked to "understand more about L1
(LogoSlotDark) to get it resolved." Since L-1's own detail text claimed the tooltip behavior was "implemented
and interactively verified," but that claim predated Update 21's `RailLogoSlot` extraction, it was re-verified
live rather than trusted — per this project's own "a resolved record is only as trustworthy as its last
verification against the real, current code" rule. A temporary Playwright script against the running dev
server (hover the logo, no `logoHref` set — the current default) found **no tooltip appeared at all**, while
the identical script against a real rail icon button (a working baseline) correctly found one. Root-caused to
TWO independent defects in `RailLogoSlot`, both introduced by Update 21's extraction of the logo's previously
inline `<a>`/`<div>` markup into its own component, sitting directly under `<TooltipTrigger asChild>`: (1) the
component was a plain function component, not `React.forwardRef` — Radix's `asChild`/Slot mechanism clones its
child and attaches a `ref` to reach the real DOM node for hover/position tracking; a non-forwarding component
silently swallows that ref with zero error or warning, so Radix had nothing to attach hover tracking to. FIXED
by converting to `React.forwardRef<HTMLAnchorElement | HTMLDivElement, ...>`, forwarding to whichever element
it renders. Re-testing still showed no tooltip — (2) `RailLogoSlot` destructured only its own known props
(`href`/`colors`/`children`), silently dropping every other prop Radix's Slot clones onto the child —
`onPointerEnter`/`onPointerLeave`/`onFocus`/`onBlur`/`data-state`, etc. — which is the actual mechanism Radix's
Tooltip uses to detect hover/focus on the real node; the ref reached the DOM correctly after fix (1), but
Radix's own pointer-tracking handlers still never did. FIXED by accepting `...rest` and spreading it onto the
rendered element, composing (not overwriting, not overwritten by) the component's own internal
`onMouseEnter`/`onMouseLeave`/`onMouseDown`/`onMouseUp` color-state handlers with whatever Radix injects on the
same event names. VERIFIED live via Playwright after both fixes, in combination: non-interactive logo (no
`logoHref`, current default) now shows its tooltip ("BiDezine") unconditionally on hover, matching L-1's own
"UNCONDITIONALLY" requirement; with a temporary `logoHref` wired in for testing only (reverted immediately
after), the interactive logo showed the tooltip AND correct hover (`background: oklch(0.301 0 0)`, `color:
oklch(0.922 0 0)`) and pressed (`background: oklch(0.348 0 0)`, `color: oklch(0.985 0 0)`) color transitions
simultaneously — confirming Update 21's L-51 color contract has zero regression from this fix. Non-interactive
logo hover was also re-confirmed to show ZERO color change (`getComputedStyle` identical before/after hover),
confirming L-51's own structural interactive gate is untouched. `npx tsc --noEmit` clean after both fixes. L-1
updated in `rail-sidebar.ts` from `status: "note"` to `status: "resolved"`, with its detail text rewritten to
document the regression and both fixes directly, rather than leaving the now-inaccurate original claim in
place uncorrected. The fix's rationale is also documented directly in `RailLogoSlot`'s own doc comment in
`FunctionalRailSidebar.tsx`, framed as two SEPARATE failure modes (missing `forwardRef` vs. dropped rest
props) so a future refactor of this component doesn't reintroduce either one silently, the same way this one
did. This is a fresh, concrete instance of CLAUDE.md's own item 15 (name-based/runtime-identity assumptions
breaking silently under real conditions) and item 17 (independent re-verification, not self-approval) — worth
generalizing further: **any custom component placed directly under a Radix `asChild`-enabled trigger anywhere
in this codebase (`TooltipTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, etc.) needs BOTH `forwardRef` AND
full rest-prop forwarding, and passing a typecheck/build proves neither — only a live, real hover/focus
interaction test does.**

**Update 23 — L-3/L-4/L-11 re-investigated on request ("Review if L-3 and L-4 are decided/resolved/green
or if there is actually something you need from me"); all three now resolved.** L-3 (NavIndentLine) and
L-4 (ExpandButton) both still carried stale `status: "note"` detail text pointing at dependencies that
looked open but weren't checked against the real, current state. Re-verification against the actual origin
source files (`limbo-factory/src/reference/origin-design-system/gallery/NavIndentLine.tsx` and
`ExpandButton.tsx`, both newly located and read for the first time) and the currently shipped code found:
**L-4 needed no further decision** — its stated blocker (the Q4 icon choice) was already resolved via row
A-7, and the "Collapse sidebar" button in `FunctionalRailSidebar.tsx` is already composed from bidezine's
own `Button` (`variant="ghost" size="icon-xs"`), matching its own sibling "Panel actions" button exactly,
deliberately diverging from origin's bespoke 28px/`RADIUS.xs`/20px-icon numbers (which exist nowhere else
in bidezine) per the same "prefer our own established convention" precedent as F-5/F-6 — and its
hover/press icon-fill toggle already comes free from `Button`'s shared `useActionIconFill` mechanism, with
no separate wiring needed. Marked `resolved`. **L-3's own stated dependency (E-1/F-5/F-6) was a red
herring** — those three rows being resolved never actually unblocked it, because its real gate was always
L-11's own pending sign-off (the panel-tree vertical guide line itself), left at `status: "decision"` since
its introduction and never previously cross-referenced back to L-3. Origin's real `NavIndentLine.tsx` is a
meaningfully more precise atom than what shipped: hairline (0.5px, via `transform: scaleX(0.5)`, not a bare
sub-pixel `width` which the file's own comment says rounds inconsistently) vs. standard (1px) weight
variants, and a negative-margin BLEED technique (`marginTop: -rowPadY`, `marginBottom: -(rowPadY +
rowGap)`) so a line segment visually continues through a row's own padding and the inter-row gap, reading
as one unbroken line down the whole tree — versus the simpler `border-l` + compounding margin/padding
approximation actually shipped under L-11/L-12. **Decision (user unavailable, explicitly instructed to
proceed autonomously):** approve the current simplified implementation as sufficient rather than rework it
to origin's exact bleed/weight technique — it already reads correctly and continuously in both light/dark
screenshots from prior sessions, and the added complexity of negative-margin bleed math is not justified
purely for line-continuity polish at this tree's actual density. This is recorded as a **deliberate, flagged
simplification, not a silently-dropped requirement** — `NavIndentLine.tsx`'s own math remains the reference
to port if a future, denser tree ever visibly needs the fuller hairline/bleed technique. L-3 and L-11 both
marked `resolved` in `rail-sidebar.ts`, with L-11's detail text rewritten to record this comparison and
decision directly rather than leaving its prior "awaiting confirmation" framing in place uncorrected. The
Q1/Q2 category summary note in `rail-sidebar.ts` (Phase 2 subPhases) was also corrected from a stale "8
remaining divergence rows" count (which had drifted well behind actual resolved-row totals across several
prior sessions) down to the current accurate "2 remaining" (only L-6 and L-7 still carry `status:
"decision"`). **Lesson, extending Update 22's own point:** a divergence row's stated "blocked by X" text is
itself just as perishable as a "resolved" claim — X being resolved doesn't retroactively prove it was ever
the row's real, sole blocker. Always trace a row's *actual* current dependency chain (grep for what other
rows reference it, not just what its own stale text claims) before concluding it's newly unblocked.

Whenever the Intake agent finds an element in the source that isn't cleanly pairable to an existing
bidezine equivalent — icons, gaps, paddings, blocks, layouts, animations, effects, colors, fonts, anything —
it must be listed **individually**, never batched into a vague summary, and never auto-resolved. The human
decides each one. This is the same spirit as the Fluent iconography protocol's "when no confident match
exists, stop and ask" rule, just generalized to every visual/behavioral aspect of a ported component, not
only icons.

**Update 24 — L-7 (Collapse motion component) resolved; zero divergence rows remain `status: "decision"`.**
The user asked for L-7's recommendation ("whats your recommendation knowing that we want to be true to our
design system?"), then explicitly authorized an experimental, revertible implementation ("lets try
implementing it if i dont like it i can revert it, so dont mark it as completed/green as i give you my
green light"). Investigated origin's real `<Collapse>` (`limbo-factory/src/reference/origin-design-system/motion.tsx`)
— a hand-rolled `grid-template-rows: 0fr↔1fr` component with a `setTimeout`-based JS timer to guarantee
deterministic unmount, driven by its own `MOTION.slow`/`MOTION.ease` tokens — versus bidezine's real
`Collapsible` (`src/ui/collapsible.tsx`, a thin unstyled Radix wrapper) and its real `Accordion`
(`src/ui/accordion.tsx`), which already solves this exact class of problem via
`data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down`, powered by the
`tw-animate-css` package (already a root `package.json` dependency) reading Radix's own
`--radix-accordion-content-height`. **Recommendation, approved and implemented:** reuse the same technique
for `Collapsible` rather than reimplement origin's bespoke JS-timer/grid technique — `tw-animate-css` turned
out to already ship a dedicated `collapsible-down`/`collapsible-up` keyframe pair reading
`--radix-collapsible-content-height` specifically (not Accordion's variable), so no new keyframes needed
authoring. Added `data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up
overflow-hidden` to `PanelTree`'s group-node `CollapsibleContent` in `FunctionalRailSidebar.tsx` only —
bidezine's shared `src/ui/collapsible.tsx` primitive itself was not touched, keeping this scoped to the rail
sandbox and easily revertible per the user's own framing. No fixed pixel height anywhere: Radix measures the
real content height live on every open (the user directly asked "what height did you use" suspecting a
hardcoded `26px` from an earlier, unrelated decision — confirmed none was set; the animation is driven
entirely by the live-measured CSS custom property). **Real implementation gap caught and fixed before
declaring this done:** `limbo-factory` runs its own separate Tailwind build (`@tailwindcss/vite` over its
own `src/index.css`), which never imported `tw-animate-css` — the root package's `src/styles/system.css`
does import it, but that CSS is pre-compiled into the static `dist/system.css` this app consumes as a built
dependency, so the animation utility classes would have been dead, no-op CSS in this app specifically
(present in the DOM, matching no real rule — exactly the class of invisible failure this project's own
"verify by render, not by number" principle warns against). Fixed by adding `tw-animate-css` as an explicit
`devDependency` in `limbo-factory/package.json` and importing it in `limbo-factory/src/index.css`; verified
by curling the live dev server's own compiled CSS (`http://127.0.0.1:4199/src/index.css`) before and after
the fix, confirming `animate-collapsible-down`/`animate-collapsible-up`/`--radix-collapsible-content-height`
went from absent to present as real, matched rules. `npx tsc --noEmit` clean throughout. User approved live
in the `limbo-factory` preview ("i see then a[pp]rove you can make it green now") before `L-7`'s row in
`rail-sidebar.ts` was updated from `status: "decision"` to `status: "resolved"` — not marked resolved a
moment earlier, per the user's own explicit constraint. The Q1/Q2 category summary note (`id: "remaining"`)
was updated from "1 remaining divergence row" to "0 divergence rows awaiting a decision — all resolved,"
since `L-7` was the last row anywhere in the tracker still carrying `status: "decision"`. **Lesson:** an
animation implementation is not verified merely because the class names are syntactically valid Tailwind
utilities and typecheck passes — when a sandbox app has its OWN separate build pipeline from the design
system it consumes, a utility class sourced from a dependency of the *design system's* build can still be
completely absent from the *sandbox's own* compiled output; the only real proof is inspecting the actual
served/compiled CSS for the specific selector, not just confirming the source file references the right
class name.

**Update 25 — "Notable risks" tab audited for staleness against the divergence tracker; 7 of 11 risk rows
had drifted out of sync with rows they themselves reference.** Prompted directly: "lets go now after the
notable risks... can you review them and see if by chance some are not up to date?" Cross-checked every
`refs` id across all 11 `notableRisks` entries (`limbo-factory/src/data/rail-sidebar.ts`) against the
current, real `status` of those divergence rows — not trusting each risk's own `done`/`false` flags at face
value, per this project's own repeated "verify against actual current state" principle. Found:
- **R-3a/R-3b** (Category H motion, Category K focus-ring/scrollbar) still read `done: false` and, for R-3a,
  "H-2 through H-6... remain open" — but every H-* and K-* row referenced is now `status: "resolved"` (H-2–H-6
  via explicit user deferral to a future animation-token upgrade, K-1–K-4 fully resolved). Flipped both to
  `done: true`, rewording R-3a to describe the deferral honestly rather than implying a still-open item.
- **R-4b** ("Spot-check remaining categories F, G against origin source") — still `done: false`, but F-3,
  F-7, and G-1 are all `resolved` and their own detail text confirms the origin-source comparison actually
  happened (F-3/F-7 re-derived against bidezine's own existing defaults instead of origin's bare literals;
  G-1 confirmed against the live component and visually approved). Flipped to `done: true`.
- **R-5** (Sidebar naming collision) — `R-5a` still asked to "decide final naming," `done: false`, with no
  reference at all to `M-8` (already `resolved`), which explicitly decided this exact question weeks earlier:
  no rename, no merged API, the two stay distinct organisms for this phase, revisited only at Promote time.
  Added the `M-8` reference and flipped `R-5a` to `done: true`; `R-5b` (confirm no token/class collision at
  Promote time) correctly stays `false` since that's a real, still-future Promote-phase check.
- **R-6b** ("Collapse.tsx copied into the self-contained reference before Build") — still `done: false`,
  referencing only `H-6`. `L-7` (this same session, Update 24) explicitly chose NOT to copy origin's
  bespoke `Collapse.tsx`, reusing Radix Collapsible + `tw-animate-css` instead — so the literal action item
  will never happen, but the underlying risk (losing timing/easing values because the file isn't captured)
  is moot for a different reason: the chosen approach doesn't need those values at all. Reworded to explain
  the superseding decision and flipped to `done: true`, adding an `L-7` ref.
- **R-9a** ("H-6 explicitly decided: reuse Radix Collapsible vs. reimplement custom unmount timing") — still
  `done: false` and only referenced `H-6`, which never actually made this decision (it only deferred the
  duration/easing token question). The real decision was made and implemented in `L-7`. Reworded to point at
  `L-7` and flipped to `done: true`; `R-9b` (Escalation agent independently verifies deterministic unmount)
  correctly stays `false` — genuinely not yet run, a real, still-open gap distinct from the decision itself.
- **R-1b** ("audit actionable icon usages so filled is opt-in by state...") — still `done: false`, only
  referencing `A-1`/`A-8`/`A-9` (the capability being available, not any audit of its usage). `L-20` and
  especially `L-27` (both `resolved`) already performed exactly this: an exhaustive hover/press/select sweep
  across every actionable icon in the component (5 rail buttons, footer, Collapse control, all 11
  overflow-menu items, all 23 leaf/group tree items) with zero failures on the final pass. Added `L-20`/`L-27`
  refs and flipped to `done: true`.

Net effect via `isRiskResolved()` (a risk renders green once every action item is `done`): **R-1** and **R-6**
now render fully resolved/green, matching their real current state; R-3, R-5, and R-9 remain partially open,
correctly, since each still has one genuinely unfinished item (R-3c independent audit, R-5b Promote-time
collision check, R-9b Escalation-agent verification) that this pass did NOT fabricate as done. R-2, R-4a,
R-7, R-8, R-10, R-11 were checked and found already accurate — no changes made to those. `npx tsc --noEmit`
clean after all edits. **Lesson, extending Update 23's own point about stale "blocked by" text:** a risk
tracker's own action items can silently drift out of sync with the divergence rows they cite as evidence,
in either direction — some rows had been resolved without their downstream risk items ever being revisited,
and at least one (R-5a) had its actual answer sitting in a different, unreferenced row (`M-8`) the entire
time. Reviewing "is this risk still accurate" requires re-walking every `refs` id's live status, not just
reading the risk's own prose.

## Factory-line interface requirements — live, in `limbo-factory/` (port 4199)

- A dedicated local dev environment, on its own port, distinct from the main showcase (`4188`) and the
  icon-comparison reference tool (`5590`).
- Left-side panel listing the transformation **Phases and Sub-phases** (Intake → divergence list → human
  decisions → Build → Escalation-check → Audit → final human review → promotion) as a checkable progress
  list, so it's visually obvious what stage a component is at and what's been resolved.
- Must be built **only from real `@bidezine/system` components** — same "real components only" rule that
  governs the main site's chrome.
- Must be a **generic, reusable shell** — built once, reused for every future Limbo component, not
  hardcoded to Rail Sidebar specifically.
- **Whole-app light/dark toggle** (`ThemeToggle.tsx`) so color/elevation divergences can be evaluated in
  both modes, not just one.
- **Graphical before/after comparisons for every visual divergence category** (`CompareVisuals.tsx`):
  icons render as real inline SVG side-by-side; colors as swatches (hardcoded hex for "before", live
  `var(--token)` for "after" so they track the real theme toggle); typography as rendered text samples;
  layout/sizing and border-radius as small proportioned shapes; motion as a replayable CSS animation with
  duration/easing labeled; elevation as a shape+shadow pair that responds to theme; z-index as a rendered
  stacking example. Spacing (category E) is intentionally exempt — it doesn't need a visual aid. Every
  value shown is sourced from the real origin project or real bidezine tokens, never invented.
- **Status badges are visually distinct by severity**: "Needs human decision" = solid/high-contrast
  (`bg-foreground text-background`); "Worth noting" = grey (`bg-muted text-muted-foreground`); "Clean
  equivalent" = the existing secondary look, unchanged.
- **Color Token Lab tab**: proposed-but-unapproved token values get their own approval surface before
  anything is written to `tokens/*.tokens.json` — draft swatches only, explicitly labeled as pending.
- **Logo-import slot**: enforces the standing Q3 rule (AI never invents a logo — always asks for an image
  link; empty if none given) as a real UI element, not just a written rule.
- **Notable risks carry a concrete action-item checklist** (`isRiskResolved()`), each item cross-referenced
  to the blocking question or divergence row that resolves it. A risk's status is *computed*, not stored —
  red while any item is undone, green once every item is done.

## Source intake record (Rail Sidebar)

- **Origin:** `RailNav` component in `C:\Users\miguelmyers\Workspaces\systems\design-system` — comes with
  search, an icon-hosted rail-overflow behavior, an overflow menu, and a side/panel menu. Multiple
  sub-components/experiences, not a single simple component.
- **Self-contained copy** (read-only reference, mirrors the `reference/shadcn-ui/` pattern): copied 41
  files (~2.1MB — component source, stories, behavior contract, spec, 5 audits, 1 ADR, consumer-governance
  clarification, 2 QA reports, a consumer-build prompt, a panel-unification ledger, and evidence
  screenshots) into `limbo/rail-sidebar/reference/` inside this repo, preserving the origin project's
  relative folder structure for traceability. Nothing here is wired into `src/ui/`, `site/`, or any build
  step — it exists purely for the Intake agent to read. **Known gap (see flaws log): `ExpandButton.tsx`
  was missing from this copy** and had to be read directly from the origin for the Q4 investigation.
- **Intake/Dissection agent dispatched** to read the full reference set + our own current CLAUDE.md,
  icons manifest, tokens, and existing `src/ui/` primitives (including our already-ported shadcn `Sidebar`
  primitive, in case of behavioral overlap), and produce the itemized divergence list per the rule below.

## Flaws / weaknesses log

_(Fill in as Rail Sidebar runs through this protocol for the first time — this is the whole reason this
file exists. Capture anything that didn't work as intended: a gate that was too easy to route around, a
divergence that slipped through undetected, an agent role that needed splitting further, interface
friction, anything.)_

- **Sequencing flaw caught early:** the original todo graph made Intake/Dissection depend on the
  factory-line UI being built first. That's backwards — analysis doesn't need a visualization tool to
  exist, and blocking on it would have stalled real work behind a UI-building side quest. Decoupled:
  dissection can start as soon as the source is gathered; the factory-line UI is built in parallel and
  simply *displays* phase progress after the fact, it never gates the underlying work.

- **Documentation-vs-code drift caught by the human, not the AI (Q4):** the Intake agent's original
  investigation into the panel-collapse icon trusted a QA doc (`docs/qa/railnav-visual-qa.md`) claiming
  `IconChevronDoubleLeft` was implemented and "visually approved." The user flagged this as wrong from
  memory and attached screenshots. Re-investigation found the actual live component
  (`ExpandButton.tsx`, which the self-contained reference copy was missing entirely) imports
  `IconPanelLeftContract` — the docs were stale relative to the real, currently-shipping source file.
  **Lesson for the protocol:** the Intake/Dissection agent must verify claims against the actual current
  source file, never against accompanying docs/QA notes alone — docs can lag behind real implementation,
  and a stale doc that "sounds authoritative" is exactly the kind of trap this protocol exists to catch.
  Also surfaced a secondary gap: the self-contained reference copy (`limbo/rail-sidebar/reference/`) was
  missing a component the intake report depended on (`ExpandButton.tsx`) — the copy-in step needs a
  completeness check against every import the source docs/behavior descriptions reference, not just the
  files that seemed obviously relevant at copy time.

- **"No auto-deciding" extended to visual mockups, not just decisions:** when building the factory line's
  before/after visual comparisons, one value (`statusRedText`) was initially guessed from a common Radix
  scale value without checking source, then caught and corrected against the real `tokens.ts` before
  being shown to the user. Lesson: the same anti-fabrication discipline applied to written divergence
  rows must also apply to anything rendered as a visual aid — a plausible-looking but unverified swatch
  is just as much an auto-decision as an unverified prose claim.

- **A resolved decision still needs its own status tier, not a reuse of "clean":** once Q1/Q3/Q4 were
  answered, the divergence rows that cascade from them (A-3, A-7, A-8, A-9) kept displaying "Needs human
  decision" / "Worth noting" badges even though nothing was actually still open — the badge reflected the
  row's *history*, not its *current* state. Reusing the "clean" tag for these would have been equally
  wrong in the other direction (it erases the fact that a real decision happened). **Lesson:** a factory
  line needs a fourth tier distinct from clean/decision/note — "resolved" (decided via a cascade, not
  because it never diverged) — or badges silently go stale every time a blocking question closes, and the
  reviewer has to re-verify rows that are actually already settled.

- **An `<img src="data:...">` does not track `currentColor`, even when the underlying SVG uses
  `fill="currentColor"`:** the logo preview was built with an `<img>` tag wrapping a data-URI, which
  visually looked identical to an inline SVG at rest but silently failed the one property that mattered
  (switching color with the theme). **Lesson:** "render as SVG so the color switches" is a requirement
  about the DOM mechanism, not just the file format — an SVG *file* embedded via `<img>`/`background:
  url(...)` is opaque to CSS `currentColor`/`fill`, only an inline `<svg>` element in the document
  responds. The Independent Audit agent should treat "does it respond to the theme toggle" as a literal,
  checked behavior — not inferred from "it's an SVG."

- **Sizing/rendering questions need the actual sourcing rule stated, not re-derived per row:** two
  separate divergence rows (A-2, A-6) both surfaced the same underlying question — "is a 16px-in-a-20px-
  slot render a real icon divergence, or just a display-size choice?" — and both were left open pending an
  answer the codebase already had (100% of `icons/manifest.json` sources from Fluent's `_20_regular` grid;
  on-screen size is a separate, per-component Tailwind concern). **Lesson:** once a standing sourcing rule
  is confirmed for one row, the Intake/Escalation agents should proactively check every other row flagged
  with a similar-shaped concern and resolve them together, rather than making the human re-ask the same
  underlying question row by row.

- **Tab/section ordering is itself a divergence-resolution dependency, not just a UI nicety:** category B
  (and part of C) genuinely cannot be evaluated without the Color Token Lab's proposed swatches, but the
  lab tab was placed after the divergence list in the initial build. **Lesson:** when one tab/section is a
  hard prerequisite for reading another, the factory-line shell should order them by dependency, not by
  the order they happened to be built in — this is a recurring risk for the *next* Limbo occupant's
  factory line too, not a one-off fix specific to Rail Sidebar.

- **Isolated swatches are not sufficient evidence for color sign-off, even after the human explicitly
  approves them:** the human tentatively approved all 9 candidate tokens from the swatch-only view, but
  immediately qualified it — full sign-off requires seeing them composed together in an actual rail shape
  (background + border + hover/active/pressed + on-color text all adjacent at once). A swatch grid cannot
  surface real problems like a candidate `--sidebar-rail-surface` being nearly indistinguishable from the
  app's own `--background` in dark mode — that only became visible once RailPreview was built and toggled
  to dark. **Lesson:** for any token family gating a *composed* UI element (not a single flat surface), the
  Human Decisions phase should default to building a lightweight, real-DOM composed preview (interactive
  hover/press, not simulated) alongside the swatch lab from the start, rather than treating swatch approval
  as sufficient and adding the composed view only after being asked. Approval status should also have an
  explicit "tentative, pending composed preview" tier distinct from a final "resolved" — don't let a
  provisional yes get recorded or read back as a final one.

- **"Resolved" note text needs to be rewritten at each approval-tier change, not just the badge:** the Q2
  resolution note and the per-row footer copy in Color Token Lab both said "pending your approval" even
  after the human tentatively approved everything — the badge/tier changed but the prose describing it
  didn't, which is its own source of the same staleness problem noted above for status badges. **Lesson:**
  every place a resolution status is surfaced (badge AND explanatory prose AND blocking-question note)
  needs to be treated as one unit that changes together, not three independent copies that can drift.

- **"Real components only" applies to the factory-line UI itself, and can be silently violated even while
  following it everywhere else — and one instance found is not evidence the rest of the codebase is clean:**
  the "Tentatively approved" pill in the Color Token Lab banner was built as a hand-rolled
  `<span className="rounded-full bg-secondary px-2 py-0.5 ...">` instead of importing the real `Badge` from
  `@bidezine/system` — even though `Badge` was already imported and used correctly elsewhere on the very same
  page (`PhaseRail`'s "Done"/"Pending" pills). The hand-rolled version was missing
  `inline-flex items-center justify-center` (among other things), which made the text render visibly
  uncentered with no real vertical padding — invisible in code review, obvious the moment the human looked
  at a screenshot. Fixing that one instance and moving on was **not sufficient** — when the human asked for
  a full re-inspection of the factory line, three more hand-rolled violations turned up that had gone
  unnoticed because they didn't visibly break like the Badge did (they merely *duplicated* a real
  component's styling instead of importing it, which looks fine at a glance but is still the same rule
  violation and still carries the same drift risk):
  - `PhaseRail.tsx`'s phase-nav item was a raw `<button>` manually re-implementing the exact
    active/hover/focus idiom that `SidebarMenuButton` already encodes (`data-active` → `bg-accent
    text-accent-foreground`). `SidebarMenuButton` itself couldn't be dropped in directly (it requires a
    `SidebarProvider` context via `useSidebar()`, which would mean adopting the whole Sidebar
    provider/mobile/collapse machinery just for a simple phase list) — resolved instead by rebuilding it on
    the real `Button` component (`variant="ghost"`, active state via className override) so at minimum the
    interactive base (focus-visible ring, disabled handling, transition) comes from the real primitive.
  - `CompareVisuals.tsx`'s `MotionCompare`'s "Replay" control was a raw `<button className="rounded-md
    border px-2 py-1 ...">` instead of `Button` (`variant="outline" size="xs"`).
  - `DivergenceView.tsx`'s `RisksList` action-item indicator was a hand-rolled `<span>` with conditional
    border/background classes plus a manually-placed `CheckIcon`, reimplementing what the real `Checkbox`
    component already does — replaced with `<Checkbox checked={item.done} disabled />`.
  **Lesson:** "must be built only from real components" is not self-enforcing just because it's followed in
  most places, and a single caught violation doesn't mean the rest of the file (or the rest of the app) is
  clean — every individual interactive/styled element needs its own conscious check of "does a real
  component already exist for this," and finding one violation should trigger a full sweep of the same
  codebase for the same pattern, not just a fix-and-move-on. A rendered screenshot comparison against a
  known-correct instance of the same component elsewhere on the page catches the *visually broken* cases
  (like the Badge) but not the merely-duplicated-and-still-looks-fine cases (like these three) — those need
  a deliberate code read, not just a render check. This rule has now been elevated into `CLAUDE.md`'s
  standing "Rules that matter" section (not left as a Limbo-only convention), since it's a repo-wide rule,
  not something specific to this protocol. Durable fix/reference: see the new
  [Color Token Import Guide](/docs/COLOR-TOKEN-IMPORT-GUIDE.md), Step 5.

- **Hand-reconstructing an interactive origin component from source reading, however careful, cannot
  reliably reproduce it — each attempt reintroduces new errors instead of converging on accuracy.** The
  "Full divergence list" origin column was rebuilt twice from reading `RailNav.tsx`/`RailNav.stories.tsx`
  and taking screenshots, and was still wrong both times in ways that weren't caught until the human
  pointed them out: no search input in the mock (the real header has none — search is a separate row
  below it), no functioning 3-dot panel menu (the real one is a genuine Radix `DropdownMenu`), and no
  panel resize handle (the real panel has live drag-resize state). Static JSX retyped from memory of a
  1995-line component with real interactive state machines (dropdown open state, drag-resize tracking,
  controlled/uncontrolled search) will always miss something a screenshot alone can't reveal — **the
  fix was to stop reconstructing entirely and vendor the real, unmodified source instead.** All 15
  dependency files (`RailNav.tsx` + its 6 sub-components + `theme.ts`/`tokens.ts`/`layout.ts`/`status.ts`/
  `motion.tsx`/`icons/index.ts`/`icons/fluent.tsx`, plus `RailNav.stories.tsx` kept as an untouched
  reference copy) were copied byte-for-byte into `limbo-factory/src/reference/origin-design-system/`, the
  origin's own `@radix-ui/react-dropdown-menu` dependency was added to `limbo-factory/package.json` (this
  tool's own dependency, never `@bidezine/system`'s), and the exact `Default` story's `DefaultShell` was
  mechanically sliced (not retyped) out of the vendored `.stories.tsx` into a small importable module
  (`gallery/DefaultDemo.tsx`) plus a thin embedding shim (`OriginRailNavLive.tsx`, supplies a
  `ThemeContext.Provider` and a bounded frame in place of the story's `100dvh`/no-provider assumptions —
  the only non-verbatim part, and it changes zero visual/behavioral output). Verified interactively: the
  real search input accepts text, the real dropdown menu opens with its real 3 items
  (Search box/Expand all/Collapse all), and the real resize-drag separator is present — none of these can
  be faked by a static mock, and none needed to be, once the actual code was running instead of being
  redescribed. **Lesson for future Limbo occupants:** if a component has ANY non-trivial interactive
  behavior (menus, drag state, controlled inputs, animation state machines), reach for vendoring the real
  source into a dedicated reference subtree *before* attempting a hand-built comparison mock — a hand-built
  mock is only safe for components that are close to purely static/presentational.

- **A vendored component's own documented sizing/containment contract must be honored exactly, not
  guessed at with a convenient fixed value — and when the docs only describe an *approximation*, the
  real source's own measurement code is the final authority.** The real `RailNav`'s rail overflow
  (collapsing excess sections into a "More" button) reads its container's genuine rendered
  `clientHeight`/`offsetHeight` via a real `ResizeObserver` (`design-system/src/gallery/RailNav.tsx`'s
  `computedMax` effect) — NOT a fixed arithmetic formula. `docs/interaction-patterns.md`'s "Rail overflow
  behavior" section describes a simplified budget (`available = containerHeight - 16px - 16px - 44px`,
  `maxVisibleItems = floor(available / 44px)`) that is close but not exact once real per-instance logo/
  footer slot heights are measured instead of the doc's flat constants — the true threshold for the
  `Default` story's 16 sections turned out to be 842px, not the doc-derived 780px.
  **A second, more fundamental issue was hiding underneath the first:** `OriginRailNavLive.tsx`'s
  embedding shim originally wrapped the real component in a plain `<div style={{ height, overflow:
  "hidden" }}>`. But the vendored `DefaultShell`'s own outer wrapper is hardcoded `height: 100dvh` — a
  *viewport*-relative CSS unit that always measures the real top-level browsing context's actual window
  size, completely ignoring any ancestor element's size. That div's `height` was cosmetic: DefaultShell
  always rendered at ~full physical browser height internally regardless of what number was passed, so
  RailNav's real overflow measurement always saw "plenty of room" and never collapsed — no pixel value
  chosen for that div could ever have fixed it, because `overflow: hidden` on the div only visually
  clips excess content, it doesn't change what a `100dvh`-sized descendant measures itself against. This
  was hidden by the first (smaller) bug: an initial too-small guessed height (640px) still visually
  "truncated" for the wrong reason, masking that the sizing mechanism was fundamentally non-functional
  until the human explicitly re-tested with genuinely small container sizes and reported "the rail
  always shows completely even in a small container" — the tell that NOTHING about the container size
  was being honored at all. **Fix:** the real, only-correct solution for embedding a component whose
  vendored source uses viewport units is an `<iframe>` — its own independent browsing context has its
  OWN top-level viewport, so `100dvh` measured inside it genuinely equals the iframe's own rendered box
  size (this is literally how real Storybook embeds every story). `OriginRailNavLive.tsx` now mounts a
  React root inside the iframe's own document instead of rendering into a plain div.
  **Lesson for future Limbo occupants:** (1) never trust a doc's simplified formula as exact once the
  real source's measurement code is available to read — verify empirically (bisect the real container
  size and watch for the actual collapse/expand threshold) rather than trusting arithmetic alone; (2)
  before choosing ANY embedding strategy for a vendored component, grep it for `dvh`/`vh`/`vw` viewport
  units — if present, a bounded `<div>` cannot constrain it no matter what height is chosen, and an
  `<iframe>` (or an equivalent separate-browsing-context mechanism) is required, not optional.
- **A component with a real `ResizeObserver`-driven internal calculation must never be mounted twice
  simultaneously with only one instance CSS-hidden at a time** (e.g. a `dark:hidden` / `hidden dark:block`
  pair, the same light/dark toggle pattern used safely for purely static/presentational content
  elsewhere in this project). A hidden (`display:none`) instance's `ResizeObserver` reports a `0x0`
  `contentRect`; making it visible again by toggling a parent class does not reliably re-trigger a
  correct fresh measurement (a real browser `ResizeObserver` quirk around `display:none`<->`block`
  transitions), so the previously-hidden `RailNav` instance can get stuck showing a collapsed "More"
  state even once visible again — reproduced concretely by toggling to dark and back to light, and
  finding light broken even though it had rendered correctly moments before. **Fix, revised:** the
  cleanest solution isn't remounting via a `key` change (an earlier, more complex attempt) — once the
  component is mounted inside its own iframe/React root (see the entry above), a theme change is just a
  normal re-render with a different `ThemeContext` value passed to the SAME already-mounted tree; there
  is no unmount, no `display: none` toggle, and nothing that could ever leave the `ResizeObserver` stuck
  mid-measurement. **Lesson:** the safe dual-CSS-toggle light/dark pattern is only safe for static/
  presentational content — anything with real `ResizeObserver`/`IntersectionObserver`/layout-measuring
  internals should have exactly ONE long-lived mounted instance whose props change on theme flips, never
  two instances toggled via CSS visibility.

- **Per-instance interaction-state rules (tooltip suppression, indicator visibility) are easy for an
  Intake pass to miss entirely, because they only show up when reading a component's actual state
  logic line-by-line, not from its rendered appearance or its docs.** Three real gaps surfaced only
  once a human manually exercised the running `FunctionalRailSidebar.tsx` preview and asked pointed
  questions (starting with "why no tooltip on hover of the logo?"): (1) `LogoSlotDark` always shows a
  hover tooltip, even non-interactively — the built preview had no `Tooltip` wrapper on the logo slot
  at all; (2) `RailButtonDark` explicitly suppresses its hover tooltip once a button is `active` or
  `browsing` (`showTooltip = ... && !isBrowsing && !isActive && !isDisabled`) — the preview showed the
  tooltip unconditionally; (3) `OverflowTriggerButton`'s active-in-overflow dot hides while its own
  menu is open (`active && !open`) — the preview never itemized this sub-component at all, so it never
  got flagged as a divergence in the first place. None of these were in the original ~50-item
  divergence list. **Lesson:** the Intake/Dissection agent's itemized list should explicitly include a
  pass over every stateful sub-component's *conditional* rendering logic (any `showX = ... && !y && !z`
  expression, not just its default/rest-state appearance) — a component can be visually identical to its
  origin counterpart at rest and still diverge the moment a user hovers/selects/opens something. This
  is the same "verify against real source, not appearance/docs" discipline as the earlier `IconPanelLeftContract`
  documentation-drift lesson, just applied to interaction states instead of icon choice. **Also
  surfaced a real anti-pattern to avoid**: the first attempt to suppress the logo/rail-button tooltip
  toggled Radix `Tooltip`'s own `open` prop between `false` and `undefined` per render, which flips the
  component between controlled and uncontrolled and throws a React console warning — the correct fix is
  to conditionally omit the `Tooltip` wrapper entirely for the suppressed state, never to toggle its
  `open` prop. All three gaps are now captured in the divergence list itself (rail-sidebar.ts rows L-1,
  L-2, L-8, and the cross-cutting M-5 caveat) so the eventual real `src/ui/` Build phase — the work that
  actually ships via `dist/` → `site/` → Cloudflare Pages, unlike this local-only `limbo-factory/`
  preview — has the full, itemized, verified behavior contract instead of relying on someone
  re-discovering it by hand a second time.

- **The "Real components only" rule recurred in the actual Rail Sidebar implementation itself, not just
  the factory-line chrome around it — confirming the earlier lesson's warning that one fixed instance is
  never evidence the rest of the codebase is clean.** Prompted by a direct question ("what native
  component are we using for the rail buttons — Button, right?"), a DOM-level check (real `Button`
  instances always carry `data-variant`/`data-size` attributes; nothing else does) confirmed the rail's
  own pinned icon buttons correctly use `Button`, but turned up two real violations once the same check
  was run across the rest of the same files: (1) `FunctionalRailSidebar.tsx`'s `PanelTree` group-toggle
  row (the `CollapsibleTrigger` for "System logic"/"Schedules") was a raw native `<button>` with
  hand-copied hover/focus styling instead of the real `Button`; (2) `FullRailPreview.tsx` still carried
  an entire earlier-generation static mock (`FullRailMock`/`RailBtn`/`PanelRow`/`GroupHeader`, including
  a raw `<button>` and a `<div role="button">`) that had already been fully superseded by
  `RailNavStatusPreview` → `FunctionalRailSidebar` — confirmed genuinely dead (its only export,
  `FullRailPreview`, was never imported anywhere in the app, only referenced in stale comments). **Fix:**
  swapped (1) for the real `Button`; deleted (2) outright rather than leaving it as inert-but-still-rule-
  violating code someone could silently re-wire back in later. **Lesson:** verifying "is this the real
  primitive" by DOM attribute inspection (not just visual comparison) is a fast, reliable check worth
  running proactively on every interactive element in a component under active Build work, not only when
  something looks visually off — and finding one clean instance (the pinned rail buttons) is exactly as
  weak a signal of overall cleanliness as finding one violation was in the earlier factory-line-chrome
  entry above; both call for a full sweep of the actual file(s), not a spot check. Documented in
  rail-sidebar.ts row M-11.

- **Using the real `Button` primitive does not automatically mean a component gets real interaction
  feedback — an inline style or className override can silently cancel it, and that gap is invisible
  unless someone actually hovers/presses the element.** Immediate follow-up to the entry above: once
  confirmed the rail buttons *were* the real `Button`, the next question ("why no hover/press state if
  Button has those states assigned?") exposed that `RailIconButton`'s className carried
  `hover:bg-transparent` — silently overriding `Button`'s own ghost-variant `hover:bg-accent` — with
  nothing substituted in its place, so the rail had zero visible hover or press feedback despite being
  built from the "correct" primitive. Confirmed definitively via `getComputedStyle` in the browser
  (background stayed `rgba(0,0,0,0)` through hover AND mousedown), not just by reading the code. The
  correct dark-rail hover/pressed tokens (B-2/B-4, already approved via Q2) were sitting unused on the
  `RailColors` type the whole time — `colors.hover`/`colors.pressed` were defined and computed but never
  once referenced in the component. The overflow "More" trigger had the identical gap. **Fix:** both
  buttons now track real hover/pressed/open state locally (mirroring origin `RailButtonDark`'s own
  local-state approach, since these are dynamic per-instance token values, not expressible as static
  Tailwind utility classes) and apply the already-approved tokens via inline style; the dead
  `hover:bg-transparent` overrides were removed. **Lesson:** "is this the real component" and "does this
  component actually behave correctly" are two separate checks — confirming the former (DOM attribute
  inspection, per the entry above) says nothing about the latter. Any claim that an interactive element
  has a working hover/press/focus state needs to be verified by actually triggering that state (a
  `getComputedStyle` check, a hover screenshot, or equivalent) rather than inferred from "it's built on
  the right primitive." Documented in rail-sidebar.ts row M-12 (and B-2/B-4, which were marked
  `resolved` at the token/decision level long before the component actually consumed them — a reminder
  that a divergence row being "resolved" only means the *value* was approved, not that Build finished
  wiring it up).

- **A divergence row marked "resolved" at the color-decision level can still turn out wrong once actually
  rendered — human sign-off on a value in isolation is not the same as verifying it in its real
  composited context.** Q2/B-5 had already given `darkBorderStrong` final sign-off (oklch(0.256) light-
  app-mode / oklch(0.254) dark-app-mode), but once the "browsing" ring was actually built and hovered in
  the live preview, a direct question ("the active-state border isn't very visible on the dark surface,
  can you propose something better?") led to measuring it: a lightness delta of only ~0.05/~0.11 against
  the rail surface (oklch(0.205)/oklch(0.145)) — confirmed via `getComputedStyle`, not just eyeballing a
  swatch. Origin's own value (`rgba(255,255,255,0.6)` composited over its dark surface) is considerably
  brighter, meaning the original approved candidate undersold even origin's own apparent intent, not
  just bidezine's. **Handled per protocol**: proposed a revision — oklch(0.708 0 0) for both app modes,
  reusing the already-approved `onDarkSubtle` value (and the base theme's own `--ring`/
  `--muted-foreground` tokens, so still no invented number) — applied it live so it could be judged in
  real context (screenshots taken in both app light/dark mode confirmed a clearly visible ring), then
  asked the human to confirm or pick the bolder oklch(0.922) alternative. The human was unavailable to
  answer, so the candidate was left explicitly `approved: false` (never silently flipped to approved)
  and the affected divergence row (B-5) was reopened from "resolved" back to "decision" rather than left
  displaying a now-known-stale "resolved" badge. **Lesson:** this repo's Color Token Lab already renders
  swatches in isolation for approval, which is exactly why the earlier "isolated swatches are not
  sufficient evidence" lesson (further up this log) exists — this is a second, concrete instance of that
  same risk, this time surfacing only once the token reached its real composited use (a thin inset ring
  on an actual button, not a swatch box) months after the swatch itself was approved. A "resolved" color
  decision should be treated as provisional until it's been seen in its real rendered role, and finding
  it wrong later doesn't mean skip re-opening the divergence row — silently patching the value while
  leaving a stale "resolved" status would hide exactly the kind of regression this log exists to catch.
  Documented in rail-sidebar.ts row M-13 (and B-5, reverted to "decision").

- **Two visually distinct roles sharing one color token is itself a latent regression risk — fixing the
  token for one role can silently break the other.** Immediate follow-up to the entry above: the human
  caught it within the same review pass — "that helped a lot but it changed the divider line making it
  too visible... if this is something the divider line can revert staking with a proper token we can
  revert it, if not we might need to assign a color token for it." `FunctionalRailSidebar.tsx`'s two
  horizontal divider lines (between logo/nav and nav/footer) had been built reusing
  `colors.border`/`darkBorderStrong` — the exact same token as the browsing-state ring — for a
  completely different visual role (a near-invisible hairline vs. a must-be-visible ring). That was
  invisible as a problem for as long as `darkBorderStrong` stayed dim (the whole complaint in the entry
  above); the moment it was correctly brightened for the ring, the divider brightened right along with
  it as an unintended side effect, because nothing had ever separated the two roles. Checked against
  origin (`design-system/src/gallery/RailNav.tsx`) before deciding how to fix it: origin's real rail has
  **no divider line at all** between these groups — it uses flex `gap` for spacing only, and
  `darkBorderStrong` there is used exclusively for the ring/overflow-menu border, never as an internal
  rail divider. So the divider itself is a bidezine-side addition with no origin equivalent, but the
  human's ask was clearly to keep it, just decoupled — not to remove it to match origin exactly. **Fix:**
  gave the divider its own dedicated token (`darkDividerSubtle`, `--sidebar-rail-divider`) rather than
  reverting the ring fix — reusing `darkBorderStrong`'s *original*, already-reviewed value verbatim
  (`oklch(0.256)`/`oklch(0.254)`), now correctly scoped only to the role it was always visually right
  for. **Lesson:** whenever a single color/token is reused across more than one semantically distinct
  UI role, treat that as a design smell worth resolving immediately, not after it causes a regression —
  a token needs one clear job; if two different visual elements happen to want the same numeric value
  today, that's a coincidence to note, not a reason to point them at the same named token, because a
  future correction to one role's requirement (exactly what happened here) will silently drag the other
  role along with it. Documented in rail-sidebar.ts row M-14 (new `--sidebar-rail-divider` token,
  approved — it reuses an already-reviewed value, not a new decision).

- **A "resolved" color decision can be broken by nothing more than an unlucky coincidence with the
  design system's OWN base tokens — not just by a bad choice relative to origin.** Third finding in this
  same short review pass: "when dark mode the rail looks the same color as the background... i dont
  want it to look like the sidebar color but neither as dark as the background." Confirmed via
  `getComputedStyle`: the rail's real rendered surface and the page's own body background resolved to
  the literal identical value, `oklch(0.145 0 0)` — bidezine's dark-theme `--background` — even though
  `darkSurface`/B-1 had already been marked resolved via Q2. This is a different failure mode than the
  earlier border/divider entries above (which were about a value being wrong *relative to its own visual
  role*): here the approved value was accidentally identical to an *unrelated, pre-existing* bidezine
  token it was never meant to reference at all. **The fix search itself surfaced a hard physical
  constraint worth recording**: any replacement value had to stay strictly between `--background`
  (0.145, or it's not distinct) and the already-approved `darkHoverBg` (0.191, or the rest state would
  already read as hovered, inverting the whole hover escalation with nowhere left to go) — which also
  ruled out the tempting shortcut of reusing bidezine's own `--card`/`--sidebar` dark value (0.205, which
  sits *above* `darkHoverBg` and would have inverted things just as badly) — coincidentally the exact
  thing the human separately said not to look like. No existing bidezine achromatic stop falls inside
  that narrow (0.145, 0.191) window, so the fix (`oklch(0.18 0 0)`) is a genuinely new number, same
  precedent as `darkHoverBg`/`darkPressedBg`/`darkActiveBg`/`darkActiveHoverBg` before it. **Lesson:**
  when a rail/organism token family is built to "roughly track" the design system's own base tokens
  (as this dark-rail family explicitly is, per Q2's original mandate), an approved candidate needs to be
  spot-checked against the CURRENT full list of bidezine's own tokens for accidental exact matches, not
  just judged as internally consistent within its own token family — a value can be perfectly reasonable
  in isolation and still collide with something already on the page. Documented in rail-sidebar.ts row
  M-15 (and B-1, reopened from "resolved" back to "decision").

- **A recorded decision can drift from the actual shipped implementation without anyone noticing, until
  a full sweep is done for a different reason.** While closing out the rail's remaining open items after
  the human's overall sign-off ("rail seems right entirely"), G-3's written record said the approved rail
  icon-slot radius was `radius-md`/8px — but `FunctionalRailSidebar.tsx`'s actual rail icon buttons
  (`RailIconButton`, the overflow trigger, the logo slot, the footer buttons) all use Tailwind's
  `rounded-lg` (`radius-lg`, 10px), confirmed by reading the real `className`, not the doc. This is the
  same class of drift as the earlier `IconPanelLeftContract`-vs-stale-QA-doc finding, just between our
  own decision record and our own Build output instead of between origin's docs and origin's code. Since
  the human had just visually approved the rail as currently rendering (10px, not 8px), the fix was to
  correct the RECORD to match the real, reviewed value rather than change working, approved code to match
  a stale note. **Lesson:** a "resolved" divergence row is only trustworthy as long as it's periodically
  re-verified against the actual rendered/shipped code, not just trusted once written — this is the same
  underlying risk raised by the B-1/B-5 color entries above (approvals going stale), just for a layout
  value instead of a color, reinforcing that ANY category of "resolved" record needs occasional spot-
  verification, not only colors. Documented in rail-sidebar.ts row G-3 (corrected in place).

- **Demo content that's always short can hide a real overflow-behavior bug indefinitely — the Intake
  pass's itemized list never covered the panel header's title/subtitle overflow rules at all.** The human
  asked to verify the title's single-line-truncate behavior specifically because they had "no way to see
  this" — every demo section label ("Slides", "Documents", etc.) and the fixed Lorem ipsum subtitle are
  short enough that neither overflow rule had ever actually been exercised, truncated, or wrapped in any
  screenshot taken so far. Verified by temporarily substituting long strings via the DOM and reading
  computed style, not just eyeballing a render: the TITLE was already correct (Tailwind `truncate`, matching
  origin's real `whiteSpace: nowrap; textOverflow: ellipsis`). The SUBTITLE was not — it also used
  `truncate` (single-line), but origin's actual current source (`design-system/src/gallery/RailNav.tsx`)
  wraps its subtitle unbounded (`whiteSpace: normal`, no line cap at all, per that file's own code comment
  documenting a 2026-07-31 change away from single-line truncation). Per explicit instruction, bidezine's
  version was set to wrap up to 3 lines then truncate (`line-clamp-3`) — a deliberate, bounded compromise
  between origin's unbounded wrap and the single-line truncate that had shipped by mistake — confirmed via
  `scrollHeight`/`clientHeight` computed-style evidence (112px of real content clamped to a 48px, 3-line
  box) and a screenshot showing the third line ending in an ellipsis. **Lesson:** an Intake pass needs to
  explicitly test each text-bearing element's overflow/wrap contract with content long enough to actually
  trigger it, not just note its type-scale/color mapping — a component can look completely correct through
  an entire review cycle simply because none of the demo strings were ever long enough to expose a real
  divergence. Documented in rail-sidebar.ts row D-11 (new row — this was never itemized in the original
  divergence list at all, only found once directly asked to verify).

- **The same root-cause bug class repeated twice in a row was the signal to generalize the lesson early,
  rather than wait for this file's own exit condition.** By the time M-19 (rail button sizing) landed,
  M-18 (search icon overlap) had *already* demonstrated the exact same underlying mechanism — a className
  meant to override a bidezine primitive's own built-in shorthand utility class (`px-3`, `size-9`) silently
  losing the compiled-stylesheet cascade tie, even though it looked correct in the source and appeared later
  in the className string. Two independent instances of the identical failure mode, on two different
  primitives (`Input`, `Button`), in the same session, is exactly the pattern this protocol's own preamble
  says to fold into `CLAUDE.md` — but this file's stated exit condition is Rail Sidebar's full promotion,
  which hadn't happened yet. Given the user's explicit request ("we need to prevent this for future sandbox
  components... before reaching the design system"), the fix was elevated directly into `CLAUDE.md`'s new
  "Sandbox/Limbo fidelity" section immediately, rather than staged here and forgotten until an eventual
  exit. **Lesson for the protocol itself:** don't wait for a component's full lifecycle to end before
  promoting a durable lesson that's already been proven twice — the moment a failure class repeats, treat it
  as generalized, not component-specific, and update the standing rules right away. That section now covers
  every recurring failure class hit this session: className-override cascade ties (M-18/M-19), suppressed
  states shipped with no replacement wired in (M-12), hand-rolled markup standing in for a real primitive
  (M-11), color decisions approved as isolated swatches that didn't hold up once composed (M-13/M-14/M-15),
  doc-vs-code drift (Q4, G-3), faithfully-reproduced-but-unflagged origin bugs (M-17), and overflow rules
  never exercised by short demo content (D-11).

- **The core, session-spanning root cause: verification was reactive the entire time, and the formal
  Independent Audit gate never actually ran.** Looking back across the whole Rail Sidebar transformation
  (M-11 through L-13, roughly twenty distinct findings), every single one was caught the same way — a human
  looked at the rendered component, noticed something was visually off, and only then did an AI investigation
  trace it back to a root cause. Not one was caught by an AI-initiated systematic check running *before* the
  work was presented as finished. Meanwhile, this protocol's own Agent Roster has always specified a fourth,
  independent "Audit agent" role whose entire job is exactly this kind of proactive, exhaustive check — and
  it was never invoked, not once, across the entire Build phase. The Build agent (in practice, this session)
  treated "I fixed the specific thing that was pointed out, and it looks right in a screenshot" as equivalent
  to "verified," which let the identical underlying bug CLASS (a className override losing a tailwind-merge
  conflict-group tie to a primitive's own base recipe) recur three separate times — `Input`'s `px-3` (M-18),
  `Button`'s `size-9` (M-19), `Button`'s `has-[>svg]:px-3` (L-12) — before a genuinely exhaustive, scripted
  sweep of every primitive usage in the file ever ran. When that sweep finally did run (prompted by the
  request to refine this very protocol), it found one further real issue in seconds — a dead `hover:bg-
  transparent` on a disabled button, mimicking the M-12 anti-pattern (L-14) — that eighteen prior turns of
  reactive, one-issue-at-a-time fixing had not surfaced, simply because nobody had ever asked about that
  specific button. **Lesson, made concrete rather than left as a platitude:** a new "Primitive Fidelity
  Checklist" has been added to `CLAUDE.md` — a literal, mandatory, step-by-step procedure (className-merge
  verification via `tailwind-merge` run directly, full box-model parity checks via `getComputedStyle`, every
  interactive state simulated live, alignment claims measured via `getBoundingClientRect`, and a full sweep
  after every fix, not just the one instance that prompted it) that the Build agent must run against every
  primitive-touching change BEFORE calling it done, not defer entirely to a Audit phase that may never
  actually be invoked. The Agent Roster table above was updated to make the Audit agent's role a genuine
  *second*, independent check on top of that — not the only check.

- **A second, distinct wave of findings after the "Primitive Fidelity Checklist" was declared complete proved
  the checklist's own blind spot: it only ever covered CSS/style mechanics, never structural/positional
  conventions, data completeness, or a primitive's absence of a named capability.** Prompted directly:
  "we have detected many divergences... we need to refine the protocol... to reduce this to zero," followed
  later by four fresh, unrelated findings in one turn — a chevron on the wrong side (copied from origin's own
  layout, never checked against bidezine's own real chevron conventions), six group nodes silently missing
  the `icon` field origin's own source data always gave them, a scrollbar overlay measured to *negatively*
  overlap content by 4px, and a real shared primitive (`DropdownMenuItem`) with no truncation in its base
  recipe at all. None of the existing 10 checklist items would have caught any of these even if followed
  perfectly — they check className merges, box-model parity, interactive states, alignment measurements, and
  primitive-swap behavior, but nothing about *element ordering conventions*, *field-by-field data porting
  completeness*, or *whether a primitive's base recipe covers a specific named concern at all*. **Lesson for
  the protocol itself, not just this component:** a checklist that catches every instance of a known failure
  *class* can still miss an entirely new *category* of failure, and the fix each time is not "add a synonym of
  an existing item" but "recognize when a finding doesn't fit any existing item, and widen the checklist's own
  scope, not just its item count." Four new items (11–14) were added to `CLAUDE.md`'s Primitive Fidelity
  Checklist covering exactly these categories: cross-checking a ported pattern's structural arrangement
  against bidezine's own other real implementations of the same semantic pattern (not origin's layout by
  default), an exhaustive field-by-field diff when porting any origin data structure, checking a shared
  primitive's base recipe for the specific named concern at hand rather than assuming it's covered, and
  measuring a decorative/overlay element's actual geometric footprint against its neighboring content under
  real interaction. A framing note was added directly above item 1 making this explicit: items 1–10 are
  CSS-mechanics-only, items 11–14 are a second wave covering different failure kinds, and the checklist
  should be expected to keep widening in *kind* whenever a genuinely new category surfaces — not treated as
  complete once a given wave of items has been added.

- **The single most serious finding of this entire protocol run: a whole class of recurring "icon doesn't fill"
  bugs had one real root cause, and every fix for it was verified in an environment that could never have
  caught it.** Prompted by the user's fifth report of this exact symptom, framed explicitly as a systemic risk:
  "this is serious because it shows there is a fundamental issue in the code that keeps breaking this, and we
  run the risk that this issue will pass to deployment for future projects." Rather than patch one more icon,
  investigated the shared mechanism itself (`src/lib/action-icons.tsx`): its `isIconElement()` check has an
  explicit `isActionIcon === true` marker (set on every real generated icon) and a fallback matching
  `.name`/`.displayName` against `endsWith("Icon")` — with the file's own code comment already warning that
  fallback is unsafe under production minification. A hand-rolled icon factory in the Rail Sidebar sandbox
  relied solely on that unsafe fallback. Proved this empirically: built the component for production, confirmed
  the minified bundle contains zero occurrences of the closure's declared name (gone, as the code comment
  predicted) while the `isActionIcon` property-string survives, then served the actual built output and tested
  hover live — every affected icon had **completely stopped filling on hover/select, with zero errors**, while
  a real generated icon in the identical bundle kept working. **This is why the bug kept recurring all session:
  every single fix — including several earlier in this same protocol run — was re-verified only against the
  Vite dev server, where function names survive, so a component-wide regression was shipping invisibly
  underneath passing dev-server checks every time.** Fixed at the source (one static-property assignment,
  mirroring the real generated-icon pipeline exactly) rather than per-icon, and re-verified against an actual
  rebuilt production bundle before calling it done. **Lesson for the protocol, not just this component:** a new,
  15th item was added to `CLAUDE.md`'s Primitive Fidelity Checklist specifically: anything relying on a
  component's runtime name-based identity must be tested against a real production/minified build, not only
  the dev server — this is a distinct verification *environment* gap, not another instance of the checklist's
  existing CSS-mechanics or structural/data categories, and it is exactly the kind of gap capable of shipping a
  silent regression to every future consumer of this design system if left uncaught.

- **The origin quarantine was, for this component's entire run, a claim rather than a fact — and the intake
  record above says so in writing without it being true.** The "Source intake record" entry states of the
  copied origin material: "Nothing here is wired into `src/ui/`, `site/`, or any build step — it exists purely
  for the Intake agent to read." That was accurate for `origin/rail-sidebar/reference/` (2 source files plus
  docs, genuinely read-only). It was **not** accurate for the copy that actually rendered: 17 files / ~6,834
  lines of origin source lived at `sandbox/src/reference/origin-design-system/`, inside the Sandbox app's own
  `src/`, behind its own `@/reference/*` alias, compiled into the app's bundle and executing in the app's JS
  realm. `FullRailPreview.tsx` imported it directly. The material *looked* isolated because
  `OriginRailNavLive.tsx` mounted it into an `about:blank` iframe via `document.write()` — but that separated
  the **DOM** only; the code was never separated at all. **The lesson is about what an isolation mechanism
  actually isolates:** an iframe gives you a separate browsing context, and that is genuinely what RailNav's
  `100dvh` measurement needed, so the mechanism was doing real work and the visible result was correct. It
  simply was not doing the job it was also being credited with. When something is described as quarantined,
  name the specific property claimed (separate DOM? separate CSS cascade? separate JS realm? separate module
  graph?) and check each one, rather than accepting a mechanism that plainly provides *one* of them as
  evidence for all of them. Closed at Sandbox Milestone 5, step 1: the material moved to
  `origin/rail-sidebar/app/`, its own npm + TypeScript project with its own bundle, embedded by
  `<iframe src>` and nothing else, so a crossing import no longer resolves at all;
  `scripts/check-quarantine.mjs` fails the build on any that is reintroduced (proven against three deliberate
  violations: a name-matched import, a relative `../../origin/...` climb into a hypothetical future occupant
  that no name rule knows about, and drift between the two duplicated halves of the embed contract). Proven
  absent from the shipped bundle rather than assumed: 25 string literals that exist only in origin source and
  survive origin's own production build were checked against the Sandbox app's own production bundle — zero
  present. Three earlier apparent hits were false positives that had to be individually traced before the
  result meant anything (`"Clear search"` → `@bidezine/system`'s own `dist`, `"menuitemcheckbox"` → an ARIA
  role string in shared Radix, `"style.transition"` → a doc comment in origin and ordinary property access in
  Radix), which is itself the point: a leak check is only as good as its exclusion of legitimately-shared
  dependencies.

- **A verification passed against the wrong document entirely, for three consecutive checks, with HTTP 200 and
  no error anywhere.** While verifying the above, the live check "an `<aside>` renders inside the origin
  iframe" passed — while the iframe was serving a nested copy of **the Sandbox app itself**. Vite's dev server
  applies its SPA history fallback to a bare directory URL, so `/origin/rail-sidebar/` returned the app's own
  `index.html` instead of the origin page sitting in `public/` at that exact path. The app has an `<aside>`
  too. It surfaced only on dumping the frame's real DOM and noticing Tailwind classes (`bg-card`, `h-screen`)
  that origin — entirely inline-styled — could not have produced. Two durable lessons, folded into
  `CLAUDE.md`'s Primitive Fidelity Checklist item 10 (which already covered the element-level version of this
  failure, but not the document-level one): **(a)** an identity assertion must be two-directional — assert a
  marker only the intended thing can produce AND the absence of a marker only the substitute could produce,
  because any marker generic enough to be worth checking is generic enough for a substitute to satisfy;
  **(b)** prefer an explicit file path over a directory URL whenever a server sits in between, since fallback
  behaviour is precisely the kind of thing that differs silently between dev, preview and production. Fixed by
  spelling out `index.html` in `ORIGIN_EMBED_PATH`, and re-verified 8/8 against **both** the dev server and a
  real `vite preview` production build — the dev-only verification trap of checklist item 15, avoided
  deliberately this time rather than discovered again.

- **A behaviour that legitimately changes as a side effect of a structural fix still has to be re-measured,
  not reasoned about.** Moving origin code inside the frame's own realm made two things different, and only
  live measurement separated "improvement" from "regression". The hand-written `mousemove`/`mouseup` relay in
  the old shim became unnecessary — RailNav's `window.addEventListener` now attaches to the frame's own window
  and receives those events directly — so it was deleted; the panel's drag-resize was then re-tested live and
  still works. Separately, RailNav's resize clamp reads `window.innerWidth`, which used to be the OUTER page's
  width and is now the frame's: at a 372px embed the panel widens to exactly `396 - 54 - 8 - 32 = 302px` and
  shrinks to origin's own `PANEL_MIN_WIDTH` of 240px. A first drag test dragged *outward*, saw 2px of travel,
  and looked like a broken drag; the arithmetic above is what showed it was origin's own clamp working
  correctly against its own viewport — which is also what real Storybook does, since every story renders in an
  iframe. **The old outer-realm behaviour was the unfaithful one.** The lesson: when a fix changes which realm
  a measurement is taken in, enumerate every measurement that realm feeds (here: `100dvh`, `ResizeObserver`,
  `window.innerWidth`, and event listener targets) rather than only the one the task was about.

- **A gate requirement whose JOIN can match nothing is satisfied by having nothing to compare — it passes
  loudly and enforces nothing.** `fn_divergence_unmet`'s `evidence.current` requirement ("this measurement is
  not older than the code it describes") reads `FROM sandbox.divergence d JOIN sandbox.source_file sf ON
  sf.path = d.anchor_file`. `anchor_file` was **NULL on all 155 rows** and `source_file` was empty, so the
  join matched nothing, no unmet row was ever emitted, and the requirement had been **vacuously satisfied for
  every divergence since M1** — through every proof suite, every approval, and every review. It was found only
  incidentally, because M7's invalidation sweep needed the same column and discovered it empty; nothing about
  the gate's own output would ever have revealed it, since a requirement that emits no row looks exactly like a
  requirement that is met. **Lesson for the protocol:** a proof suite that only checks "does the gate refuse
  when it should" is half a suite. For every requirement expressed as `NOT EXISTS` over a join, there must also
  be a check that the requirement can *fire at all* — construct the failing case deliberately and watch the
  unmet row appear. Absence of a complaint is not evidence of compliance, and this is the database-layer
  version of the same trap checklist item 3 records for CSS states ("never conclude a state works because the
  class exists in the source").

- **A test fixture with realistic data can quietly mutate the very corpus it sits beside, and its own green
  result is what hides it.** `db/verify-system-change.mjs` reported **17/17** while every run silently marked
  all 40 real Rail Sidebar evidence rows stale: two of its fixtures carried plausible `affected_paths`
  (`src/ui/**`, `src/lib/**`) and one of them *lands* mid-suite, which fires the real invalidation sweep
  against real rows that genuinely depend on those paths. The suite was measuring correct behaviour and
  causing damage with the same action. Caught only by reading the sweep's own reported counts
  (`swept_divergences: 8` when the fixture owns exactly one divergence) rather than the pass/fail line. Fixed
  by pointing both fixtures at `__fixture__/` paths nothing real depends on, and by asserting the corpus is
  untouched afterwards (40 rows, 0 stale). **Lesson for the protocol:** any suite that exercises a
  cross-cutting mechanism — a sweep, a cascade, a bulk update — must use inputs that provably match **nothing
  real**, and must verify the surrounding data is unchanged when it finishes. Realistic fixture values are a
  liability precisely where the mechanism under test is designed to reach broadly; "it looks like real data" is
  the property that makes it dangerous, not the property that makes it a good test.

- **Restoring a measurement does not restore the judgement built on it, and a batch re-verification that
  reports only its own pass count will read as finished when it is not.** After M7's `--stale` batch re-ran
  every affected Rail Sidebar divergence (13/13 passing, fresh non-stale evidence written), **all seven were
  still refused by the gate** — six on `review.present`, and F-3 on `review.citations_support`, naming
  evidence `#129` which is stale. That last one is structural rather than incidental: a review citation points
  at a specific `evidence_id`, and a fresh measurement is always a *new* row, so no amount of re-running can
  ever clear it — a human has to re-review. This is correct (a system change invalidated the measurement the
  judgement rested on) but it is invisible unless the command says so. `run-checks.mjs --stale` therefore
  re-reads `fn_divergence_unmet` for every row it touched and prints CLEAR/UNMET per divergence, and exits
  non-zero if any stale row had no check spec to re-run at all. **Lesson for the protocol:** any bulk
  remediation step must report against the *gate*, not against its own internal success rate, and must name
  the portion of its own work it could not perform — otherwise "13/13 passed" is an honest sentence that
  produces a false impression, which is the exact failure mode this whole protocol exists to prevent.

## Exit condition

Once Rail Sidebar is promoted into `src/ui/` and registered in the real showcase, and the human has given
final sign-off: fold any durable process refinements into `CLAUDE.md`, then delete this file. (Note: the
"Sandbox/Limbo fidelity" section and the "Primitive Fidelity Checklist" were both already folded into
`CLAUDE.md` ahead of that exit condition — see the flaws-log entries above — because the underlying failure
classes had already repeated multiple times within this one transformation and the user explicitly asked for
the protocol itself to be refined before continuing. Any further NEW failure classes discovered before Rail
Sidebar's own exit should still be logged here first, then folded in the same way once repetition (or
explicit urgency) warrants it.)
