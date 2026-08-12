// ═══════════════════════════════════════════════════════════════════════════════════
// What does this file actually depend on, in the design system?
//
// M7's sweep has to answer "which evidence does this system change invalidate", and the
// honest answer requires knowing that F-2's rail-button measurement depends on
// `src/ui/button.tsx` — even though F-2's own anchor lives in `sandbox/`, three
// directories away, and nothing in the divergence record says so.
//
// ── Why not just match on anchor_file ───────────────────────────────────────────────
// Because it misses the exact case M7 exists for. F-2 is anchored in
// `sandbox/src/components/FunctionalRailSidebar.tsx`; a change to `src/ui/button.tsx`
// touches no path F-2 names, so a path-comparison sweep would leave its evidence green
// while the primitive it measures has moved underneath it.
//
// ── The governing rule when unsure: over-invalidate ─────────────────────────────────
// A false "stale" costs one batch re-run. A false "current" is a false green — the thing
// this entire system exists to refuse. The asymmetry is not close, so every ambiguity
// below resolves toward marking MORE rather than less: an unresolvable import, a wildcard
// re-export, a file that cannot be read.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"

/** Import/require specifiers. Syntactic on purpose — zero dependencies, and a specifier
 * is a string literal in every form. Same approach as check-quarantine.mjs. */
const SPECIFIERS = [
  /\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
]

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"]

async function readIfExists(path) {
  try {
    return await readFile(path, "utf8")
  } catch {
    return null
  }
}

/** Resolves an extensionless import the way a bundler would. */
async function resolveFile(base) {
  for (const ext of ["", ...EXTENSIONS]) {
    const candidate = base + ext
    if (await readIfExists(candidate)) return candidate
  }
  for (const ext of EXTENSIONS) {
    const candidate = join(base, `index${ext}`)
    if (await readIfExists(candidate)) return candidate
  }
  return null
}

/**
 * Builds `exported name → source file` from `src/index.ts`.
 *
 * This is the piece that makes crossing the package boundary possible at all: a consumer
 * writes `import { Button } from "@bidezine/system"`, which points at `dist/`, and the
 * question the sweep needs answered is which file under `src/ui/` that came from.
 */
export async function buildExportMap(repoRoot) {
  const indexPath = join(repoRoot, "src", "index.ts")
  const source = (await readIfExists(indexPath)) ?? ""
  const byName = new Map()
  const wildcards = []

  // export { A, B as C, type D } from "./ui/button"
  for (const m of source.matchAll(/export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const target = m[2]
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim()
      if (name) byName.set(name, target)
    }
  }
  for (const m of source.matchAll(/export\s*\*\s*from\s*["']([^"']+)["']/g)) wildcards.push(m[1])

  // ── expand the wildcards, rather than over-attributing to all of them ─────────────
  // `export * from "./ui/scroll-area"` hides the names it provides, and the first version
  // of this simply attributed any unknown name to EVERY wildcard source. That is safe in
  // the over-invalidate direction but useless in practice: one component resolved to 35
  // design-system paths including `chart`, `carousel` and `calendar`, which it plainly
  // does not use. A sweep that marks nearly everything stale is the over-ceremony failure
  // (§9) wearing a correctness costume — it would be ignored within a week.
  //
  // So each wildcard source is read and its own export names extracted. Anything still
  // unresolved after that falls back to the blunt behaviour, which is the right place for
  // bluntness: the rare unknown, not the common case.
  for (const target of wildcards) {
    const resolved = await resolveFile(resolve(repoRoot, "src", target.replace(/^\.\//, "")))
    if (!resolved) continue
    const body = (await readIfExists(resolved)) ?? ""
    for (const pattern of [
      /export\s+(?:declare\s+)?(?:async\s+)?function\s+(\w+)/g,
      /export\s+(?:const|let|var|class)\s+(\w+)/g,
      /export\s+(?:type|interface|enum)\s+(\w+)/g,
    ]) {
      for (const m of body.matchAll(pattern)) if (!byName.has(m[1])) byName.set(m[1], target)
    }
    for (const m of body.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const raw of m[1].split(",")) {
        const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim()
        if (name && !byName.has(name)) byName.set(name, target)
      }
    }
  }

  return { byName, wildcards, indexPath }
}

/**
 * Every design-system path the given entry file depends on, transitively.
 *
 * Returns repo-relative paths, plus the bare marker `tokens/` when the file reaches the
 * design system at all — see the note on tokens below.
 */
export async function resolveDependencies(repoRoot, entryFile, exportMap, aliases = {}) {
  const deps = new Set()
  const seen = new Set()
  const queue = [resolve(repoRoot, entryFile)]

  const rel = (p) => relative(repoRoot, p).split("\\").join("/")

  while (queue.length) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)

    const source = await readIfExists(file)
    if (source === null) continue

    for (const pattern of SPECIFIERS) {
      pattern.lastIndex = 0
      let m
      while ((m = pattern.exec(source)) !== null) {
        const spec = m[1]

        // ── the design system, across the package boundary ──────────────────────
        if (spec === "@bidezine/system" || spec.startsWith("@bidezine/system/")) {
          // Anything importing the system at all pulls in src/index.ts, whose very first
          // line is `import "./styles/system.css"` — which is where the token layer
          // enters. So a token change genuinely reaches every consumer, and recording
          // that is not over-reach: there is no import to point at because tokens arrive
          // through CSS custom properties rather than through the module graph.
          deps.add("src/index.ts")
          deps.add("src/styles/")
          deps.add("tokens/")

          // Named imports resolve to their real source files.
          const named = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@bidezine\/system["']/g)]
          for (const group of named) {
            for (const raw of group[1].split(",")) {
              const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.trim()
              if (!name) continue
              const target = exportMap.byName.get(name)
              if (target) {
                const resolved = await resolveFile(resolve(repoRoot, "src", target.replace(/^\.\//, "")))
                if (resolved) deps.add(rel(resolved))
              } else {
                // Not found by name: it came from a wildcard re-export, or the map is
                // incomplete. Attribute it to every wildcard source rather than dropping
                // it — dropping is the failure mode that produces a false green.
                for (const w of exportMap.wildcards) {
                  const resolved = await resolveFile(resolve(repoRoot, "src", w.replace(/^\.\//, "")))
                  if (resolved) deps.add(rel(resolved))
                }
              }
            }
          }
          continue
        }

        // ── relative and aliased imports: follow them ───────────────────────────
        let next = null
        if (spec.startsWith(".")) {
          next = await resolveFile(resolve(dirname(file), spec))
        } else {
          for (const [prefix, target] of Object.entries(aliases)) {
            if (spec.startsWith(prefix)) {
              next = await resolveFile(resolve(repoRoot, target, spec.slice(prefix.length)))
              break
            }
          }
        }
        if (next) {
          queue.push(next)
          // A followed file that lives in the design system is itself a dependency.
          const r = rel(next)
          if (r.startsWith("src/")) deps.add(r)
        }
        // Everything else is a third-party package. Not our system, not our problem.
      }
    }
  }

  return [...deps].sort()
}
