import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Label,
  Switch,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/switch-demo.tsx and
 * switch-description.tsx as closely as possible, restructured as an
 * ExampleBrowser instead of a stack of fixed demos.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex items-center space-x-2">
        <Switch id="airplane-mode" />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    ),
    code: `<Switch id="airplane-mode" />
<Label htmlFor="airplane-mode">Airplane Mode</Label>`,
  },
  {
    label: "With description",
    render: () => (
      <div className="max-w-sm">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="switch-focus-mode">Share across devices</FieldLabel>
            <FieldDescription>
              Focus is shared across devices, and turns off when you leave the app.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-focus-mode" />
        </Field>
      </div>
    ),
    code: `<Field orientation="horizontal">
  <FieldContent>
    <FieldLabel htmlFor="focus-mode">Share across devices</FieldLabel>
    <FieldDescription>Focus is shared across devices…</FieldDescription>
  </FieldContent>
  <Switch id="focus-mode" />
</Field>`,
  },
  {
    label: "Disabled",
    render: () => (
      <div className="flex items-center space-x-2">
        <Switch id="switch-disabled" disabled />
        <Label htmlFor="switch-disabled">Disabled</Label>
      </div>
    ),
    code: `<Switch id="switch-disabled" disabled />
<Label htmlFor="switch-disabled">Disabled</Label>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "checked",
    type: "boolean",
    description: "Controlled checked state (Radix Switch prop).",
  },
  {
    prop: "defaultChecked",
    type: "boolean",
    description: "Uncontrolled initial checked state.",
  },
  {
    prop: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the switch.",
  },
]

export function SwitchShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Switch</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/switch.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
