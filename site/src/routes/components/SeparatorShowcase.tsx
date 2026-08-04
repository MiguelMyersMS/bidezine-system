import { Separator } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/separator-demo.tsx
 * verbatim.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex max-w-sm flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <div className="leading-none font-medium">shadcn/ui</div>
          <div className="text-muted-foreground">
            The Foundation for your Design System
          </div>
        </div>
        <Separator />
        <div>
          A set of beautifully designed components that you can customize,
          extend, and build on.
        </div>
      </div>
    ),
    code: `<div className="flex max-w-sm flex-col gap-4 text-sm">
  <div className="flex flex-col gap-1.5">
    <div className="leading-none font-medium">shadcn/ui</div>
    <div className="text-muted-foreground">
      The Foundation for your Design System
    </div>
  </div>
  <Separator />
  <div>
    A set of beautifully designed components that you can customize,
    extend, and build on.
  </div>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "orientation",
    type: "\"horizontal\" | \"vertical\"",
    default: "\"horizontal\"",
    description: "Axis used to size the separator.",
  },
  {
    prop: "decorative",
    type: "boolean",
    default: "true",
    description: "Marks the separator as decorative for assistive tech.",
  },
  {
    prop: "className",
    type: "string",
    description: "Additional classes applied to the separator.",
  }
]

export function SeparatorShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Separator</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/separator.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
