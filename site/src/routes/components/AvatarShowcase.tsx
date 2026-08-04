import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

/**
 * Reproduces reference/shadcn-ui/apps/v4/examples/radix/avatar-demo.tsx
 * verbatim, restructured as an ExampleBrowser (filter chips, one at a time)
 * instead of a single fixed demo.
 */

const examples: ShowcaseExample[] = [
  {
    label: "Default",
    render: () => (
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" className="grayscale" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    ),
    code: `<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`,
  },
  {
    label: "Fallback",
    render: () => (
      <Avatar>
        <AvatarImage src="/broken-image.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    ),
    code: `<Avatar>
  <AvatarImage src="/broken-image.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`,
  },
  {
    label: "Size",
    render: () => (
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    ),
    code: `<Avatar size="sm">…</Avatar>
<Avatar>…</Avatar>
<Avatar size="lg">…</Avatar>`,
  },
  {
    label: "Badge",
    render: () => (
      <Avatar>
        <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
        <AvatarFallback>ER</AvatarFallback>
        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
      </Avatar>
    ),
    code: `<Avatar>
  <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
  <AvatarFallback>ER</AvatarFallback>
  <AvatarBadge className="bg-green-600" />
</Avatar>`,
  },
  {
    label: "Group",
    render: () => (
      <AvatarGroup className="grayscale">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    ),
    code: `<AvatarGroup>
  <Avatar>…</Avatar>
  <Avatar>…</Avatar>
  <Avatar>…</Avatar>
  <AvatarGroupCount>+3</AvatarGroupCount>
</AvatarGroup>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "size",
    type: `"default" | "sm" | "lg"`,
    default: `"default"`,
    description: "Avatar diameter. AvatarBadge and AvatarGroupCount scale to match.",
  },
]

export function AvatarShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Avatar</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/avatar.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
