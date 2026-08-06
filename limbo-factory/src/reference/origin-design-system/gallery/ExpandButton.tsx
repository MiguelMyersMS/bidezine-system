import React, { useState } from "react";
import { useTokens } from "../theme";
import { RADIUS } from "../layout";
import { DISABLED } from "../status";
import { cssTransition, useReducedMotion } from "../motion";
import { IconPanelLeftContract } from "../icons";

export type ExpandButtonState = "default" | "hover" | "pressed" | "focus" | "disabled";

export interface ExpandButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
  open?: boolean;
  disabled?: boolean;
  forceState?: ExpandButtonState;
}

export default function ExpandButton({
  onClick,
  ariaLabel = "Collapse sidebar",
  open = false,
  disabled = false,
  forceState,
}: ExpandButtonProps) {
  const tokens = useTokens();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const state: ExpandButtonState = forceState
    ?? (disabled
      ? "disabled"
      : pressed
        ? "pressed"
        : hovered
          ? "hover"
          : focused
            ? "focus"
            : "default");

  const background =
    state === "focus"
      ? tokens.focusOverlay
      : state === "hover"
        ? tokens.hoverBg
        : state === "pressed"
          ? tokens.pressedOverlay
          : "transparent";

  const color =
    state === "disabled"
      ? tokens.iconDisabled
      : state === "default"
        ? tokens.textMuted
        : tokens.ink;

  const filled = state !== "default" && state !== "disabled";
  const isFocus = state === "focus";

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick?.()}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onFocus={(e) => !disabled && setFocused(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => {
        setPressed(false);
        setFocused(false);
      }}
      aria-label={ariaLabel}
      aria-expanded={open}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: RADIUS.xs,
        border: "none",
        boxShadow: isFocus ? `inset 0 0 0 1.5px ${tokens.ink}` : "none",
        background,
        cursor: disabled ? DISABLED.cursor : "pointer",
        padding: 0,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        outline: "none",
        boxSizing: "border-box",
        transition: cssTransition(["background", "color", "box-shadow"], "feedback", reducedMotion),
      }}
    >
      <IconPanelLeftContract size={20} color="currentColor" filled={filled} />
    </button>
  );
}
