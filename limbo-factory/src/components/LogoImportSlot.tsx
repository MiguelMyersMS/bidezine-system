import { useState } from "react"
import { Input, Label } from "@bidezine/system"

/**
 * Standing rule from Q3: the AI must never pick or invent a logo/brand icon —
 * always ask the user for an image link to import. If none is supplied, the
 * slot renders empty (not a placeholder icon). Pre-filled here with the real
 * bidezine mark from the origin project, since that IS the correct logo for
 * Rail Sidebar specifically — not an AI-invented default.
 */
export function LogoImportSlot({ defaultUrl }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl ?? "")

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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/30">
          {url ? (
            <img src={url} alt="Logo preview" className="max-h-10 max-w-10 object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">empty</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">
        No link provided → the logo slot renders empty. This is the permanent behavior, not a
        temporary placeholder.
      </p>
    </div>
  )
}
