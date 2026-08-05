import {
  GitBranchIcon,
  Marker,
  MarkerContent,
  MarkerIcon,
  SearchIcon,
  Spinner,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full max-w-sm flex-col gap-8 py-6">
        <Marker>
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to a new branch</MarkerContent>
        </Marker>
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">Thinking...</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
      </div>
    ),
    code: `<Marker>
  <MarkerIcon><GitBranchIcon /></MarkerIcon>
  <MarkerContent>Switched to a new branch</MarkerContent>
</Marker>
<Marker variant="separator">
  <MarkerContent>Conversation compacted</MarkerContent>
</Marker>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: '"default" | "separator"',
    default: '"default"',
    description: "Marker: separator variant renders a centered divider style, without an icon slot.",
  },
]

export function MarkerShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Marker</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/marker.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
