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
      pending("avatar"),
      pending("badge"),
      pending("separator"),
      pending("skeleton"),
      pending("aspect-ratio"),
      pending("label"),
      pending("kbd"),
      pending("spinner"),
      pending("progress"),
    ],
  },
  {
    slug: "forms",
    title: "Forms",
    components: [
      pending("input"),
      pending("textarea"),
      pending("checkbox"),
      pending("switch"),
      pending("select"),
      pending("native-select"),
      pending("radio-group"),
      pending("slider"),
      pending("input-otp"),
      pending("toggle"),
      pending("toggle-group"),
      pending("input-group"),
      pending("field"),
      pending("form"),
      pending("combobox"),
    ],
  },
  {
    slug: "overlays",
    title: "Overlays",
    components: [
      pending("dialog"),
      pending("alert-dialog"),
      pending("sheet"),
      pending("popover"),
      pending("tooltip"),
      pending("dropdown-menu"),
      pending("context-menu"),
      pending("hover-card"),
      pending("menubar"),
      pending("drawer"),
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
