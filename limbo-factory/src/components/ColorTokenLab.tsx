import { Card, CardContent } from "@bidezine/system"
import type { ProposedToken } from "@/data/rail-sidebar"

/**
 * Q2's approval surface: every proposed dark-rail token, shown as a swatch pair
 * (this app's light theme value vs. its dark theme value), so you can approve
 * before anything is written to tokens/*.tokens.json. Toggle the header's
 * light/dark switch to see both — nothing here is a live token yet.
 */
export function ColorTokenLab({ tokens }: { tokens: ProposedToken[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Draft values only — sourced verbatim from the origin project's tokens.ts. Nothing here has been
        written to tokens/*.tokens.json. Toggle light/dark in the header to preview both.
      </p>
      <div className="flex flex-col gap-3">
        {tokens.map((t) => (
          <Card key={t.name}>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div
                  className="h-12 w-12 rounded-md border dark:hidden"
                  style={{ background: t.lightAppHex }}
                />
                <div
                  className="hidden h-12 w-12 rounded-md border dark:block"
                  style={{ background: t.darkAppHex }}
                />
                <p className="font-mono text-[10px] text-muted-foreground">
                  <span className="dark:hidden">{t.lightAppHex}</span>
                  <span className="hidden dark:inline">{t.darkAppHex}</span>
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.usage}</p>
              </div>
              <p className="w-full shrink-0 text-xs text-muted-foreground sm:w-56">
                Draft — pending your approval before authoring into tokens/base.tokens.json.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
