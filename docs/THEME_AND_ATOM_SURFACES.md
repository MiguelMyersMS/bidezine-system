# Theme and Atom Surface Modes

This page explains the two Storybook toolbar switches that affect how atoms and related components render:

- `Theme`: `Light` or `Dark`
- `Surface`: `Atom` or `Dark Atom`

These switches are intentionally separate. `Dark theme` and `Dark Atom` are not the same thing.

## Figma Family Naming

In Figma, dark-surface component families are separate groups such as:

- `AtomsDark`
- `MoleculesDark`
- `OrganismsDark`

Dark-surface components use the same base name as their counterpart with a `Dark` suffix.

Examples:

- `MenuItem` / `MenuItemDark`
- `ClearButton` / `ClearButtonDark`
- `SelectionIndicator` / `SelectionIndicatorDark`

The relationship is not always one-to-one:

- A component can have both a normal version and a dark version.
- A component can have only a normal version and no dark version.
- A component can have only a dark version and no normal counterpart.

So `Dark` suffix means "this component belongs to the fixed dark-surface family." It does not necessarily mean "this is merely the dark theme rendering of the normal component."

## Mental Model

`Theme` controls the app-level token set.

`Surface` controls the atom family being previewed.

| Storybook control | Values | Meaning |
|---|---|---|
| Native toolbar `Theme` | `Light`, `Dark` | Chooses the app theme tokens: `TOKENS_LIGHT` or `TOKENS_DARK`. |
| Canvas `Surface` switch | `Atom`, `Dark Atom` | Chooses whether component stories render as normal theme-aware components or fixed dark-surface components. Only supported options are shown. |

## Storybook Control Contract

### Theme is mandatory for every element

Every Storybook element must support the `Theme` switch.

This applies to all levels:

- Atoms
- Molecules
- Organisms
- Any future composed/view-level gallery surfaces

There are no exceptions. Every element must be reviewable in:

- `Theme = Light`
- `Theme = Dark`

This is required even when the component itself is a fixed dark-surface component. In that case, the component should remain visually dark while the surrounding app/canvas theme changes.

### Surface is conditional by family availability

Every eligible story should expose the `Surface` switch, but the available options depend on which Figma/code families exist for that element.

| Available Figma/code families | Storybook `Surface` behavior |
|---|---|
| Normal component exists and dark component exists | Enable both `Atom` and `Dark Atom`. |
| Normal component exists, no dark component exists | Enable `Atom`; disable `Dark Atom`. |
| Dark component exists, no normal component exists | Enable `Dark Atom`; disable `Atom`. |

Examples:

| Element situation | Expected Storybook surface options |
|---|---|
| `MenuItem` and `MenuItemDark` both exist | `Atom` and `Dark Atom` enabled. |
| Component only exists in `Atoms` / normal family | `Atom` enabled, `Dark Atom` disabled. |
| Component only exists in `AtomsDark` / dark family | `Dark Atom` enabled, `Atom` disabled. |

Current Storybook implementation note: Storybook's native toolbar options are global/static, so the surface family selector is implemented as a small canvas switch in `.storybook/preview.tsx`. It renders only the supported options for the current story.

### Naming rule

The `Surface` switch represents Figma family availability, not only theme rendering.

- `Atom` maps to the normal family (`Atoms`, `Molecules`, `Organisms`, etc.).
- `Dark Atom` maps to the dark-surface family (`AtomsDark`, `MoleculesDark`, `OrganismsDark`, etc.).

For molecule or organism stories, the label may still appear as `Surface = Atom / Dark Atom` in Storybook, but conceptually it means normal family vs dark-surface family.

## Atom

`Surface = Atom` means the component follows the live `ThemeContext`.

In this mode, the component reads tokens with `useTokens()` and allows the active app theme to control contrast:

- In `Theme = Light`, atom tokens resolve to the light token family.
- In `Theme = Dark`, atom tokens resolve to the dark token family.

This can create a large visual contrast change between light and dark modes. That is expected.

Example:

```tsx
const tokens = useTokens();

return (
  <button
    style={{
      background: tokens.surface,
      color: tokens.ink,
      border: `1px solid ${tokens.hairline}`,
    }}
  />
);
```

