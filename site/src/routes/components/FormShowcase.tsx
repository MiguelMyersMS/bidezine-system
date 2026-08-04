import { useState } from "react"
import { useForm } from "react-hook-form"

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

type ContactFormValues = {
  name: string
  email: string
  role: string
  notes: string
}

/**
 * Adapts the reference form examples: shadcn's form docs pair these helpers
 * with react-hook-form + zod schema resolvers, but zod was not a dependency in
 * this workspace when the forms batch started. This showcase keeps the shipped
 * react-hook-form wiring and falls back to built-in rules plus a native submit
 * handler so Form can be verified without pulling the schema stack in early.
 */
function NativeValidationFlow() {
  const form = useForm<ContactFormValues>({
    defaultValues: {
      name: "",
      email: "",
      role: "viewer",
      notes: "",
    },
  })
  const [submitted, setSubmitted] = useState<ContactFormValues | null>(null)

  return (
    <Form {...form}>
      <form
        className="grid w-full max-w-md gap-6"
        onSubmit={form.handleSubmit((values) => setSubmitted(values))}
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Name is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Evil Rabbit" {...field} />
              </FormControl>
              <FormDescription>
                Shown with built-in react-hook-form rules instead of a zod schema.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The FormControl wrapper keeps the trigger wired to the field state.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          rules={{
            minLength: {
              value: 10,
              message: "Notes must be at least 10 characters.",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us what you need..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <Button type="submit">Submit</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset()
              setSubmitted(null)
            }}
          >
            Reset
          </Button>
        </div>
        {submitted && (
          <pre className="rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    </Form>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Native validation flow",
    render: () => <NativeValidationFlow />,
    code: `<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      rules={{ required: "Name is required." }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    ...
  </form>
</Form>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "control",
    type: "Control<TFieldValues>",
    description: "FormField: react-hook-form control object from useForm().",
  },
  {
    prop: "name",
    type: "FieldPath<TFieldValues>",
    description: "FormField: the field name to register.",
  },
  {
    prop: "rules",
    type: "RegisterOptions",
    description:
      "FormField: react-hook-form validation rules (used here instead of a zod resolver).",
  },
]

export function FormShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Form</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/form.tsx
          </code>{" "}
          with only internal import-path fixes.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
