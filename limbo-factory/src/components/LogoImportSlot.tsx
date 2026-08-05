import { useState } from "react"
import { Input, Label } from "@bidezine/system"

/**
 * Standing rule from Q3: the AI must never pick or invent a logo/brand icon —
 * always ask the user for an image link to import. If none is supplied, the
 * slot renders empty (not a placeholder icon).
 *
 * Pre-filled here with the real bidezine mark from the origin project, since
 * that IS the correct logo for Rail Sidebar specifically — not an AI-invented
 * default. Per Q3's confirmed answer, this default mark renders as an actual
 * inline `<svg fill="currentColor">` (not an `<img>`), so its color genuinely
 * tracks the theme toggle. A custom URL the user types in is a different,
 * arbitrary asset we can't guarantee is `currentColor`-compatible, so that
 * path still falls back to a plain `<img>`.
 */
export function LogoImportSlot({
  defaultUrl,
  defaultSvgPath,
  defaultViewBox = "0 0 20 20",
}: {
  defaultUrl?: string
  defaultSvgPath?: string
  defaultViewBox?: string
}) {
  const [url, setUrl] = useState(defaultUrl ?? "")
  const usingDefault = defaultSvgPath !== undefined && url === (defaultUrl ?? "")

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="logo-url" className="text-xs">
        Logo image link (you provide this — the AI will not choose or invent one)
      </Label>
      <div className="flex items-center gap-3">
        <Input
          id="logo-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/logo.svg"
          className="max-w-sm"
        />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-foreground">
          {url && usingDefault ? (
            <svg viewBox={defaultViewBox} fill="currentColor" className="h-8 w-8">
              <path d={defaultSvgPath} />
            </svg>
          ) : url ? (
            <img src={url} alt="Logo preview" className="max-h-10 max-w-10 object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">empty</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">
        No link provided → the logo slot renders empty. This is the permanent behavior, not a
        temporary placeholder.
        {usingDefault ? " Rendered as inline SVG, so it switches color with the theme toggle." : ""}
      </p>
    </div>
  )
}
