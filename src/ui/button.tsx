"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"

/**
 * `ghost`'s own `active:` rule (added alongside its pre-existing `hover:`) is a deliberate
 * divergence from shadcn's real upstream source, which ships zero built-in pressed/mousedown
 * background for ANY Button variant (verified byte-identical against reference/shadcn-ui's own
 * button.tsx before this was added). It reuses the exact same `--accent` token pair the variant's
 * own `hover:` already uses — never a new/invented color — mirroring the identical, already-
 * established `active:bg-sidebar-accent active:text-sidebar-accent-foreground` convention on this
 * system's own `SidebarMenuButton` (src/ui/sidebar.tsx). See CLAUDE.md's Primitive Fidelity
 * Checklist item 26 for the rule this codifies: before proposing ANY new color for an interactive
 * state, check whether an existing bidezine primitive already implements that same state semantic,
 * and reuse its exact token rather than inventing a new one.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-control whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground dark:hover:bg-accent/50 dark:active:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  children,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const isSelected = props["aria-pressed"] === true || props["aria-pressed"] === "true"
  const actionIcon = useActionIconFill<HTMLButtonElement>({
    active: isSelected,
    disabled,
  })
  const renderedChildren = fillActionIcons(children, actionIcon.filled)

  return (
    <Comp
      ref={actionIcon.ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, className }))}
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
      {renderedChildren}
    </Comp>
  )
}

export { Button, buttonVariants }
