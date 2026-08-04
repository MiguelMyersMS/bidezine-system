import { Skeleton } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/skeleton-demo.tsx
 * verbatim.
 */
export function SkeletonShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Skeleton</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/skeleton.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </Example>
    </div>
  )
}
