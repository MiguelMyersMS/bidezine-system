// Badge — small status indicator label.
// Used for counts, status labels, and categorical tags.
//
// Props:
//   variant  — "default" | "success" | "warning" | "error" | "accent" (default: "default")
//   children — badge content (text or number)

import React from "react";
import { TYPE, TOKENS_DARK, type TokenSet } from "../tokens";
import { RADIUS } from "../layout";
import { useTokens } from "../theme";

export type BadgeVariant =
  | "default"
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "color"
  | "bold"
  // Legacy aliases kept for compatibility with existing usages.
  | "accent"
  | "success"
  | "error";

export type BadgeSize = "sm" | "md";
export type BadgeSurface = "atom" | "darkAtom";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  atomSurface?: BadgeSurface;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  children: React.ReactNode;
}

export default function Badge({
  variant = "default",
  size = "sm",
  atomSurface = "atom",
  textColor,
  backgroundColor,
  borderColor,
  children,
}: BadgeProps) {
  const themeTokens = useTokens();
  const activeTokens = atomSurface === "darkAtom" ? TOKENS_DARK : themeTokens;
  const resolvedVariant = resolveVariant(variant);
  const styles = badgeStyles(resolvedVariant, activeTokens, atomSurface);
  const isSmall = size === "sm";

  const xPadding = isSmall ? 6 : 8;
  const height = isSmall ? 18 : 22;
  const typeStyle = isSmall ? TYPE.caption : TYPE.labelM;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        padding: `0 ${xPadding}px`,
        borderRadius: RADIUS.pill,
        border: borderColor ? `1px solid ${borderColor}` : styles.border,
        boxSizing: "border-box",
        maxWidth: "100%",
        minWidth: 0,
        ...typeStyle,
        color: textColor ?? styles.color,
        background: backgroundColor ?? styles.bg,
      }}
    >
      {/* Badge label is ONE line (Figma: whitespace-nowrap). When the pill is width-constrained
          by its container it truncates with an ellipsis instead of wrapping + spilling out of the
          pill. The inner span carries the clip so the pill shape stays intact. */}
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {children}
      </span>
    </span>
  );
}

function resolveVariant(variant: BadgeVariant): Exclude<BadgeVariant, "success" | "error"> {
  if (variant === "success") return "positive";
  if (variant === "error") return "negative";
  if (variant === "accent") return "color";
  return variant;
}

function badgeStyles(variant: Exclude<BadgeVariant, "success" | "error">, t: TokenSet, atomSurface: BadgeSurface) {
  switch (variant) {
    case "neutral":
      return atomSurface === "darkAtom"
        ? { color: t.textMuted, bg: t.surface, border: `1px solid ${t.borderStrong}` }
        : { color: t.textMuted, bg: t.bgSubtle, border: `1px solid ${t.hairline}` };
    case "positive":
      return { color: t.statusGreenText, bg: t.statusGreenSubtle, border: "none" };
    case "negative":
      return { color: t.statusRedText, bg: t.statusRedSubtle, border: "none" };
    case "warning":
      return { color: t.statusAmberText, bg: t.statusAmberSubtle, border: "none" };
    case "info":
      return { color: t.accentText, bg: t.accentSubtle, border: "none" };
    case "color":
      return { color: t.onDark, bg: t.accent, border: "none" };
    case "bold":
      return atomSurface === "darkAtom"
        ? { color: t.onInk, bg: t.onDark, border: "none" }
        : { color: t.onInk, bg: t.ink, border: "none" };
    default:
      return { color: t.textMuted, bg: "transparent", border: "none" };
  }
}
