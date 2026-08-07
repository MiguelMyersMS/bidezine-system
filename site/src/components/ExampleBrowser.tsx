import { useState, type ReactNode } from "react"
import {
  Button,
  Card,
  CardContent,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  cn,
  CopyIcon,
} from "@bidezine/system"

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
  /** Extra classes for the preview stage. Raise min-height for downward overlays. */
  stageClassName?: string
}

/**
 * Replaces the long stack of Example sections with a filter row plus a single
 * preview. Same content, one section at a time, code collapsed by default.
 *
 * Chrome is built entirely from @bidezine/system + its own tokens — no
 * parallel stylesheet. The chips are the system's own Button (`variant="ghost"`
 * as a base, `rounded-full` plus a thin `--border` and `--muted-foreground`
 * text via Tailwind utilities that resolve through the token pipeline), not a
 * hand-styled element. The preview frame is the system's Card.
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
        {examples.map((item, index) => {
          const isActive = index === active
          return (
            <Button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              variant="ghost"
              size="xs"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-full border font-medium",
                isActive
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Button>
          )
        })}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardContent
          className={cn(
            // contain-layout gives position:fixed descendants (e.g. Sidebar's
            // desktop rail) a containing block here instead of the real
            // viewport, so a demo stays inside its own preview box instead of
            // overlapping the site's own page chrome.
            "relative flex min-h-[200px] items-center justify-center overflow-hidden contain-layout p-[10px]",
            stageClassName
          )}
        >
          {example.render()}
        </CardContent>

        <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
          <span className="font-medium tracking-wide text-muted-foreground uppercase">
            {example.label}
          </span>
          <Button variant="ghost" size="xs" onClick={() => setShowCode(!showCode)}>
            {showCode ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {showCode ? "Hide code" : "View code"}
          </Button>
        </div>

        {showCode && <CodeBlock code={example.code} />}
      </Card>
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
    <div className={cn("relative border-t bg-muted", className)}>
      {label && (
        <div className="px-3 pt-2 font-mono text-[11px] text-muted-foreground">{label}</div>
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
