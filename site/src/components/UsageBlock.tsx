/**
 * Lightweight per-component "docs" block (see project plan's scope-expansion
 * note: "bring everything - primitives, themes, CLI, docs"). We deliberately
 * did NOT build a shadcn-style scaffolding CLI - `@bidezine/system` is an
 * ordinary installable npm package (all Radix/vaul/recharts/etc. runtime
 * deps ship as `dependencies`, not copy-pasted per-project), so there is
 * nothing to install beyond the package itself. This block renders that
 * install + import usage for every showcase page from a single source of
 * truth (the nav-manifest display name), rather than hand-editing 59 files.
 */
interface UsageBlockProps {
  /** Display name from nav-manifest, e.g. "Native Select", "Input OTP". */
  name: string
}

function exportNameFor(name: string): string {
  // nav-manifest display names are already PascalCase words separated by
  // spaces (e.g. "Radio Group" -> RadioGroup, "Input OTP" -> InputOTP),
  // matching the real exported symbol in src/index.ts for every component.
  return name.replace(/\s+/g, "")
}

export function UsageBlock({ name }: UsageBlockProps) {
  const exportName = exportNameFor(name)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Usage
      </div>
      <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
        <code>npm install @bidezine/system</code>
      </pre>
      <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
        <code>{`import { ${exportName} } from "@bidezine/system"`}</code>
      </pre>
    </div>
  )
}
