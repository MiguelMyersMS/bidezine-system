import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bidezine/system"
import { Example } from "./Example"

export function AccordionShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Accordion</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <Accordion type="single" collapsible defaultValue="shipping" className="max-w-lg">
          <AccordionItem value="shipping">
            <AccordionTrigger>What are your shipping options?</AccordionTrigger>
            <AccordionContent>
              We offer standard, express, and overnight shipping with free delivery on international orders.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>What is your return policy?</AccordionTrigger>
            <AccordionContent>
              Returns are accepted within 30 days as long as items are unused and in original packaging.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger>How can I contact support?</AccordionTrigger>
            <AccordionContent>
              Reach us by email, live chat, or phone. We reply within one business day.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Example>
    </div>
  )
}
