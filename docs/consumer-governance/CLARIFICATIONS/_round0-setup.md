# Clarifications — Round 0 setup

DS-side answers to the round-0 `REQUESTS.md` blockers/findings (Copilot). Claude Design's round-0 answers
will be appended when its report arrives.

## B0.4 — protocol not on master (source-of-truth conflict) — RESOLVED
- Question: `docs/consumer-governance/COMMUNICATION-PROTOCOL.md` exists only on the unmerged
  `docs/consumer-governance` branch, not on `master`; "read fresh from master" can't be satisfied.
- Answer: correct — my process gap. The protocol is merged to `master` via PR #59 (this PR). Once merged it
  is canonical on `master`; read it there from Round 1 on.
- Folded into: PR #59 merge. Date: 2026-07-29.

## B0.5 — Vite dev server fails to render (transitive CJS interop) — FIX PROPOSED, please re-test
- Question: with `optimizeDeps.exclude: ["@miguel/design-system"]`, the DEV server throws named-export
  interop errors (`createPortal` from react-dom, `useSyncExternalStoreWithSelector` from
  use-sync-external-store); `vite build` passes.
- Answer: real finding — the blanket `exclude` was old guidance for a local `file:` link and is wrong for an
  installed package, because it stops Vite from pre-bundling the DS's transitive CJS deps (Radix, TanStack,
  use-sync-external-store). Corrected `CLAUDE.md` Vite section:
  - **Installed package (your case, `github:` install):** do NOT exclude — `optimizeDeps.include:
    ["@miguel/design-system"]` + `resolve.dedupe: ["react","react-dom"]`. Vite then crawls + interop-wraps
    the transitive CJS deps.
  - **Local `file:` link only:** keep `exclude` but force-include the transitive CJS deps (`@miguel/design-
    system > @radix-ui/react-*`, `> @tanstack/react-table`, `> use-sync-external-store/shim/with-selector`).
- **ACTION FOR COPILOT:** switch to `optimizeDeps.include: ["@miguel/design-system"]` (drop the `exclude`),
  restart the dev server, re-render RailNav, and report whether the dev interop errors are gone. If they are,
  B0.5 closes (and we add a gate); if not, re-file with the new error.
- Folded into: `CLAUDE.md` Vite section. Date: 2026-07-29.

## B0.6 — root import vs `/gallery` — VERIFY after B0.5
- Question: `import { RailNav } from "@miguel/design-system"` (root) "doesn't resolve"; only
  `@miguel/design-system/gallery` did.
- Answer: RailNav **is** re-exported from the root barrel on `master` (`src/index.ts`), and your production
  build succeeded — so this is most likely a symptom of the B0.5 dev-server interop, not a real barrel
  omission. After applying the B0.5 fix, please re-test the ROOT import and report. (Deep imports like
  `@miguel/design-system/gallery` are always valid regardless.)
- Date: 2026-07-29.

## Claude Design round-0

### ✅ MILESTONE — the browser UMD bundle is render-verified in the real environment
`window.DS.version` assert PASS (1.0.0+fac87a1), 199 exports, `useTokens()` paints dark through the provider,
single React instance, NO invalid-hook-call, NO process-not-defined, FOCUS_GLOBAL_CSS (222 chars) + fonts
inject. This is the browser-path thesis (PR #58) proven in production, not just Node simulation.

### R1 / R2 — same as B0.4: protocol + `prompts/consumer-build/` only on the branch → RESOLVED by merging PR #59.

### CD0.1 (R3) — `<RailNav/>` with no props THROWS — OWNER DECISION
- `sections` is destructured with no default (`RailNav.tsx:252`) and dereferenced `useState(sections.length)`
  (`:283`); `footerSections` defaults to `[]` on the next line. So a no-prop render throws `undefined.length`.
- Two fixes: (a) **default `sections = []`** (robust empty rail, consistent with `footerSections`) — a
  1-line DS change + an `EmptySections` regression story; or (b) keep `sections` required and correct the
  round-0 prompt (RailNav is never rendered empty in practice). Owner decides — RailNav is sealed.
- Date: 2026-07-29.

### CD0.2 (R5) — Claude Design's existing shell themes via CSS-vars, not the provider — OWNER DECISION
- Its shell + 10 foundation pages were built on the old `_ds_` (CSS-var + `data-theme`), which does NOT
  retheme the real DS components (README §2). Migration scope (full shell → provider theming, vs a hybrid
  where old chrome stays CSS-var and only the newly-tested DS components go through the provider) is the
  owner's call. Nothing changed.
- Date: 2026-07-29.

### Channel — Claude Design CANNOT push to GitHub
It reads the repo + copies files, but cannot commit/push/create a repo. So its `REQUESTS.md` reaches the DS
side via the **owner exporting the Claude Design project into a GitHub repo** the DS reads (the fallback in
the protocol §1). Confirmed: governance files sit at the project root and export as-is.
