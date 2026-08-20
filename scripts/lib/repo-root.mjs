// ═══════════════════════════════════════════════════════════════════════════════════
// The repo-root path constant, with no database attached.
//
//   import { REPO_ROOT } from "./lib/repo-root.mjs"
//
// This module exists to break a coupling, and that is ALL it does. It exports one
// absolute path and imports nothing but node: built-ins, so importing it can never
// require a dependency to be installed.
//
// ── The coupling it breaks (Issue 07o) ──────────────────────────────────────────────
// verifier/lib/db.mjs also exports REPO_ROOT, but it does `import sql from "mssql"` at
// module top level — so importing that module for ANY reason resolves mssql, a
// verifier/-only dependency absent from a root npm install. Three source-only checks
// borrowed nothing from it but this path constant:
//
//   scripts/check-rules.mjs, scripts/check-type-slots.mjs, scripts/check-rules-test.mjs
//
// On a clean clone all three crashed with ERR_MODULE_NOT_FOUND at module load, BEFORE
// asserting anything. The blocking `rules` CI workflow runs two of them with no install
// step, so the gate did not fail on a violation — it crashed on a missing module. Its
// run history is unambiguous: 112 runs, 0 passes, red since its first run on 2026-08-12,
// every failure the identical `Cannot find package 'mssql'`. It never once asserted a
// rule. Moving the constant here is what lets those checks — and the gate — run.
//
// ── Why this stays a path constant and nothing else ─────────────────────────────────
// The defect was that a database module was the cheapest place to get a path from. Re-
// exporting connect/sql/loadEnv here, or adding any "convenience" surface, would rebuild
// exactly that: the next check that wants a path would drag the driver back in. The value
// of this file is precisely its emptiness. verifier/lib/db.mjs keeps its OWN REPO_ROOT for
// the verifier scripts that genuinely connect to a database; this does not replace it.
//
// The value is byte-identical to db.mjs's: both are `join(<own dir>, "..", "..")`, and
// this file sits at the same depth (scripts/lib/ ↔ verifier/lib/), so both resolve to the
// repository root.
// ═══════════════════════════════════════════════════════════════════════════════════

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = join(HERE, "..", "..")
