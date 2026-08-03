/**
 * Dev-only config for the playground render surface (`npm run dev`).
 * The package build uses vite.config.ts — this file never ships.
 */
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  root: fileURLToPath(new URL("./playground", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5180, open: true },
})
