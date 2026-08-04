import { Slider } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/slider-demo.tsx and
 * slider-range.tsx as closely as possible.
 */
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
      <Example title="Single value">
        <Slider
          defaultValue={[75]}
          max={100}
          step={1}
          className="mx-auto w-full max-w-xs"
        />
      </Example>
      <Example title="Range">
        <Slider
          defaultValue={[25, 50]}
          max={100}
          step={5}
          className="mx-auto w-full max-w-xs"
        />
      </Example>
    </div>
  )
}
