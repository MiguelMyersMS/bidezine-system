---
name: code-cleanup
description: "TypeScript strict checks, dead export detection, unused import cleanup, consistency enforcement, documentation sync, and file organization for the design system codebase."
allowed-tools: Read, Grep, Glob, Bash(npx tsc)
---

# Code Cleanup Skill

## When to Use
- Before committing changes
- After removing components or tokens
- Periodic maintenance (weekly)
- Before syncing with consumers

## Catalog IDs

| ID | Rule | Default Severity |
|---|---|---|
| `CP.DOMAIN-IN-GALLERY` | Domain-specific component in gallery/ | HIGH |
| `CP.MISSING-TOKENS` | Component doesn't use useTokens() for theming | HIGH |
| `CP.STABLE-INCOMPLETE` | Component marked stable but missing required artifacts | HIGH |
| `CP.NOT-REGISTERED` | Component missing from docs/registry/components.json | MEDIUM |
| `CP.MISSING-DOCS` | Component lacks required usage/a11y/keyboard docs | MEDIUM |
| `CP.MISSING-STATUS` | Component lacks maturity status in registry | MEDIUM |
| `LY.FOURTH-RADIUS` | New interactive radius tier outside pill/rounded/soft | BLOCKER |
| `LY.HARDCODED-SPACE` | Hardcoded spacing instead of SPACE token | MEDIUM |
| `LY.HARDCODED-RADIUS` | Hardcoded border-radius instead of RADIUS token | MEDIUM |

## Finding Schema

```json
{
  "primary_id": "CP.NOT-REGISTERED",
  "related_ids": ["CP.MISSING-STATUS"],
  "severity": "MEDIUM",
  "file": "src/gallery/NewComponent.tsx",
  "line": 1,
  "evidence": "NewComponent exists in gallery/ but has no entry in components.json",
  "impact": "Component won't appear in Storybook or audits.",
  "recommended_fix": "Add entry to docs/registry/components.json with status, owner, and description.",
  "autofixable": true,
  "confidence": "high"
}
```

## Cleanup Steps

### Step 1 â€” Ingest
- Glob all `src/**/*.ts` and `src/**/*.tsx` files
- Read `docs/registry/*.json` for registry state
- Read `AGENTS.md` and `CLAUDE.md` for documentation state

### Step 2 â€” TypeScript Strict Check
- Run `npx tsc --noEmit` to verify no type errors
- Check for `any` types that should be narrowed
- Verify all exported types are properly defined

### Step 3 â€” Dead Export Detection
- For each export in `src/index.ts`, verify it's used in at least one consumer
- For each icon in `src/icons/index.ts`, verify it's used somewhere
- Flag exports that exist but have zero consumers (candidates for deprecation)

### Step 4 â€” Unused Import Cleanup
- Scan all `.ts`/`.tsx` files for unused imports
- Remove imports that are no longer referenced

### Step 5 â€” Consistency & Layout Checks
- All files use consistent quote style (double quotes)
- All files use consistent semicolon style
- All `as const` assertions are present where needed
- No `// @ts-ignore` or `// @ts-expect-error` without explanation
- No hardcoded spacing values â€” use SPACE tokens
- No hardcoded border-radius â€” use RADIUS tokens
- No fourth interactive radius tier

### Step 6 â€” Documentation Sync
- Verify `CLAUDE.md` module map matches actual exports
- Verify `AGENTS.md` module map matches actual exports
- Verify `docs/registry/*.json` files match source code
- Check for stale documentation references
- Verify all components have maturity status in registry

### Step 7 â€” File Organization
- No orphaned files (files not imported or exported anywhere)
- Gallery components follow naming convention (PascalCase)
- Icon components follow naming convention (Icon{Name})

### Step 8 â€” Report
Output to `docs/audits/cleanup-{YYYY-MM-DD}.md`:

```markdown
# Code Cleanup Report
**Timestamp:** YYYY-MM-DD HH:MM

## Summary
- Files scanned: N
- Findings: X blocker, Y high, Z medium, W low
- Health score: NN/100

## Findings
### [MEDIUM] `CP.NOT-REGISTERED` â€” `src/gallery/NewComponent.tsx`
**Evidence:** Component exists but has no registry entry.
**Impact:** Missing from docs and audits.
**Fix:** Add to components.json.
**Autofixable:** yes | **Confidence:** high

## Actions Taken
- {list of auto-fixed items}

## Manual Review Needed
- {items requiring human decision}

## Synthesis
<one paragraph: overall code health + top 3 actions>
```

## Guardrails
- **BLOCKER** findings (e.g., LY.FOURTH-RADIUS) block the skill
- Auto-fixes are applied only for LOW/MEDIUM findings with high confidence
- HIGH+ auto-fixes require human approval

