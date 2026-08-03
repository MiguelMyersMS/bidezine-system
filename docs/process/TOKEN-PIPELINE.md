# Token Pipeline (v2)

**Status:** Active · **Decided:** 2026-08-02 by Miguel (Laptop A) during the golden-path slice.
**Implements:** the "NEW — token pipeline" protocol in `SHADCN-V2-FOUNDATION-HANDOFF.md` §11.
**Extends:** ADR-001 (DTCG 2025.10) · **Under:** ADR-006 (shadcn foundation).

## The shape of it

```text
tokens/*.tokens.json      ← THE SOURCE. Hand-edited. DTCG 2025.10.
        │
        │  npm run tokens   (scripts/build-tokens.mjs)
        ▼
src/styles/tokens.css     ← GENERATED. :root + .dark custom properties (runtime)
src/tokens.ts             ← GENERATED. Typed names + var() refs (authoring)
        │
        │  @theme inline mapping in src/styles/system.css
        ▼
Tailwind utilities        ← bg-background, text-muted-foreground, border-border …
```

`npm run build` runs `npm run tokens` first (via `prebuild`), so the generated files
can never lag the source.

**Two hard rules:**

1. **Never hand-edit `src/styles/tokens.css` or `src/tokens.ts`.** They carry a
   generated banner. Edits are overwritten on the next build.
2. **Never add a CSS custom property directly to a stylesheet.** It would exist at
   runtime but not in the typed surface, and the two would drift silently.

## Parity gate

`light.tokens.json` and `dark.tokens.json` must declare **exactly the same token
names**. The emitter fails the build (exit 1) on any mismatch, naming the offender.

Rationale: a token defined in one mode only doesn't error at runtime — it silently
inherits whatever ancestor value is in scope, producing a component that looks
correct in one theme and subtly wrong in the other. That is the single hardest class
of theming bug to spot by eye, so it is a build failure instead.

## The naming contract

**We author against shadcn's vocabulary** (`background`, `foreground`, `primary`,
`muted-foreground`, `border`, `input`, `ring`, `destructive`, `radius`, …).

Why: those names are the *contract* borrowed Radix behaviour is written against.
Keeping them means a component pulled from `reference/shadcn-ui/` compiles unmodified
and we only have to review its **behaviour** — which is the thing we actually want
from it. Renaming on the way in would mean editing every class string of all 63
components, which is 63 chances to introduce a styling bug while doing a behavioural
port.

**The values are ours.** Names borrowed, values authored — that is the whole point of
the token indirection. Today the values are still shadcn's neutral seed; Phase 4
(re-skin) replaces them. Because every component resolves through `@theme inline` →
our custom properties, **re-skinning is an edit to `tokens/*.tokens.json` alone.** No
component churn.

## Adding a token (the demand-driven rule)

We deliberately started with shadcn's core set and **nothing else** — no chart,
sidebar, or surface tokens for components that don't exist yet. Tokens are added
**when a shipping component needs one**, never in bulk and never speculatively.

When you hit a distinction the current set can't express:

1. **Confirm it's real.** A new token is justified only when two things must be able
   to differ *independently*. "It happens to be a different colour right now" is not
   enough — that's a value, not a token.
2. **Add it to `tokens/*.tokens.json`** — all modes, or the parity gate fails. Never
   to the CSS.
3. **Follow shadcn's own extension shape**: kebab-case, `--thing` paired with
   `--thing-foreground` where a foreground is implied. (They did exactly this
   themselves with `--surface`, `--code`, `--selection`, `--sidebar-*`.) No new
   prefix namespace.
4. **If the old design system already named that distinction, reuse its name.**
   `hairline`, not `border-faint`. The ~90 components and specs in `../design-system`
   are our reference library; matching their vocabulary keeps those specs readable as
   documentation instead of requiring a translation table.
5. **Map it in `@theme inline`** in `src/styles/system.css` if it should produce a
   Tailwind utility.

### Exception: migrating an established scale from v1

*(Added 2026-08-03, resolving the contradiction raised at `docs/components/dialog/07-risks.md` G-3.)*

The demand-driven rule above governs tokens **we invent**. It does not govern **scales v1 already
designed and proved in a shipped application** — spacing, typography, radius, z-index, motion,
elevation and breakpoints in `../design-system/src/{layout,tokens,status}.ts`.

Those may be adopted **whole**, in one move, because:

- they are **not speculative** — the risk the rule guards against is inventing tokens nobody needs, and
  a scale that has been carrying a real product for a year is the opposite of speculative;
- a scale adopted **piecemeal is worse than one adopted whole.** Taking three steps of a ramp because
  three components happened to need them produces a ramp with holes, and the holes get filled later by
  whoever hits them first — which is exactly the ad-hoc drift the rule exists to prevent;
- the alternative is re-deriving, component by component, a system that already exists.

**The rule that still binds:** a value that exists in *neither* v1 nor the component being built is an
invention, and invention still requires a shipping component to demand it. Adoption is not a licence to
round out a v1 scale with steps v1 never had.

Every adopted scale records **where it came from** in `docs/DECISION_LOG.md`, so a later reader can tell
a migrated decision from a new one.

### Why the rule exists

Without it, the first time a component needs a distinction shadcn's vocabulary lacks,
there are three exits and you take a different one each time:

- **Overload** an existing token — the two can never differ again, and the day they
  must, it's a find-replace across everything built so far.
- **Inline a raw value** (`border-[#d9d9e0]`) — a value escapes the token system
  entirely and no longer responds to theming.
- **Add a var ad hoc** — fine, but with no convention the names drift (`--hairline`
  here, `--border-faint` there, `--divider` next month).

`../design-system/src/tokens.ts` is the evidence. It is 391 lines in which the
semantic tokens carry paragraph-long comments explaining surface-aware splits
(`focusOverlay`, `triggerHoverBg`, `carouselPillBg`, `calendarBandBg`) that each had
to be **retrofitted** into a vocabulary that hadn't planned for them. That file is not
an argument for front-loading tokens. It is an argument for having a stated shape a
new token takes when you add one.

### Known extensions we will need

Not added yet — listed so that when they arrive they arrive by the rule above, not by
improvisation. The old DS's **permanently-dark-surface** family (the rail: `RailNav`,
`RailButton`, `RailMenu`, and the `onDark*` scale) has **no equivalent in shadcn's
vocabulary at all** — shadcn has no concept of a dark surface living inside a light
theme. Those are group-B differentiators in `docs/reference/REFERENCE-MAP.md` and will
need genuinely new tokens when the rail is built.

## Tailwind source scanning — a standing trap

`reference/shadcn-ui/` is **committed**, not git-ignored. Tailwind v4's automatic
source detection only skips git-ignored paths, so left alone it would scan the entire
vendored shadcn repo and compile every utility *they* use into *our* stylesheet —
shipping their look inside our package.

`src/styles/system.css` therefore uses `@import "tailwindcss" source(none);` plus an
explicit `@source "../**/*.{ts,tsx}"`. **Do not remove either.** If you ever add a new
source root, add it explicitly rather than re-enabling auto-detection.
