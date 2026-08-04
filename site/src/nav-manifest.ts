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
}

export interface NavCategory {
  slug: string
  title: string
  components: ComponentEntry[]
}

function pending(name: string): ComponentEntry {
  return { slug: name, name: titleCase(name), status: "pending" }
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
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
      pending("breadcrumb"),
      pending("tabs"),
      pending("navigation-menu"),
      pending("pagination"),
      pending("sidebar"),
    ],
  },
  {
    slug: "data-display",
    title: "Data Display",
    components: [
      pending("card"),
      pending("table"),
      pending("item"),
      pending("empty"),
      pending("marker"),
      pending("message"),
      pending("message-scroller"),
      pending("bubble"),
      pending("attachment"),
      pending("chart"),
    ],
  },
  {
    slug: "composed",
    title: "Composed",
    components: [
      pending("calendar"),
      pending("carousel"),
      pending("command"),
      pending("resizable"),
      pending("scroll-area"),
      pending("sonner"),
      pending("accordion"),
      pending("collapsible"),
      pending("button-group"),
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
