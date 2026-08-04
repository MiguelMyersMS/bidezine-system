import { GlobeIcon } from "lucide-react"

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  InputGroupAddon,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"] as const

const timezones = [
  {
    value: "Americas",
    items: [
      "(GMT-5) New York",
      "(GMT-8) Los Angeles",
      "(GMT-6) Chicago",
      "(GMT-5) Toronto",
      "(GMT-8) Vancouver",
      "(GMT-3) São Paulo",
    ],
  },
  {
    value: "Europe",
    items: [
      "(GMT+0) London",
      "(GMT+1) Paris",
      "(GMT+1) Berlin",
      "(GMT+1) Rome",
      "(GMT+1) Madrid",
      "(GMT+1) Amsterdam",
    ],
  },
  {
    value: "Asia/Pacific",
    items: [
      "(GMT+9) Tokyo",
      "(GMT+8) Shanghai",
      "(GMT+8) Singapore",
      "(GMT+4) Dubai",
      "(GMT+11) Sydney",
      "(GMT+9) Seoul",
    ],
  },
] as const

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/combobox-demo.tsx,
 * combobox-groups.tsx, and combobox-input-group.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Basic",
    render: () => (
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
    code: `<Combobox items={frameworks}>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No items found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
  },
  {
    label: "Grouped options",
    render: () => (
      <Combobox items={timezones}>
        <ComboboxInput placeholder="Select a timezone" />
        <ComboboxContent>
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(group, index) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                {index < timezones.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
    code: `<Combobox items={timezones}>
  <ComboboxInput placeholder="Select a timezone" />
  <ComboboxContent>
    <ComboboxEmpty>No timezones found.</ComboboxEmpty>
    <ComboboxList>
      {(group, index) => (
        <ComboboxGroup key={group.value} items={group.items}>
          <ComboboxLabel>{group.value}</ComboboxLabel>
          <ComboboxCollection>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxCollection>
          {index < timezones.length - 1 && <ComboboxSeparator />}
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
  },
  {
    label: "Input group addon",
    render: () => (
      <Combobox items={timezones}>
        <ComboboxInput placeholder="Select a timezone">
          <InputGroupAddon>
            <GlobeIcon />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent alignOffset={-28} className="w-60">
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(group) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ),
    code: `<Combobox items={timezones}>
  <ComboboxInput placeholder="Select a timezone">
    <InputGroupAddon>
      <GlobeIcon />
    </InputGroupAddon>
  </ComboboxInput>
  <ComboboxContent alignOffset={-28} className="w-60">
    <ComboboxEmpty>No timezones found.</ComboboxEmpty>
    <ComboboxList>
      {(group) => (
        <ComboboxGroup key={group.value} items={group.items}>
          <ComboboxLabel>{group.value}</ComboboxLabel>
          <ComboboxCollection>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "disabled",
    type: "boolean",
    default: "false",
  },
  {
    prop: "showTrigger",
    type: "boolean",
    default: "true",
  },
  {
    prop: "showClear",
    type: "boolean",
    default: "false",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "side",
    type: "\"top\" | \"right\" | \"bottom\" | \"left\"",
    default: "\"bottom\"",
  },
  {
    prop: "sideOffset",
    type: "number",
    default: "6",
  },
  {
    prop: "align",
    type: "\"start\" | \"center\" | \"end\"",
    default: "\"start\"",
  },
  {
    prop: "alignOffset",
    type: "number",
    default: "0",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function ComboboxShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Combobox</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/combobox.tsx
          </code>{" "}
          with only internal import-path fixes.
        </p>
      </div>
      <ExampleBrowser examples={examples} stageClassName="min-h-[320px]" />
      <ApiReference rows={apiRows1} title="ComboboxInput" />
      <ApiReference rows={apiRows2} title="ComboboxContent" />
    </div>
  )
}
