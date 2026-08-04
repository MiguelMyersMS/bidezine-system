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
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
})
