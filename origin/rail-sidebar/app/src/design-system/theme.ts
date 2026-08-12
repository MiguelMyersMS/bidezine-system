// Design System — Theme context, hooks, and responsive utilities.
// Import: import { useTokens, useBreakpoint, ThemeContext } from "@miguel/design-system/theme"

import { createContext, useContext, useState, useEffect } from "react";
import { TOKENS_LIGHT, type TokenSet } from "./tokens";
import { BP } from "./layout";

// ── Theme context ──
export const ThemeContext = createContext<TokenSet>(TOKENS_LIGHT);
export function useTokens(): TokenSet { return useContext(ThemeContext); }

// ── Responsive hook ──
// Returns current breakpoint tier based on viewport width.
// Tiers: xs (<520) | sm (520–767) | md (768–1023) | lg (1024–1279) | xl (≥1280)
export type Tier = "xs" | "sm" | "md" | "lg" | "xl";

export function useBreakpoint(): Tier {
  const [tier, setTier] = useState<Tier>(() => getTier(typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    const queries = [
      { mq: window.matchMedia(`(min-width: ${BP.lg}px)`), tier: "xl" as Tier },
      { mq: window.matchMedia(`(min-width: ${BP.md}px)`), tier: "lg" as Tier },
      { mq: window.matchMedia(`(min-width: ${BP.sm}px)`), tier: "md" as Tier },
      { mq: window.matchMedia(`(min-width: ${BP.xs}px)`), tier: "sm" as Tier },
    ];
    const update = () => {
      const match = queries.find(q => q.mq.matches);
      setTier(match ? match.tier : "xs");
    };
    update();
    queries.forEach(q => q.mq.addEventListener("change", update));
    return () => queries.forEach(q => q.mq.removeEventListener("change", update));
  }, []);
  return tier;
}

function getTier(w: number): Tier {
  if (w >= BP.lg) return "xl";
  if (w >= BP.md) return "lg";
  if (w >= BP.sm) return "md";
  if (w >= BP.xs) return "sm";
  return "xs";
}
