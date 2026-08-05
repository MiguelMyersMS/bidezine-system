import * as React from "react"

import {
  Button,
  ChevronsUpDownIcon as ChevronsUpDown,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex w-[350px] flex-col gap-2">
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold">Order #4189</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle details</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium">Shipped</span>
      </div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium">Shipping address</p>
          <p className="text-muted-foreground">100 Market St, San Francisco</p>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium">Items</p>
          <p className="text-muted-foreground">2x Studio Headphones</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => <CollapsibleDemo />,
    code: `<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <div className="flex items-center justify-between gap-4">
    <h4 className="text-sm font-semibold">Order #4189</h4>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="icon">
        <ChevronsUpDown />
      </Button>
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent>
    <div className="rounded-md border px-4 py-2 text-sm">
      <p className="font-medium">Shipping address</p>
    </div>
  </CollapsibleContent>
</Collapsible>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "open",
    type: "boolean",
    description: "Collapsible: controlled open state.",
  },
  {
    prop: "onOpenChange",
    type: "(open: boolean) => void",
    description: "Collapsible: called when the open state should change.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description: "CollapsibleTrigger: merges trigger behavior onto its child instead of rendering a button.",
  },
]

export function CollapsibleShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Collapsible</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/collapsible.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
