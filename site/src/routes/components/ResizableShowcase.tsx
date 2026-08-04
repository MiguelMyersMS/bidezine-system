import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function ResizableDemo() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="max-w-sm rounded-lg border">
      <ResizablePanel defaultSize="50%">
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold">One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="25%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => <ResizableDemo />,
    code: `<ResizablePanelGroup orientation="horizontal" className="max-w-sm rounded-lg border">
  <ResizablePanel defaultSize="50%">
    <div className="flex h-[200px] items-center justify-center p-6">
      <span className="font-semibold">One</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize="50%">
    <div className="flex h-full items-center justify-center p-6">
      <span className="font-semibold">Two</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "orientation",
    type: '"horizontal" | "vertical"',
    description: "ResizablePanelGroup: layout axis, passed through to react-resizable-panels.",
  },
  {
    prop: "defaultSize",
    type: "number | string",
    description: "ResizablePanel: initial size of the panel within its group.",
  },
  {
    prop: "withHandle",
    type: "boolean",
    default: "false",
    description: "ResizableHandle: shows a small grip icon on the drag handle.",
  },
]

export function ResizableShowcase() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Resizable</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/resizable.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
