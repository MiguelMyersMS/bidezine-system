import {
  Field,
  FieldDescription,
  FieldLabel,
  Textarea,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/textarea-demo.tsx and
 * textarea-field.tsx as closely as possible.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="max-w-sm">
        <Textarea placeholder="Type your message here." />
      </div>
    ),
    code: `<div className="max-w-sm">
  <Textarea placeholder="Type your message here." />
</div>`,
  },
  {
    label: "Field demo",
    render: () => (
      <div className="max-w-sm">
        <Field>
          <FieldLabel htmlFor="textarea-message">Message</FieldLabel>
          <FieldDescription>Enter your message below.</FieldDescription>
          <Textarea id="textarea-message" placeholder="Type your message here." />
        </Field>
      </div>
    ),
    code: `<div className="max-w-sm">
  <Field>
    <FieldLabel htmlFor="textarea-message">Message</FieldLabel>
    <FieldDescription>Enter your message below.</FieldDescription>
    <Textarea id="textarea-message" placeholder="Type your message here." />
  </Field>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "className",
    type: "string",
  }
]

export function TextareaShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Textarea</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/textarea.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
