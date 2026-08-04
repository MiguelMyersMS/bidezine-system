import type React from "react"
import { useParams } from "react-router-dom"
import { findComponent } from "@/nav-manifest"
import { Install } from "@/components/Install"
import { ButtonShowcase } from "./components/ButtonShowcase"
import { AvatarShowcase } from "./components/AvatarShowcase"
import { BadgeShowcase } from "./components/BadgeShowcase"
import { SeparatorShowcase } from "./components/SeparatorShowcase"
import { SkeletonShowcase } from "./components/SkeletonShowcase"
import { AspectRatioShowcase } from "./components/AspectRatioShowcase"
import { LabelShowcase } from "./components/LabelShowcase"
import { KbdShowcase } from "./components/KbdShowcase"
import { SpinnerShowcase } from "./components/SpinnerShowcase"
import { ProgressShowcase } from "./components/ProgressShowcase"
import { InputShowcase } from "./components/InputShowcase"
import { TextareaShowcase } from "./components/TextareaShowcase"
import { CheckboxShowcase } from "./components/CheckboxShowcase"
import { SwitchShowcase } from "./components/SwitchShowcase"
import { SelectShowcase } from "./components/SelectShowcase"
import { NativeSelectShowcase } from "./components/NativeSelectShowcase"
import { RadioGroupShowcase } from "./components/RadioGroupShowcase"
import { SliderShowcase } from "./components/SliderShowcase"
import { InputOTPShowcase } from "./components/InputOTPShowcase"
import { ToggleShowcase } from "./components/ToggleShowcase"
import { ToggleGroupShowcase } from "./components/ToggleGroupShowcase"
import { InputGroupShowcase } from "./components/InputGroupShowcase"
import { FieldShowcase } from "./components/FieldShowcase"
import { FormShowcase } from "./components/FormShowcase"
import { ComboboxShowcase } from "./components/ComboboxShowcase"
import { DialogShowcase } from "./components/DialogShowcase"
import { AlertDialogShowcase } from "./components/AlertDialogShowcase"
import { SheetShowcase } from "./components/SheetShowcase"
import { PopoverShowcase } from "./components/PopoverShowcase"
import { TooltipShowcase } from "./components/TooltipShowcase"
import { DropdownMenuShowcase } from "./components/DropdownMenuShowcase"
import { ContextMenuShowcase } from "./components/ContextMenuShowcase"
import { HoverCardShowcase } from "./components/HoverCardShowcase"
import { MenubarShowcase } from "./components/MenubarShowcase"
import { DrawerShowcase } from "./components/DrawerShowcase"
import { AccordionShowcase } from "./components/AccordionShowcase"
import { AttachmentShowcase } from "./components/AttachmentShowcase"
import { BreadcrumbShowcase } from "./components/BreadcrumbShowcase"
import { BubbleShowcase } from "./components/BubbleShowcase"
import { ButtonGroupShowcase } from "./components/ButtonGroupShowcase"
import { CalendarShowcase } from "./components/CalendarShowcase"
import { CardShowcase } from "./components/CardShowcase"
import { CarouselShowcase } from "./components/CarouselShowcase"
import { ChartShowcase } from "./components/ChartShowcase"
import { CollapsibleShowcase } from "./components/CollapsibleShowcase"
import { CommandShowcase } from "./components/CommandShowcase"
import { EmptyShowcase } from "./components/EmptyShowcase"
import { ItemShowcase } from "./components/ItemShowcase"
import { MarkerShowcase } from "./components/MarkerShowcase"
import { MessageShowcase } from "./components/MessageShowcase"
import { MessageScrollerShowcase } from "./components/MessageScrollerShowcase"
import { NavigationMenuShowcase } from "./components/NavigationMenuShowcase"
import { PaginationShowcase } from "./components/PaginationShowcase"
import { ResizableShowcase } from "./components/ResizableShowcase"
import { ScrollAreaShowcase } from "./components/ScrollAreaShowcase"
import { SidebarShowcase } from "./components/SidebarShowcase"
import { SonnerShowcase } from "./components/SonnerShowcase"
import { TableShowcase } from "./components/TableShowcase"
import { TabsShowcase } from "./components/TabsShowcase"

/**
 * Showcase pages register here as components are ported (Phase 3 of the plan).
 * Everything else in the nav-manifest falls back to the "coming soon" state
 * below, so the full menu is always navigable even before a component lands.
 */
const showcases: Record<string, React.ComponentType> = {
  button: ButtonShowcase,
  avatar: AvatarShowcase,
  badge: BadgeShowcase,
  separator: SeparatorShowcase,
  skeleton: SkeletonShowcase,
  "aspect-ratio": AspectRatioShowcase,
  label: LabelShowcase,
  kbd: KbdShowcase,
  spinner: SpinnerShowcase,
  progress: ProgressShowcase,
  input: InputShowcase,
  textarea: TextareaShowcase,
  checkbox: CheckboxShowcase,
  switch: SwitchShowcase,
  select: SelectShowcase,
  "native-select": NativeSelectShowcase,
  "radio-group": RadioGroupShowcase,
  slider: SliderShowcase,
  "input-otp": InputOTPShowcase,
  toggle: ToggleShowcase,
  "toggle-group": ToggleGroupShowcase,
  "input-group": InputGroupShowcase,
  field: FieldShowcase,
  form: FormShowcase,
  combobox: ComboboxShowcase,
  dialog: DialogShowcase,
  "alert-dialog": AlertDialogShowcase,
  sheet: SheetShowcase,
  popover: PopoverShowcase,
  tooltip: TooltipShowcase,
  "dropdown-menu": DropdownMenuShowcase,
  "context-menu": ContextMenuShowcase,
  "hover-card": HoverCardShowcase,
  menubar: MenubarShowcase,
  drawer: DrawerShowcase,
  "accordion": AccordionShowcase,
  "attachment": AttachmentShowcase,
  "breadcrumb": BreadcrumbShowcase,
  "bubble": BubbleShowcase,
  "button-group": ButtonGroupShowcase,
  "calendar": CalendarShowcase,
  "card": CardShowcase,
  "carousel": CarouselShowcase,
  "chart": ChartShowcase,
  "collapsible": CollapsibleShowcase,
  "command": CommandShowcase,
  "empty": EmptyShowcase,
  "item": ItemShowcase,
  "marker": MarkerShowcase,
  "message": MessageShowcase,
  "message-scroller": MessageScrollerShowcase,
  "navigation-menu": NavigationMenuShowcase,
  "pagination": PaginationShowcase,
  "resizable": ResizableShowcase,
  "scroll-area": ScrollAreaShowcase,
  "sidebar": SidebarShowcase,
  "sonner": SonnerShowcase,
  "table": TableShowcase,
  "tabs": TabsShowcase,
}

export function ComponentRoute() {
  const { slug = "" } = useParams()
  const entry = findComponent(slug)
  const Showcase = showcases[slug]

  if (!entry) {
    return <p className="text-muted-foreground">Unknown component: {slug}</p>
  }

  if (entry.status === "pending" || !Showcase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{entry.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Not ported yet. Reproduce → verify → adjust is tracked in the project
          plan; check back once this one clears the pipeline.
        </p>
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Showcase />
      <Install exportName={entry.name.replace(/\s+/g, "")} />
    </div>
  )
}
