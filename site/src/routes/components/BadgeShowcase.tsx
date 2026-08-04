import { Badge } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/badge-demo.tsx
 * verbatim.
 */
const examples: ShowcaseExample[] = [
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
    code: `<div className="flex w-full flex-wrap justify-center gap-2">
  <Badge>Badge</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="outline">Outline</Badge>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: "\"default\" | \"secondary\" | \"destructive\" | \"outline\" | \"ghost\" | \"link\"",
    default: "\"default\"",
    description: "Visual style.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description: "Render onto a single child element via Radix Slot.",
  },
  {
    prop: "className",
    type: "string",
    description: "Additional classes applied to the badge.",
  }
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
