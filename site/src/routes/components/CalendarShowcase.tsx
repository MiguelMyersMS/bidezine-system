import * as React from "react"

import { Calendar } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const apiRows: ApiRow[] = [
  {
    prop: "showOutsideDays",
    type: "boolean",
    default: "true",
  },
  {
    prop: "captionLayout",
    type: "\"label\" | \"dropdown\" | \"dropdown-months\" | \"dropdown-years\"",
    default: "\"label\"",
  },
  {
    prop: "buttonVariant",
    type: "Button variant",
    default: "\"ghost\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function CalendarShowcase() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
        captionLayout="dropdown"
      />
    ),
    code: `<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-lg border"
  captionLayout="dropdown"
/>`,
  },
]


  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/calendar.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} title="Calendar" />
    </div>
  )
}
