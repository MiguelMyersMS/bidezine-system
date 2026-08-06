import { Badge, Card, CardContent, cn } from "@bidezine/system"
import type { ProposedToken } from "@/data/rail-sidebar"
import { NEGATIVE_BADGE, POSITIVE_BADGE } from "@/lib/status-colors"

/**
 * Q2's approval surface. Per token: title = the proposed bidezine name (extends the existing
 * --sidebar-* family), subtitle = what it's for + the origin's own name for traceability. Below
 * that, origin color (left) vs. bidezine candidate (right) side by side — the candidate is NOT
 * a copy of the origin; it's one of bidezine's OWN existing achromatic lightness stops (the same
 * oklch() values already used by --background/--sidebar/--secondary/--accent/--ring/etc in
 * src/styles/tokens.css), chosen so the rail's ramp lines up with a ramp bidezine already uses
 * elsewhere. 9 of 10 are APPROVED (final sign-off given after review of the composed RailPreview
 * above, including two follow-up hex-based revisions to the hover/pressed/border-strong tokens).
 * The 10th (select-hover) is a newly proposed candidate awaiting your decision — it has no origin
 * equivalent at all, see its `proposalNote` in rail-sidebar.ts for why it's proposed anyway.
 */
export function ColorTokenLab({ tokens }: { tokens: ProposedToken[] }) {
  const approvedCount = tokens.filter((t) => t.approved !== false).length
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Left = the origin's own color, verbatim (reference only, not a bidezine color) — or "no origin
        equivalent" when the origin never modeled that state at all. Right ={" "}
        <strong>a bidezine candidate</strong> — reuses one of bidezine's existing lightness stops
        (or extends that same ramp one step further) rather than copying the origin, so the rail's ramp
        matches the rest of the system. {approvedCount}/{tokens.length} candidates have final sign-off.
        Toggle light/dark in the header to preview both app-theme variants.
      </p>
      <div className="flex flex-col gap-3">
        {tokens.map((t) => {
          const isApproved = t.approved !== false
          return (
          <Card key={t.originName}>
            <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
              <div>
                <p className="font-mono text-sm font-semibold">{t.proposedVar}</p>
                <p className="text-xs text-muted-foreground">
                  {t.usage}
                  {t.noOriginEquivalent ? null : (
                    <>
                      {" "}
                      · origin name: <span className="font-mono">{t.originName}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start justify-center gap-6">
                <div className="flex w-36 flex-col items-end gap-1">
                  {t.noOriginEquivalent ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed">
                      <span className="text-[9px] text-muted-foreground">n/a</span>
                    </div>
                  ) : (
                    <>
                      <div
                        className="h-14 w-14 rounded-md border dark:hidden"
                        style={{ background: t.originLightHex }}
                      />
                      <div
                        className="hidden h-14 w-14 rounded-md border dark:block"
                        style={{ background: t.originDarkHex }}
                      />
                    </>
                  )}
                  <p className="w-full text-right font-mono text-[10px] text-muted-foreground">
                    {t.noOriginEquivalent ? (
                      "no origin equivalent"
                    ) : (
                      <>
                        <span className="dark:hidden">{t.originLightHex}</span>
                        <span className="hidden dark:inline">{t.originDarkHex}</span>
                      </>
                    )}
                  </p>
                  <Badge variant="outline" className="text-[9px]">
                    {t.noOriginEquivalent ? "not in origin" : "origin, verbatim"}
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
                  <Badge
                    className={cn("text-[9px]", isApproved ? POSITIVE_BADGE : NEGATIVE_BADGE)}
                  >
                    {isApproved ? "approved" : "needs your decision"}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isApproved
                  ? "Approved — sourced from the composed rail preview above, ready to be authored into tokens/base.tokens.json at Build time."
                  : t.proposalNote}
              </p>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </div>
  )
}
