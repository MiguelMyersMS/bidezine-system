# Theme & Surfaces — Light/Dark and Atom/Dark-Atom

> The logic behind the two Storybook toolbar switches (**Theme** and **Surface**) and how
> components render on light vs dark. Written 2026-06-25 from the code; keep in sync as the
> model is refined. Source of truth: `src/tokens.ts`, `src/theme.ts`, `.storybook/preview.tsx`,
> `src/gallery/storyTheme.ts`.

## TL;DR

There are **two independent axes**, controlled by two separate toolbar switches:

| Axis | Toolbar | Values | What it changes |
|------|---------|--------|-----------------|
| **Theme** | "Theme" | light · dark | The whole app's `TokenSet` via `ThemeContext` (`TOKENS_LIGHT` ↔ `TOKENS_DARK`) |
| **Surface** | "Surface" | atom · darkAtom | For ONE component shown in isolation: whether it sits on a normal surface or a **permanently-dark** surface (like the rail), by overriding surface tokens |

They are orthogonal. "Dark theme" ≠ "Dark Atom". Theme is app-wide; Surface is a per-component
viewing context for atoms/molecules that can live on a dark chrome surface.

## 1. Theme axis (light/dark)

- `ThemeContext` (`src/theme.ts`) holds a `TokenSet`. Components read it with `useTokens()`.
- The app wraps its root in `<ThemeContext.Provider value={dark ? TOKENS_DARK : TOKENS_LIGHT}>`.
- A normal, theme-adaptive component just uses `useTokens()` — it looks correct in either theme
  because every color comes from the active token set. **Never hard-code a hex or a fixed
  `TOKENS_LIGHT.*`** in a theme-adaptive component.

## 2. Surface axis (atom/darkAtom)

Some components live on a **permanently dark surface** regardless of the app theme — the nav rail,
dark overlays, dark cards. The "Surface" switch previews a component there **without** switching the
whole theme. It works by overriding the surface-related tokens to the dark-surface family.

`.storybook/preview.tsx` applies this override when `atomSurface === "darkAtom"` (for `Atoms/*`
stories automatically, or any story with `parameters.useAtomSurfaceGlobals = true`):

| Semantic token | overridden to (dark-surface family) |
|----------------|-------------------------------------|
| `ink` | `onDark` (white) |
| `textMuted` / `textSubtle` / `textDisabled` / `iconDisabled` | `onDarkMuted` / `onDarkSubtle` / `onDarkDisabled` |
| `bg` / `surface` | `darkSurface` |
| `bgSubtle` / `hoverBg` | `darkHoverBg` |
| `activeBg` / `bgStrong` | `darkActiveBg` |
| `hairline` | `onDarkDisabled` |
| `border` / `borderStrong` | `darkBorder` / `darkBorderStrong` |

### The two dark-surface token families (`src/tokens.ts`)

- **`onDark*`** — *foreground* on a permanently-dark surface, white-based:
  `onDark` (100%), `onDarkMuted` (70%), `onDarkSubtle` (50%), `onDarkFaint` (40%), `onDarkDisabled` (20%).
- **`dark*`** — *surface & interaction* fills: `darkSurface`, `darkHoverBg` (white 10%),
  `darkActiveBg` (white 20%), `darkPressedBg` (white 15%), `darkHairline`, `darkBorder`,
  `darkBorderStrong`.

## 3. The three ways a component renders dark — and when to use each

| # | Mode | Mechanism | Use for |
|---|------|-----------|---------|
| 1 | **Theme-dark** | the whole app is under `TOKENS_DARK`; component reads `useTokens()` | any normal component when the app theme is dark |
| 2 | **darkAtom surface** | the SAME component, surface tokens overridden (Surface switch) | atoms/molecules that can appear on dark chrome; component must read tokens, not hard-code colors |
| 3 | **purpose-built `*Dark`** | a named wrapper that renders the base with `variant="atomDark"` (or hard-binds dark tokens) | components that live PERMANENTLY on a dark surface (rail) — `AccordionHeaderDark`, `MenuItemDark`, `DarkPillButton` |

`MenuItemDark` is the canonical example of #3 — it is literally:

```tsx
<MenuItem variant="atomDark" ... />
```

So a "dark pair" is **not a second implementation** — it's the same component on the dark surface,
exposed under a named component for ergonomics. The base component carries a `variant: "atom" | "atomDark"`.

## 4. How a story opts into the Surface switch

The `atomSurface` global is a toolbar control that is **always visible**, but it only *affects* a story when:

- the story is under `Atoms/*` (automatic), **or**
- the story sets `parameters: { useAtomSurfaceGlobals: true }` and reads
  `getStoryAtomSurface(context.globals.atomSurface)` to pick the variant/tokens (see `MenuItem.stories.tsx`).

Helpers live in `src/gallery/storyTheme.ts` (`getStoryAtomSurface`, `getStoryThemeTokens`,
`getStoryThemeMode`); `audit-components.js` enforces that stories normalize globals through them
(`STORY.THEME-HELPER-BYPASS`).

## 5. The pairing rule (for molecules)

> **A molecule should opt into the Surface switch ONLY if it has a dark pair** (a `variant="atomDark"`
> / `*Dark` view). Molecules without a dark pair must NOT set `useAtomSurfaceGlobals` — toggling the
> Surface switch on them would do nothing meaningful.

Today, among molecules only **`MenuItem`** opts in (it has `MenuItemDark`). All other molecules
correctly ignore the switch. (The toolbar *button* is still globally visible but inert for them; hiding
it per-story is an optional future nicety.)

## 6. Verifying dark surfaces

`npm run audit:atoms:dark-visual` (`scripts/audit-dark-atoms-visual.mjs`, see
`docs/atomic/PROTOCOL.md` § "Dark Atom Surface Gate") captures each atom under the
`theme × surface` combinations and asserts:

- `atom` actually responds to the **theme** (light vs dark differ) — catches hard-bound light tokens.
- `darkAtom` is **stable across themes** (it's a fixed dark-family surface contract).
- `atom` and `darkAtom` are **visually different** — catches a component that ignores the surface override.

A component that hard-codes colors (instead of reading `useTokens()`) fails this gate.
