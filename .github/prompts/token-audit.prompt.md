---
name: token-audit
description: "Audit all design tokens for DTCG compliance, light/dark parity, semantic naming, consumer usage, and typography correctness. Run after any token change or periodically as a health check."
allowed-tools: Read, Grep, Glob
---

# Token Audit Skill

## When to Use
- After modifying `src/tokens.ts`
- After updating `docs/registry/tokens.json`
- Periodic health check (weekly or before releases)
- When a consumer reports a missing or mismatched token
- When adding new semantic tokens

## Catalog IDs

| ID | Rule | Default Severity |
|---|---|---|
| `TK.PALETTE-DIRECT` | Component references PALETTE instead of useTokens() | BLOCKER |
| `TK.MISSING-DARK` | Token exists in TOKENS_LIGHT but not TOKENS_DARK | BLOCKER |
| `TK.UNAPPROVED-FONT` | Font not in approved stack (DM Sans, Raleway, Inter) | BLOCKER |
| `TK.INVALID-REFERENCE` | Alias token references a missing token | BLOCKER |
| `TK.NON-DTCG-NAME` | Token/group name in registry contains `.`, `{`, `}`, or starts with `$` | BLOCKER |
| `TK.CIRCULAR-REFERENCE` | Token alias chain creates a cycle | BLOCKER |
| `TK.CSS-OPACITY` | Uses CSS `opacity` property instead of color alpha | HIGH |
| `TK.HARDCODED-FONT` | Hardcoded font-family instead of TYPE token | HIGH |
| `TK.HARDCODED-SIZE` | Hardcoded font-size instead of TYPE token | HIGH |
| `TK.HARDCODED-COLOR` | Hardcoded color value instead of semantic token | HIGH |
| `TK.ALIAS-BYPASS` | Component uses primitive token instead of semantic | HIGH |
| `TK.MISSING-STATE` | Missing hover/focus/active/disabled state token | HIGH |
| `TK.MISSING-MODE` | Missing light/dark/high-contrast mode mapping | HIGH |
| `TK.DEPRECATED-IN-USE` | Deprecated token still used by component | HIGH |
| `TK.NON-DTCG-SHAPE` | Registry token missing $type, $value, or $description | HIGH |
| `TK.ORPHAN-TOKEN` | Defined token not referenced by any consumer | MEDIUM |
| `TK.MISSING-DESCRIPTION` | Token lacks purpose/usage description | MEDIUM |

## Finding Schema

Every finding must have one primary catalog ID. Include related IDs when the issue crosses token, component, accessibility, or layout rules.

```json
{
  "primary_id": "TK.PALETTE-DIRECT",
  "related_ids": [],
  "severity": "BLOCKER",
  "file": "src/gallery/DateChip.tsx",
  "line": 42,
  "evidence": "color: PALETTE.iris9",
  "impact": "Component will not respond to theme changes.",
  "recommended_fix": "Replace with `const t = useTokens(); color: t.accent`",
  "autofixable": true,
  "confidence": "high"
}
```

## Audit Steps

### Step 1 â€” Ingest
Collect source files for analysis:
- Read `src/tokens.ts` (palette, semantic tokens, typography)
- Read `docs/registry/tokens.json` (registry representation)
- Glob `src/gallery/*.tsx` and `src/icons/*.tsx` for consumer usage within the package

### Step 2 â€” Scope
Determine audit scope:
- **Full audit:** All checks below
- **Diff audit:** If run from `/smell`, only check files in the diff

### Step 3 â€” Analyze
Walk every source file. For each issue found, cite exactly one primary catalog ID. Quote the smallest possible code excerpt.

**Check sequence:**

1. **DTCG Registry Compliance** â€” Verify tokens.json uses valid DTCG naming (no `.`, `{`, `}` in keys, no `$`-prefixed group names). Verify each token has `$type`, `$value`, `$description`.
2. **Light/Dark Parity** â€” Every key in `TOKENS_LIGHT` must exist in `TOKENS_DARK` and vice versa.
3. **Alias Integrity** â€” Trace all alias references to verify targets exist. Detect circular reference chains.
4. **Palette Encapsulation** â€” Grep `src/gallery/` and `src/icons/` for direct `PALETTE.` references. Only `tokens.ts` and `theme.ts` may reference PALETTE.
5. **Semantic Naming** â€” Token names follow `{category}{Modifier}` camelCase. Categories: ink, text, bg, surface, hover, active, border, hairline, shadow, accent, status, dark, onDark.
6. **Typography** â€” TYPE entries match documented font stack. All numeric TYPE tokens include `fontVariantNumeric: "tabular-nums"`. No hardcoded font-family or font-size in gallery components.
7. **Consumer Usage** â€” Check every token in `TokenSet` is referenced in at least one file. Flag orphans.
8. **Deprecation** â€” Cross-reference any tokens marked deprecated in registry against actual usage.

### Step 4 â€” Report
Output a structured report to `docs/audits/token-audit-{YYYY-MM-DD}.md`:

```markdown
# Token Audit Report
**Scope:** [full | diff base...HEAD]
**Timestamp:** YYYY-MM-DD HH:MM

## Summary
- Tokens scanned: N
- Findings: X blocker, Y high, Z medium
- Health score: NN/100

## Findings
### [BLOCKER] `TK.PALETTE-DIRECT` â€” `src/gallery/DateChip.tsx:42`
**Evidence:** `color: PALETTE.iris9`
**Impact:** Component will not respond to theme changes.
**Fix:** Replace with `const t = useTokens(); color: t.accent`
**Autofixable:** yes | **Confidence:** high

## Synthesis
<one paragraph: overall token health + top 3 actions>
```

### Step 5 â€” Reflect
If BLOCKER findings exist:
1. Attempt auto-fix for findings marked `autofixable: true`
2. Re-run affected checks (not the full audit)
3. Maximum 3 retry cycles
4. If BLOCKERs persist after 3 retries, report them as unresolved

## Guardrails
- **BLOCKER** findings block the skill from proceeding to other work
- **HIGH** findings produce prominent warnings
- **MEDIUM** findings are logged in the report
- Token modifications affecting multiple consumers require human approval before applying fixes

