import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full max-w-sm flex-col gap-8 py-6">
        <Bubble align="end">
          <BubbleContent>Hey there! What&apos;s up?</BubbleContent>
        </Bubble>
        <BubbleGroup>
          <Bubble variant="muted">
            <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
          </Bubble>
          <Bubble variant="muted">
            <BubbleContent>
              I can group messages, switch sides, and keep the whole thread easy to scan.
            </BubbleContent>
            <BubbleReactions role="img" aria-label="Reaction: thumbs up">
              <span>👍</span>
            </BubbleReactions>
          </Bubble>
        </BubbleGroup>
        <Bubble align="end">
          <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            Yes. You are reading a demo that is demoing itself. Very meta. Very on-brand.
          </BubbleContent>
          <BubbleReactions
            role="img"
            aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
          >
            <span>👍</span>
            <span>🔥</span>
            <span>👀</span>
            <span>+2</span>
          </BubbleReactions>
        </Bubble>
      </div>
    ),
    code: `<div className="flex w-full max-w-sm flex-col gap-8 py-6">
  <Bubble align="end">
    <BubbleContent>Hey there! What&apos;s up?</BubbleContent>
  </Bubble>
  <BubbleGroup>
    <Bubble variant="muted">
      <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
    </Bubble>
    <Bubble variant="muted">
      <BubbleContent>
        I can group messages, switch sides, and keep the whole thread easy to scan.
      </BubbleContent>
      <BubbleReactions role="img" aria-label="Reaction: thumbs up">
        <span>👍</span>
      </BubbleReactions>
    </Bubble>
  </BubbleGroup>
  <Bubble align="end">
    <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
  </Bubble>
  <Bubble variant="muted">
    <BubbleContent>
      Yes. You are reading a demo that is demoing itself. Very meta. Very on-brand.
    </BubbleContent>
    <BubbleReactions
      role="img"
      aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
    >
      <span>👍</span>
      <span>🔥</span>
      <span>👀</span>
      <span>+2</span>
    </BubbleReactions>
  </Bubble>
</div>`,
  },
]

const apiRows1: ApiRow[] = [
  {
    prop: "variant",
    type: "\"default\" | \"outline\"",
    default: "\"default\"",
  },
  {
    prop: "align",
    type: "\"start\" | \"end\"",
    default: "\"start\"",
  },
  {
    prop: "className",
    type: "string",
  }
]

const apiRows2: ApiRow[] = [
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
  },
  {
    prop: "className",
    type: "string",
  }
]

export function BubbleShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Bubble</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/bubble.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows1} title="Bubble" />
      <ApiReference rows={apiRows2} title="BubbleContent" />
    </div>
  )
}
