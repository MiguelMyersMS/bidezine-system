# Icon Protocol — Fluent UI Icons for ActionMenu & Gallery Components

## How to identify and add an icon from Figma

### Step 1 — Find the icon name in Figma
1. Open the Figma file and select the component (e.g. a Row inside a menu).
2. In the **Layers panel** (left sidebar), expand the row until you reach the icon node.
   - Path: `Row → Icon/Slot → <Icon Name>`
3. The leaf node name IS the Fluent icon name (e.g. `Arrow Sort Up Lines`, `Shape Subtract`, `Eye Off`).
4. **Faster method:** In the MCP `figma-get_figma_data` response, look for the `componentSets` section — each entry has a `name` field that is the icon name. Example:
   ```
   componentSets:
     141:3286:
       name: Arrow Sort Up Lines   ← this is the icon name
   ```

### Step 2 — Translate name to GitHub path
Convert the Figma name to a URL-safe path:
- Capitalize each word, join with `%20` for the folder name
- Lowercase with underscores for the file name

| Figma name | Folder | File pattern |
|---|---|---|
| `Arrow Sort Up Lines` | `Arrow%20Sort%20Up%20Lines` | `ic_fluent_arrow_sort_up_lines_20_regular.svg` |
| `Shape Subtract` | `Shape%20Subtract` | `ic_fluent_shape_subtract_20_regular.svg` |
| `Eye Off` | `Eye%20Off` | `ic_fluent_eye_off_20_regular.svg` |
| `Form Multiple` | `Form%20Multiple` | `ic_fluent_form_multiple_20_regular.svg` |

Base URL:
```
https://raw.githubusercontent.com/microsoft/fluentui-system-icons/main/assets/<Folder>/SVG/<file>
```

Always fetch **both** `_regular` and `_filled` variants in parallel.

### Step 3 — Add to `src/icons/fluent.tsx`
Add a new exported component **before** `export type { IconProps }` at the bottom:

**Single-path icon:**
```tsx
export const IconArrowSortUpLines = ({ size = 18, color = "currentColor", filled = false }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {filled
      ? <path d="...filled path..." fill={color} />
      : <path d="...regular path..." fill={color} />
    }
  </svg>
);
```

**Multi-path icon** (e.g. `IconFormMultiple` — 5 paths regular, 3 paths filled):
```tsx
export const IconFormMultiple = ({ size = 18, color = "currentColor", filled = false }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {filled
      ? <>
          <path d="...path1..." fill={color} />
          <path d="...path2..." fill={color} />
          <path d="...path3..." fill={color} />
        </>
      : <>
          <path d="...path1..." fill={color} />
          <path d="...path2..." fill={color} />
          <path d="...path3..." fill={color} />
          <path d="...path4..." fill={color} />
          <path d="...path5..." fill={color} />
        </>
    }
  </svg>
);
```

**Rules:**
- Replace ALL occurrences of `#212121` in SVG paths with `{color}`.
- Use React Fragment `<>...</>` when the variant has more than one `<path>`.
- Always include both `filled` and regular variants — even if currently unused.
- Default `size = 18`. Use `size={16}` when placing inside menu rows.
- `viewBox` is always `"0 0 20 20"` for Fluent UI System Icons (20px source).

### Step 4 — Export from `src/icons/index.ts`
Add the new icon name to the named export block at the bottom that imports from `"./fluent"`:
```ts
  IconArrowSortUpLines,
  IconArrowSortDownLines,
} from "./fluent";
```
⚠️ Check for duplicates first — some icons may already be exported earlier in the file.

### Step 5 — Run registry refresh + health
```bash
npm run registry:refresh  # registers new icons in docs/registry/icons.json
npm run health            # verifies typecheck + all audits pass
```

### Step 6 — Use in stories/components
```tsx
import { IconArrowSortUpLines } from "../icons";
// ...
icon: <IconArrowSortUpLines size={16} />
```

