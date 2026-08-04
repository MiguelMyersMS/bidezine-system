import { Slider } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/slider-demo.tsx and
 * slider-range.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Single value",
    render: () => (
      <Slider
        defaultValue={[75]}
        max={100}
        step={1}
        className="mx-auto w-full max-w-xs"
      />
    ),
    code: `<Slider
  defaultValue={[75]}
  max={100}
  step={1}
  className="mx-auto w-full max-w-xs"
/>`,
  },
  {
    label: "Range",
    render: () => (
      <Slider
        defaultValue={[25, 50]}
        max={100}
        step={5}
        className="mx-auto w-full max-w-xs"
      />
    ),
    code: `<Slider
  defaultValue={[25, 50]}
  max={100}
  step={5}
  className="mx-auto w-full max-w-xs"
/>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "min",
    type: "number",
    default: "0",
  },
  {
    prop: "max",
    type: "number",
    default: "100",
  },
  {
    prop: "defaultValue",
    type: "number[]",
  },
  {
    prop: "value",
    type: "number[]",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function SliderShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Slider</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
