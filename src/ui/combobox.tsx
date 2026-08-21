"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { CheckIcon, ChevronDownIcon, XIcon } from "@/icons/generated"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/ui/input-group"
import { ScrollArea, useScrollAreaOverflow } from "@/ui/scroll-area"

const Combobox = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  disabled,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  const actionIcon = useActionIconFill<HTMLButtonElement>({ disabled })

  return (
    <ComboboxPrimitive.Trigger
      ref={actionIcon.ref}
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      disabled={disabled}
      onMouseDown={(event) => {
        actionIcon.onMouseDown()
        props.onMouseDown?.(event)
      }}
      onMouseEnter={(event) => {
        actionIcon.onMouseEnter()
        props.onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        actionIcon.onMouseLeave()
        props.onMouseLeave?.(event)
      }}
      onMouseUp={(event) => {
        actionIcon.onMouseUp()
        props.onMouseUp?.(event)
      }}
      {...props}
    >
      {fillActionIcons(children, actionIcon.filled)}
      <ChevronDownIcon
        data-slot="combobox-trigger-icon"
        className="pointer-events-none size-4 text-muted-foreground"
        filled={actionIcon.filled}
      />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, disabled, ...props }: ComboboxPrimitive.Clear.Props) {
  const actionIcon = useActionIconFill<HTMLButtonElement>({ disabled })

  return (
    <ComboboxPrimitive.Clear
      ref={actionIcon.ref}
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      disabled={disabled}
      onMouseDown={(event) => {
        actionIcon.onMouseDown()
        props.onMouseDown?.(event)
      }}
      onMouseEnter={(event) => {
        actionIcon.onMouseEnter()
        props.onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        actionIcon.onMouseLeave()
        props.onMouseLeave?.(event)
      }}
      onMouseUp={(event) => {
        actionIcon.onMouseUp()
        props.onMouseUp?.(event)
      }}
      {...props}
    >
      <XIcon className="pointer-events-none" filled={actionIcon.filled} />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-elevation-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

/**
 * Deliberate divergence from shadcn's own real source (which uses a plain `overflow-y-auto` div
 * here) — a real `ScrollArea` is composed instead, per the two-layer scroll region pattern (see
 * CLAUDE.md's "Scroll region protocol"). `ScrollArea` wraps `ComboboxPrimitive.List` from the
 * OUTSIDE rather than nesting inside it: Base UI's `List.Props["children"]` can be a function (a
 * "closed template" render-prop that `List` resolves internally into its own `ComboboxCollection`
 * wiring) — intercepting and re-rendering `children` ourselves, as an inner wrap would require,
 * breaks that resolution and does not type-check. Wrapping from the outside leaves `List`'s own
 * children handling completely untouched. `List` keeps its own `p-1`/`data-empty:p-0` padding (the
 * OUTER layer's role); the extra end-side gutter moves onto `List` itself since it's the element
 * `ScrollArea`'s viewport renders directly. Bidezine does not enable Base UI's opt-in `virtualized`
 * combobox mode anywhere in this file — if a consumer does turn it on, this composition would need
 * re-evaluating, since virtualization typically expects to directly own the scrolling element.
 *
 * The consumer-facing `className` prop lands on `ScrollArea` (the element that actually owns the
 * height cap and clipping), matching this component's pre-migration contract where `className`
 * could override the `max-h-[min(...)]`/overflow behavior directly — not on the inner `List`, which
 * no longer owns any height/overflow of its own and would silently swallow such an override. The
 * end-side gutter is conditional on `ScrollArea` actually reporting overflow, read via
 * `useScrollAreaOverflow()` (React Context) rather than a CSS `group-data-*` selector — the latter
 * matches ANY ancestor sharing the same group name/data attribute, not just the nearest one, which
 * silently breaks whenever `ScrollArea` instances nest anywhere in the page (see scroll-area.tsx's
 * authoring note).
 */
function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ScrollArea
      className={cn(
        "max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))] overflow-hidden [&_[data-slot=scroll-area-viewport]]:scroll-py-1",
        className
      )}
    >
      <ComboboxListInner {...props} />
    </ScrollArea>
  )
}

/**
 * Split out from `ComboboxList` solely so `useScrollAreaOverflow()` can be called from a component
 * that actually renders as a child of `ScrollArea` (inside its Context Provider) — see the matching
 * note on `CommandListInner` in command.tsx for why this split is necessary.
 */
function ComboboxListInner({ ...props }: ComboboxPrimitive.List.Props) {
  const { scrollableY } = useScrollAreaOverflow()
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn("p-1 data-empty:p-0", scrollableY && "pe-2")}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  ...props
}: ComboboxPrimitive.Item.Props) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ disabled })

  return (
    <ComboboxPrimitive.Item
      ref={actionIcon.ref}
      data-slot="combobox-item"
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-body outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
      <ComboboxPrimitive.ItemIndicator
        data-slot="combobox-item-indicator"
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none size-4 pointer-coarse:size-5" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 text-caption text-muted-foreground pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-body",
        className
      )}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-body text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent bg-clip-padding px-2.5 py-1.5 text-body shadow-elevation-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-focus focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-focus has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1.5 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  const removeIcon = useActionIconFill<HTMLButtonElement>()

  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-control-sm whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          ref={removeIcon.ref}
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
          onMouseDown={removeIcon.onMouseDown}
          onMouseEnter={removeIcon.onMouseEnter}
          onMouseLeave={removeIcon.onMouseLeave}
          onMouseUp={removeIcon.onMouseUp}
        >
          <XIcon className="pointer-events-none" filled={removeIcon.filled} />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  children,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}
