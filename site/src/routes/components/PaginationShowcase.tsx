import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#page-1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#page-1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#page-2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#page-3">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#page-3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
    code: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#page-1" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#page-1">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#page-2" isActive>
        2
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#page-3">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#page-3" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "isActive",
    type: "boolean",
  },
  {
    prop: "size",
    type: "\"default\" | \"sm\" | \"lg\" | \"icon\" | \"xs\" | \"icon-xs\" | \"icon-sm\" | \"icon-lg\"",
    default: "\"icon\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function PaginationShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Pagination</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/pagination.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} title="PaginationLink" />
    </div>
  )
}
