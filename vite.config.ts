import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import dts from "vite-plugin-dts"

const src = fileURLToPath(new URL("./src", import.meta.url))
const pkg = createRequire(import.meta.url)("./package.json")

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ["src"],
      exclude: ["**/*.stories.tsx"],
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  resolve: {
    alias: { "@": src },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "system",
    },
    rollupOptions: {
      /*
       * Externalise React AND every runtime dependency.
       *
       * Bundling Radix in would ship a second copy of its React context into any
       * app that also uses Radix directly — and duplicated context silently breaks
       * exactly the behaviour we borrowed it for (portals, focus traps, open state).
       * npm installs these for the consumer since they are real `dependencies`.
       */
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
      ].map((name) => new RegExp(`^${name}(/.*)?$`)),
    },
  },
})
