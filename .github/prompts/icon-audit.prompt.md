---
name: icon-audit
description: "Audit all icons for Fluent UI System Icons compliance â€” fill-based SVGs, correct viewBox, filled prop for interactive icons, proper size tiers. Run after adding or modifying icons."
allowed-tools: Read, Grep, Glob
---

# Icon Audit Skill

## When to Use
- After adding new icons to `src/icons/fluent.tsx`
- After modifying icon components
- Periodic compliance check
- When a consumer reports icon inconsistencies

## Catalog IDs

| ID | Rule | Default Severity |
|---|---|---|
| `IC.NON-FLUENT` | Icon from non-Fluent UI System Icons source | BLOCKER |
| `IC.MISSING-FILLED` | Interactive icon missing `filled` boolean prop | HIGH |
| `IC.FILLED-NOT-WIRED` | Interactive icon call site not passing `filled={hovered \|\| active \|\| pressed}` | HIGH |
| `IC.PATH-TRUNCATED` | Regular vs Filled SVG paths are not visually distinct (possible truncation) | HIGH |
| `IC.WRONG-VIEWBOX` | viewBox not `"0 0 20 20"` | HIGH |
| `IC.STROKE-BASED` | Uses stroke instead of fill | HIGH |
| `IC.NOT-EXPORTED` | Icon defined but missing from barrel export | MEDIUM |
| `IC.WRONG-SIZE` | Consumer uses icon at size outside tier (24/36/18) | LOW |
| `IC.NAMING` | Icon name doesn't follow `Icon{Name}` PascalCase convention | LOW |

## Finding Schema

```json
{
  "primary_id": "IC.MISSING-FILLED",
  "related_ids": ["A11.NO-KEYBOARD"],
  "severity": "HIGH",
  "file": "src/icons/fluent.tsx",
  "line": 120,
  "evidence": "IconFilter does not accept `filled` prop but is used in interactive FilterButton",
  "impact": "No visual feedback on hover for interactive icon.",
  "recommended_fix": "Add Regular + Filled path variants with `filled` boolean prop.",
  "autofixable": false,
  "confidence": "high"
}
```

## Audit Steps

### Step 1 â€” Ingest
- Read `src/icons/fluent.tsx` (all icon definitions)
- Read `src/icons/index.ts` (export barrel)
- Read `docs/registry/icons.json` (registry representation)
- Glob `src/gallery/*.tsx` for icon usage within the package

### Step 2 â€” Scope
- **Full audit:** All checks below
- **Diff audit:** If run from `/smell`, only check icons in the diff

### Step 3 â€” Analyze

1. **Source Compliance** â€” Every icon component must originate from Microsoft Fluent UI System Icons. No Lucide, Heroicons, FontAwesome, Material, or custom icons (exception: IconLogo brand mark).
2. **SVG Structure** â€” All icons must be fill-based inline SVGs. viewBox must be `"0 0 20 20"`. No hardcoded width/height in the SVG. Fill color via `color` prop or `currentColor`. No stroke paths.
3. **Interactive Icon Pattern** â€” Every icon used in buttons/nav/toggles must accept a `filled` boolean prop. Single component per icon (NOT separate IconX + IconXFilled). Verify `filled={false}` renders Regular, `filled={true}` renders Filled.
4. **Call-Site Behavior** (`IC.FILLED-NOT-WIRED`) â€” At every call site where an icon is inside an interactive element (button, link, nav item), verify the `filled` prop follows the pattern: `filled={hovered || active || pressed}` or equivalent. A `filled` prop that is hardcoded `false`, hardcoded `true`, or missing hover/active state is a violation. Common violations:
   - `filled={active}` without `|| hovered` â€” icon doesn't fill on hover
   - `filled={false}` (hardcoded) â€” icon never fills
   - `filled` prop not passed at all â€” defaults to false always
5. **Path Integrity** (`IC.PATH-TRUNCATED`) â€” For every icon with a `filled` prop, compare the char length and visual structure of Regular vs Filled path `d` attributes. If both paths are nearly identical (same length Â± 5%, or identical outer shape), the Regular path was likely truncated or copy-pasted from the Filled variant. Verify against the Fluent UI System Icons GitHub source. The Regular variant typically has MORE path data (inner strokes/outlines), not less.
6. **Export Completeness** â€” Every icon in `fluent.tsx` must be exported from `icons/index.ts`. Every icon in `icons/index.ts` must be exported from the barrel `src/index.ts`. `IconProps` type must be exported.
7. **Size Tier Compliance** â€” Check consumer usage for correct size tiers: 24px (nav), 36px (hero), 18px (default). Flag non-standard sizes.
8. **Registry Sync** â€” Every icon in source must appear in `docs/registry/icons.json`. Flag any registry entries that don't match source.

### Step 4 â€” Report
Output to `docs/audits/icon-audit-{YYYY-MM-DD}.md`:

```markdown
# Icon Audit Report
**Scope:** [full | diff base...HEAD]
**Timestamp:** YYYY-MM-DD HH:MM

## Summary
- Icons scanned: N
- Findings: X blocker, Y high, Z medium, W low
- Health score: NN/100

## Findings
### [BLOCKER] `IC.NON-FLUENT` â€” `src/icons/fluent.tsx:85`
**Evidence:** IconCustomWidget uses non-Fluent SVG path
**Impact:** Breaks icon consistency across the system.
**Fix:** Replace with equivalent Fluent UI System Icon.
**Autofixable:** no | **Confidence:** high

## Synthesis
<one paragraph: overall icon health + top 3 actions>
```

### Step 5 â€” Reflect
If BLOCKER findings exist:
1. Attempt auto-fix for findings marked `autofixable: true`
2. Re-run affected checks
3. Maximum 3 retry cycles

## Guardrails
- **BLOCKER** findings block the skill from proceeding
- **HIGH** findings produce prominent warnings
- Icon source changes require verification against the Fluent UI System Icons catalog

