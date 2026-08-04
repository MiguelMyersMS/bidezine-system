import {
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Label,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/checkbox-demo.tsx
 * as closely as possible, restructured as an ExampleBrowser instead of a
 * single fixed demo.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <FieldGroup className="max-w-sm">
        <Field orientation="horizontal">
          <Checkbox id="terms-checkbox" name="terms-checkbox" />
          <Label htmlFor="terms-checkbox">Accept terms and conditions</Label>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="terms-checkbox-2" name="terms-checkbox-2" defaultChecked />
          <FieldContent>
            <FieldLabel htmlFor="terms-checkbox-2">
              Accept terms and conditions
            </FieldLabel>
            <FieldDescription>
              By clicking this checkbox, you agree to the terms.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal" data-disabled>
          <Checkbox id="toggle-checkbox" name="toggle-checkbox" disabled />
          <FieldLabel htmlFor="toggle-checkbox">Enable notifications</FieldLabel>
        </Field>
        <FieldLabel>
          <Field orientation="horizontal">
            <Checkbox id="toggle-checkbox-2" name="toggle-checkbox-2" />
            <FieldContent>
              <FieldTitle>Enable notifications</FieldTitle>
              <FieldDescription>
                You can enable or disable notifications at any time.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      </FieldGroup>
    ),
    code: `<Field orientation="horizontal">
  <Checkbox id="terms" name="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</Field>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "checked",
    type: "boolean | \"indeterminate\"",
    description: "Controlled checked state (Radix Checkbox prop).",
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
    description: "Disables the checkbox.",
  },
]

export function CheckboxShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Checkbox</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/checkbox.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
