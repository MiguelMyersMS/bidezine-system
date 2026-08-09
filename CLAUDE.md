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
| `limbo/` | Holding area for components being ported from a foreign design system. Each occupant lives here until it passes the full Limbo protocol and is promoted into `src/ui/`. See `LIMBO-PROTOCOL-LOG.md` for the gate sequence. |
| `limbo-factory/` | Dedicated local dev environment (port 4199) for the active Limbo transformation. Built entirely from real `@bidezine/system` components. Never merged into `dist/` or shipped to consumers. |

## Rules that matter

**No hand-rolled components, ever.** If a real `@bidezine/system` component exists for what you're
building — a badge, a button, a checkbox, a card, anything — import and use it. Never approximate its
look with a raw `<span>`/`<div>`/`<button>` styled with matching Tailwind classes. A hand-rolled
approximation *will* drift from the real component's actual recipe (missing flex/centering rules, missing
focus/aria states, missing disabled handling) in ways that are invisible in code review and only become
obvious once a human looks at the rendered result. This applies everywhere in this repo, including
tooling/dev apps like `limbo-factory/` — not just `site/` and `src/ui/` consumers. This is the direct,
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

## Verify by render, not by number

A value can compute correctly and still not appear. Check the rendered result, not just the property.
This has caught more real defects here than any amount of reading.

## Sandbox/Limbo fidelity — preventing contamination before promotion

A component built in a sandbox (`limbo-factory/`, or any future Limbo occupant) can look completely correct
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
temporary working log) so it protects every future Limbo occupant, not just the one that exposed it.

## Primitive Fidelity Checklist — mandatory, run proactively, not on request

Every failure class documented above was caught the same way: a human looked at the rendered result and
noticed something was off, then an AI investigation traced it back afterward. Not one was caught by the AI
running its own systematic check *before* presenting work as finished — including the formal "Independent
Audit" gate the Limbo protocol itself defines, which sat un-run for the component's entire Build phase while
over a dozen of these bugs accumulated underneath it. Reactive verification (checking only what a human
happens to ask about) cannot reach zero; only an exhaustive, repeatable procedure run on every primitive
usage can. This checklist exists to make that procedure concrete instead of aspirational.

**Run every item below for every real primitive usage you touch, before calling any change "done" — not
just the property the current task happens to mention:**

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

## Three machines, one branch

Laptop A, Laptop B, and a PC all work `main` directly. `origin` is the only source of truth — unpushed
work does not travel.

**Pull when you sit down · push when you get up · commit small and often.**
Work room-by-room: one person per file.

## Attribution

shadcn/ui and Radix are MIT-licensed. `THIRD-PARTY-LICENSES.md` stays. We may license our own work as we
choose; the third-party notice covers their portions.
