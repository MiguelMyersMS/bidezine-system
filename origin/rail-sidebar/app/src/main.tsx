// Mounting harness for the quarantined origin RailNav. Replaces the old
// `sandbox/src/reference/origin-design-system/OriginRailNavLive.tsx` shim, which mounted this same
// tree into an about:blank iframe from *inside the Sandbox app's own bundle and JS realm*. The DOM
// was separated; the code was not. This file is the same harness moved to the correct side of the
// boundary: the Sandbox app now loads this page with `<iframe src>`, so origin modules are fetched,
// parsed and executed by the iframe's own realm and never enter the Sandbox app's module graph.
//
// No RailNav / DefaultShell behaviour, token or markup is altered here. This is purely a mount.
//
// ── Why an iframe at all (carried over from the old shim; still the governing reason) ────────────
// DefaultShell's outer wrapper is hardcoded `height: 100dvh`. `dvh` is a *viewport*-relative unit:
// it always measures the real top-level browsing context's window size and ignores every ancestor
// element. A plain bounded `<div style={{ height: 820, overflow: "hidden" }}>` therefore does NOT
// constrain it — DefaultShell still lays out at full physical browser height internally, so
// RailNav's own rail-overflow measurement (it reads `railRef.current.clientHeight` inside a real
// `ResizeObserver`, see `design-system/gallery/RailNav.tsx`'s `computedMax` effect) always sees
// plenty of room and never collapses sections into "More", no matter what height the wrapper is
// given. `overflow: hidden` clips the excess visually; it does not change what RailNav measures.
// An iframe is its own browsing context with its own viewport, so `100dvh` measured in here
// genuinely equals this frame's rendered box. This also matches how real Storybook renders every
// story, so the isolation is faithful rather than a workaround.
//
// The iframe's rendered height is set by the embedder (see `sandbox/src/components/FullRailPreview.tsx`).
// For the record, since it was measured rather than derived: the real Default story's 16 rail
// sections need >= 842px before the "More navigation options" button appears, found by bisecting
// the frame height and watching for that button — RailNav's `computedMax` effect measures the
// actual rendered logo-slot and footer-slot heights via refs rather than fixed constants, so it
// does not reduce to an arithmetic formula from the docs alone.

import { createRoot } from "react-dom/client"
import { ThemeContext } from "./design-system/theme"
import { TOKENS_LIGHT, TOKENS_DARK } from "./design-system/tokens"
import DefaultShell from "./design-system/gallery/DefaultDemo"
import { useEmbedVariant, READY_MESSAGE } from "./embed-protocol"

const params = new URLSearchParams(window.location.search)

// The panel's own `box-shadow: 0 2px 8px rgba(...)` needs roughly 8px of blur plus 2px of vertical
// offset of transparent room around the rail to render un-clipped. An iframe is a hard viewport
// boundary — anything painted outside its physical box is simply never painted, whatever `overflow`
// any wrapper sets. The embedder handles its half (it sizes the frame larger by this same number on
// every side and pulls it back with an equal negative margin, so the layout box other elements see
// is unchanged); this page handles the other half, padding the rail's own `aside` so the shadow has
// somewhere to bleed into. The number arrives in the URL rather than being duplicated here, so the
// embedder stays its single source of truth.
const bleed = Number(params.get("bleed") ?? 0)
if (Number.isFinite(bleed) && bleed > 0) {
  const style = document.createElement("style")
  style.textContent = `#root>div>aside{padding:${bleed}px !important;}`
  document.head.appendChild(style)
}

const initialVariant = params.get("variant") === "dark" ? "dark" : "light"

function QuarantinedOriginRail() {
  // Theme arrives by postMessage and swaps the context value on the SAME mounted tree. It must
  // never remount and must never be hidden with `display: none`: either would tear down or freeze
  // RailNav's `ResizeObserver` mid-measurement, which is exactly the failure the old CSS-hidden
  // dual-instance approach produced. The initial value comes from the URL so the very first paint
  // is already correct and there is no flash before the first message lands.
  const variant = useEmbedVariant(initialVariant)
  return (
    <ThemeContext.Provider value={variant === "dark" ? TOKENS_DARK : TOKENS_LIGHT}>
      <DefaultShell />
    </ThemeContext.Provider>
  )
}

const mountEl = document.getElementById("root")
if (!mountEl) throw new Error("origin rail-sidebar: #root missing from index.html")

// Deliberately NOT wrapped in <StrictMode>. StrictMode's development-only double-invocation mounts,
// unmounts and remounts every effect — which for this tree means tearing down and re-creating
// RailNav's `ResizeObserver` on the rail element. That is the precise failure mode the whole iframe
// arrangement exists to avoid (see the theme comment above), and this is vendored reference
// material being reproduced faithfully, not bidezine code whose effect hygiene we are auditing.
createRoot(mountEl).render(<QuarantinedOriginRail />)

// Tell the embedder the listener is attached. Without this the embedder would have to guess when
// the frame is ready, and a theme toggled during load would be dropped.
window.parent?.postMessage({ type: READY_MESSAGE }, window.location.origin)
