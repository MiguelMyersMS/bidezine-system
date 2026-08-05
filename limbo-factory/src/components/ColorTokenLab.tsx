import { Badge, Card, CardContent } from "@bidezine/system"
import type { ProposedToken } from "@/data/rail-sidebar"

/**
 * Q2's approval surface. Per token: title = the proposed bidezine name (extends the existing
 * --sidebar-* family), subtitle = what it's for + the origin's own name for traceability. Below
 * that, origin color (left) vs. bidezine candidate (right) side by side — the candidate is NOT
 * a copy of the origin; it's one of bidezine's OWN existing achromatic lightness stops (the same
 * oklch() values already used by --background/--sidebar/--secondary/--accent/--ring/etc in
 * src/styles/tokens.css), chosen so the rail's ramp lines up with a ramp bidezine already uses
 * elsewhere. All 9 are tentatively approved (per your review) — final sign-off is gated on seeing
 * them composed together in RailPreview above, not just as isolated swatches.
 */
export function ColorTokenLab({ tokens }: { tokens: ProposedToken[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Left = the origin's own color, verbatim (reference only, not a bidezine color). Right ={" "}
        <strong>a bidezine candidate, tentatively approved</strong> — reuses one of bidezine's
        existing lightness stops rather than copying the origin, so the rail's ramp matches the rest
        of the system. Toggle light/dark in the header to preview both app-theme variants.
      </p>
      <div className="flex flex-col gap-3">
        {tokens.map((t) => (
          <Card key={t.originName}>
            <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
              <div>
                <p className="font-mono text-sm font-semibold">{t.proposedVar}</p>
                <p className="text-xs text-muted-foreground">
                  {t.usage} · origin name: <span className="font-mono">{t.originName}</span>
                </p>
              </div>
              <div className="flex items-start justify-center gap-6">
                <div className="flex w-36 flex-col items-end gap-1">
                  <div
                    className="h-14 w-14 rounded-md border dark:hidden"
                    style={{ background: t.originLightHex }}
                  />
                  <div
                    className="hidden h-14 w-14 rounded-md border dark:block"
                    style={{ background: t.originDarkHex }}
                  />
                  <p className="w-full text-right font-mono text-[10px] text-muted-foreground">
                    <span className="dark:hidden">{t.originLightHex}</span>
                    <span className="hidden dark:inline">{t.originDarkHex}</span>
                  </p>
                  <Badge variant="outline" className="text-[9px]">
                    origin, verbatim
                  </Badge>
                </div>
                <span className="pt-5 text-muted-foreground" aria-hidden>
                  →
                </span>
                <div className="flex w-36 flex-col items-start gap-1">
                  <div
                    className="h-14 w-14 rounded-md border dark:hidden"
                    style={{ background: t.proposedLight }}
                  />
                  <div
                    className="hidden h-14 w-14 rounded-md border dark:block"
                    style={{ background: t.proposedDark }}
                  />
                  <p className="w-full text-left font-mono text-[10px] text-muted-foreground">
                    <span className="dark:hidden">{t.proposedLight}</span>
                    <span className="hidden dark:inline">{t.proposedDark}</span>
                  </p>
                  <Badge className="text-[9px]">tentatively approved</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tentatively approved — final sign-off pending against the full rail preview above,
                before authoring into tokens/base.tokens.json.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
