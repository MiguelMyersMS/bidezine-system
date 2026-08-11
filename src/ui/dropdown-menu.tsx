"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "@/icons/generated"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { fillActionIcons, useActionIconFill } from "@/lib/action-icons"
import { cn } from "@/lib/utils"
import { ScrollArea, useScrollAreaOverflow } from "@/ui/scroll-area"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

/**
 * Reads the enclosing `ScrollArea`'s real overflow state via React Context (not a CSS
 * `group-data-*` selector — see scroll-area.tsx's authoring note for why that approach breaks
 * whenever `ScrollArea` instances nest) to conditionally reserve the scrollbar's end-side gutter.
 */
function DropdownMenuScrollGutter({ children }: { children: React.ReactNode }) {
  const { scrollableY } = useScrollAreaOverflow()
  return <div className={cn(scrollableY && "pe-2")}>{children}</div>
}

/**
 * Deliberate divergence from shadcn's own real source (which uses a plain `overflow-y-auto` div
 * here) — a real `ScrollArea` is composed inside instead, per the two-layer scroll region pattern
 * (see CLAUDE.md's "Scroll region protocol"). `Content` itself is the OUTER layer: it keeps its own
 * uniform `p-1` and the Radix-measured `max-h-(--radix-dropdown-menu-content-available-height)` cap,
 * and switches to `flex flex-col overflow-hidden` so `ScrollArea` (the actual scrolling element) can
 * correctly shrink to the remaining space rather than growing past the cap and being silently
 * clipped. The inner content wrapper adds an extra end-side gutter on top of Content's own padding
 * so real menu items never sit flush against the scrollbar thumb — but ONLY when `ScrollArea` itself
 * reports the content is actually tall enough to scroll, never unconditionally: a short menu that
 * fits without scrolling must not carry dead empty space on its end side just because it happens to
 * be wrapped in `ScrollArea`.
 */
function DropdownMenuContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) flex-col overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <DropdownMenuScrollGutter>{children}</DropdownMenuScrollGutter>
        </ScrollArea>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

/**
 * Deliberate divergence from shadcn's own real source, which has no concept of a persistently
 * "selected/current" menu item at all (only `DropdownMenuCheckboxItem`/`DropdownMenuRadioItem`,
 * a different semantic — a toggleable/mutually-exclusive setting, not "this item represents the
 * page/section you're currently on"). Added `isActive`, mirroring the exact convention this
 * system's own real `Button`/`SidebarMenuButton` already use for the identical concept:
 * `data-active`/`data-[active=true]:bg-accent`/`font-medium`, plus feeding the same shared
 * `useActionIconFill` hook so the icon fills too — one boolean drives background, text weight, AND
 * icon fill together (see CLAUDE.md's Primitive Fidelity Checklist item 20 on why these must never
 * be two separately-maintained conditionals). Reuses `bg-accent`/`text-accent-foreground` — the
 * SAME token pair this component already uses for its own `focus:`/`DropdownMenuSubTrigger`'s
 * `data-[state=open]:` states — rather than borrowing `SidebarMenuButton`'s `--sidebar-accent`
 * tokens verbatim, since those are a separate palette scoped to a real `<SidebarProvider>` tree
 * (the same reasoning divergence row L-9 already established for why `SidebarMenuButton` itself
 * isn't a clean drop-in outside a real Sidebar instance).
 *
 * `active:bg-accent active:text-accent-foreground` (a true CSS `:active`/mousedown pseudo-class,
 * distinct from the persistent `isActive` prop above) mirrors `SidebarMenuButton`'s own identical
 * `active:bg-sidebar-accent active:text-sidebar-accent-foreground` rule and `Button`'s own `ghost`
 * variant `active:` rule — reusing the same already-established `--accent` token this component
 * already uses everywhere else, never a new/invented color (see rail-sidebar.ts's C-8 entry and
 * CLAUDE.md's Primitive Fidelity Checklist item 26).
 *
 * `--accent-pressed`/`--accent-selected` (see rail-sidebar.ts's M-3/M-4 entries): the `active:` and
 * `data-[active=true]:` background rules read these via a CSS var-with-fallback
 * (`var(--accent-pressed, var(--accent))`) rather than `--accent` directly. Neither variable is
 * defined anywhere by default, so every existing consumer falls straight through to `--accent` and
 * renders byte-identically to before this change. A consumer that DOES need its hover/pressed/
 * persistent-active states to resolve to three visually distinct colors (e.g. the Rail's own dark
 * overflow menu, which already tracks three distinct tokens — `colors.hover`/`colors.pressed`/
 * `colors.active` — on its own trigger button) can locally redefine these two custom properties via
 * an inline `style` on `DropdownMenuContent`, without touching this shared recipe's default look for
 * anyone else.
 *
 * `isOpen` (see rail-sidebar.ts's M-3/M-4 entries): a second, distinct-from-`isActive` state —
 * "this item's own destination panel/section is currently open, but nothing inside it has been
 * chosen as the active leaf yet" — mirroring the Rail's own three-tier `default`/`browsing`/`active`
 * distinction (`RailIconButton`'s `state` prop), which `isActive` alone could not express (a stashed
 * section whose panel was freshly opened had zero visual indicator until a leaf inside it was
 * picked). Sets `data-state="open"` (shared vocabulary with `DropdownMenuSubTrigger`'s own real
 * open/closed submenu state — safe here since a plain `Item` never sets this attribute itself) and
 * reuses the SAME `bg-accent`/`text-accent-foreground` tokens this component already uses for its
 * own `focus:` state, rather than inventing a third token pair — a lighter treatment than
 * `isActive`'s stronger `--accent-selected` fill, so the two tiers stay visually distinct from each
 * other. `useActionIconFill`'s own `data-state === "open"` check already treats this as a fill
 * trigger, so the icon fills too with no extra wiring.
 */
