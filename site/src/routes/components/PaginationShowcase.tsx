import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@bidezine/system"
import { Example } from "./Example"

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
      <Example title="Demo">
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
      </Example>
    </div>
  )
}
