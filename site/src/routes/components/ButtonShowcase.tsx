import {
  ArrowUpIcon,
  Button,
  ButtonGroup,
  ChevronLeftIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  Spinner,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces shadcn's own button-default / button-with-icon / button-demo
 * examples (reference/shadcn-ui/apps/v4/examples/radix/button-*.tsx)
 * verbatim, as the Phase 2 fidelity baseline. The only adaptation: the
 * reference's button-with-icon example uses @tabler/icons-react, which isn't
 * a dependency of this package — substituted with the equivalent Fluent UI
 * System Icon (this design system's icon set).
 *
 * Sections are the same ones shadcn's own docs page lists, restructured as an
 * ExampleBrowser (filter chips, one at a time) instead of a long stack.
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
    label: "Size",
    render: () => (
      <div className="flex flex-wrap items-center gap-4">
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
    ),
    code: `<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>`,
  },
  {
    label: "Outline",
    render: () => <Button variant="outline">Outline</Button>,
    code: `<Button variant="outline">Outline</Button>`,
  },
  {
    label: "Secondary",
    render: () => <Button variant="secondary">Secondary</Button>,
    code: `<Button variant="secondary">Secondary</Button>`,
  },
  {
    label: "Ghost",
    render: () => <Button variant="ghost">Ghost</Button>,
    code: `<Button variant="ghost">Ghost</Button>`,
  },
  {
    label: "Destructive",
    render: () => <Button variant="destructive">Destructive</Button>,
    code: `<Button variant="destructive">Destructive</Button>`,
  },
  {
    label: "Link",
    render: () => <Button variant="link">Link</Button>,
    code: `<Button variant="link">Link</Button>`,
  },
  {
    label: "Icon",
    render: () => (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon-xs" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
        <Button variant="outline" size="icon" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
        <Button variant="outline" size="icon-lg" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
      </div>
    ),
    code: `<Button variant="outline" size="icon" aria-label="Submit">
  <ArrowUpIcon />
</Button>`,
  },
  {
    label: "With icon",
    render: () => (
      <Button variant="outline" size="sm">
        <GitBranchIcon /> New Branch
      </Button>
    ),
    code: `<Button variant="outline" size="sm">
  <GitBranchIcon /> New Branch
</Button>`,
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
    code: `<Button variant="outline">Button</Button>
<Button variant="outline" size="icon" aria-label="Submit">
  <ArrowUpIcon />
</Button>`,
  },
  {
    label: "Rounded",
    render: () => (
      <Button variant="outline" size="icon" aria-label="Submit" className="rounded-full">
        <ArrowUpIcon />
      </Button>
    ),
    code: `<Button variant="outline" size="icon" className="rounded-full">
  <ArrowUpIcon />
</Button>`,
  },
  {
    label: "Spinner",
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" disabled>
          <Spinner /> Generating
        </Button>
        <Button variant="ghost" disabled>
          Downloading <Spinner />
        </Button>
      </div>
    ),
    code: `<Button variant="secondary" disabled>
  <Spinner /> Generating
</Button>`,
  },
  {
    label: "Button group",
    render: () => (
      <ButtonGroup>
        <Button variant="outline" size="icon" aria-label="Back">
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
        <Button variant="outline">Snooze</Button>
        <Button variant="outline" size="icon" aria-label="More">
          <MoreHorizontalIcon />
        </Button>
      </ButtonGroup>
    ),
    code: `<ButtonGroup>
  <Button variant="outline">Archive</Button>
  <Button variant="outline">Report</Button>
  <Button variant="outline">Snooze</Button>
</ButtonGroup>`,
  },
  {
    label: "As child",
    render: () => (
      <Button asChild>
        <a href="#as-child">Login</a>
      </Button>
    ),
    code: `<Button asChild>
  <a href="/login">Login</a>
</Button>`,
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
    code: `<Button variant="secondary" size="lg">secondary</Button>
// variant: ${variants.join(" | ")}
// size: ${sizes.join(" | ")}`,
  },
  {
    label: "Disabled",
    render: () => (
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled>default</Button>
        <Button variant="outline" disabled>
          outline
        </Button>
        <Button variant="ghost" disabled>
          ghost
        </Button>
      </div>
    ),
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
    description:
      "Height and padding, or square icon-only sizing. Inline padding tightens automatically when a direct svg child is present.",
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
          Displays a button or a component that looks like a button. Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx
          </code>{" "}
          with one deliberate divergence: the <code className="rounded bg-muted px-1 py-0.5 text-sm">ghost</code>{" "}
          variant gains an <code className="rounded bg-muted px-1 py-0.5 text-sm">
            active:bg-accent active:text-accent-foreground dark:active:bg-accent/50
          </code>{" "}
          pressed-state rule shadcn&rsquo;s own source has no equivalent for (shadcn ships zero built-in
          pressed/mousedown background for any Button variant). It reuses the exact same{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">--accent</code> token the variant&rsquo;s own{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">hover:</code> already uses — never a new
          color — mirroring <code className="rounded bg-muted px-1 py-0.5 text-sm">SidebarMenuButton</code>&rsquo;s
          own already-established <code className="rounded bg-muted px-1 py-0.5 text-sm">
            active:bg-sidebar-accent
          </code>{" "}
          convention. Other examples below reproduce the source&rsquo;s own demos before any styling
          adjustments.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
