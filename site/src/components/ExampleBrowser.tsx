import { useState, type ReactNode } from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon } from "lucide-react"
import { Button, cn } from "@bidezine/system"

export interface ShowcaseExample {
  /** Section name, shown in the filter row. Keep it short — these are chips. */
  label: string
  /** Live render. A function so only the visible example mounts. */
  render: () => ReactNode
  /** Source snippet shown under "View code". */
  code: string
}

interface ExampleBrowserProps {
  examples: ShowcaseExample[]
  /** Index shown first. Defaults to 0. */
  defaultIndex?: number
  /** Min height of the preview stage. Raise it for overlays that open downward. */
  stageClassName?: string
}

/**
 * Replaces the long stack of Example sections with a filter row plus a single
 * preview. Same content, one section at a time, code collapsed by default.
 *
 * Only the selected example's render() runs, so a page with a dozen sections
 * mounts one subtree instead of twelve — worth it for the overlay-heavy pages.
 */
export function ExampleBrowser({
  examples,
  defaultIndex = 0,
  stageClassName,
}: ExampleBrowserProps) {
  const [active, setActive] = useState(defaultIndex)
  const [showCode, setShowCode] = useState(false)

  const example = examples[active]
  if (!example) return null

  return (
    <section className="flex flex-col gap-3">
      <div role="tablist" aria-label="Examples" className="flex flex-wrap gap-1.5">
        {examples.map((item, index) => (
          <Button
            key={item.label}
            role="tab"
            aria-selected={index === active}
            variant={index === active ? "default" : "outline"}
            size="xs"
            className="rounded-full"
            onClick={() => setActive(index)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div
          className={cn(
            "flex min-h-[200px] items-center justify-center p-8",
            stageClassName
          )}
        >
          {example.render()}
        </div>

        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {example.label}
          </span>
          <Button variant="ghost" size="xs" onClick={() => setShowCode(!showCode)}>
            {showCode ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {showCode ? "Hide code" : "View code"}
          </Button>
        </div>

        {showCode && <CodeBlock code={example.code} />}
      </div>
    </section>
  )
}

export function CodeBlock({
  code,
  label,
  className,
}: {
  code: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className={cn("relative border-t border-border bg-muted", className)}>
      {label && (
        <div className="px-3 pt-2 font-mono text-[11px] text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Copy code"
        className="absolute top-1.5 right-1.5"
        onClick={() => {
          void navigator.clipboard?.writeText(code)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1200)
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}
