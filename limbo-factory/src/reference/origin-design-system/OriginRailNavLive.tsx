// Embedding shim for the real, vendored RailNav `Default` story — NOT part of the verbatim extract
// itself. `DefaultDemo.tsx` (in gallery/) is the mechanically-sliced, byte-faithful copy of the
// story's DefaultShell; this file only adds what's needed to drop that live component into our own
// page instead of a full Storybook iframe:
//   1. A ThemeContext.Provider, since `useTokens()` falls back to TOKENS_LIGHT with no provider —
//      real Storybook picks light/dark via its own theme decorator, which we don't have here.
//   2. A fixed-height, overflow-hidden frame, since DefaultShell's own wrapper div is `height: 100dvh`
//      (viewport-relative, correct for a full Storybook page) — inside our own layout we contain it
//      instead so it doesn't blow out the surrounding page. RailNav itself already uses `height: 100%`
//      internally (see RailNav.tsx), so it fills whatever bounded frame we give it correctly.
// No RailNav/DefaultShell behavior, token, or markup is altered — this is purely a mounting harness.

import { ThemeContext } from "./theme";
import { TOKENS_LIGHT, TOKENS_DARK } from "./tokens";
import DefaultShell from "./gallery/DefaultDemo";

export function OriginRailNavLive({ variant, height = 640 }: { variant: "light" | "dark"; height?: number }) {
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
