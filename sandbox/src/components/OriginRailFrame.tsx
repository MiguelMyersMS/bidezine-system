import { useEffect, useRef, useState } from "react"
import {
  ORIGIN_EMBED_PATH,
  READY_MESSAGE,
  SHADOW_BLEED,
  VARIANT_MESSAGE,
  type Variant,
} from "./origin-embed-protocol"

/**
 * The origin pane: the real, vendored RailNav Default story, rendered in quarantine.
 *
 * This component contains no origin code and imports none. It renders an `<iframe src>` pointing at
 * `origin/rail-sidebar/app`, which is a separate Vite project with its own `package.json`, its own
 * `tsconfig.json` and its own bundle. Origin JS is therefore fetched, parsed and executed by the
 * frame's own realm; origin CSS is scoped to the frame's own document. Neither can reach the
 * translation pane, and there is no module graph the two share.
 *
 * This replaces `sandbox/src/reference/origin-design-system/OriginRailNavLive.tsx`, which mounted
 * the same tree into an `about:blank` iframe via `document.write()` from *inside this app's own
 * bundle*. That separated the DOM but not the code: all ~6,800 lines of origin source compiled into
 * this app and ran in this app's realm, one import away from everything. `scripts/check-quarantine.mjs`
 * now fails this app's build if any such import comes back.
 *
 * Two behaviours were deliberately dropped in the move, because the boundary made them unnecessary
 * rather than because they were abandoned:
 *
 * 1. **The mousemove/mouseup relay.** RailNav's panel resize-drag attaches its drag-continuation
 *    listener with a plain `window.addEventListener`. Under the old shim, RailNav's module code ran
 *    in the OUTER page's realm while its DOM lived in the frame, so that `window` was the outer
 *    window and native events over the rail never reached it — a hand-written relay had to forward
 *    them across. Now RailNav executes inside the frame, so its `window` *is* the frame's window and
 *    it receives those events directly. Verified live, not assumed.
 * 2. **The `document.write()` bootstrap and its embedded `<style>`.** Those rules now live in the
 *    origin page's own `index.html`, which is where they always belonged.
 *
 * One real behavioural change follows from the same shift, and it is an improvement rather than a
 * regression: RailNav clamps its panel resize to
 * `max(LAYOUT.panelW, window.innerWidth - railW - panelGap - SPACE[6])`. Under the old shim that
 * `window` was the OUTER page's, so the clamp was computed against the whole browser width and the
 * panel could be dragged far wider than the frame it was drawn in, only to be clipped by it. Now
 * `window.innerWidth` is the frame's own width, so the clamp matches what the user can actually see
 * — and it matches real Storybook, where every story renders in an iframe and RailNav computes
 * against that same frame. Measured: at a 372px-wide embed the panel widens to exactly
 * 396 - 54 - 8 - 32 = 302px and shrinks to origin's own PANEL_MIN_WIDTH of 240px.
 */
export function OriginRailFrame({ height = 860, width = 372 }: { height?: number; width?: number }) {
  const variant = useDocumentDarkMode()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // The `src` is computed ONCE and never changes. Putting the variant in it and letting it update
  // would re-navigate the frame on every theme toggle — a full document teardown, which is exactly
  // what tears down RailNav's `ResizeObserver` mid-measurement and breaks its rail-overflow
  // calculation. The initial variant rides in the URL so the first paint is already correct; every
  // change after that is a postMessage that swaps a context value on the still-mounted tree.
  const [src] = useState(
    () => `${ORIGIN_EMBED_PATH}?variant=${variant}&bleed=${SHADOW_BLEED}`,
  )

  // Read by the ready handler, which fires once and must send whatever the theme is *by then* —
  // the user can toggle it while the frame is still loading.
  const variantRef = useRef<Variant>(variant)
  variantRef.current = variant

  const post = (v: Variant) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: VARIANT_MESSAGE, variant: v },
      window.location.origin,
    )
  }

  // The frame announces when its listener is attached. Without this handshake a theme toggled
  // during load would be posted into a frame that is not listening yet, and silently lost.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: unknown } | null)?.type !== READY_MESSAGE) return
      post(variantRef.current)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    post(variant)
  }, [variant])

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Origin RailNav — Default story (quarantined)"
      style={{
        // Physically larger than the visible rail on every side, pulled back by an equal negative
        // margin, so the layout box every ancestor sees is still exactly `height` x `width` and
        // nothing shifts — only the transparent bleed the panel's box-shadow paints into is new.
        // See SHADOW_BLEED in ./origin-embed-protocol.
        height: height + SHADOW_BLEED * 2,
        width: width + SHADOW_BLEED * 2,
        margin: -SHADOW_BLEED,
        // No `maxWidth: "100%"`: the containing flex column sizes itself off this frame's own
        // intrinsic width, so a percentage max-width resolves circularly and silently caps the frame
        // back to its pre-bleed size, re-truncating the shadow the bleed exists to protect. This
        // embed always renders at a caller-controlled fixed size.
        border: "none",
        display: "block",
        colorScheme: "normal",
      }}
    />
  )
}

/** Tracks the Sandbox page's own real theme class, so the framed origin rail follows the app's
 * light/dark toggle. Moved here verbatim from the old `OriginRailNavLive.tsx` shim — it reads this
 * app's DOM, so it belongs on this side of the boundary. */
function useDocumentDarkMode(): Variant {
  const [mode, setMode] = useState<Variant>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  )
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setMode(root.classList.contains("dark") ? "dark" : "light")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])
  return mode
}
