// ── Motion primitives ──────────────────────────────────────────────────────────
// Reusable animation building blocks for the design system. Durations/easings live in
// `status.ts` as the `MOTION` tokens; this module adds the shared *behaviors* built on them
// (the <Collapse> auto-height primitive, named transition presets, and the reduced-motion hook).
//
// Import: import { Collapse, TRANSITIONS, useReducedMotion } from "@miguel/design-system/motion"
//
// Rules (see AGENTS.md §Motion):
//   1. Every animation reads MOTION tokens — never hard-coded ms/curves.
//   2. Every animation has an instant fallback under `prefers-reduced-motion: reduce`.
//   3. Expand/collapse + reveal behaviors are machine-verified (Storybook play tests).
import { useState, useEffect, useRef } from "react";
import type { ReactNode, CSSProperties } from "react";
import { MOTION } from "./status";

export { MOTION };

// ── Named transition presets ──
// A preset = { duration (ms, MOTION token), easing (MOTION token) }. Pair with `cssTransition`
// to build a CSS `transition` string that respects reduced-motion. Add a preset here (don't
// inline durations at call sites) so the registry + Motion story stay the single inventory.
export const TRANSITIONS = {
  /** Group expand/collapse — auto-height via <Collapse>. `ease` (in-out) spreads the motion
   *  across the whole duration so the height change is clearly visible (expressive front-loads
   *  ~90% into the first 40ms, which reads as an instant snap). */
  collapse:    { duration: MOTION.slow,   easing: MOTION.ease },
  /** Sidebar panel open/close — width + content fade. `easeOut` = gentle decelerate arrival. */
  panelReveal: { duration: MOTION.medium, easing: MOTION.easeOut },
  /** Disclosure chevron rotation. */
  chevron:     { duration: MOTION.fast,   easing: MOTION.easeOut },
  /** Hover/press color + background micro-feedback. */
  feedback:    { duration: MOTION.fast,   easing: MOTION.ease },
} as const;

export type TransitionPreset = keyof typeof TRANSITIONS;

/** Build a CSS `transition` value for one or more properties from a preset.
 *  Returns `"none"` when reduced — callers spread the result into `style.transition`. */
export function cssTransition(
  properties: string | string[],
  preset: TransitionPreset = "feedback",
  reduced = false,
): string {
  if (reduced) return "none";
  const { duration, easing } = TRANSITIONS[preset];
  const props = Array.isArray(properties) ? properties : [properties];
  return props.map((p) => `${p} ${duration}ms ${easing}`).join(", ");
}

// ── prefers-reduced-motion ──
/** Live `prefers-reduced-motion: reduce` state (SSR-safe; updates on OS setting change). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// ── <Collapse> — animated auto-height disclosure ──
export interface CollapseProps {
  /** When true the content is expanded; false collapses it. */
  open: boolean;
  children: ReactNode;
  /** Override the duration (ms). Defaults to the `collapse` preset. */
  duration?: number;
  /** Override the easing. Defaults to the `collapse` preset. */
  easing?: string;
  /** Force reduced-motion (else auto-detected). RailNav passes its own value down. */
  reducedMotion?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Optional role/aria passthrough for the outer wrapper. */
  id?: string;
}

/**
 * Animate a block of content to/from its natural height — no JS measurement, no magic
 * max-height. Uses the CSS `grid-template-rows: 0fr ↔ 1fr` technique inside an
 * `overflow: hidden` track, plus an opacity fade. Children are mounted on open and
 * unmounted after the close transition completes, so collapsed subtrees stay out of the DOM.
 * Under `prefers-reduced-motion: reduce` it snaps instantly (no transition, immediate mount/unmount).
 */
export function Collapse({
  open,
  children,
  duration = TRANSITIONS.collapse.duration,
  easing = TRANSITIONS.collapse.easing,
  reducedMotion,
  style,
  className,
  id,
}: CollapseProps) {
  const autoReduced = useReducedMotion();
  const reduce = reducedMotion ?? autoReduced;

  // `mounted`: children present in the DOM (true while open OR animating closed).
  const [mounted, setMounted] = useState(open);
  // `shown`: drives the grid track 0fr↔1fr. Deferred one frame on enter so 0fr→1fr transitions.
  const [shown, setShown] = useState(open);
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip animating the initial mount — only subsequent open/close changes animate.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let raf1: number | undefined;
    let raf2: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      setMounted(true);
      if (reduce) {
        setShown(true);
      } else {
        // Start collapsed (0fr), then flip to 1fr next paint so the transition runs.
        setShown(false);
        raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setShown(true)); });
      }
    } else {
      setShown(false); // animate to 0fr
      // Unmount AFTER the close transition — timer-based (not transitionend) so it is deterministic
      // even when the browser doesn't fire a `grid-template-rows` transitionend. This guarantees
      // collapsed children always leave the DOM (preserves the expand/collapse contract).
      if (reduce) setMounted(false);
      else timer = setTimeout(() => setMounted(false), duration + 50);
    }
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (timer) clearTimeout(timer);
    };
  }, [open, reduce, duration]);

  if (!mounted) return null;

  return (
    <div
      id={id}
      className={className}
      style={{
        display: "grid",
        gridTemplateRows: shown ? "1fr" : "0fr",
        opacity: shown ? 1 : 0,
        transition: reduce
          ? "none"
          : `grid-template-rows ${duration}ms ${easing}, opacity ${duration}ms ${easing}`,
        ...style,
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}
