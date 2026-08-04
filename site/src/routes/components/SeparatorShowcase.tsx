import { Separator } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/separator-demo.tsx
 * verbatim.
 */
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
      <Example title="Demo">
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
      </Example>
    </div>
  )
}
