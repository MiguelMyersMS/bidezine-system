import { BookmarkIcon } from "lucide-react"

import { Toggle } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/toggle-demo.tsx
 * verbatim.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
        <BookmarkIcon className="group-data-[state=on]/toggle:fill-foreground" />
        Bookmark
      </Toggle>
    ),
    code: `<Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
  <BookmarkIcon className="group-data-[state=on]/toggle:fill-foreground" />
  Bookmark
</Toggle>`,
  },
]

const apiRows: ApiRow[] = [
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
    prop: "className",
    type: "string",
  }
]

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
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
