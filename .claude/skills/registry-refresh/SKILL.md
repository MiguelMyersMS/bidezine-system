---
name: registry-refresh
description: "Regenerate docs/registry/*.json files from source code. Ensures registry stays in sync with actual tokens, icons, and components. Run after any source change."
allowed-tools: Read, Grep, Glob, Write
---

# Registry Refresh Skill

## When to Use
- After any change to `src/tokens.ts`, `src/icons/fluent.tsx`, or `src/gallery/*.tsx`
- After adding or removing components or icons
- After running any audit that reveals registry drift
- As part of the `/health` workflow

## What Gets Refreshed

| Registry file | Source |
|---|---|
| `docs/registry/tokens.json` | `src/tokens.ts` (palette, semantic tokens, typography, spacing, radius, breakpoints, elevation, z-index, motion) |
| `docs/registry/icons.json` | `src/icons/fluent.tsx` + `src/icons/index.ts` |
| `docs/registry/components.json` | `src/gallery/*.tsx` + `src/gallery/index.ts` |

## Refresh Steps

### Step 1 â€” Scan Source

**Tokens** (`src/tokens.ts`):
- Extract PALETTE scales and their steps
- Extract TOKENS_LIGHT / TOKENS_DARK keys (verify parity)
- Extract TYPE scale entries and their CSS properties
- Extract FONT_FAMILY definition
- Read SPACE, RADIUS, BP from `src/layout.ts`
- Read elevation, Z, MOTION from `src/status.ts`

**Icons** (`src/icons/fluent.tsx`):
- List all exported icon components
- For each: detect if it has a `filled` prop (two path variants)
- Determine source (fluent vs custom)
- Cross-check against `src/icons/index.ts` exports

**Components** (`src/gallery/*.tsx`):
- List all component files
- For each: extract component name, props interface, tokens used (grep useTokens/TYPE/SPACE/RADIUS usage)
- Cross-check against `src/gallery/index.ts` exports
- Preserve existing metadata that can't be auto-detected: status, owner, keyboard_notes, a11y_status, storybook path

### Step 2 â€” Build DTCG-Compatible Token Registry

Token registry uses DTCG-compatible shape. Rules:
- **No `.`, `{`, `}` in group/token names** (DTCG 2025.10 naming rules)
- **No `$`-prefixed group names** (`$` prefix reserved for DTCG keywords)
- Use nested JSON objects for hierarchy (not dot-separated keys)
- Each leaf token includes `$type`, `$value`, `$description`

Example shape:
```json
{
  "color": {
    "slate": {
      "1": {
        "$type": "color",
        "$value": "#FCFCFD",
        "$description": "Lightest slate background"
      }
    }
  }
}
```

### Step 3 â€” Write Registry Files

Write updated JSON to:
- `docs/registry/tokens.json`
- `docs/registry/icons.json`
- `docs/registry/components.json`

**Merge rules for components.json:**
- Auto-detected fields (name, file, tokens_used, interactive, has_filled_icon) are overwritten from source
- Human-managed fields (status, owner, keyboard_notes, a11y_status, storybook, description) are preserved if they exist
- New components get default values: `status: "experimental"`, `owner: "{system_owner}"`, `a11y_status: "untested"`

### Step 4 â€” Validate

After writing:
1. Verify JSON is valid (parse test)
2. Verify DTCG naming compliance (no `.`, `{`, `}` in keys)
3. Verify every source file has a registry entry
4. Verify no registry entries reference deleted source files
5. Report any drift found

### Step 5 â€” Report

Output a brief summary (not a full audit file):

```
Registry Refresh â€” YYYY-MM-DD HH:MM
  tokens.json: updated (N tokens, N palette scales)
  icons.json: updated (N icons, N with filled variant)
  components.json: updated (N components, N new entries added)
  Drift found: [none | list of mismatches corrected]
```

## Ownership Configuration

Default owner for new entries is configurable:

```json
{
  "system_owner": "miguelmyers",
  "fallback_owner": "system_owner"
}
```

This avoids hardcoding a person into every registry entry. Update `system_owner` in registry `_meta` when ownership changes.

## Guardrails
- Never delete human-managed fields (status, owner, keyboard_notes, a11y_status)
- Never downgrade a component's status automatically
- Flag if a source file was deleted but registry entry remains (suggest removal, don't auto-remove)
- DTCG naming violations in generated output = skill failure (must fix before writing)
