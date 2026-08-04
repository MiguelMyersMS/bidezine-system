import { Bold, Italic, Underline } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/toggle-group-demo.tsx
 * and toggle-group-sizes.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <ToggleGroup variant="outline" type="multiple">
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
    code: `<ToggleGroup variant="outline" type="multiple">
  <ToggleGroupItem value="bold" aria-label="Toggle bold">
    <Bold />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Toggle italic">
    <Italic />
  </ToggleGroupItem>
  <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
    <Underline />
  </ToggleGroupItem>
</ToggleGroup>`,
  },
  {
    label: "Sizes",
    render: () => (
      <div className="flex flex-col gap-4">
        <ToggleGroup type="single" size="sm" defaultValue="top" variant="outline">
          <ToggleGroupItem value="top" aria-label="Toggle top">
            Top
          </ToggleGroupItem>
          <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
            Bottom
          </ToggleGroupItem>
          <ToggleGroupItem value="left" aria-label="Toggle left">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Toggle right">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" defaultValue="top" variant="outline">
          <ToggleGroupItem value="top" aria-label="Toggle top default">
            Top
          </ToggleGroupItem>
          <ToggleGroupItem value="bottom" aria-label="Toggle bottom default">
            Bottom
          </ToggleGroupItem>
          <ToggleGroupItem value="left" aria-label="Toggle left default">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Toggle right default">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    ),
    code: `<div className="flex flex-col gap-4">
  <ToggleGroup type="single" size="sm" defaultValue="top" variant="outline">
    <ToggleGroupItem value="top" aria-label="Toggle top">
      Top
    </ToggleGroupItem>
    <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
      Bottom
    </ToggleGroupItem>
    <ToggleGroupItem value="left" aria-label="Toggle left">
      Left
    </ToggleGroupItem>
    <ToggleGroupItem value="right" aria-label="Toggle right">
      Right
    </ToggleGroupItem>
  </ToggleGroup>
  <ToggleGroup type="single" defaultValue="top" variant="outline">
    <ToggleGroupItem value="top" aria-label="Toggle top default">
      Top
    </ToggleGroupItem>
    <ToggleGroupItem value="bottom" aria-label="Toggle bottom default">
      Bottom
    </ToggleGroupItem>
    <ToggleGroupItem value="left" aria-label="Toggle left default">
      Left
    </ToggleGroupItem>
    <ToggleGroupItem value="right" aria-label="Toggle right default">
      Right
    </ToggleGroupItem>
  </ToggleGroup>
</div>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "variant",
    type: "\"default\" | \"outline\"",
    default: "\"default\"",
  },
  {
    prop: "size",
    type: "\"sm\" | \"default\" | \"lg\"",
    default: "\"default\"",
  },
  {
    prop: "spacing",
    type: "number",
    default: "0",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "variant",
    type: "\"default\" | \"outline\"",
  },
  {
    prop: "size",
    type: "\"sm\" | \"default\" | \"lg\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function ToggleGroupShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Toggle Group</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/toggle-group.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="ToggleGroup" />
      <ApiReference rows={apiRows2} title="ToggleGroupItem" />
    </div>
  )
}
