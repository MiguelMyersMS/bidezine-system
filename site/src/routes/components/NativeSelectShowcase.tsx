import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/native-select-demo.tsx
 * and native-select-groups.tsx as closely as possible, restructured as an
 * ExampleBrowser instead of a stack of fixed demos.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <NativeSelect>
        <NativeSelectOption value="">Select status</NativeSelectOption>
        <NativeSelectOption value="todo">Todo</NativeSelectOption>
        <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
        <NativeSelectOption value="done">Done</NativeSelectOption>
        <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
      </NativeSelect>
    ),
    code: `<NativeSelect>
  <NativeSelectOption value="">Select status</NativeSelectOption>
  <NativeSelectOption value="todo">Todo</NativeSelectOption>
  ...
</NativeSelect>`,
  },
  {
    label: "Grouped options",
    render: () => (
      <NativeSelect>
        <NativeSelectOption value="">Select department</NativeSelectOption>
        <NativeSelectOptGroup label="Engineering">
          <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
          <NativeSelectOption value="backend">Backend</NativeSelectOption>
          <NativeSelectOption value="devops">DevOps</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Sales">
          <NativeSelectOption value="sales-rep">Sales Rep</NativeSelectOption>
          <NativeSelectOption value="account-manager">
            Account Manager
          </NativeSelectOption>
          <NativeSelectOption value="sales-director">
            Sales Director
          </NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Operations">
          <NativeSelectOption value="support">Customer Support</NativeSelectOption>
          <NativeSelectOption value="product-manager">
            Product Manager
          </NativeSelectOption>
          <NativeSelectOption value="ops-manager">
            Operations Manager
          </NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    ),
    code: `<NativeSelect>
  <NativeSelectOptGroup label="Engineering">
    <NativeSelectOption value="frontend">Frontend</NativeSelectOption>
    ...
  </NativeSelectOptGroup>
</NativeSelect>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "value / defaultValue",
    type: "string",
    description: "Controlled/uncontrolled selected value (native select prop).",
  },
  {
    prop: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the native select.",
  },
]

export function NativeSelectShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Native Select</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/native-select.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
