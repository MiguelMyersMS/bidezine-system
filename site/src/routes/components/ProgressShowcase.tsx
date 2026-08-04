import * as React from "react"
import { Progress } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/progress-demo.tsx
 * verbatim.
 */
function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress value={progress} className="w-[60%]" />
}

export function ProgressShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/progress.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <ProgressDemo />
      </Example>
    </div>
  )
}
