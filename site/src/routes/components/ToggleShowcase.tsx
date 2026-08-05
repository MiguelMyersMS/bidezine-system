import { BookmarkIcon, Toggle } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/toggle-demo.tsx
 * verbatim, restructured as an ExampleBrowser.
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
  <BookmarkIcon />
  Bookmark
</Toggle>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: `"default" | "outline"`,
    default: `"default"`,
    description: "Visual style of the toggle.",
  },
  {
    prop: "size",
    type: `"default" | "sm" | "lg"`,
    default: `"default"`,
    description: "Size of the toggle.",
  },
  {
    prop: "pressed / defaultPressed",
    type: "boolean",
    description: "Controlled/uncontrolled pressed state (Radix Toggle prop).",
  },
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
