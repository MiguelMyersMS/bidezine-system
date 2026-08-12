# Color Token Import Guide

**Purpose:** a reusable, durable reference for how to map colors when bringing a component in from a
*different* design system (via the [Sandbox protocol](/SANDBOX-PROTOCOL-LOG.md)) into `@bidezine/system`'s
own tokens. Written after the Rail Sidebar occupant's Color Token Lab work, so the next occupant doesn't
have to rediscover this from scratch. Unlike `SANDBOX-PROTOCOL-LOG.md`, **this file is permanent** — update
it, don't delete it, as new cases are learned.

## The two source-of-truth files

- [`tokens/light.tokens.json`](/tokens/light.tokens.json) / [`tokens/dark.tokens.json`](/tokens/dark.tokens.json)
  — bidezine's real, currently-shipping semantic color tokens: primarily shadcn/ui's own unmodified
  values, plus a small number of bidezine Adjustments layered in alongside them (e.g. `success`/`warning`/
  `info`, added for Badge's status variants — each explicitly marked as such via its own `$description`).
  Every color used anywhere in `@bidezine/system` traces back to one of these.
- [`scripts/lib/color.mjs`](/scripts/lib/color.mjs) — the conversion utility. Use it, don't hand-convert.

## Step 1 — Identify what color space the values need to end up in

bidezine's **default theme** (`tokens/light.tokens.json` / `tokens/dark.tokens.json`) is authored entirely
in `oklch()`. This is what every new token candidate should target — not hex, not hsl, not rgba.

(The three alternate named presets in `tokens/themes/` — `daylight`, `emerald`, `midnight` — use `hsl()`
instead, because those are shadcn's own presets vendored unmodified in that format. They are a separate
concern; a Sandbox occupant's new tokens don't need `hsl` equivalents unless the presets themselves are
being extended.)

## Step 2 — Converting values, in whichever direction you have

`scripts/lib/color.mjs` has both directions:

| You have | You need | Function |
|---|---|---|
| A hex string (from the origin's source, or from the human's own pick/eyedrop) | `oklch()` | `hexToOklch(hex, precision = 3)` → `{ L, C, H, css }` |
| An existing bidezine `oklch()` value | sRGB / hex (e.g. for Figma) | `oklchToSrgb(L, C, H)` + `toHex(...)` |

Figma has **no OKLCH color mode** (only Hex/RGB/CSS/HSL/HSB — confirmed directly in Figma's own color
picker), and the Figma Variables API only accepts sRGB. So:
- If the human is exploring colors **in Figma**, they must pick/read Hex (or HSL/RGB) there, then hand you
  the hex — you convert with `hexToOklch`.
- If you're pushing bidezine tokens **into** Figma (`scripts/figma-variables.mjs`), the conversion runs the
  other way automatically — see that script's `colorValue()`.

Quick one-liner pattern for converting a batch of human-supplied hex values:

```js
import('./scripts/lib/color.mjs').then(({ hexToOklch }) => {
  console.log(hexToOklch('#2E2E2E').css) // -> oklch(0.301 0 0)
})
```

## Step 3 — Two legitimate strategies for a new token's *value* (not just its format)

Once you know a token needs a new bidezine-side value, there are two different ways to source that value
— both valid, use whichever fits the situation:

1. **Reuse one of bidezine's own existing achromatic lightness stops.** Most of bidezine's dark/light
   semantic tokens are already on a shared, small set of `L` values (see the cheat sheet below) — reusing
   one keeps a new token's "step" consistent with tokens that already exist, rather than introducing an
   arbitrary new lightness value that only this one token uses.
2. **Convert a human-supplied hex value directly.** When the human has a specific color they want (e.g.
   eyedropped from a reference screenshot, or a deliberate brand choice), convert it verbatim with
   `hexToOklch` — don't round it to the nearest existing stop unless asked to.

Either way: **never hand-write an oklch/hex value from guessing or "close enough" memory.** Every value
must trace to a real source — the origin's actual code, the human's actual hex pick, or an actual existing
bidezine token — never invented or approximated by the AI.

**Worked example — bidezine's own `success`/`warning`/`info` Badge tokens** (`tokens/light.tokens.json` /
`tokens/dark.tokens.json`, first shipped alongside `src/ui/badge.tsx`'s status-variant Adjustment): these
are a third case, distinct from both options above — a genuinely new *semantic concept* bidezine's own
token set didn't have (positive/caution/informational status), authored fresh in OKLCH and verified for
WCAG AA contrast (4.5:1+) against white text, rather than reused from an existing stop or converted from a
human-supplied hex. See `src/ui/badge.tsx`'s own doc comment for the full contrast numbers and rationale —
referenced here as the canonical example of "add a wholly new semantic color, from scratch, without
contaminating from another design system's literal values."

### bidezine's own achromatic (grayscale) lightness stops, for reuse

| Token | Light `L` | Dark `L` |
|---|---|---|
| `background` / `foreground` | 1 / 0 | 0.145 / 0.985 |
| `card`, `popover` | 1 | 0.205 |
| `primary` | 0 | 0.922 |
| `primary-foreground` | 0.985 | 0.205 |
| `secondary`, `muted`, `accent` | 0.97 | 0.269 (secondary/muted) / 0.371 (accent) |
| `muted-foreground` | 0.556 | 0.708 |
| `accent-foreground`, `secondary-foreground` | 0.205 | 0.985 |
| `ring` | 0.708 | 0.556 |
| `border`, `input` | 0.922 (solid) | white @ 10%/15% alpha (see below) |

All have `C = 0, H = 0` (or an arbitrary hue placeholder like `89.876°`, since hue is mathematically
meaningless when chroma is 0 — don't be alarmed by a nonzero-looking `H` on an achromatic value).

### The `border`/`input` alpha-overlay pattern

bidezine's dark-mode `border` and `input` are **not solid colors** — they're `white` at low alpha
(`oklch(1 0 0 / 0.1)` and `/ 0.15` respectively), meant to sit over whatever surface is behind them. This
is shadcn's own convention. If a Sandbox occupant needs a "visible border" token and you're tempted to reuse
`--border` directly, check first whether it's strong enough against the occupant's specific surface — it
may not be (see the flattening technique below).

**Flattening an alpha overlay to a solid value**, when a candidate token needs to be a fixed solid (e.g.
to keep a token family internally consistent), and you want to know exactly what a real overlay renders as
in practice: convert both colors to sRGB, alpha-blend, convert back:

```js
import('./scripts/lib/color.mjs').then(({ oklchToSrgb, srgbToOklch }) => {
  function blend(fg, bg, alpha) {
    return { r: fg.r*alpha + bg.r*(1-alpha), g: fg.g*alpha + bg.g*(1-alpha), b: fg.b*alpha + bg.b*(1-alpha) }
  }
  const surface = oklchToSrgb(0.145, 0, 0)      // whatever the real surface is
  const white   = { r: 1, g: 1, b: 1 }
  const flattened = blend(white, surface, 0.10)  // 10% white overlay
  console.log(srgbToOklch(flattened.r, flattened.g, flattened.b))
})
```

## Step 4 — Never approve from an isolated swatch alone

A hard lesson from Rail Sidebar (logged in full in `SANDBOX-PROTOCOL-LOG.md`): a grid of individual color
swatches **cannot** surface real problems that only appear when colors sit next to each other in the
actual composed UI — e.g. two states becoming visually indistinguishable, or a border disappearing into an
adjacent surface. Always build a small, real-DOM, interactive composed preview (not simulated) alongside
the swatch lab, and get sign-off against *that*, not the swatches alone.

When a human supplies their own hex-based revisions to a candidate token set, run the numbers before
applying them — check the resulting hierarchy/ordering (e.g. hover < pressed < active lightness) makes
sense, and flag anything that looks like it inverts an established convention or collapses two states into
one. The human may still choose to proceed anyway, but they should get to make that call with the numbers
in front of them, not discover it after the fact.

## Step 5 — Every UI surface used to *display* this process must itself be real components

This one isn't about token values, but is closely related and easy to get wrong while building a factory
line / comparison tool: **any UI you build to host this process must be composed entirely from real
`@bidezine/system` components** (`Badge`, `Button`, `Checkbox`, `Card`, etc.), not hand-rolled
`<span>`/`<div>`/`<button>` elements with inline Tailwind classes that approximate a component's look. This
is now a repo-wide rule stated in `CLAUDE.md`, not a Limbo-only convention — treat it as absolute.

A hand-rolled approximation will drift from the real component's actual recipe (missing `inline-flex
items-center justify-center`, missing focus/aria states, missing disabled handling, etc.) in ways that
range from **visually broken** (a Badge missing centering — obvious the moment someone looks at a
screenshot) to **merely duplicated and still looking fine** (a nav button or checkbox that LGTMs visually
but is a silent maintenance-drift risk, since it doesn't track the real component if that component's
recipe changes later). The second kind is much easier to miss — a render/screenshot check alone won't catch
it, because it looks correct. Finding one hand-rolled violation should always trigger a deliberate code
read of the rest of the same app for the same pattern (grep for raw `<span`/`<div`/`<button` carrying
component-shaped Tailwind classes like `rounded-full`, `border`, hover/active variants), not just a
fix-and-move-on for the one instance found. If a real component already exists for what you're building,
import and use it — don't re-derive its styling by hand, even partially.

## Precision convention

Write oklch values at 3 decimal places (e.g. `oklch(0.301 0 0)`), matching the precision already used
throughout `tokens/*.tokens.json`.
