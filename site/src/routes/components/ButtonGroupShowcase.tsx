import * as React from "react"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AudioLinesIcon,
  BotIcon,
  CalendarPlusIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  ListFilterIcon,
  MailCheckIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TagIcon,
  Trash2Icon,
  TrashIcon,
  UserRoundXIcon,
  VolumeOffIcon,
} from "lucide-react"

import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Separator,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function ButtonGroupDemo() {
  const [label, setLabel] = React.useState("personal")

  return (
    <ButtonGroup>
      <ButtonGroup className="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeftIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Snooze</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More Options">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MailCheckIcon />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArchiveIcon />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <ClockIcon />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarPlusIcon />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListFilterIcon />
                Add to List
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TagIcon />
                  Label As...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={label} onValueChange={setLabel}>
                    <DropdownMenuRadioItem value="personal">Personal</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="work">Work</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="other">Other</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <Trash2Icon />
                Trash
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </ButtonGroup>
  )
}

function ButtonGroupDropdownExample() {
  return (
    <ButtonGroup>
      <Button variant="outline">Follow</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="pl-2!">
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="[--radius:1rem]">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <VolumeOffIcon />
              Mute Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckIcon />
              Mark as Read
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertTriangleIcon />
              Report Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserRoundXIcon />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShareIcon />
              Share Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CopyIcon />
              Copy Conversation
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <TrashIcon />
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

function ButtonGroupSplitExample() {
  return (
    <ButtonGroup>
      <Button variant="secondary">Button</Button>
      <ButtonGroupSeparator />
      <Button size="icon" variant="secondary">
        <PlusIcon />
      </Button>
    </ButtonGroup>
  )
}

function ButtonGroupSeparatorExample() {
  return (
    <ButtonGroup>
      <Button variant="secondary" size="sm">
        Copy
      </Button>
      <ButtonGroupSeparator />
      <Button variant="secondary" size="sm">
        Paste
      </Button>
    </ButtonGroup>
  )
}

function ButtonGroupOrientationExample() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Media controls" className="h-fit">
      <Button variant="outline" size="icon">
        <PlusIcon />
      </Button>
      <Button variant="outline" size="icon">
        <MinusIcon />
      </Button>
    </ButtonGroup>
  )
}

function ButtonGroupSizeExample() {
  return (
    <div className="flex flex-col items-start gap-8">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="sm">
          Button
        </Button>
        <Button variant="outline" size="sm">
          Group
        </Button>
        <Button variant="outline" size="icon-sm">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Button</Button>
        <Button variant="outline">Group</Button>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button variant="outline" size="lg">
          Button
        </Button>
        <Button variant="outline" size="lg">
          Group
        </Button>
        <Button variant="outline" size="icon-lg">
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </div>
  )
}

function ButtonGroupNestedExample() {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <Button variant="outline" size="sm">
          4
        </Button>
        <Button variant="outline" size="sm">
          5
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon-sm" aria-label="Previous">
          <ArrowLeftIcon />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Next">
          <ArrowRightIcon />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  )
}

function ButtonGroupInputExample() {
  return (
    <ButtonGroup>
      <Input placeholder="Search..." />
      <Button variant="outline" aria-label="Search">
        <SearchIcon />
      </Button>
    </ButtonGroup>
  )
}

function ButtonGroupInputGroupExample() {
  const [voiceEnabled, setVoiceEnabled] = React.useState(false)

  return (
    <ButtonGroup className="[--radius:9999rem]">
      <ButtonGroup>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <InputGroup>
          <InputGroupInput
            placeholder={voiceEnabled ? "Record and send audio..." : "Send a message..."}
            disabled={voiceEnabled}
          />
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  size="icon-xs"
                  data-active={voiceEnabled}
                  className="data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-800 dark:data-[active=true]:text-orange-100"
                  aria-pressed={voiceEnabled}
                >
                  <AudioLinesIcon />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>Voice Mode</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>
      </ButtonGroup>
    </ButtonGroup>
  )
}

function ButtonGroupSelectExample() {
  const CURRENCIES = [
    { value: "$", label: "US Dollar" },
    { value: "€", label: "Euro" },
    { value: "£", label: "British Pound" },
  ]
  const [currency, setCurrency] = React.useState("$")

  return (
    <ButtonGroup>
      <ButtonGroup>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="font-mono">{currency}</SelectTrigger>
          <SelectContent className="min-w-24">
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.value} <span className="text-muted-foreground">{c.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="10.00" pattern="[0-9]*" />
      </ButtonGroup>
      <ButtonGroup>
        <Button aria-label="Send" size="icon" variant="outline">
          <ArrowRightIcon />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  )
}

