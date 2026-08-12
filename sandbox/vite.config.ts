import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const src = fileURLToPath(new URL("./src", import.meta.url))

// Fixed port, distinct from the main showcase (4188) and the icon-comparison
// reference tool (5590) — the factory-line tracker is its own tool, never
// linked from the public site's nav.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
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
