import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // Issue 07e: px-1 rewired to kbd-padding-x (Finding 2 — a
        // horizontal job, a different CSS axis from input-padding-y's
        // vertical job, even though both point at padding-4 today).
        // h-5/min-w-5 (20px) stay raw — no rung of the control-height-*
        // ladder matches 20px, and forcing one on would change the
        // rendered pixel; single consumer, reported not authored.
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-kbd-padding-x text-control-sm text-muted-foreground select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
