import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@bidezine/system"
import { CodeBlock } from "./ExampleBrowser"

const MANAGERS = {
  pnpm: "pnpm add @bidezine/system",
  npm: "npm install @bidezine/system",
  yarn: "yarn add @bidezine/system",
  bun: "bun add @bidezine/system",
} as const

type Manager = keyof typeof MANAGERS

interface InstallProps {
  /** Exported symbol for the import line, e.g. "RadioGroup". */
  exportName: string
}

/**
 * Replaces UsageBlock. Same content — install command plus import line — with
 * the command switchable per package manager.
 *
 * There is no scaffolding CLI on purpose: @bidezine/system is an ordinary
 * installable package (Radix, vaul, recharts et al. ship as dependencies), so
 * installing the package is the whole install step.
 */
export function Install({ exportName }: InstallProps) {
  const [manager, setManager] = useState<Manager>("pnpm")

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-3 text-lg font-semibold">Installation</h2>
        <Tabs value={manager} onValueChange={(value) => setManager(value as Manager)}>
          <TabsList variant="line">
            {(Object.keys(MANAGERS) as Manager[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {key}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <CodeBlock code={MANAGERS[manager]} label="terminal" className="border-t-0" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Usage</h2>
        <div className="overflow-hidden rounded-md border border-border">
          <CodeBlock
            code={`import { ${exportName} } from "@bidezine/system"`}
            className="border-t-0"
          />
        </div>
      </div>
    </section>
  )
}
