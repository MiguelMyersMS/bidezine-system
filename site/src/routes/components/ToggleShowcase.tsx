import { BookmarkIcon } from "lucide-react"

import { Toggle } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/toggle-demo.tsx
 * verbatim.
 */
export function ToggleShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Toggle</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/toggle.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
          <BookmarkIcon className="group-data-[state=on]/toggle:fill-foreground" />
          Bookmark
        </Toggle>
      </Example>
    </div>
  )
}
