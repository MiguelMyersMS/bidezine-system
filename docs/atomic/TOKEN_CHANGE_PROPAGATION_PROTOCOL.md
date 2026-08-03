# Token / Foundation Change Propagation Protocol

> When you change a design **token or foundation** (typography tier, color token, spacing,
> radius, opacity) — a change that affects **more than one component** — it must propagate
> through **every layer in lockstep**, and **Figma must be reconciled**. A partial
> propagation (one surface updated, another missed; the *size* changed but the *weight*
> missed) is the exact failure mode this protocol exists to prevent.

## Why this exists

A token change is never a one-file edit. The **2026-06-13 typography tier split** moved
nav/list/input surfaces to 14px — and the rail overflow menu (`OverflowMenuItem`) got the
*size* but **missed the active-weight bump** (`labelL`). It was a half-update caught only by a
manual verification pass, not by any gate. Separately, **Figma is the source of truth (Golden
Rule #4)** — if Figma is not updated to match, the next Figma-verify will "correct" the code
back. This protocol makes both completeness and Figma-sync explicit and checkable.

## Trigger

Any change to: `src/tokens.ts` (`TYPE` / `PALETTE` / `TOKENS*`), `src/layout.ts`
(`SPACE` / `RADIUS` / `LAYOUT`), or a foundational contract in `AGENTS.md` / `CLAUDE.md` that
affects **>1 component**. (A single-component visual fix is NOT this protocol — that's the
normal spec/VERIFY loop.)

## The propagation checklist — ALL must land before "done"

1. **Token source** — `tokens.ts` / `layout.ts`: add/rename/change the token (e.g. add `TYPE.labelL`).
2. **Every consumer component** — grep the old token AND the affected surfaces; update **every
   state** (rest / hover / active / selected / disabled / focus), not just the default. Use a
   **per-state contract** (a `labelFont`/token-per-state map), never a single spread — the
   overflow-menu miss was precisely a single `...TYPE.bodyM` with no active branch.
3. **Every spec.md** — update the documented token + **per-state** value in each affected
   `*.spec.md` (state matrix AND layer anatomy). One spec per affected surface.
4. **Canonical docs** — `AGENTS.md` (the relevant contract / Golden Rule) + `CLAUDE.md`
   (the scale table). Mark superseded docs deprecated.
5. **Registry** — `docs/registry/tokens.json` if the token set is tracked there.
6. **Verification gate** — `tsc --noEmit`; `npm run test:behavior` (no render regression) + a
   visual capture of **each** affected surface; `npm run audit:specs`.
7. **Figma reconciliation** — see next section. REQUIRED, not optional.

## Figma reconciliation (Golden Rule #4 — Figma is the source of truth)

- A token change is only legitimate if the Figma design **intends** it (a stored Figma text
  style / variable / color). Figma is authoritative.
- **Order:** prefer **Figma-first** (update the Figma style/variable, then code follows GR4).
  When code changes first (an in-flight owner decision), the Figma style **MUST** be updated to
  match **in the same change-set** — and the owner must have stored the new Figma style.
- **Figma-sync verification (REQUIRED, every affected surface — not a sample):** for each
  affected component's Figma node, read the **applied text style / property** and confirm it
  matches the documented tier. Helper: `node scripts/figma-text-style-check.mjs <nodeId> …`
  (reports every TEXT node's style name + size/weight; `FIGMA_API_KEY` env). Then:
  - **Match** → record `figma-synced: true` for that node in the spec.
  - **Mismatch** (node still on the old style/value) → **FLAG a `FIGMA-DESYNC` finding**. Do NOT
    silently keep the code change. Surface it so Figma is updated (or the code reverted). *A code
    value that disagrees with Figma is a GR4 violation until reconciled.*

## Completeness = no desync at any layer

The change is **done** only when **token + all consumers (all states) + all specs + AGENTS/CLAUDE
+ registry + Figma** all agree, verified by the gate. Any single-layer lag is a finding:

| Finding | Meaning |
|---|---|
| `TIER-DESYNC` | a consumer or a **state** not updated (e.g. overflow `active` weight missed) |
| `FIGMA-DESYNC` | a Figma node still on the old style/value |
| `SPEC-DESYNC` | a `*.spec.md` (matrix or anatomy) not updated |
| `DOC-DESYNC` | `AGENTS.md` / `CLAUDE.md` / registry not updated |

## Worked example — 2026-06-13 typography tier split

- **Token:** `TYPE.labelL` (Inter 14/500) added to `tokens.ts`.
- **Tiers:** Nav/list/input (NavRow, SelectRow, SearchBar, **RailNav overflow menu**) → `bodyM`
  14/400 rest, `labelL` 14/500 active. Menu/ActionMenu (MenuItem, ActionMenu submenus,
  PanelHeaderMenu) **unchanged** at `bodyS` 13/400, `labelM` 13/500.
- **Consumers:** `NavRowShell` (bodyM/labelL); panel search `<input>` (bodyM); `OverflowMenuItem`
  (bodyM/labelL — **initially `TIER-DESYNC`: active weight missed; fixed**). `Select.tsx` already
  used bodyM+500-checked (no change). `ActionMenu.tsx` intentionally unchanged.
- **Specs:** navrow, searchbar, panelheader, railmenu, selectrow, selectdropdown. `navigation-rail.md` deprecated.
- **Docs:** `AGENTS.md` (NavRow States Contract, List Row Geometry), `CLAUDE.md` (TYPE scale).
- **Figma:** owner stored `Body/M` + `Label/L` before the code change → run Figma-sync per surface
  (NavRow `207:3406`, SearchBar, RailMenu rows) and flag any node still on the old 13px style.

## Connects to

- **Golden Rule #4** (Figma source of truth) — the Figma-sync step is its enforcement for token changes.
- **Golden Rule #5 / `_TEMPLATE.spec.md` behaviors** — per-state behavior/visual still test-gated.
- **`audit-specs.js` checklist** ids `state-matrix-all-slots`, `all-colors-tokenized`,
  `spec-internal-consistency` — extend to cover typography-tier per-state values.
