import * as React from "react"

import { ScrollArea, Separator } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const tags = Array.from({ length: 50 }).map((_, i, a) => "v1.2.0-beta." + (a.length - i))

function ScrollAreaDemo() {
  return (
    <div className="h-72 w-48 overflow-hidden rounded-md border p-2">
      <ScrollArea className="size-full">
        <div className="p-4">
          <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
          {tags.map((tag) => (
            <React.Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => <ScrollAreaDemo />,
    code: `<div className="h-72 w-48 overflow-hidden rounded-md border p-2">
  <ScrollArea className="size-full">
    <div className="p-4">
      <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
      {tags.map((tag) => (
        <Fragment key={tag}>
          <div className="text-sm">{tag}</div>
          <Separator className="my-2" />
        </Fragment>
      ))}
    </div>
  </ScrollArea>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "type",
    type: '"auto" | "always" | "scroll" | "hover"',
    default: '"hover"',
    description: "ScrollArea: Radix scroll-area visibility behavior for the scrollbar.",
  },
]

export function ScrollAreaShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Scroll Area</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/scroll-area.tsx
          </code>{" "}
          , with an internal overflow-detection addition (
          <code className="rounded bg-muted px-1 py-0.5 text-sm">data-scrollable-y</code>/
          <code className="rounded bg-muted px-1 py-0.5 text-sm">data-scrollable-x</code> on{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">Root</code>) so consumers can
          conditionally reserve gutter space only when content actually overflows — see CLAUDE.md&rsquo;s
          Scroll region protocol. This demo composes the two-layer pattern (an outer padded shell plus{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">size-full</code> on{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">ScrollArea</code>) instead of shadcn&rsquo;s
          own bare usage, so the scrollbar doesn&rsquo;t sit flush against the container&rsquo;s own border.
        </p>
      </div>
      <ExampleBrowser examples={examples} stageClassName="items-stretch" />
      <ApiReference rows={apiRows} />
    </div>
  )
}
