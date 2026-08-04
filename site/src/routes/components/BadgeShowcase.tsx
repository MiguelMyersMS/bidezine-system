import { Badge } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/badge-demo.tsx
 * verbatim, restructured as an ExampleBrowser (filter chips, one at a time)
 * instead of a single fixed demo.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Default",
    render: () => <Badge>Badge</Badge>,
    code: `<Badge>Badge</Badge>`,
  },
  {
    label: "Secondary",
    render: () => <Badge variant="secondary">Secondary</Badge>,
    code: `<Badge variant="secondary">Secondary</Badge>`,
  },
  {
    label: "Destructive",
    render: () => <Badge variant="destructive">Destructive</Badge>,
    code: `<Badge variant="destructive">Destructive</Badge>`,
  },
  {
    label: "Outline",
    render: () => <Badge variant="outline">Outline</Badge>,
    code: `<Badge variant="outline">Outline</Badge>`,
  },
  {
    label: "Ghost",
    render: () => <Badge variant="ghost">Ghost</Badge>,
    code: `<Badge variant="ghost">Ghost</Badge>`,
  },
  {
    label: "Link",
    render: () => (
      <Badge variant="link" asChild>
        <a href="#link">Link</a>
      </Badge>
    ),
    code: `<Badge variant="link" asChild>
  <a href="/docs">Link</a>
</Badge>`,
  },
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full flex-wrap justify-center gap-2">
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    ),
    code: `<Badge>Badge</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: `"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"`,
    default: `"default"`,
    description: "Visual style.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render props onto a single child element instead of a <span> (Radix Slot).",
  },
]

export function BadgeShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Badge</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/badge.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
