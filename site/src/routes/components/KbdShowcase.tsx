import { Kbd, KbdGroup } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/kbd-demo.tsx
 * verbatim.
 */
const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex flex-col items-center gap-4">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌥</Kbd>
          <Kbd>⌃</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>B</Kbd>
        </KbdGroup>
      </div>
    ),
    code: `<div className="flex flex-col items-center gap-4">
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>⇧</Kbd>
    <Kbd>⌥</Kbd>
    <Kbd>⌃</Kbd>
  </KbdGroup>
  <KbdGroup>
    <Kbd>Ctrl</Kbd>
    <span>+</span>
    <Kbd>B</Kbd>
  </KbdGroup>
</div>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "className",
    type: "string",
    description: "Additional classes applied to the keycap.",
  }
]

export function KbdShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Kbd</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/kbd.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} title="Kbd" />
    </div>
  )
}
