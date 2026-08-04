import * as React from "react"

import { Calendar } from "@bidezine/system"
import { Example } from "./Example"

export function CalendarShowcase() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

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
      <Example title="Demo">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border"
          captionLayout="dropdown"
        />
      </Example>
    </div>
  )
}
