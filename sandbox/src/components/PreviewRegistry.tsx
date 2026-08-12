import { RailNavStatusPreview } from "@/components/FullRailPreview"
import type { ProposedToken } from "@/data/rail-sidebar"

/**
 * Which components have a preview pane, by slug.
 *
 * This is the honest boundary of M5 step 2's generalisation. Phases, divergences,
 * categories, anchors and evidence are all DATA and come from the corpus, so the app is
 * genuinely N-component. A preview pane is not data: Rail Sidebar's is ~2,000 lines of
 * real, hand-built `@bidezine/system` composition, and the next occupant's will be its
 * own. Pretending otherwise would mean inventing a renderer that could draw an arbitrary
 * component from a database row, which is not a thing.
 *
 * So the registry is explicit, and a component with no entry still works — it shows its
 * phases and its full divergence list, with a stated "no preview registered" panel where
 * the pane would be. That keeps the app's view of the corpus identical to the corpus's own
 * (the stray `__dbg__` row included) rather than quietly hiding what it cannot draw.
 */

export type PreviewProps = {
  source: "origin" | "bidezine"
  tokens: ProposedToken[]
  height: number
}

export const PREVIEW_REGISTRY: Record<string, (props: PreviewProps) => React.ReactNode> = {
  "rail-sidebar": (props) => <RailNavStatusPreview {...props} />,
}

export function hasPreview(slug: string): boolean {
  return slug in PREVIEW_REGISTRY
}

export function NoPreviewRegistered({ slug }: { slug: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium">No preview registered for “{slug}”</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This component's divergences, categories and evidence all come from the corpus and are
          shown in full. A preview pane is per-occupant code rather than data — register one in{" "}
          <code className="text-[11px]">PREVIEW_REGISTRY</code> when this component gets a real
          translation to look at.
        </p>
      </div>
    </div>
  )
}
