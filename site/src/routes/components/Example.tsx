import type React from "react"

export function Example({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      <div className="rounded-lg border border-border bg-card p-6">
        {children}
      </div>
    </section>
  )
}
