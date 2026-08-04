/**
 * Props table for a showcase page, keyed off the real component's exported
 * prop types (see each *Showcase.tsx's `api` array, hand-verified against
 * src/ui/*.tsx and dist/index.d.ts — not guessed or ported from any
 * recreation). Renders nothing if a showcase hasn't defined one yet, so
 * rollout can stay progressive across all 59 components.
 */
export interface ApiRow {
  prop: string
  type: string
  default?: string
  description?: string
}

export function ApiReference({ rows }: { rows: ApiRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        API Reference
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Prop</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Default</th>
              <th className="px-4 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.prop} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{row.prop}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {row.type}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {row.default ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {row.description ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