In `Surface = Atom`, do not hard-bind `TOKENS_LIGHT` or `TOKENS_DARK`. The component must read the live `ThemeContext`.

## Dark Atom

`Surface = Dark Atom` means the component renders as part of the fixed dark-surface atom family.

Dark atoms stay visually dark in both app themes. Their background remains dark, and foreground content stays bright/readable.

This is used for atoms that live on dark surfaces such as:

- Rail controls
- Dark sidebar elements
- Dark menus
- Dark icon/action controls

The same concept can apply above atoms. For example, a molecule may have a `MoleculesDark` Figma source and a `Dark`-suffixed counterpart such as `MenuItemDark`.

In Storybook, `Dark Atom` remaps semantic tokens onto the dark-surface token family:

| Normal semantic role | Dark Atom mapping |
|---|---|
| `ink` | `onDark` |
| `textMuted` | `onDarkMuted` |
| `textSubtle` | `onDarkSubtle` |
| `textDisabled` | `onDarkDisabled` |
| `surface` | `darkSurface` |
| `hoverBg` | `darkHoverBg` |
| `activeBg` | `darkActiveBg` |
| `border` | `darkBorder` |
| `borderStrong` | `darkBorderStrong` |

The visual may still shift slightly between `Theme = Light` and `Theme = Dark` because the active app theme can influence surrounding canvas tokens, but the atom itself remains in the dark-surface family.

### Dark-atom content overrides must be theme-invariant

Every token the `Dark Atom` remap overrides for **content the atom renders on its own dark surface** must resolve to a value that is the SAME in both `Theme = Light` and `Theme = Dark`. The dark-surface tokens (`onDark`, `onDarkMuted`, `darkSurface`, `darkHoverBg`, …) satisfy this by construction — they are defined identically in `TOKENS_LIGHT` and `TOKENS_DARK`. A remap override must **not reach for a base theme token that flips** (e.g. `ink`, which is `#1c2024` in light but `#edeef0` in dark).

Violating this breaks the `Dark Atom + Dark` combination specifically: the override silently resolves to the dark-theme value and the content becomes unreadable on the fixed dark surface. Concrete incident: `onSelected` (the content on a selected fill) was set to the active `tokens.ink`; in `Theme = Dark` it resolved to `#edeef0` (near-white) and the selected label washed out on its white pill. Fixed by pinning it to the theme-invariant `TOKENS_LIGHT.ink`. See `docs/deploy/AI-INTEGRITY-LEDGER.md` Case 2.

When adding a surface-aware token to the remap in `.storybook/preview.tsx`, verify it in **`Dark Atom + Dark`**, not only `Dark Atom + Light` — the light default hides exactly this class of bug.

## Four Combinations

| Theme | Surface | Expected result |
|---|---|---|
| `Light` | `Atom` | Light app tokens; normal light atom appearance. |
| `Dark` | `Atom` | Dark app tokens; normal atom appearance adapts to dark theme. |
| `Light` | `Dark Atom` | Dark-surface atom inside a light-themed app. |
| `Dark` | `Dark Atom` | Dark-surface atom inside a dark-themed app. |

The important distinction:

- `Theme = Dark` means the app is dark.
- `Surface = Dark Atom` means the component surface itself is from the dark atom family.

## Required Review Matrix

The review matrix depends on surface availability.

### Both normal and dark families exist

Test all four combinations:

| Theme | Surface |
|---|---|
| `Light` | `Atom` |
| `Dark` | `Atom` |
| `Light` | `Dark Atom` |
| `Dark` | `Dark Atom` |

### Only normal family exists

Test:

| Theme | Surface |
|---|---|
| `Light` | `Atom` |
| `Dark` | `Atom` |

`Dark Atom` should be disabled.

### Only dark family exists

Test:

| Theme | Surface |
|---|---|
| `Light` | `Dark Atom` |
| `Dark` | `Dark Atom` |

`Atom` should be disabled.

## Storybook Implementation

The Storybook theme global and custom surface switch are defined in `.storybook/preview.tsx`.

The decorator chooses:

```tsx
const isDark = context.globals.theme === "dark";
const tokens = isDark ? TOKENS_DARK : TOKENS_LIGHT;
const atomSurface = context.globals.atomSurface === "darkAtom" ? "darkAtom" : "atom";
```

