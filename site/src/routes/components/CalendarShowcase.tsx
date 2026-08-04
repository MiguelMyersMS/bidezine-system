import * as React from "react"

import { Calendar } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      captionLayout="dropdown"
    />
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => <CalendarDemo />,
    code: `<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-lg border"
  captionLayout="dropdown"
/>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "captionLayout",
    type: '"label" | "dropdown" | "dropdown-months" | "dropdown-years"',
    default: '"label"',
    description: "Calendar: layout of the month/year caption.",
  },
  {
    prop: "mode",
    type: '"single" | "multiple" | "range"',
    description: "Calendar: react-day-picker selection mode.",
  },
]

export function CalendarShowcase() {
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
      <ApiReference rows={apiRows} />
    </div>
  )
}
