import React, { useState } from "react";
import { useTokens } from "../theme";
import { TYPE } from "../tokens";
import { SPACE, LAYOUT, RADIUS } from "../layout";
import { DISABLED, Z, elevation } from "../status";
import { cssTransition, useReducedMotion } from "../motion";

const TOOLTIP_OFFSET = LAYOUT.panelGap;
const TOOLTIP_PAD_X = SPACE[2];

export type RailButtonDarkState = "rest" | "disabled" | "hovered" | "pressed" | "active" | "browsing";

export interface RailButtonDarkSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  disabled?: boolean;
}

export interface RailButtonDarkProps {
  section: RailButtonDarkSection;
  active?: boolean;
  browsing?: boolean;
  onClick?: () => void;
  forceState?: RailButtonDarkState;
  reducedMotion?: boolean;
}

export default function RailButtonDark({
  section,
  active = false,
  browsing = false,
  onClick,
  forceState,
  reducedMotion,
}: RailButtonDarkProps) {
  const tokens = useTokens();
  const elev = elevation(tokens);
  const autoReducedMotion = useReducedMotion();
  const reduce = reducedMotion ?? autoReducedMotion;

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const Icon = section.icon;

  const isDisabled = forceState ? forceState === "disabled" : !!section.disabled;
  const isPressed = forceState ? forceState === "pressed" : pressed;
  const isHovered = forceState ? forceState === "hovered" : hovered;
  const isActive = forceState ? forceState === "active" : active;
  const isBrowsing = forceState ? forceState === "browsing" : browsing;

  const showTooltip = !forceState && (hovered || focused) && !isBrowsing && !isActive && !isDisabled;

  const background = isDisabled
    ? "transparent"
    : isPressed
      ? tokens.darkPressedBg
      : isActive
        ? tokens.darkActiveBg
        : isHovered
          ? tokens.darkHoverBg
          : "transparent";

  // Browsing ring as an INNER inset box-shadow (true 1.5px — a real `border:1.5px` snaps to 1px in
  // Chromium; matches RailNav's own inline browsing ring, which already uses inset box-shadow).
  const browsingRing = !isDisabled && isBrowsing ? `inset 0 0 0 1.5px ${tokens.darkBorderStrong}` : "none";

  const color = isDisabled
    ? tokens.onDarkDisabled
    : isActive || isPressed
      ? tokens.onDark
      : isBrowsing || isHovered
        ? tokens.onDarkHover
        : tokens.onDarkSubtle;

  const transition = cssTransition(["background", "color", "box-shadow"], "feedback", reduce);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
    >
      <button
        type="button"
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        onMouseDown={() => !isDisabled && setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onFocus={(e) => !isDisabled && setFocused(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => {
          setPressed(false);
          setFocused(false);
        }}
        aria-label={section.label}
        aria-current={isActive ? "page" : undefined}
        data-section-id={section.id}
        style={{
          width: LAYOUT.railButton,
          height: LAYOUT.railButton,
          borderRadius: RADIUS.soft,
          background,
          border: "none",
          boxShadow: browsingRing,
          boxSizing: "border-box",
          cursor: isDisabled ? DISABLED.cursor : "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          transition,
        }}
      >
        <Icon size={20} color="currentColor" filled={!isDisabled && (isActive || isBrowsing || isHovered || isPressed)} />
      </button>

      {showTooltip && (
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
          {section.label}
        </span>
      )}
    </div>
  );
}
