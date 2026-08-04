import { LoaderIcon, Search } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Spinner,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/input-group-demo.tsx
 * and input-group-spinner.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Search",
    render: () => (
      <InputGroup className="max-w-xs">
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
      </InputGroup>
    ),
    code: `<InputGroup className="max-w-xs">
  <InputGroupInput placeholder="Search..." />
  <InputGroupAddon>
    <Search />
  </InputGroupAddon>
  <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
</InputGroup>`,
  },
  {
    label: "Loading states",
    render: () => (
      <div className="grid w-full max-w-sm gap-4">
        <InputGroup>
          <InputGroupInput placeholder="Searching..." />
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Processing..." />
          <InputGroupAddon>
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Saving changes..." />
          <InputGroupAddon align="inline-end">
            <InputGroupText>Saving...</InputGroupText>
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Refreshing data..." />
          <InputGroupAddon>
            <LoaderIcon className="animate-spin" />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InputGroupText className="text-muted-foreground">
              Please wait...
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    ),
    code: `<div className="grid w-full max-w-sm gap-4">
  <InputGroup>
    <InputGroupInput placeholder="Searching..." />
    <InputGroupAddon align="inline-end">
      <Spinner />
    </InputGroupAddon>
  </InputGroup>
  <InputGroup>
    <InputGroupInput placeholder="Processing..." />
    <InputGroupAddon>
      <Spinner />
    </InputGroupAddon>
  </InputGroup>
  <InputGroup>
    <InputGroupInput placeholder="Saving changes..." />
    <InputGroupAddon align="inline-end">
      <InputGroupText>Saving...</InputGroupText>
      <Spinner />
    </InputGroupAddon>
  </InputGroup>
  <InputGroup>
    <InputGroupInput placeholder="Refreshing data..." />
    <InputGroupAddon>
      <LoaderIcon className="animate-spin" />
    </InputGroupAddon>
    <InputGroupAddon align="inline-end">
      <InputGroupText className="text-muted-foreground">
        Please wait...
      </InputGroupText>
    </InputGroupAddon>
  </InputGroup>
</div>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "align",
    type: "\"inline-start\" | \"inline-end\" | \"block-start\" | \"block-end\"",
    default: "\"inline-start\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "type",
    type: "\"button\" | \"submit\" | \"reset\"",
    default: "\"button\"",
  },
  {
    prop: "variant",
    type: "\"ghost\" | \"default\" | \"secondary\" | \"destructive\" | \"outline\" | \"link\"",
    default: "\"ghost\"",
  },
  {
    prop: "size",
    type: "\"xs\" | \"sm\" | \"default\" | \"lg\" | \"icon\" | \"icon-xs\" | \"icon-sm\" | \"icon-lg\"",
    default: "\"xs\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function InputGroupShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Input Group</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/input-group.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="InputGroupAddon" />
      <ApiReference rows={apiRows2} title="InputGroupButton" />
    </div>
  )
}
