import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// The quarantined origin RailNav, built as a standalone page.
//
// This is deliberately its OWN Vite project rather than a second entry in `sandbox/`'s config.
// The Sandbox app loads the built page with `<iframe src>`, so origin code gets its own document,
// its own JS realm and its own bundle — nothing origin defines can reach the translation pane, and
// there is no module graph the two share. Because this project has its own `package.json` and its
// own `tsconfig.json`, an import reaching across the boundary does not merely violate a rule: it
// does not resolve at all. That structural property is the point (SANDBOX-SPEC invariant 6:
// "Origin material is quarantined. It renders in isolation and is never importable").
//
// `scripts/check-quarantine.mjs` guards the boundary from the other side and fails the Sandbox
// build if anything under `sandbox/`, `site/` or `src/` ever imports from here.

// Built straight into the Sandbox app's `public/` so one static path serves it in dev, preview and
// build alike, with no proxy and no second dev server to remember to start. The output directory is
// gitignored — it is a build artifact of this project, not source.
const OUT_DIR = fileURLToPath(new URL("../../../sandbox/public/origin/rail-sidebar", import.meta.url))

export default defineConfig({
  // Must match where `sandbox/public/` serves this from, or the emitted asset URLs 404.
  base: "/origin/rail-sidebar/",
  plugins: [react()],
  build: {
    target: "es2022",
    outDir: OUT_DIR,
    // OUT_DIR sits outside this project's root, which Vite refuses to clear unless told explicitly.
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    // Only used when running this page on its own for debugging. The Sandbox app (4199) never
    // points at this port — it loads the built output from its own origin instead, so there is no
    // cross-origin hop and no second process in the normal workflow.
    port: 4198,
    strictPort: true,
  },
})