function DropdownMenuItem({
  className,
  children,
  disabled,
  inset,
  isActive = false,
  isOpen = false,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  isActive?: boolean
  isOpen?: boolean
  variant?: "default" | "destructive"
}) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ active: isActive, disabled })

  return (
    <DropdownMenuPrimitive.Item
      ref={actionIcon.ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-active={isActive}
      data-state={isOpen ? "open" : undefined}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground active:bg-[var(--accent-pressed,var(--accent))] active:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-[active=true]:bg-[var(--accent-selected,var(--accent))] data-[active=true]:font-medium data-[active=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
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
    </DropdownMenuPrimitive.Item>
  )
}

/**
 * `data-[state=checked]:bg-accent/50` (a distinct-but-related, softer resting tint for a checked
 * row, plus the same `active:` pressed rule DropdownMenuItem now carries) is a deliberate divergence
 * from shadcn's own real source, which has no background treatment for the checked state at all —
 * only the checkmark glyph. Reuses the exact `--accent` token this component already uses for its
 * own `focus:` state, at the same reduced opacity `NavigationMenuLink`'s own established
 * `data-[active=true]:bg-accent/50` convention already uses for an identical "distinct resting tint,
 * stronger on focus/hover" pattern (src/ui/navigation-menu.tsx) — never a new/invented color (see
 * rail-sidebar.ts's C-7 entry and CLAUDE.md's Primitive Fidelity Checklist item 26).
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground active:bg-accent active:text-accent-foreground data-[state=checked]:bg-accent/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

/**
 * `--dm-subicon-fg`/`--dm-subicon-fg-hover` (see rail-sidebar.ts's M-3/M-4 follow-up): mirrors the
 * exact fallback-var pattern already established on `DropdownMenuItem` above. This trigger's own
 * `data-[state=open]` state is the "menu is open via this row, but nothing inside it has been
 * chosen yet" state — the direct analog of `RailIconButton`'s own `isBrowsing` state, which reuses
 * its HOVER token (`colors.fgHover`), never its persistent-selected token (`colors.fg`), for exactly
 * this reason (a sub-menu being open isn't the same thing as this row being "the current page").
 * That's why both `focus:` and `data-[state=open]:` below share the SAME `--dm-subicon-fg-hover`
 * var rather than needing a third, `--dm-subicon-fg-selected`-style slot. Both vars default to this
 * component's original hard-coded values (`--muted-foreground` at rest, `--accent-foreground` on
 * focus/open), so every existing consumer renders identically to before; only a caller that defines
 * these two custom properties (e.g. the Rail's own dark overflow menu) sees a different color. This
 * only affects icons that DON'T already carry their own `text-*` class (per the existing
 * `:not([class*='text-'])` guard) — the auto-appended trailing `ChevronRightIcon` below has none, so
 * it's the one this mainly targets; a caller's own icon child can still opt out by giving itself an
 * explicit `text-[...]` class, exactly like `DropdownMenuItem`'s rail call site already does.
 */
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  const actionIcon = useActionIconFill<HTMLDivElement>({ disabled })

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={actionIcon.ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      disabled={disabled}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[var(--dm-subicon-fg,var(--muted-foreground))] focus:[&_svg:not([class*='text-'])]:text-[var(--dm-subicon-fg-hover,var(--accent-foreground))] data-[state=open]:[&_svg:not([class*='text-'])]:text-[var(--dm-subicon-fg-hover,var(--accent-foreground))]",
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
      <ChevronRightIcon className="ml-auto size-4" filled={actionIcon.filled} />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
