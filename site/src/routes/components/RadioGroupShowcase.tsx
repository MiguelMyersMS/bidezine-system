import { Label, RadioGroup, RadioGroupItem } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/radio-group-demo.tsx
 * verbatim.
 */
export function RadioGroupShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Radio Group</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/radio-group.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <RadioGroup defaultValue="comfortable" className="w-fit">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="default" id="radio-r1" />
            <Label htmlFor="radio-r1">Default</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="comfortable" id="radio-r2" />
            <Label htmlFor="radio-r2">Comfortable</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="compact" id="radio-r3" />
            <Label htmlFor="radio-r3">Compact</Label>
          </div>
        </RadioGroup>
      </Example>
    </div>
  )
}
