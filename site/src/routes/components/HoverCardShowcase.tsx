import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@bidezine/system"
import { Example } from "./Example"

export function HoverCardShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Hover Card</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/hover-card.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <HoverCard openDelay={10} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button variant="link">Hover Here</Button>
          </HoverCardTrigger>
          <HoverCardContent className="flex w-64 flex-col gap-0.5">
            <div className="font-semibold">@nextjs</div>
            <div>The React Framework – created and maintained by @vercel.</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Joined December 2021
            </div>
          </HoverCardContent>
        </HoverCard>
      </Example>
      <Example title="Sides">
        <div className="flex flex-wrap justify-center gap-2">
          {(["left", "top", "bottom", "right"] as const).map((side) => (
            <HoverCard key={side} openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button variant="outline" className="capitalize">
                  {side}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side={side}>
                <div className="flex flex-col gap-1">
                  <h4 className="font-medium">Hover Card</h4>
                  <p>This hover card appears on the {side} side of the trigger.</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </Example>
    </div>
  )
}
