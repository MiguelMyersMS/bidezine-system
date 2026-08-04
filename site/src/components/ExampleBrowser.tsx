import type React from "react"
import { useState } from "react"

/**
 * One-example-at-a-time viewer, replacing the long vertical stack of
 * <Example> blocks. Filter chips switch the single visible preview instead
 * of scrolling — the layout idea Claude (design) proposed, rebuilt here
 * against the real components with zero behavior changes (see
 * docs/infra/CLOUDFLARE.md history: only the page shell was ported, never
 * Claude's component reimplementations).
 */
export interface ShowcaseExample {
  label: string
  render: () => React.ReactNode
  code: string
}

export function ExampleBrowser({ examples }: { examples: ShowcaseExample[] }) {
  const [active, setActive] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const current = examples[active]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {examples.map((example, i) => (
          <button
            key={example.label}
            type="button"
            onClick={() => {
              setActive(i)
              setShowCode(false)
            }}
            aria-pressed={i === active}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
              (i === active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground")
            }
          >
            {example.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-40 items-center justify-center rounded-lg border border-border bg-card p-6">
        {current.render()}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showCode ? "Hide code" : "View code"}
        </button>
        {showCode && (
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
            <code>{current.code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
