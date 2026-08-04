import {
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <Carousel className="w-full max-w-[12rem] sm:max-w-xs">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    ),
    code: `<Carousel className="w-full max-w-[12rem] sm:max-w-xs">
  <CarouselContent>
    {Array.from({ length: 5 }).map((_, index) => (
      <CarouselItem key={index}>
        <div className="p-1">
          <Card>
            <CardContent className="flex aspect-square items-center justify-center p-6">
              <span className="text-4xl font-semibold">{index + 1}</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "orientation",
    type: "\"horizontal\" | \"vertical\"",
    default: "\"horizontal\"",
  },
  {
    prop: "opts",
    type: "CarouselOptions",
  },
  {
    prop: "setApi",
    type: "(api: CarouselApi) => void",
  },
  {
    prop: "plugins",
    type: "EmblaPluginType[]",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "variant",
    type: "Button variant",
    default: "\"outline\"",
  },
  {
    prop: "size",
    type: "Button size",
    default: "\"icon\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function CarouselShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Carousel</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/carousel.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="Carousel" />
      <ApiReference rows={apiRows2} title="CarouselPrevious / CarouselNext" />
    </div>
  )
}