---

## Naming convention
| Pattern | Example |
|---|---|
| `Icon` + PascalCase Figma name (words joined) | `IconArrowSortUpLines` |
| No suffix for generic single-word icons | `IconEdit`, `IconDelete`, `IconLink` |
| Keep directional/variant suffixes | `IconArrowSortUpLines` ≠ `IconArrowSortUp` |
| Multi-word names: keep all words | `IconShapeSubtract`, `IconFormMultiple` |

---

## Composition rule — never hand-roll an icon button (ENFORCED: `AC.RAW-ICON-BUTTON`)

A raw Fluent `IconX` is a **dumb SVG**. All the interactive behaviour — the icon-rule
Regular→Filled toggle on hover, the hover/press/focus backgrounds, the focus ring — lives
in the **icon-button ATOMS** (`EllipsisButton`, `CommentButton`, `BreakdownIcon`, `InfoIcon`,
`ChevronCarousel`, `ChevronTrigger`, `SortTableIndicator`, `FilterTableIcon`,
`DisclosureTableToggle`, …). Wrapping a raw icon in your own `<button>` silently drops every
one of those and still passes tsc — the classic shortcut.

**Rule:** when a Figma frame references an `Atom.*` (or you need an icon that reacts to
interaction), **compose the code atom** — don't re-wrap the raw icon. Before wrapping any
icon in a button:
1. `ls src/gallery | grep -iE '<Name>(Button|Icon|Trigger)'` and `grep <Name> src/gallery/index.ts`.
2. If it exists → compose it. If a Figma `Atom.*` is referenced, the code atom almost
   certainly already exists.
3. If it truly doesn't exist → **create it as an atom** (mirror `EllipsisButton.tsx`:
   `filled = state !== "default" && state !== "disabled"`), then compose it.
4. Raw `IconX` is only ever correct **inside a leaf atom itself**.

**Gate:** `scripts/audit-atom-composition.js` (in `npm run health`) fails HIGH on
`AC.RAW-ICON-BUTTON` — a composer that feeds an icon-only raw icon to a hand-rolled local
button wrapper. It does NOT flag leaf atoms (their own `<button>` is the default export) or
labeled buttons / menu-row indicators (not icon-only).

---

## Size rules (from AGENTS.md)
| Context | Size |
|---|---|
| Menu / popover rows | `16px` |
| Navigation icons (rail, panel, footer) | `20px` |
| Disclosure chevrons | `16px` |
| Decorative hero | `36px` |

---

## Icons added for ActionMenu (current inventory)

| Export name | Figma name | Row usage |
|---|---|---|
| `IconEdit` | Edit | Rename, Sort by |
| `IconLink` | Link | Copy link |
| `IconHeart` | Heart | Add to favorites |
| `IconEyeOff` | Eye Off | Hide space |
| `IconArchive` | Archive | Archive |
| `IconDelete` | Delete | Delete |
| `IconFormMultiple` | Form Multiple | Presets |
| `IconShapeSubtract` | Shape Subtract | Duplicate |
| `IconArrowSort` | Arrow Sort | Sort by row (main menu) |
| `IconArrowSortUpLines` | Arrow Sort Up Lines | Sort ascending (submenu) |
| `IconArrowSortDownLines` | Arrow Sort Down Lines | Sort descending (submenu) |

---

## Common pitfalls

| Pitfall | Fix |
|---|---|
| Icon already exists (duplicate export error) | Check `src/icons/index.ts` before adding — search for the name |
| `#212121` not replaced in all paths | Search the pasted SVG for `#212121` globally before saving |
| `export type { IconProps }` gets duplicated | New icons go BEFORE this line, not after |
| Multi-path icon missing Fragment wrapper | Each variant needs `<>...</>` when it has more than one `<path>` |
| Wrong size in row | Always `size={16}` inside menu rows, even though default is `18` |

