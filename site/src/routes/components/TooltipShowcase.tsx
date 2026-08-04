import { SaveIcon } from "lucide-react"

import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    ),
    code: `<Tooltip>
  <TooltipTrigger asChild><Button variant="outline">Hover</Button></TooltipTrigger>
  <TooltipContent><p>Add to library</p></TooltipContent>
</Tooltip>`,
  },
  {
    label: "Keyboard shortcut",
    render: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon-sm">
            <SaveIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Save Changes <Kbd>S</Kbd>
        </TooltipContent>
      </Tooltip>
    ),
    code: `<Tooltip>
  <TooltipTrigger asChild><Button variant="outline" size="icon-sm"><SaveIcon /></Button></TooltipTrigger>
  <TooltipContent>Save Changes <Kbd>S</Kbd></TooltipContent>
</Tooltip>`,
  },
  {
    label: "Sides",
    render: () => (
      <div className="flex flex-wrap gap-2">
        {(["left", "top", "bottom", "right"] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline" className="w-fit capitalize">
                {side}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    ),
    code: `<Tooltip>
  <TooltipTrigger asChild><Button variant="outline">{side}</Button></TooltipTrigger>
  <TooltipContent side={side}><p>Add to library</p></TooltipContent>
</Tooltip>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "open / defaultOpen",
    type: "boolean",
    description: "Controlled/uncontrolled open state (Radix Tooltip prop).",
  },
  {
    prop: "side",
    type: `"top" | "right" | "bottom" | "left"`,
    default: `"top"`,
    description: "TooltipContent: which side of the trigger the tooltip renders on.",
  },
]

export function TooltipShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Tooltip</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/tooltip.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
