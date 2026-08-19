"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "@/icons/generated"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        // Issue 07e: h-9 rewired to control-height-default (Finding 1,
        // the height ladder is already job-named). p-1 container padding
        // stays raw — out of scope.
        "flex h-control-height-default items-center gap-1 rounded-md border bg-background p-1 shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  const actionIcon = useActionIconFill<HTMLButtonElement>({ disabled })

  return (
    <MenubarPrimitive.Trigger
      ref={actionIcon.ref}
      data-slot="menubar-trigger"
      className={cn(
        // Issue 07f: px-2 (padding-8) re-adjudicated — a distinct job
        // (the toolbar-row trigger button itself, not a dropdown row) but
        // single-consumer in src/ui today, so it stays raw rather than
        // become a semantic that is really just this value with a longer
        // name. py-1 (padding-4) was already reported blocked in 07e and
        // is unchanged — would have been a third semantic on that
        // primitive, out of this issue's re-adjudication scope.
        "flex items-center rounded-sm px-2 py-1 text-control outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
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
    </MenubarPrimitive.Trigger>
  )
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-elevation-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      />
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ disabled })

  return (
    <MenubarPrimitive.Item
      ref={actionIcon.ref}
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Issue 07e: py-1.5 rewired to menu-item-padding-y (Finding 1,
        // shared with dropdown-menu.tsx/context-menu.tsx's own Item —
        // one genuine job, not three components sharing a number). Issue
        // 07f: px-2 rewired to menu-item-padding-x, the horizontal
        // counterpart — same shared menu-row job, surviving
        // re-adjudication once the per-primitive cap that blocked it in
        // 07e was removed. Wired here only; dropdown-menu.tsx/context-
        // menu.tsx share the identical job but are out of this issue's
        // file scope.
        "relative flex cursor-default items-center gap-2 rounded-sm px-menu-item-padding-x py-menu-item-padding-y text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      )}
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
    </MenubarPrimitive.Item>
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn(
        // Issue 07e: py-1.5 rewired to menu-item-padding-y (Finding 1,
        // same shared menu-row job as MenubarItem/RadioItem/Label/
        // SubTrigger). Issue 07f: pr-2 rewired to menu-item-padding-x
        // (survived re-adjudication, see MenubarItem's own comment).
        // pl-8 (the fixed indicator gutter) stays raw.
        "relative flex cursor-default items-center gap-2 rounded-xs py-menu-item-padding-y pr-menu-item-padding-x pl-8 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={cn(
        // Issue 07e: py-1.5 rewired to menu-item-padding-y (Finding 1,
        // same shared menu-row job as MenubarItem/CheckboxItem/Label/
        // SubTrigger). Issue 07f: pr-2 rewired to menu-item-padding-x
        // (survived re-adjudication, see MenubarItem's own comment).
        // pl-8 (the fixed indicator gutter) stays raw.
        "relative flex cursor-default items-center gap-2 rounded-xs py-menu-item-padding-y pr-menu-item-padding-x pl-8 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        // Issue 07e: py-1.5 rewired to menu-item-padding-y (Finding 1,
        // same shared menu-row job). Issue 07f: px-2 rewired to
        // menu-item-padding-x (survived re-adjudication, see
        // MenubarItem's own comment).
        "px-menu-item-padding-x py-menu-item-padding-y text-control data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "ml-auto text-shortcut text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ disabled })

  return (
    <MenubarPrimitive.SubTrigger
      ref={actionIcon.ref}
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        // Issue 07e: py-1.5 rewired to menu-item-padding-y (Finding 1,
        // same shared menu-row job). Issue 07f: px-2 rewired to
        // menu-item-padding-x (survived re-adjudication, see
        // MenubarItem's own comment).
        "flex cursor-default items-center rounded-sm px-menu-item-padding-x py-menu-item-padding-y text-body outline-none select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
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
      <ChevronRightIcon className="ml-auto h-4 w-4" filled={actionIcon.filled} />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={cn(
        "z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-elevation-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
