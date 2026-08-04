import * as React from "react"

import { ScrollArea, Separator } from "@bidezine/system"
import { Example } from "./Example"

const tags = Array.from({ length: 50 }).map((_, i, a) => "v1.2.0-beta." + (a.length - i))

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
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <ScrollArea className="h-72 w-48 rounded-md border">
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
      </Example>
    </div>
  )
}
