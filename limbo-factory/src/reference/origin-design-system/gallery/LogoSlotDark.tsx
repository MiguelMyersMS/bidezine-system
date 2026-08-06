import React, { useState } from "react";
import { useTokens } from "../theme";
import { TYPE } from "../tokens";
import { SPACE, LAYOUT, RADIUS } from "../layout";
import { Z, elevation } from "../status";
import { cssTransition, useReducedMotion } from "../motion";
import { IconLogo } from "../icons";

const TOOLTIP_OFFSET = LAYOUT.panelGap;
const TOOLTIP_PAD_X = SPACE[2];

export type LogoSlotDarkState = "rest" | "hover" | "pressed";

export interface LogoSlotDarkProps {
  content?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  forceState?: LogoSlotDarkState;
  reducedMotion?: boolean;
}

export default function LogoSlotDark({
  content = <IconLogo />,
  onClick,
  label = "BiDezine",
  forceState,
  reducedMotion,
}: LogoSlotDarkProps) {
  const tokens = useTokens();
  const elev = elevation(tokens);
  const autoReducedMotion = useReducedMotion();
  const reduce = reducedMotion ?? autoReducedMotion;

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isInteractive = !!onClick;

  const isHovered = forceState ? forceState === "hover" : hovered;
  const isPressed = forceState ? forceState === "pressed" : pressed;

  const showTooltip = !forceState && (hovered || focused);

  const sharedStyle: React.CSSProperties = {
    width: LAYOUT.railButton,
    height: LAYOUT.railButton,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACE[3],
    flexShrink: 0,
    borderRadius: RADIUS.soft,
    color: tokens.onDark,
    transition: cssTransition("background", "feedback", reduce),
  };

  const tooltip = showTooltip && (
    <span
      role="tooltip"
      style={{
        position: "absolute",
        left: `calc(100% + ${TOOLTIP_OFFSET}px)`,
        top: "50%",
        transform: "translateY(-50%)",
        height: 24,
        padding: `0 ${TOOLTIP_PAD_X}px`,
        display: "inline-flex",
        alignItems: "center",
        background: tokens.darkSurface,
        border: `0.5px solid ${tokens.darkBorderStrong}`,
        borderRadius: RADIUS.tooltip,
        ...TYPE.labelM,
        color: tokens.onDark,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: Z.dropdown,
        boxShadow: elev.mid,
      }}
    >
      {label}
    </span>
  );

  if (!isInteractive) {
    return (
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div aria-hidden="true" style={sharedStyle}>
          {content}
        </div>
        {tooltip}
      </div>
    );
  }

  const background = isPressed
    ? tokens.darkPressedBg
    : isHovered
      ? tokens.darkHoverBg
      : "transparent";

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => {
          setPressed(false);
          setFocused(false);
        }}
        aria-label={label}
        style={{
          ...sharedStyle,
          background,
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {content}
      </button>
      {tooltip}
    </div>
  );
}
