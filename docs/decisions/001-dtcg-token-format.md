---
title: Adopt DTCG 2025.10 token format in registry JSON
status: accepted
date: 2026-05-21
owner: miguelmyers
---

## Context

The design system needs a machine-readable token format that supports aliases, grouping, and standard tooling integration. Multiple formats exist: Style Dictionary, Tokens Studio, Figma Variables, and DTCG (W3C Design Tokens Community Group).

## Decision

Adopt DTCG 2025.10 format for all `docs/registry/*.json` files:

- Use `$type`, `$value`, `$description` for each token
- Use nested JSON objects for hierarchy (not dot-separated flat keys)
- No `.`, `{`, `}` in token or group names (reserved by DTCG spec)
- Source of truth remains `src/tokens.ts` — registry JSON is generated via the `registry-refresh` skill

## Consequences

- Registry is compatible with W3C-aligned tools (Style Dictionary, Figma Variables, Tokens Studio)
- Semantic tokens use DTCG alias syntax: `{primitive/color/slate/12}`
- Style Dictionary transform pipeline deferred to Phase 4
- Any future token tool migration has a standard format to work from
