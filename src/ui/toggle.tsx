"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-control whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-focus focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-elevation-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // Issue 07e: height/min-w rewired to the shared control-height-*
        // ladder (Finding 1, no new semantic — the ladder was already
        // named for the job). lg's own padding is a genuine second job on
        // padding-10 (Finding 2), now toggle-padding-x-lg. default's own
        // px-2 was re-adjudicated by Issue 07f: a height-paired,
        // unconditional inset distinct from every other padding-8
        // semantic, but its only consumer in src/ui, so it stays raw
        // rather than become a semantic that is really just this value
        // with a longer name. sm's own px-1.5 stays raw too — still
        // single-file against padding-6, out of this issue's scope.
        default: "h-control-height-default min-w-control-height-default px-2",
        sm: "h-control-height-sm min-w-control-height-sm px-1.5",
        lg: "h-control-height-lg min-w-control-height-lg px-toggle-padding-x-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  children,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  const actionIcon = useActionIconFill<HTMLButtonElement>({ disabled })

  return (
    <TogglePrimitive.Root
      ref={actionIcon.ref}
      data-slot="toggle"
      disabled={disabled}
      className={cn(toggleVariants({ variant, size, className }))}
      onMouseDown={(event) => {
        actionIcon.onMouseDown()
        onMouseDown?.(event)
      }}
      onMouseEnter={(event) => {
        actionIcon.onMouseEnter()
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        actionIcon.onMouseLeave()
        onMouseLeave?.(event)
      }}
      onMouseUp={(event) => {
        actionIcon.onMouseUp()
        onMouseUp?.(event)
      }}
      {...props}
    >
      {fillActionIcons(children, actionIcon.filled)}
    </TogglePrimitive.Root>
  )
}

export { Toggle, toggleVariants }
