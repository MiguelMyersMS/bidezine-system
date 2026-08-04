import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/select-demo.tsx and
 * select-groups.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Select>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ),
    code: `<Select>
  <SelectTrigger className="w-full max-w-48">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="blueberry">Blueberry</SelectItem>
      <SelectItem value="grapes">Grapes</SelectItem>
      <SelectItem value="pineapple">Pineapple</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
  },
  {
    label: "Grouped options",
    render: () => (
      <Select>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="broccoli">Broccoli</SelectItem>
            <SelectItem value="spinach">Spinach</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ),
    code: `<Select>
  <SelectTrigger className="w-full max-w-48">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="blueberry">Blueberry</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Vegetables</SelectLabel>
      <SelectItem value="carrot">Carrot</SelectItem>
      <SelectItem value="broccoli">Broccoli</SelectItem>
      <SelectItem value="spinach">Spinach</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "size",
    type: "\"sm\" | \"default\"",
    default: "\"default\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "position",
    type: "\"item-aligned\" | \"popper\"",
    default: "\"item-aligned\"",
  },
  {
    prop: "align",
    type: "\"start\" | \"center\" | \"end\"",
    default: "\"center\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function SelectShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Select</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/select.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="SelectTrigger" />
      <ApiReference rows={apiRows2} title="SelectContent" />
    </div>
  )
}
