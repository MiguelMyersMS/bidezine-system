import { SaveIcon } from "lucide-react"

import {
  Button,
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bidezine/system"
import { Example } from "./Example"

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
      <Example title="Demo">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </Example>
      <Example title="Keyboard shortcut">
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
      </Example>
      <Example title="Sides">
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
      </Example>
    </div>
  )
}
