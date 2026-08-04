import { Spinner } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Adapts reference/shadcn-ui/apps/v4/examples/radix/spinner-demo.tsx: the
 * source wraps Spinner in the Item component, which hasn't been ported yet
 * (Item is in the data-display rollout batch). Shown standalone at a few
 * sizes instead, without introducing a phantom dependency.
 */
export function SpinnerShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Spinner</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/spinner.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <div className="flex items-center gap-6">
          <Spinner className="size-4" />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
        </div>
      </Example>
    </div>
  )
}
