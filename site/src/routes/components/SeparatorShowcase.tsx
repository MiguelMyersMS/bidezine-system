import { Separator } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/separator-demo.tsx
 * verbatim, restructured as an ExampleBrowser (filter chips, one at a time)
 * instead of a single fixed demo.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Horizontal",
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
          A set of beautifully designed components that you can customize, extend, and
          build on.
        </div>
      </div>
    ),
    code: `<div className="flex flex-col gap-1.5">
  <div className="font-medium">shadcn/ui</div>
  <div className="text-muted-foreground">The Foundation for your Design System</div>
</div>
<Separator />
<div>A set of beautifully designed components…</div>`,
  },
  {
    label: "Vertical",
    render: () => (
      <div className="flex h-5 items-center gap-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    ),
    code: `<div className="flex h-5 items-center gap-4">
  <div>Blog</div>
  <Separator orientation="vertical" />
  <div>Docs</div>
  <Separator orientation="vertical" />
  <div>Source</div>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "orientation",
    type: `"horizontal" | "vertical"`,
    default: `"horizontal"`,
    description: "Direction of the line.",
  },
  {
    prop: "decorative",
    type: "boolean",
    default: "true",
    description: "Hides the line from assistive tech when true (Radix Separator prop).",
  },
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
