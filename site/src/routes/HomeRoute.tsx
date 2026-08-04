import { navManifest } from "@/nav-manifest"

export function HomeRoute() {
  const total = navManifest.flatMap((c) => c.components).length
  const ready = navManifest
    .flatMap((c) => c.components)
    .filter((c) => c.status === "ready").length

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">bidezine/system showcase</h1>
      <p className="mt-2 text-muted-foreground">
        Every component from shadcn/ui, reproduced through{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">@bidezine/system</code>,
        verified against the source, then adjusted to taste.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        {ready} of {total} components ported so far. Pick one from the sidebar to see it live.
      </p>
    </div>
  )
}
