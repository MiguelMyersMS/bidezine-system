import React, { useState } from "react";
import { RADIUS } from "../layout";
import { useTokens } from "../theme";
import { cssTransition, useReducedMotion } from "../motion";
import { DISABLED } from "../status";
import { IconDismiss } from "../icons";

export type ClearButtonState = "hidden" | "default" | "hover" | "focus" | "disabled";

export interface ClearButtonProps {
  visible?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  forceState?: ClearButtonState;
}

export default function ClearButton({
  visible = true,
  disabled = false,
  ariaLabel = "Clear search",
  onClick,
  forceState,
}: ClearButtonProps) {
  const tokens = useTokens();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const state: ClearButtonState = forceState
    ?? (!visible
      ? "hidden"
      : disabled
        ? "disabled"
        : focused
          ? "focus"
          : hovered
            ? "hover"
            : "default");

  const color =
    state === "disabled"
      ? tokens.iconDisabled
      : state === "hover" || state === "focus"
        ? tokens.ink
        : tokens.textSubtle;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => state !== "hidden" && !disabled && onClick?.()}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(event) => event.preventDefault()}
      onFocus={(e) => !disabled && setFocused(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
      style={{
        width: 24,
        height: 24,
        borderRadius: RADIUS.xs,
        border: "none",
        boxShadow: state === "focus" ? `inset 0 0 0 1.5px ${tokens.ink}` : "none",
        background: state === "focus" ? tokens.focusOverlay : state === "hover" ? tokens.hoverBg : "transparent",
        cursor: disabled ? DISABLED.cursor : "pointer",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color,
        boxSizing: "border-box",
        outline: "none",
        visibility: state === "hidden" ? "hidden" : "visible",
        pointerEvents: state === "hidden" ? "none" : undefined,
        transition: cssTransition(["background", "color", "box-shadow"], "feedback", reducedMotion),
      }}
    >
      <IconDismiss size={16} color="currentColor" />
    </button>
  );
}
