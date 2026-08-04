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
 * switch-description.tsx as closely as possible.
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
    code: `<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`,
  },
  {
    label: "With description",
    render: () => (
      <div className="max-w-sm">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="switch-focus-mode">
              Share across devices
            </FieldLabel>
            <FieldDescription>
              Focus is shared across devices, and turns off when you leave the app.
            </FieldDescription>
          </FieldContent>
          <Switch id="switch-focus-mode" />
        </Field>
      </div>
    ),
    code: `<div className="max-w-sm">
  <Field orientation="horizontal">
    <FieldContent>
      <FieldLabel htmlFor="switch-focus-mode">
        Share across devices
      </FieldLabel>
      <FieldDescription>
        Focus is shared across devices, and turns off when you leave the app.
      </FieldDescription>
    </FieldContent>
    <Switch id="switch-focus-mode" />
  </Field>
</div>`,
  },
]

const apiRows: ApiRow[] = [
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