function ButtonGroupPopoverExample() {
  return (
    <ButtonGroup>
      <Button variant="outline">
        <BotIcon /> Copilot
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open Popover">
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="rounded-xl p-0 text-sm">
          <div className="px-4 py-3">
            <div className="text-sm font-medium">Agent Tasks</div>
          </div>
          <Separator />
          <div className="p-4 text-sm *:[p:not(:last-child)]:mb-2">
            <Textarea
              placeholder="Describe your task in natural language."
              className="mb-4 resize-none"
            />
            <p className="font-medium">Start a new task with Copilot</p>
            <p className="text-muted-foreground">
              Describe your task in natural language. Copilot will work in the background and
              open a pull request for your review.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => <ButtonGroupDemo />,
    code: `<ButtonGroup>
  <ButtonGroup>
    <Button variant="outline">Archive</Button>
    <Button variant="outline">Report</Button>
  </ButtonGroup>
  <ButtonGroup>
    <Button variant="outline">Snooze</Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="More Options">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">...</DropdownMenuContent>
    </DropdownMenu>
  </ButtonGroup>
</ButtonGroup>`,
  },
  {
    label: "Dropdown",
    render: () => <ButtonGroupDropdownExample />,
    code: `<ButtonGroup>
  <Button variant="outline">Follow</Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="pl-2!">
        <ChevronDownIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">...</DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>`,
  },
  {
    label: "Split",
    render: () => <ButtonGroupSplitExample />,
    code: `<ButtonGroup>
  <Button variant="secondary">Button</Button>
  <ButtonGroupSeparator />
  <Button size="icon" variant="secondary">
    <PlusIcon />
  </Button>
</ButtonGroup>`,
  },
  {
    label: "Separator",
    render: () => <ButtonGroupSeparatorExample />,
    code: `<ButtonGroup>
  <Button variant="secondary" size="sm">Copy</Button>
  <ButtonGroupSeparator />
  <Button variant="secondary" size="sm">Paste</Button>
</ButtonGroup>`,
  },
  {
    label: "Orientation",
    render: () => <ButtonGroupOrientationExample />,
    code: `<ButtonGroup orientation="vertical" aria-label="Media controls">
  <Button variant="outline" size="icon"><PlusIcon /></Button>
  <Button variant="outline" size="icon"><MinusIcon /></Button>
</ButtonGroup>`,
  },
  {
    label: "Size",
    render: () => <ButtonGroupSizeExample />,
    code: `<ButtonGroup>
  <Button variant="outline" size="sm">Small</Button>
  <Button variant="outline" size="sm">Button</Button>
  <Button variant="outline" size="sm">Group</Button>
  <Button variant="outline" size="icon-sm"><PlusIcon /></Button>
</ButtonGroup>`,
  },
  {
    label: "Nested",
    render: () => <ButtonGroupNestedExample />,
    code: `<ButtonGroup>
  <ButtonGroup>
    <Button variant="outline" size="sm">1</Button>
    <Button variant="outline" size="sm">2</Button>
  </ButtonGroup>
  <ButtonGroup>
    <Button variant="outline" size="icon-sm" aria-label="Previous"><ArrowLeftIcon /></Button>
    <Button variant="outline" size="icon-sm" aria-label="Next"><ArrowRightIcon /></Button>
  </ButtonGroup>
</ButtonGroup>`,
  },
  {
    label: "Input",
    render: () => <ButtonGroupInputExample />,
    code: `<ButtonGroup>
  <Input placeholder="Search..." />
  <Button variant="outline" aria-label="Search">
    <SearchIcon />
  </Button>
</ButtonGroup>`,
  },
  {
    label: "Input Group",
    render: () => <ButtonGroupInputGroupExample />,
    code: `<ButtonGroup className="[--radius:9999rem]">
  <ButtonGroup>
    <Button variant="outline" size="icon"><PlusIcon /></Button>
  </ButtonGroup>
  <ButtonGroup>
    <InputGroup>
      <InputGroupInput placeholder="Send a message..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs"><AudioLinesIcon /></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </ButtonGroup>
</ButtonGroup>`,
  },
  {
    label: "Select",
    render: () => <ButtonGroupSelectExample />,
    code: `<ButtonGroup>
  <ButtonGroup>
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="font-mono">{currency}</SelectTrigger>
      <SelectContent>...</SelectContent>
    </Select>
    <Input placeholder="10.00" pattern="[0-9]*" />
  </ButtonGroup>
  <ButtonGroup>
    <Button aria-label="Send" size="icon" variant="outline"><ArrowRightIcon /></Button>
  </ButtonGroup>
</ButtonGroup>`,
  },
  {
    label: "Popover",
    render: () => <ButtonGroupPopoverExample />,
    code: `<ButtonGroup>
  <Button variant="outline"><BotIcon /> Copilot</Button>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="icon" aria-label="Open Popover">
        <ChevronDownIcon />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end">...</PopoverContent>
  </Popover>
</ButtonGroup>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "orientation",
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: "ButtonGroup: joins its children's borders/radii along this axis.",
  },
  {
    prop: "asChild",
    type: "boolean",
    default: "false",
    description: "ButtonGroupText: renders the merged child element instead of a div.",
  },
]

export function ButtonGroupShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Button Group</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/button-group.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
