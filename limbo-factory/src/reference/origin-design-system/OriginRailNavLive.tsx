// Embedding shim for the real, vendored RailNav `Default` story — NOT part of the verbatim extract
// itself. `DefaultDemo.tsx` (in gallery/) is the mechanically-sliced, byte-faithful copy of the
// story's DefaultShell; this file only adds what's needed to drop that live component into our own
// page instead of a full Storybook iframe:
//   1. A ThemeContext.Provider, since `useTokens()` falls back to TOKENS_LIGHT with no provider —
//      real Storybook picks light/dark via its own theme decorator, which we don't have here.
//   2. A bounded frame, since DefaultShell's own wrapper div is `height: 100dvh` (viewport-relative,
//      correct for a full Storybook page) — inside our own layout we contain it in a fixed-height box
//      instead so it doesn't blow out the surrounding page.
// No RailNav/DefaultShell behavior, token, or markup is altered — this is purely a mounting harness.
//
// Frame height, from design-system/docs/interaction-patterns.md ("Viewport containment" /
// "Rail overflow behavior"): the rail auto-collapses excess sections into a "More" overflow menu the
// moment its container is shorter than needed — that's real, intended behavior, NOT a bug, but it means
// an arbitrarily short frame silently (and misleadingly) truncates the rail for THIS demo specifically.
// Per the doc's own budget formula:
//   available = frameHeight - aside padding (16px) - surface padding (16px) - footer zone (44px)
//   maxItems  = floor(available / 44px per slot)
// SECTIONS_DEFAULT (the real Default story's rail) has 16 top-zone sections, so avoiding overflow needs
// available >= 16 * 44 = 704, i.e. frameHeight >= 704 + 16 + 16 + 44 = 780. 820px gives headroom so the
// rail renders exactly as it does full-page in the real Storybook — no artificial "More" collapse.
//
// Mount discipline: only ONE instance is ever mounted at a time (never a `dark:hidden`/`dark:block`
// pair CSS-toggled on top of each other). RailNav's overflow-budget calc runs off a real
// ResizeObserver reading its own container's rendered size — an instance sitting `display: none`
// reports a 0×0 rect, and toggling it back to visible does not reliably re-trigger a fresh
// measurement, so a CSS-hidden copy can get stuck showing the "More" overflow collapse even once
// visible again. `OriginRailNavLiveAuto` below tracks the page's real light/dark class via a
// MutationObserver and remounts (via `key`) on every change, so RailNav always measures a real,
// currently-visible container.
import { useEffect, useState } from "react";
import { ThemeContext } from "./theme";
import { TOKENS_LIGHT, TOKENS_DARK } from "./tokens";
import DefaultShell from "./gallery/DefaultDemo";

export function OriginRailNavLive({ variant, height = 820 }: { variant: "light" | "dark"; height?: number }) {
  return (
    <div
      style={{
        height,
        width: 640,
        maxWidth: "100%",
        overflow: "hidden",
        borderRadius: 12,
        position: "relative",
      }}
    >
      <ThemeContext.Provider value={variant === "dark" ? TOKENS_DARK : TOKENS_LIGHT}>
        <DefaultShell />
      </ThemeContext.Provider>
    </div>
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

/** Single always-mounted instance that remounts on theme change, so RailNav's own overflow
 * measurement always runs against a real, visible container — see mount-discipline note above. */
export function OriginRailNavLiveAuto({ height = 820 }: { height?: number }) {
  const mode = useDocumentDarkMode();
  return <OriginRailNavLive key={mode} variant={mode} height={height} />;
}
