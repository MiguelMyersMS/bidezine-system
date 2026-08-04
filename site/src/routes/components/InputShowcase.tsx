import {
  Field,
  FieldDescription,
  FieldLabel,
  Input,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/input-demo.tsx and
 * input-file.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Field demo",
    render: () => (
      <div className="max-w-sm">
        <Field>
          <FieldLabel htmlFor="input-demo-api-key">API Key</FieldLabel>
          <Input id="input-demo-api-key" type="password" placeholder="sk-..." />
          <FieldDescription>
            Your API key is encrypted and stored securely.
          </FieldDescription>
        </Field>
      </div>
    ),
    code: `<div className="max-w-sm">
  <Field>
    <FieldLabel htmlFor="input-demo-api-key">API Key</FieldLabel>
    <Input id="input-demo-api-key" type="password" placeholder="sk-..." />
    <FieldDescription>
      Your API key is encrypted and stored securely.
    </FieldDescription>
  </Field>
</div>`,
  },
  {
    label: "File input",
    render: () => (
      <div className="max-w-sm">
        <Field>
          <FieldLabel htmlFor="input-demo-picture">Picture</FieldLabel>
          <Input id="input-demo-picture" type="file" />
          <FieldDescription>Select a picture to upload.</FieldDescription>
        </Field>
      </div>
    ),
    code: `<div className="max-w-sm">
  <Field>
    <FieldLabel htmlFor="input-demo-picture">Picture</FieldLabel>
    <Input id="input-demo-picture" type="file" />
    <FieldDescription>Select a picture to upload.</FieldDescription>
  </Field>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "type",
    type: "string",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function InputShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Input</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/input.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
