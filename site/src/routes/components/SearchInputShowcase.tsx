import { useState } from "react"
import { SearchInput } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function BasicDemo() {
  return <SearchInput className="max-w-sm" placeholder="Search..." />
}

function ControlledDemo() {
  const [value, setValue] = useState("")
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Controlled search..."
      />
      <p className="text-xs text-muted-foreground">
        Current value: <code>{JSON.stringify(value)}</code>
      </p>
    </div>
  )
}

function DisabledDemo() {
  return (
    <SearchInput
      className="max-w-sm"
      defaultValue="Locked query"
      disabled
      placeholder="Search..."
    />
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Basic",
    render: () => <BasicDemo />,
    code: `<SearchInput placeholder="Search..." />`,
  },
  {
    label: "Controlled",
    render: () => <ControlledDemo />,
    code: `const [value, setValue] = useState("")

<SearchInput
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Controlled search..."
/>`,
  },
  {
    label: "Disabled",
    render: () => <DisabledDemo />,
    code: `<SearchInput defaultValue="Locked query" disabled placeholder="Search..." />`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "value / defaultValue",
    type: "string",
    description: "Standard controlled/uncontrolled text value, same as a native input.",
  },
  {
    prop: "onChange",
    type: "(e: ChangeEvent<HTMLInputElement>) => void",
    description: "Fires on every keystroke and on programmatic clear (click or Escape).",
  },
  {
    prop: "onClear",
    type: "() => void",
    description: "Called after the clear button (or Escape) clears the field.",
  },
  {
    prop: "clearLabel",
    type: "string",
    default: `"Clear search"`,
    description: "Accessible label for the clear button.",
  },
  {
    prop: "inputClassName",
    type: "string",
    description: "className applied to the actual <input> element, not the outer container.",
  },
  {
    prop: "disabled",
    type: "boolean",
    description: "Disables the input and suppresses the clear button entirely.",
  },
]

export function SearchInputShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Search Input</h1>
        <p className="mt-2 text-muted-foreground">
          Not part of shadcn&rsquo;s own upstream registry &mdash; shadcn only ever
          demonstrates a search-style field as an ad-hoc{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">InputGroup</code>{" "}
          composition in its own examples, with no dedicated component of its own. This is
          a deliberate addition, built entirely from bidezine&rsquo;s own already-shipped{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">InputGroup</code>/
          <code className="rounded bg-muted px-1 py-0.5 text-sm">InputGroupButton</code>{" "}
          primitives &mdash; it reuses the same validated clear (X) button pattern shipped in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">CommandInput</code>: a
          reserved 24&times;24px slot that never shifts layout, click-to-clear with
          refocus, and Escape-to-clear that doesn&rsquo;t bubble into a parent
          dialog/sheet/dropdown.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
