/**
 * Custom navigation manifest for the showcase site.
 *
 * This intentionally does NOT mirror shadcn's own docs nav — it's our own
 * taxonomy. Every planned component is listed up front (per the project plan)
 * so the menu shows full scope immediately; `status` flips from "pending" to
 * "ready" as each one is ported into src/ui/ and given a showcase page.
 *
 * See CLAUDE.md / the project plan for the reproduce -> verify -> adjust flow
 * each component goes through before its status changes.
 */

export type ComponentStatus = "ready" | "pending"

export interface ComponentEntry {
  slug: string
  name: string
  status: ComponentStatus
  /**
   * Override for the exported symbol shown in the Usage import line, when it
   * doesn't match `name` with spaces stripped (e.g. Sonner's nav name is
   * "Sonner" but src/ui/sonner.tsx exports `Toaster`).
   */
  exportName?: string
}

export interface NavCategory {
  slug: string
  title: string
  components: ComponentEntry[]
}

export const navManifest: NavCategory[] = [
  {
    slug: "primitives",
    title: "Primitives",
    components: [
      { slug: "button", name: "Button", status: "ready" },
      { slug: "avatar", name: "Avatar", status: "ready" },
      { slug: "badge", name: "Badge", status: "ready" },
      { slug: "separator", name: "Separator", status: "ready" },
      { slug: "skeleton", name: "Skeleton", status: "ready" },
      { slug: "aspect-ratio", name: "Aspect Ratio", status: "ready" },
      { slug: "label", name: "Label", status: "ready" },
      { slug: "kbd", name: "Kbd", status: "ready" },
      { slug: "spinner", name: "Spinner", status: "ready" },
      { slug: "progress", name: "Progress", status: "ready" },
    ],
  },
  {
    slug: "forms",
    title: "Forms",
    components: [
      { slug: "input", name: "Input", status: "ready" },
      { slug: "textarea", name: "Textarea", status: "ready" },
      { slug: "checkbox", name: "Checkbox", status: "ready" },
      { slug: "switch", name: "Switch", status: "ready" },
      { slug: "select", name: "Select", status: "ready" },
      { slug: "native-select", name: "Native Select", status: "ready" },
      { slug: "radio-group", name: "Radio Group", status: "ready" },
      { slug: "slider", name: "Slider", status: "ready" },
      { slug: "input-otp", name: "Input OTP", status: "ready" },
      { slug: "toggle", name: "Toggle", status: "ready" },
      { slug: "toggle-group", name: "Toggle Group", status: "ready" },
      { slug: "input-group", name: "Input Group", status: "ready" },
      { slug: "search-input", name: "Search Input", status: "ready" },
      { slug: "field", name: "Field", status: "ready" },
      { slug: "form", name: "Form", status: "ready" },
      { slug: "combobox", name: "Combobox", status: "ready" },
    ],
  },
  {
    slug: "overlays",
    title: "Overlays",
    components: [
      { slug: "dialog", name: "Dialog", status: "ready" },
      { slug: "alert-dialog", name: "Alert Dialog", status: "ready" },
      { slug: "sheet", name: "Sheet", status: "ready" },
      { slug: "popover", name: "Popover", status: "ready" },
      { slug: "tooltip", name: "Tooltip", status: "ready" },
      { slug: "dropdown-menu", name: "Dropdown Menu", status: "ready" },
      { slug: "context-menu", name: "Context Menu", status: "ready" },
      { slug: "hover-card", name: "Hover Card", status: "ready" },
      { slug: "menubar", name: "Menubar", status: "ready" },
      { slug: "drawer", name: "Drawer", status: "ready" },
    ],
  },
  {
    slug: "navigation",
    title: "Navigation",
    components: [
      { slug: "breadcrumb", name: "Breadcrumb", status: "ready" },
      { slug: "tabs", name: "Tabs", status: "ready" },
      { slug: "navigation-menu", name: "Navigation Menu", status: "ready" },
      { slug: "pagination", name: "Pagination", status: "ready" },
      { slug: "sidebar", name: "Sidebar", status: "ready" },
    ],
  },
  {
    slug: "data-display",
    title: "Data Display",
    components: [
      { slug: "card", name: "Card", status: "ready" },
      { slug: "table", name: "Table", status: "ready" },
      { slug: "item", name: "Item", status: "ready" },
      { slug: "empty", name: "Empty", status: "ready" },
      { slug: "marker", name: "Marker", status: "ready" },
      { slug: "message", name: "Message", status: "ready" },
      { slug: "message-scroller", name: "Message Scroller", status: "ready" },
      { slug: "bubble", name: "Bubble", status: "ready" },
      { slug: "attachment", name: "Attachment", status: "ready" },
      { slug: "chart", name: "Chart", status: "ready" },
    ],
  },
  {
    slug: "composed",
    title: "Composed",
    components: [
      { slug: "calendar", name: "Calendar", status: "ready" },
      { slug: "carousel", name: "Carousel", status: "ready" },
      { slug: "command", name: "Command", status: "ready" },
      { slug: "resizable", name: "Resizable", status: "ready" },
      { slug: "scroll-area", name: "Scroll Area", status: "ready" },
      { slug: "sonner", name: "Sonner", status: "ready", exportName: "Toaster" },
      { slug: "accordion", name: "Accordion", status: "ready" },
      { slug: "collapsible", name: "Collapsible", status: "ready" },
      { slug: "button-group", name: "Button Group", status: "ready" },
    ],
  },
]

export function findComponent(slug: string): ComponentEntry | undefined {
  for (const category of navManifest) {
    const found = category.components.find((c) => c.slug === slug)
    if (found) return found
  }
  return undefined
}
