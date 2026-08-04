import { AspectRatio } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/aspect-ratio-demo.tsx,
 * with next/image swapped for a plain <img> since this site isn't a Next.js
 * app — same source image, fill behaviour, and classes. Restructured as an
 * ExampleBrowser instead of a single fixed demo.
 */

const examples: ShowcaseExample[] = [
  {
    label: "16:9",
    render: () => (
      <div className="w-full max-w-sm">
        <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
          <img
            src="https://avatar.vercel.sh/shadcn1"
            alt="Photo"
            className="size-full rounded-lg object-cover grayscale dark:brightness-20"
          />
        </AspectRatio>
      </div>
    ),
    code: `<AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
  <img src="..." alt="Photo" className="size-full rounded-lg object-cover" />
</AspectRatio>`,
  },
  {
    label: "1:1",
    render: () => (
      <div className="w-full max-w-[200px]">
        <AspectRatio ratio={1} className="rounded-lg bg-muted">
          <img
            src="https://avatar.vercel.sh/shadcn2"
            alt="Photo"
            className="size-full rounded-lg object-cover grayscale dark:brightness-20"
          />
        </AspectRatio>
      </div>
    ),
    code: `<AspectRatio ratio={1} className="rounded-lg bg-muted">
  <img src="..." alt="Photo" className="size-full rounded-lg object-cover" />
</AspectRatio>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "ratio",
    type: "number",
    default: "1",
    description: "Width divided by height, e.g. 16 / 9.",
  },
]

export function AspectRatioShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Aspect Ratio</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/aspect-ratio.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
