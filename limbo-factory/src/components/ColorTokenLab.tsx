import { Badge, Card, CardContent } from "@bidezine/system"
import type { ProposedToken } from "@/data/rail-sidebar"

/**
 * Q2's approval surface. Two SEPARATE things are shown per row, deliberately not merged into one:
 *  1. The swatch + hex — the origin's own color value, taken verbatim from its tokens.ts. This is
 *     NOT a bidezine-approved color. It hasn't been color-matched/harmonized to bidezine's palette
 *     yet — that's exactly the decision this tab exists to gate.
 *  2. The proposed CSS variable NAME — extends bidezine's existing --sidebar-* family (the closest
 *     current token group) rather than reusing the origin's own camelCase names. This is a naming
 *     proposal only; nothing is written to tokens/*.tokens.json until you approve both the name AND
 *     the (possibly adjusted) color here.
 * Toggle the header's light/dark switch to preview both app-theme values.
 */
export function ColorTokenLab({ tokens }: { tokens: ProposedToken[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Two things per row, not one: the swatch is the <strong>origin's own color, verbatim</strong> —
        not a bidezine color yet. The <code className="text-xs">--sidebar-rail-*</code> name is only a{" "}
        <strong>naming proposal</strong> (extends bidezine's existing <code className="text-xs">--sidebar-*</code>{" "}
        family). Neither the color nor the name is written to tokens/*.tokens.json until you approve
        both here. Toggle light/dark in the header to preview both app-theme values.
      </p>
      <div className="flex flex-col gap-3">
        {tokens.map((t) => (
          <Card key={t.originName}>
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
                <Badge variant="outline" className="text-[9px]">
                  origin, verbatim
                </Badge>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm">{t.proposedVar}</p>
                <p className="text-xs text-muted-foreground">
                  {t.usage} · origin name: <span className="font-mono">{t.originName}</span>
                </p>
              </div>
              <p className="w-full shrink-0 text-xs text-muted-foreground sm:w-56">
                Name + color both draft — pending your approval before authoring into
                tokens/base.tokens.json.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
