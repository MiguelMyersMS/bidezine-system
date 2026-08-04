import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const messages = Array.from({ length: 12 }, (_, index) => ({
  id: "message-" + (index + 1),
  role: index % 2 === 0 ? "user" : "assistant",
  text:
    index % 2 === 0
      ? "Review scroll checkpoint " + (index + 1) + "."
      : "Checkpoint " + (index + 1) + " is synced. The viewport should preserve context while the transcript grows.",
}))

const examples: ShowcaseExample[] = [
  {
    label: "Scrollable transcript",
    render: () => (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <Card className="h-[35rem] w-full gap-0 overflow-hidden">
          <CardHeader className="gap-1 border-b">
            <CardTitle>Scroll Status</CardTitle>
            <CardDescription>
              Scroll the transcript to see the jump button appear when new content is out of view.
            </CardDescription>
          </CardHeader>
          <MessageScrollerProvider defaultScrollPosition="start">
            <CardContent className="flex-1 overflow-hidden p-0">
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="gap-4 p-(--card-spacing)">
                    {messages.map((message) => (
                      <MessageScrollerItem
                        key={message.id}
                        scrollAnchor={message.role === "user"}
                      >
                        <Message align={message.role === "user" ? "end" : "start"}>
                          <MessageAvatar>
                            <Avatar>
                              <AvatarImage
                                src={
                                  message.role === "user"
                                    ? "https://github.com/shadcn.png"
                                    : "https://github.com/evilrabbit.png"
                                }
                                alt={message.role}
                              />
                              <AvatarFallback>
                                {message.role === "user" ? "ME" : "AI"}
                              </AvatarFallback>
                            </Avatar>
                          </MessageAvatar>
                          <MessageContent>
                            <Bubble variant={message.role === "user" ? "default" : "muted"}>
                              <BubbleContent>{message.text}</BubbleContent>
                            </Bubble>
                            {message.role === "assistant" ? (
                              <MessageFooter>Synced just now</MessageFooter>
                            ) : null}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </CardContent>
          </MessageScrollerProvider>
        </Card>
        <div className="px-0.5 text-center text-xs text-muted-foreground">
          Based on the reference scrollable transcript examples.
        </div>
      </div>
    ),
    code: `<MessageScrollerProvider defaultScrollPosition="start">
  <MessageScroller>
    <MessageScrollerViewport>
      <MessageScrollerContent>
        <MessageScrollerItem scrollAnchor={message.role === "user"}>
          <Message>...</Message>
        </MessageScrollerItem>
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "defaultScrollPosition",
    type: '"start" | "end"',
    default: '"end"',
    description: "MessageScrollerProvider: where the viewport starts scrolled on mount.",
  },
  {
    prop: "scrollAnchor",
    type: "boolean",
    default: "false",
    description: "MessageScrollerItem: marks this item as the anchor to scroll to on updates.",
  },
]

export function MessageScrollerShowcase() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Message Scroller</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/message-scroller.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
