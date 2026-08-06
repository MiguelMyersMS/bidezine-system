// Embedding shim for the real, vendored RailNav `Default` story — NOT part of the verbatim extract
// itself. `DefaultDemo.tsx` (in gallery/) is the mechanically-sliced, byte-faithful copy of the
// story's DefaultShell; this file only adds what's needed to drop that live component into our own
// page instead of a full Storybook iframe.
//
// Why an <iframe> is required (not just a bounded <div>): DefaultShell's own outer wrapper is
// hardcoded `height: 100dvh` — correct for a full Storybook page, but `dvh` is a *viewport*-relative
// unit. It always measures the real top-level browsing context's actual window size, completely
// ignoring the size of any ancestor element. A plain `<div style={{ height: 820, overflow: "hidden" }}>`
// wrapping DefaultShell does NOT constrain it: DefaultShell still renders at ~full physical browser
// height internally (typically >900px on a normal monitor), so RailNav's own rail-overflow
// measurement — which reads its real rendered `clientHeight` via a genuine `ResizeObserver`, see
// design-system/src/gallery/RailNav.tsx's `computedMax` effect — always sees "plenty of room" and
// never collapses into "More", no matter how small a `height` is passed to that outer div. The div's
// `overflow: hidden` only visually clips the excess; it doesn't change what RailNav measures. This
// was diagnosed by reading the real source directly (`railRef.current.clientHeight` inside a
// `ResizeObserver` callback), not by re-guessing another arbitrary pixel value.
//
// The fix: an `<iframe>` is its own independent browsing context with its OWN top-level viewport —
// `100dvh` measured *inside* an iframe genuinely equals that iframe's own rendered box size. So we
// mount DefaultShell into a small React root created inside the iframe's own document; the iframe
// element's `height`/`width` CSS becomes the real, honored constraint DefaultShell's `100dvh`
// resolves against. This also matches how real Storybook works (every story renders inside an
// iframe) — we're recreating that isolation deliberately, not working around it.
//
// A useful side effect: this also removes the earlier CSS-hidden dual-instance workaround entirely.
// Because there's now only ONE mounted iframe/React root, switching light/dark is just a normal
// re-render with a different ThemeContext value — never an unmount, never a `display: none` toggle —
// so there's nothing left that can leave RailNav's ResizeObserver stuck mid-measurement.
//
// Default `height` (860px): once the iframe made `100dvh` a real, honored constraint again, the
// PREVIOUS 820px guess (based on the doc's simplified `16 items * 44px + fixed overhead` formula)
// turned out to be too short — real Default story's 16 rail sections need >=842px, measured
// empirically by bisecting the iframe's rendered height and watching for the "More navigation
// options" button to disappear (the real formula in RailNav.tsx's `computedMax` effect measures the
// ACTUAL rendered logo-slot and footer-slot heights via refs, not fixed constants, so it doesn't
// reduce to a simple arithmetic formula from the docs alone). 860px gives ~18px of headroom above the
// measured 842px threshold. If FigmaAuditDisabledButton's utility footer button set ever changes,
// re-measure by temporarily setting the iframe's own `style.height` in devtools and watching for the
// "More" button.
//
// No RailNav/DefaultShell behavior, token, or markup is altered — this is purely a mounting harness.
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeContext } from "./theme";
import { TOKENS_LIGHT, TOKENS_DARK } from "./tokens";
import DefaultShell from "./gallery/DefaultDemo";

export function OriginRailNavLive({
  variant,
  height = 860,
  // 372px hugs the real rendered rail+panel width exactly (measured via the iframe's own `aside`
  // landmark, 370px, +2px buffer) now that DefaultShell's placeholder "Content area" `<main>` is
  // hidden — without this, the iframe's own leftover blank canvas reads as a second, nested
  // container around the rail instead of the rail filling its embedding box edge-to-edge.
  width = 372,
}: {
  variant: "light" | "dark";
  height?: number;
  width?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rootRef = useRef<Root | null>(null);

  // Create the iframe's own document + React root once per mount. Deliberately NOT re-run on
  // `variant` change — swapping themes only needs a re-render of the same mounted tree (see the
  // effect below), not a full document rebuild, so interaction state (search text, open panels,
  // scroll position) survives a light/dark toggle instead of resetting.
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\" />" +
        "<style>html,body{margin:0;padding:0;height:100%;background:#fff;}#root{height:100%;}" +
        // Hide DefaultShell's own placeholder "Content area" panel (its stand-in for a real app's
        // main content, not part of RailNav itself) — this is a display-only override at the
        // embedding-shim level, not an edit to the vendored DefaultDemo.tsx source.
          "main{display:none !important;}" +
          // DefaultShell's own outer flex wrapper hardcodes an `#f0f0f3` backdrop + 8px padding around
          // the rail (its own demo "canvas" look, meant to show the rail floating over an app
          // background). With `main` hidden that backdrop still fills the whole iframe, which reads as
          // a second, separate rounded "card" sitting inside our embedding box instead of the rail
          // filling it edge-to-edge like the bidezine mock does. Neutralizing it is display-only (same
          // embedding-shim rule as the `main` hide above) — RailNav's own markup/tokens are untouched.
          "#root>div{background:transparent !important;padding:0 !important;}" +
          "#root>div>aside{padding:0 !important;}</style>" +
        "</head><body><div id=\"root\"></div></body></html>"
    );
    doc.close();
    const mountEl = doc.getElementById("root");
    if (!mountEl) return;
    const root = createRoot(mountEl);
    rootRef.current = root;
    return () => {
      root.unmount();
      rootRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render the SAME mounted tree whenever the theme changes — a plain context-value swap, not a
  // remount, so RailNav's rail <div> (and its ResizeObserver) is never unmounted or hidden.
  useEffect(() => {
    rootRef.current?.render(
      <ThemeContext.Provider value={variant === "dark" ? TOKENS_DARK : TOKENS_LIGHT}>
        <DefaultShell />
      </ThemeContext.Provider>
    );
  });

  return (
    <iframe
      ref={iframeRef}
      title="Origin RailNav — Default story (live)"
      style={{
        height,
        width,
        maxWidth: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
}

function useDocumentDarkMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setMode(root.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return mode;
}

/** Auto light/dark instance: tracks the page's real theme class and re-renders the ONE mounted
 * iframe/root in place (no remount, no CSS-hidden dual instance — see file header for why the
 * previous approaches broke RailNav's real rail-overflow measurement). */
export function OriginRailNavLiveAuto({ height = 860, width = 372 }: { height?: number; width?: number }) {
  const mode = useDocumentDarkMode();
  return <OriginRailNavLive variant={mode} height={height} width={width} />;
}
