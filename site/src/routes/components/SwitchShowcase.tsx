import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Label,
  Switch,
} from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/switch-demo.tsx and
 * switch-description.tsx as closely as possible.
 */
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
      <Example title="Demo">
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
      </Example>
      <Example title="With description">
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
      </Example>
    </div>
  )
}
