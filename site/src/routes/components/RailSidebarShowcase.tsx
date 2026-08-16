import { FunctionalRailSidebar } from "@bidezine/system"

/**
 * The rail sidebar, rendered from the built package exactly as any consumer would get it.
 *
 * This page is the gate. The component carries its own default content — a deeply nested, badged
 * panel tree with a disabled leaf — so what you see here is the hardest case it has to handle, not a
 * flattering one. Look at it in both themes; the theme switcher is in the site header.
 *
 * Worth knowing while reviewing: the rail sets its own dark surface regardless of theme, so the thing
 * that changes between light and dark is the canvas around it and the panel, not the rail itself.
 */
export function RailSidebarShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium">Rail sidebar</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          A collapsed icon rail with an expanding, resizable panel. Composed entirely from bidezine
          primitives — <code className="text-xs">Button</code>, <code className="text-xs">Tooltip</code>,{" "}
          <code className="text-xs">ScrollArea</code>, <code className="text-xs">DropdownMenu</code>,{" "}
          <code className="text-xs">Collapsible</code>, <code className="text-xs">Resizable</code> — and
          the generated Fluent icon set.
        </p>
      </div>

      {/*
        A fixed height, because the rail is a full-height chrome element: it measures its own
        available space to decide how many nav icons fit before overflowing into the "More" menu
        (useOverflowFit). Given an unbounded height it would never overflow and the overflow menu —
        one of the more interesting things to look at here — would never appear.
      */}
      <div className="bg-background h-[720px] overflow-hidden rounded-xl border">
        <FunctionalRailSidebar />
      </div>
    </div>
  )
}