For atom stories, when `atomSurface === "darkAtom"`, the decorator provides a remapped token object through `ThemeContext.Provider`.

This allows the same base atom component to preview its dark-surface behavior without every atom needing a separate `*Dark.tsx` component.

For components where the dark family has a distinct API, state matrix, or behavior, use a dedicated `*Dark` implementation and spec instead of relying only on Storybook token remapping.

Stories declare family availability with `parameters.atomSurface.supported`:

```tsx
parameters: {
  atomSurface: {
    supported: ["atom", "darkAtom"],
  },
}
```

Supported values:

```tsx
supported: "atom"       // normal family only
supported: "darkAtom"   // dark family only
supported: ["atom", "darkAtom"] // both families
```

Defaults:

- `Atoms/*` stories default to both `atom` and `darkAtom`.
- Stories with `parameters.useAtomSurfaceGlobals = true` default to both.
- All other stories default to `atom` only unless they declare otherwise.

## Component Author Rules

### Use `useTokens()` for normal atoms

Normal atom components must read the live token set:

```tsx
const tokens = useTokens();
```

This keeps `Surface = Atom` responsive to both light and dark themes.

### Do not treat `atom` as light mode

This is wrong:

```tsx
const tokens = atomSurface === "atom" ? TOKENS_LIGHT : TOKENS_DARK;
```

`atom` does not mean light. It means theme-aware.

### Keep story scaffold labels theme-driven

Story labels that describe variants, states, groups, or matrix rows are documentation chrome. They should follow only the active `Theme`, not the selected `Surface`.

Use `getStoryThemeTokens(context.globals.theme)` and color those labels with `themeTokens.ink`, `themeTokens.textMuted`, or `themeTokens.textSubtle`.

Correct:

```tsx
<span style={{ ...TYPE.labelM, color: themeTokens.ink }}>
  Hover
</span>
```

Avoid:

```tsx
<span style={{ ...TYPE.labelM, color: atomSurface === "darkAtom" ? tokens.onDark : tokens.ink }}>
  Hover
</span>
```

Actual demo content that sits inside a dark-surface component mock may still use dark-surface foreground tokens. The rule above is for Storybook labels that explain the matrix, not for content intentionally rendered on the component surface.

### Use fixed dark-surface tokens only for dark-family surfaces

Dark-family components may use dark-surface tokens when their visual contract is fixed dark across themes.

Examples:

- `RailButton`
- `LogoSlot`
- dark menu rows
- components or variants explicitly documented as dark-surface atoms
- `*Dark` components such as `MenuItemDark`

### Use dedicated `*Light` components only for explicit fixed-light surfaces

Some components intentionally model a fixed light-surface variant, such as `RailButtonLight` or `LogoSlotLight`.

Those variants may hard-bind light-family behavior only when the spec explicitly says the surface is fixed light.

## Documentation References

- `.storybook/preview.tsx` defines the `Theme` and `Surface` toolbar globals.
- `AGENTS.md` codifies the rule: `atom` reads live `ThemeContext`; `darkAtom` is the fixed dark-family surface.
- `docs/atomic/atom/atomsdark.spec.md` defines the `AtomsDark` family and dark-surface deployment contract.
- `docs/audits/ATOMS_AUDIT_FINAL_PRECOMMIT_2026-06-19.md` records the post-push correction that caught components incorrectly treating `atom` as always light.

## Quick Review Checklist

When reviewing an atom or atom-like component:

- Test `Theme = Light`, `Surface = Atom`.
- Test `Theme = Dark`, `Surface = Atom`.
- Test `Theme = Light`, `Surface = Dark Atom` when the atom supports dark-surface behavior.
- Test `Theme = Dark`, `Surface = Dark Atom` when the atom supports dark-surface behavior.
- Confirm unsupported surface options are disabled, not silently allowed.
- Confirm `Surface = Atom` uses `useTokens()` and follows the live theme.
- Confirm `Surface = Dark Atom` stays visually dark and uses dark-surface foreground/background relationships.
- Confirm no component silently treats `atom` as `TOKENS_LIGHT`.
