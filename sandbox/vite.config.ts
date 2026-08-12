import { fileURLToPath } from "node:url"
import { defineConfig, type PluginOption } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
// @ts-expect-error — plain .mjs with no type declarations; it is Node-side server code,
// deliberately outside the app's own TypeScript project (it holds a database credential
// and must never be reachable from anything that ships to the browser).
import { corpusApiMiddleware } from "./server/corpus-api.mjs"

/**
 * Serves the corpus at `/api/corpus`, in BOTH dev and preview.
 *
 * Preview matters as much as dev here: a data path that only existed under `vite dev`
 * would mean the production build was never exercised against real data — the exact
 * verification gap CLAUDE.md checklist item 15 was written about, where every check
 * passed against the dev server while the built output was broken.
 */
function corpusApi(): PluginOption {
  return {
    name: "sandbox-corpus-api",
    configureServer(server) {
      server.middlewares.use(corpusApiMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(corpusApiMiddleware())
    },
  }
}

const src = fileURLToPath(new URL("./src", import.meta.url))

// Fixed port, distinct from the main showcase (4188) — the factory-line tracker is its
// own tool, never linked from the public site's nav. (A one-off icon-comparison tool on
// 5590 was named here too; it was never tracked in git, had no caller, and was deleted
// rather than left to be swept into a commit by accident a third time.)
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), corpusApi()],
  resolve: {
    alias: { "@": src },
    // Same dedupe reasoning as site/vite.config.ts: @bidezine/system is a
    // workspace link back to the repo root, which would otherwise resolve
    // its own "react" copy and break hooks in Radix-based components.
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 4199,
    strictPort: true,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
})
