import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const src = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  // Custom domain (bs.bidezine.systems) serves from the root, so base stays "/".
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": src },
    // @bidezine/system is a workspace link (site/node_modules/@bidezine/system
    // -> repo root). Vite follows that symlink to its real path and would
    // otherwise resolve "react" from the root's node_modules instead of this
    // app's — two React copies, and any component using hooks (e.g. Radix's
    // Avatar) crashes with "Cannot read properties of null (reading
    // 'useState')". Dedupe forces both resolutions to the same instance.
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
})
