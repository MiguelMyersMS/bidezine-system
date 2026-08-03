> ⚠️ **bidezine-system v2 BANNER (read first).** Inherited from the legacy `@miguel/design-system`; still
> describes the LEGACY architecture. This repo runs on the **v2 shadcn foundation** — `CLAUDE.md` and
> `docs/decisions/ADR-006-shadcn-foundation.md` are AUTHORITATIVE and override anything below on conflict.
> Reversals: there IS a build step; styling is Tailwind/CVA (not inline `CSSProperties`); theming is CSS
> variables from a DTCG source; GR4 is a DUAL source of truth (Figma = look, code = behaviour, Code Connect
> binds). Trust CLAUDE.md + ADR-006 first.

# Copilot instructions — @miguel/design-system

This repository is the **design system** (the design language + its components, tokens, specs, and the
browser bundle). It is consumed by other apps; it is not itself a consumer app.

## If you are a CONSUMER agent (building an app that USES this design system)

You have the wrong repo open for editing. **Do not edit anything here.** You CONSUME the design system —
import the raw-TS package (`@miguel/design-system`) or the browser bundle (`dist-browser/ds.umd.js` →
`window.DS`). Your build, your handoff files, and your gap-requests live in YOUR OWN app repo. If the design
system looks wrong or a spec is unclear, **file a gap/bug report in your own `REQUESTS.md` — do not fix it
here.** Full rules: `docs/consumer-governance/COMMUNICATION-PROTOCOL.md` (especially Rule 8).

Note: your own app repo should carry its own `.github/copilot-instructions.md` pointing at that protocol —
this file only governs the design-system repo itself.

## If you are a MAINTAINER agent (working ON the design system)

Read `AGENTS.md` (hard rules, golden rules) and `CLAUDE.md` (module map, token/typography/icon rules, the
factory line) first. Key constraints: no build step for the npm package (raw `.ts`/`.tsx`; the additive
`dist-browser` UMD bundle is the one exception, via `npm run build:umd`); Fluent icons only; opacity via
color alpha; tokens via `useTokens()`, never raw `PALETTE`. Run `npm run health` before marking work done.
