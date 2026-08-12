"use client"

import * as React from "react"
import { Command as CommandPrimitive, useCommandState } from "cmdk"
import { SearchIcon, XIcon } from "@/icons/generated"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog"
import { ScrollArea, useScrollAreaOverflow } from "@/ui/scroll-area"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        <Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Deliberate divergence from shadcn's own real source (which renders `SearchIcon` +
 * `CommandPrimitive.Input` only) — a clear (X) button is added, per the approved A-6/L-5 plan
 * (validated first in `sandbox`'s `SearchClearButtonLab`). cmdk's own internal `search` store
 * value is kept in sync in BOTH controlled and uncontrolled modes (cmdk's `Input` implementation
 * pushes a controlled `value` prop into its internal store via an effect), so reading it via
 * `useCommandState` correctly reflects the input's real current text either way — this avoids
 * needing to know whether the consumer passed `value`/`onValueChange` at all.
 *
 * Clearing has to go through the underlying native `<input>` element rather than any cmdk API,
 * because cmdk's `Input` only exposes an `onChange`-driven path (internal `setState` when
 * uncontrolled, or the consumer's own `onValueChange` when controlled) — there is no public
 * imperative "set value" method. Using the native property setter + a real `input` event fires
 * that exact same `onChange` path cmdk already wires up, so clearing behaves identically to the
 * user deleting the text themselves in either mode.
 */
function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const search = useCommandState((state) => state.search)
  const hasValue = search.length > 0
  const disabled = props.disabled

  const clear = () => {
    const input = inputRef.current
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set
    setter?.call(input, "")
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.focus()
  }

  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={inputRef}
        data-slot="command-input"
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
        onKeyDown={(event) => {
          props.onKeyDown?.(event)
          // Escape clears the query first instead of bubbling up to close a parent
          // dialog/sheet/dropdown this search box may be nested inside (CommandDialog's own
          // Radix Dialog closes on Escape by default) — matches origin's D3 contract.
          if (event.key === "Escape" && hasValue) {
            event.stopPropagation()
            clear()
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Clear search"
        aria-hidden={!hasValue}
        tabIndex={hasValue ? 0 : -1}
        disabled={disabled}
        className={cn("shrink-0", !hasValue && "invisible")}
        onClick={clear}
      >
        <XIcon />
      </Button>
    </div>
  )
}

/**
 * Deliberate divergence from shadcn's own real source (which uses a plain `overflow-x-hidden
 * overflow-y-auto` div here) — a real `ScrollArea` is composed instead, per the two-layer scroll
 * region pattern (see CLAUDE.md's "Scroll region protocol"). `ScrollArea` wraps
 * `CommandPrimitive.List` from the OUTSIDE rather than nesting inside it: cmdk's own `List` renders
 * an internal, unstyled `[cmdk-list-sizer]` wrapper around its children (used only for cmdk's own
 * optional `--cmdk-list-height` animation hook, which this codebase does not use, and for filtering
 * DOM reordering) that a naively-nested `ScrollArea` would need a fragile flex-chain of arbitrary
 * descendant selectors to reach through. Wrapping from the outside avoids disturbing that internal
 * structure (and cmdk's own `typeof children === "function"` children-resolution isn't touched
 * either) — `List` itself becomes ordinary flowed content inside `ScrollArea`'s viewport, and simply
 * being taller than the `max-h-[300px]` cap (now on `ScrollArea`) is what triggers scrolling.
 * `scroll-py-1` (scroll-padding, for keyboard-nav `scrollIntoView` clearance) moves onto
 * `ScrollArea`'s own internal viewport (targeted via a descendant selector, since the primitive
 * doesn't expose a viewport-specific className prop) — it must live on the actual scrolling element.
 *
 * The consumer-facing `className` prop lands on `ScrollArea` (the element that actually owns the
 * height cap and clipping), matching this component's pre-migration contract where `className`
 * could override the `max-h-[300px]`/overflow behavior directly — not on the inner `List`, which no
 * longer owns any height/overflow of its own and would silently swallow such an override. The end-
 * side gutter (`pe-2`, applied conditionally via `useScrollAreaOverflow()`) is conditional on
 * `ScrollArea` actually reporting overflow, never a bare unconditional `pe-2` — see CLAUDE.md's
 * protocol note on why an unconditional gutter is its own bug (dead empty space whenever content
 * fits without scrolling). The conditional class is read via React Context rather than a CSS
 * `group-data-*` selector because the latter matches ANY ancestor sharing the same group name/data
 * attribute (not just the nearest one), which silently breaks whenever `ScrollArea` instances nest
 * anywhere in the page (see scroll-area.tsx's authoring note).
 */
function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <ScrollArea
      className={cn(
        "max-h-[300px] overflow-hidden [&_[data-slot=scroll-area-viewport]]:scroll-py-1",
        className
      )}
    >
      <CommandListInner {...props} />
    </ScrollArea>
  )
}

/**
 * Split out from `CommandList` solely so `useScrollAreaOverflow()` can be called from a component
 * that actually renders as a child of `ScrollArea` (inside its Context Provider) — the hook can't
 * resolve correctly if called directly in `CommandList`, since `CommandList` renders the `ScrollArea`
 * itself rather than being rendered inside one.
 */
function CommandListInner({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const { scrollableY } = useScrollAreaOverflow()
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(scrollableY && "pe-2")}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ disabled })

  return (
    <CommandPrimitive.Item
      ref={actionIcon.ref}
      data-slot="command-item"
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
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
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
