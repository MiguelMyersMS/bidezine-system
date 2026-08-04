import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bidezine/system"

export interface ApiRow {
  prop: string
  /** Written as it appears in the component's own props type. */
  type: string
  /** Omit when the prop has no default. */
  default?: string
  description?: string
}

interface ApiReferenceProps {
  rows: ApiRow[]
  /** Heading; set it when a page documents more than one part (e.g. "CardHeader"). */
  title?: string
}

/**
 * Props table for a showcase page. Rows are written by hand per component,
 * mirroring the exported props type in src/ui/<component>.tsx — keep them in
 * sync when a variant is added.
 */
export function ApiReference({ rows, title = "API reference" }: ApiReferenceProps) {
  if (!rows.length) return null

  const hasDefaults = rows.some((row) => row.default)
  const hasDescriptions = rows.some((row) => row.description)

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prop</TableHead>
              <TableHead>Type</TableHead>
              {hasDefaults && <TableHead>Default</TableHead>}
              {hasDescriptions && <TableHead>Description</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.prop}>
                <TableCell>
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                    {row.prop}
                  </code>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <code className="font-mono text-xs text-muted-foreground">
                    {row.type}
                  </code>
                </TableCell>
                {hasDefaults && (
                  <TableCell>
                    {row.default ? (
                      <code className="font-mono text-xs text-muted-foreground">
                        {row.default}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                {hasDescriptions && (
                  <TableCell className="whitespace-normal text-muted-foreground">
                    {row.description}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
