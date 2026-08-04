import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Marker,
  MarkerContent,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <div className="flex w-full max-w-sm flex-col gap-6 py-6">
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Deploying to prod real quick.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src="https://github.com/evilrabbit.png" alt="@rabbit" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>It&apos;s 4:55 PM. On a Friday.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@me" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>It&apos;s a one-line change.</BubbleContent>
            </Bubble>
            <MessageFooter>Delivered</MessageFooter>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage src="https://github.com/evilrabbit.png" alt="@rabbit" />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <BubbleGroup>
              <Bubble variant="muted">
                <BubbleContent>It&apos;s always a one-line change 😭.</BubbleContent>
              </Bubble>
              <Bubble variant="muted">
                <BubbleContent>Alright, let me take a look.</BubbleContent>
                <BubbleReactions aria-label="Reactions: thumbs up">
                  <span>👍</span>
                </BubbleReactions>
              </Bubble>
            </BubbleGroup>
          </MessageContent>
        </Message>
        <Marker role="status">
          <MarkerContent className="shimmer">
            <span className="font-medium">Oliver</span> is typing...
          </MarkerContent>
        </Marker>
      </div>
    ),
    code: `<Message align="end">
  <MessageAvatar><Avatar>...</Avatar></MessageAvatar>
  <MessageContent>
    <Bubble><BubbleContent>Deploying to prod real quick.</BubbleContent></Bubble>
  </MessageContent>
</Message>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "align",
    type: '"start" | "end"',
    default: '"start"',
    description: "Message: mirrors the layout for the current user's messages vs. others.",
  },
]

export function MessageShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Message</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/message.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
