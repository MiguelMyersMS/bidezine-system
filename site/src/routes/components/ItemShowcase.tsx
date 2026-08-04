import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react"

import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full max-w-md flex-col gap-6">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Basic Item</ItemTitle>
            <ItemDescription>A simple item with title and description.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="outline" size="sm">
              Action
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline" size="sm" asChild>
          <a href="#verified-profile">
            <ItemMedia>
              <BadgeCheckIcon className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Your profile has been verified.</ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </a>
        </Item>
      </div>
    ),
    code: `<Item variant="outline">
  <ItemContent>
    <ItemTitle>Basic Item</ItemTitle>
    <ItemDescription>A simple item with title and description.</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="outline" size="sm">Action</Button>
  </ItemActions>
</Item>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: '"default" | "outline" | "muted"',
    default: '"default"',
    description: "Item: visual container style.",
  },
  {
    prop: "size",
    type: '"default" | "sm"',
    default: '"default"',
    description: "Item: padding/density.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description: "Item: render as the passed child element (Radix Slot pattern), e.g. an anchor.",
  },
]

export function ItemShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Item</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/item.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
