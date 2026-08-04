import { Label } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Adapts reference/shadcn-ui/apps/v4/examples/radix/label-demo.tsx: the
 * source pairs Label with the Checkbox component, which hasn't been ported
 * yet (Checkbox is in the forms rollout batch). A plain native checkbox
 * stands in here so Label's htmlFor/peer-disabled behaviour is still
 * demonstrated without introducing a phantom dependency.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex gap-2">
        <input type="checkbox" id="terms" className="peer size-4" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
    ),
    code: `<div className="flex gap-2">
  <input type="checkbox" id="terms" className="peer size-4" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "className",
    type: "string",
    description: "Additional classes applied to the label.",
  }
]

export function LabelShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Label</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/label.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
