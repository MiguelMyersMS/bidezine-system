import { Badge } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"
import type { ReactNode } from "react"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/badge-demo.tsx
 * verbatim, restructured as an ExampleBrowser (filter chips, one at a time)
 * instead of a single fixed demo.
 */

/**
 * Local showcase-only helper (not part of @bidezine/system) that places two or
 * more badge variations side by side (e.g. regular/emphasis weight, or
 * solid/soft tone × weight). No caption text — the visual differences are
 * distinct enough on their own that a label would be redundant noise.
 */
function WeightPair({ children }: { children: ReactNode[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {children}
    </div>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Default",
    render: () => (
      <WeightPair>
        <Badge weight="regular">Badge</Badge>
        <Badge weight="emphasis">Badge</Badge>
      </WeightPair>
    ),
    code: `<Badge weight="regular">Badge</Badge>
<Badge weight="emphasis">Badge</Badge> {/* default */}`,
  },
  {
    label: "Secondary",
    render: () => (
      <WeightPair>
        <Badge variant="secondary" weight="regular">
          Secondary
        </Badge>
        <Badge variant="secondary" weight="emphasis">
          Secondary
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="secondary" weight="regular">Secondary</Badge>
<Badge variant="secondary" weight="emphasis">Secondary</Badge> {/* default */}`,
  },
  {
    label: "Destructive",
    render: () => (
      <WeightPair>
        <Badge variant="destructive" weight="regular">
          Destructive
        </Badge>
        <Badge variant="destructive" weight="emphasis">
          Destructive
        </Badge>
        <Badge variant="destructive" tone="soft" weight="regular">
          Destructive
        </Badge>
        <Badge variant="destructive" tone="soft" weight="emphasis">
          Destructive
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="destructive" weight="regular">Destructive</Badge>
<Badge variant="destructive" weight="emphasis">Destructive</Badge> {/* default */}
<Badge variant="destructive" tone="soft" weight="regular">Destructive</Badge>
<Badge variant="destructive" tone="soft" weight="emphasis">Destructive</Badge>`,
  },
  {
    label: "Success",
    render: () => (
      <WeightPair>
        <Badge variant="success" weight="regular">
          Success
        </Badge>
        <Badge variant="success" weight="emphasis">
          Success
        </Badge>
        <Badge variant="success" tone="soft" weight="regular">
          Success
        </Badge>
        <Badge variant="success" tone="soft" weight="emphasis">
          Success
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="success" weight="regular">Success</Badge>
<Badge variant="success" weight="emphasis">Success</Badge> {/* default */}
<Badge variant="success" tone="soft" weight="regular">Success</Badge>
<Badge variant="success" tone="soft" weight="emphasis">Success</Badge>`,
  },
  {
    label: "Warning",
    render: () => (
      <WeightPair>
        <Badge variant="warning" weight="regular">
          Warning
        </Badge>
        <Badge variant="warning" weight="emphasis">
          Warning
        </Badge>
        <Badge variant="warning" tone="soft" weight="regular">
          Warning
        </Badge>
        <Badge variant="warning" tone="soft" weight="emphasis">
          Warning
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="warning" weight="regular">Warning</Badge>
<Badge variant="warning" weight="emphasis">Warning</Badge> {/* default */}
<Badge variant="warning" tone="soft" weight="regular">Warning</Badge>
<Badge variant="warning" tone="soft" weight="emphasis">Warning</Badge>`,
  },
  {
    label: "Info",
    render: () => (
      <WeightPair>
        <Badge variant="info" weight="regular">
          Info
        </Badge>
        <Badge variant="info" weight="emphasis">
          Info
        </Badge>
        <Badge variant="info" tone="soft" weight="regular">
          Info
        </Badge>
        <Badge variant="info" tone="soft" weight="emphasis">
          Info
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="info" weight="regular">Info</Badge>
<Badge variant="info" weight="emphasis">Info</Badge> {/* default */}
<Badge variant="info" tone="soft" weight="regular">Info</Badge>
<Badge variant="info" tone="soft" weight="emphasis">Info</Badge>`,
  },
  {
    label: "Outline",
    render: () => (
      <WeightPair>
        <Badge variant="outline" weight="regular">
          Outline
        </Badge>
        <Badge variant="outline" weight="emphasis">
          Outline
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="outline" weight="regular">Outline</Badge>
<Badge variant="outline" weight="emphasis">Outline</Badge> {/* default */}`,
  },
  {
    label: "Ghost",
    render: () => (
      <WeightPair>
        <Badge variant="ghost" weight="regular">
          Ghost
        </Badge>
        <Badge variant="ghost" weight="emphasis">
          Ghost
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="ghost" weight="regular">Ghost</Badge>
<Badge variant="ghost" weight="emphasis">Ghost</Badge> {/* default */}`,
  },
  {
    label: "Muted",
    render: () => (
      <WeightPair>
        <Badge variant="muted" weight="regular">
          Muted
        </Badge>
        <Badge variant="muted" weight="emphasis">
          Muted
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="muted" weight="regular">Muted</Badge>
<Badge variant="muted" weight="emphasis">Muted</Badge> {/* default */}`,
  },
  {
    label: "Link",
    render: () => (
      <WeightPair>
        <Badge variant="link" weight="regular" asChild>
          <a href="#link">Link</a>
        </Badge>
        <Badge variant="link" weight="emphasis" asChild>
          <a href="#link">Link</a>
        </Badge>
      </WeightPair>
    ),
    code: `<Badge variant="link" weight="regular" asChild>
  <a href="/docs">Link</a>
</Badge>
<Badge variant="link" weight="emphasis" asChild> {/* default */}
  <a href="/docs">Link</a>
</Badge>`,
  },
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full flex-wrap justify-center gap-2">
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success" tone="soft">
          Success
        </Badge>
        <Badge variant="warning" tone="soft">
          Warning
        </Badge>
        <Badge variant="info" tone="soft">
          Info
        </Badge>
        <Badge variant="destructive" tone="soft">
          Destructive
        </Badge>
      </div>
    ),
    code: `<Badge>Badge</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success" tone="soft">Success</Badge>
<Badge variant="warning" tone="soft">Warning</Badge>
<Badge variant="info" tone="soft">Info</Badge>
<Badge variant="destructive" tone="soft">Destructive</Badge>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: `"default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline" | "ghost" | "muted" | "link"`,
    default: `"default"`,
    description:
      "Visual style. success/warning/info and muted are a bidezine Adjustment (not in shadcn's own source): success/warning/info add semantic status pills; muted is a lower-prominence variant (text-muted-foreground, no fill at rest) for badges that should recede rather than draw attention, e.g. on a dense navigation surface.",
  },
  {
    prop: "tone",
    type: `"solid" | "soft"`,
    default: `"solid"`,
    description:
      'bidezine Adjustment. A third axis, independent of variant/weight, scoped to the four status colors (destructive/success/warning/info) — no-op for default/secondary/outline/ghost/muted/link, which already have their own low-emphasis treatment. "soft" swaps the solid white-on-filled-color pill for an opaque, lighter tinted background + darker/more saturated text of the same hue — verified 7:1+ contrast in both light and dark mode, independent of whatever surface the badge sits on (unlike an opacity-blend approach).',
  },
  {
    prop: "weight",
    type: `"regular" | "emphasis"`,
    default: `"emphasis"`,
    description:
      "bidezine Adjustment. Font-weight axis, independent of variant. \"emphasis\" (font-medium) matches shadcn's own unconditional baseline weight and is the default, so existing usage is unaffected. \"regular\" (font-normal) is a lighter, lower-visual-weight opt-in for dense/inline status labels next to body text.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render props onto a single child element instead of a <span> (Radix Slot).",
  },
]

export function BadgeShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Badge</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/badge.tsx
          </code>{" "}
          unchanged, plus a bidezine Adjustment adding{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            success
          </code>
          /
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            warning
          </code>
          /
          <code className="rounded bg-muted px-1 py-0.5 text-sm">info</code>{" "}
          status variants, a{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">muted</code>{" "}
          low-prominence variant, and a{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">tone</code>{" "}
          axis (<code className="rounded bg-muted px-1 py-0.5 text-sm">
            "solid" | "soft"
          </code>
          ) for lighter, tinted-background alternatives to the four status
          colors — shadcn's own source has none of these concepts. See{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            src/ui/badge.tsx
          </code>{" "}
          for the full rationale.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
