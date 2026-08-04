import { ArrowUpIcon, GitBranchIcon } from "lucide-react"
import { Button } from "@bidezine/system"
import { Example } from "./Example"

/**
 * Reproduces shadcn's own button-default / button-with-icon / button-demo
 * examples (reference/shadcn-ui/apps/v4/examples/radix/button-*.tsx)
 * verbatim, as the Phase 2 fidelity baseline. The only adaptation: the
 * reference's button-with-icon example uses @tabler/icons-react, which isn't
 * a dependency of this package — substituted with the equivalent lucide-react
 * icon (already a dependency) since lucide-react is what button-demo itself uses.
 */

function ButtonDefault() {
  return <Button>Button</Button>
}

function ButtonWithIcon() {
  return (
    <Button variant="outline" size="sm">
      <GitBranchIcon /> New Branch
    </Button>
  )
}

function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}

function ButtonVariantMatrix() {
  const variants = [
    "default",
    "secondary",
    "destructive",
    "outline",
    "ghost",
    "link",
  ] as const
  const sizes = ["sm", "default", "lg"] as const

  return (
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
  )
}

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
      <Example title="Default">
        <ButtonDefault />
      </Example>
      <Example title="With icon">
        <ButtonWithIcon />
      </Example>
      <Example title="Demo (outline + icon)">
        <ButtonDemo />
      </Example>
      <Example title="Variant × size matrix">
        <ButtonVariantMatrix />
      </Example>
    </div>
  )
}
