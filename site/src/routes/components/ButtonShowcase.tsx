import { ArrowUpIcon, GitBranchIcon } from "lucide-react"
import { Button } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces shadcn's own button-default / button-with-icon / button-demo
 * examples (reference/shadcn-ui/apps/v4/examples/radix/button-*.tsx)
 * verbatim, as the Phase 2 fidelity baseline. The only adaptation: the
 * reference's button-with-icon example uses @tabler/icons-react, which isn't
 * a dependency of this package — substituted with the equivalent lucide-react
 * icon (already a dependency) since lucide-react is what button-demo itself uses.
 *
 * Restructured as an ExampleBrowser (filter chips, one example visible at a
 * time) instead of a long stack — the shell Claude (design) proposed, ported
 * here against the real @bidezine/system import with no behavior changes.
 */

const variants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const
const sizes = ["sm", "default", "lg"] as const

const examples: ShowcaseExample[] = [
  {
    label: "Default",
    render: () => <Button>Button</Button>,
    code: `<Button>Button</Button>`,
  },
  {
    label: "With icon",
    render: () => (
      <Button variant="outline" size="sm">
        <GitBranchIcon /> New Branch
      </Button>
    ),
    code: `<Button variant="outline" size="sm">\n  <GitBranchIcon /> New Branch\n</Button>`,
  },
  {
    label: "Demo",
    render: () => (
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button variant="outline">Button</Button>
        <Button variant="outline" size="icon" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
      </div>
    ),
    code: `<Button variant="outline">Button</Button>\n<Button variant="outline" size="icon" aria-label="Submit">\n  <ArrowUpIcon />\n</Button>`,
  },
  {
    label: "Variant × size",
    render: () => (
      <div className="flex flex-col gap-4">
        {sizes.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-2">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
          </div>
        ))}
      </div>
    ),
    code: `<Button variant="secondary" size="lg">secondary</Button>\n// variant: ${variants.join(" | ")}\n// size: ${sizes.join(" | ")}`,
  },
  {
    label: "Disabled",
    render: () => <Button disabled>Button</Button>,
    code: `<Button disabled>Button</Button>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: `"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"`,
    default: `"default"`,
    description: "Visual style.",
  },
  {
    prop: "size",
    type: `"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"`,
    default: `"default"`,
    description: "Height/padding, or square icon-only sizing.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render props onto a single child element instead of a <button> (Radix Slot).",
  },
]

export function ButtonShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Button</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx
          </code>{" "}
          unchanged. Examples below reproduce the source's own demos before any
          styling adjustments.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
