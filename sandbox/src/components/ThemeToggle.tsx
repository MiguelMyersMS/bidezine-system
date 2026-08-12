import { useEffect, useState } from "react"
import { Button, MoonIcon, SunIcon } from "@bidezine/system"

type Mode = "light" | "dark"

const MODE_KEY = "sandbox-mode"

function readMode(): Mode {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(MODE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/**
 * Whole-app light/dark toggle — added per the user's request so color and
 * elevation divergences can be evaluated in both modes, not just one.
 * Mirrors site/src/components/ThemeSwitcher.tsx's mode logic (no preset
 * picker needed here, this tool only ever runs against the default theme).
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(readMode)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark")
    window.localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
    >
      {mode === "dark" ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}
