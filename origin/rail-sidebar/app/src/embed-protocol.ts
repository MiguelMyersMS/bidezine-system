// The embed contract between this quarantined page and the Sandbox app that frames it.
//
// This file is DUPLICATED, by design. Its counterpart is
// `sandbox/src/components/origin-embed-protocol.ts`. Sharing one module between the two would mean
// an import crossing the quarantine boundary — the exact thing this whole arrangement exists to
// make impossible, and the thing `scripts/check-quarantine.mjs` fails the build over. A contract
// between two isolated realms is a wire format, not a shared type: the honest way to express it is
// two copies that agree, each naming the other.
//
// **If you change anything here, change the Sandbox copy in the same commit.** The two are checked
// against each other by `scripts/check-quarantine.mjs`, which compares the constants below with the
// ones on the other side and fails the build if they drift.

import { useEffect, useState } from "react"

/** Prefix on every message in both directions. Bumped only if the contract changes shape. */
export const MESSAGE_NAMESPACE = "origin-rail-sidebar"

/** Sandbox -> here: swap the rendered theme without remounting. */
export const VARIANT_MESSAGE = `${MESSAGE_NAMESPACE}:variant`

/** Here -> Sandbox: the variant listener is attached; any theme set during load can be re-sent. */
export const READY_MESSAGE = `${MESSAGE_NAMESPACE}:ready`

export type Variant = "light" | "dark"

/**
 * Tracks the embedder's theme. Returns a plain value so the caller can swap a context value on the
 * already-mounted tree rather than remounting it — see `main.tsx` for why that distinction matters
 * to RailNav's rail-overflow measurement.
 */
export function useEmbedVariant(initial: Variant): Variant {
  const [variant, setVariant] = useState<Variant>(initial)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Same-origin only: this page is served out of the Sandbox app's own `public/`, so a message
      // from anywhere else is not the embedder and has no business driving this frame.
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: unknown; variant?: unknown } | null
      if (!data || data.type !== VARIANT_MESSAGE) return
      if (data.variant === "light" || data.variant === "dark") setVariant(data.variant)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return variant
}
