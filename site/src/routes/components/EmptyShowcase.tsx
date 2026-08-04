import { ArrowUpRightIcon, FolderOpenIcon } from "lucide-react"

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpenIcon />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </EmptyContent>
        <Button variant="link" asChild className="text-muted-foreground" size="sm">
          <a href="#learn-more">
            Learn More <ArrowUpRightIcon />
          </a>
        </Button>
      </Empty>
    ),
    code: `<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <FolderOpenIcon />
    </EmptyMedia>
    <EmptyTitle>No Projects Yet</EmptyTitle>
    <EmptyDescription>
      You haven&apos;t created any projects yet. Get started by creating your first project.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyContent className="flex-row justify-center gap-2">
    <Button>Create Project</Button>
    <Button variant="outline">Import Project</Button>
  </EmptyContent>
  <Button variant="link" asChild className="text-muted-foreground" size="sm">
    <a href="#learn-more">
      Learn More <ArrowUpRightIcon />
    </a>
  </Button>
</Empty>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "variant",
    type: "\"default\" | \"icon\"",
    default: "\"default\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function EmptyShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Empty</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/empty.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="Empty" />
      <ApiReference rows={apiRows2} title="EmptyMedia" />
    </div>
  )
}
