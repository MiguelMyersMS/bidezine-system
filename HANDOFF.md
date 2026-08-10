# Handoff — current state only

> **This file is a live snapshot, not a log.** It is overwritten in place, never appended to. If you are
> an AI picking up work in a new/replacement chat, read this file first, then verify every claim in it
> against the real repo state (git log, git status, live code) before acting — never trust this file (or
> any prior chat transcript) blindly. See `CLAUDE.md`'s "Handoff protocol" section for the full rules
> this file follows.

## Baseline

- Branch: `main`
- Last verified commit: `9e7e89c`
- Working tree: clean, pushed to `origin/main`

## Active task

_None. Nothing in progress._

## What's done (most recent, current state — not a history)

- Rail Sidebar panel resize (`react-resizable-panels`) ships with correct shadow clearance on all four
  sides and no height regression (L-35/L-36/L-37, see `limbo-factory/src/data/rail-sidebar.ts` and
  `LIMBO-PROTOCOL-LOG.md` Update 9/10).
- Factory-line preview stage (`limbo-factory/src/App.tsx`) anchors the Rail+Panel composite
  (`justify-start`) instead of centering it, fixing the Rail being almost entirely clipped (L-38, see
  `limbo-factory/src/data/rail-sidebar.ts` and `LIMBO-PROTOCOL-LOG.md` Update 11). User-confirmed live.

## What's next

_Nothing queued. Awaiting new instructions._

## Open questions / blockers

_None._
