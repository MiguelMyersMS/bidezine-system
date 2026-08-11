import * as React from "react"

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

function CheckboxesDemo() {
  const [showStatusBar, setShowStatusBar] = React.useState(true)
  const [showActivityBar, setShowActivityBar] = React.useState(false)
  const [showPanel, setShowPanel] = React.useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Appearance</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={showStatusBar ?? false}
            onCheckedChange={setShowStatusBar}
          >
            Status Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showActivityBar}
            onCheckedChange={setShowActivityBar}
            disabled
          >
            Activity Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
            Panel
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Email</DropdownMenuItem>
                  <DropdownMenuItem>Message</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>More...</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              New Team
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>GitHub</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    code: `<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">Open</Button></DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuGroup>
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuItem>Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
      ...
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
  },
  {
    label: "Checkboxes",
    render: () => <CheckboxesDemo />,
    code: `<DropdownMenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
  Status Bar
</DropdownMenuCheckboxItem>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "open / defaultOpen",
    type: "boolean",
    description: "Controlled/uncontrolled open state (Radix DropdownMenu prop).",
  },
  {
    prop: "align",
    type: `"start" | "center" | "end"`,
    default: `"center"`,
    description: "DropdownMenuContent: alignment relative to the trigger.",
  },
  {
    prop: "isActive",
    type: "boolean",
    default: "false",
    description:
      "DropdownMenuItem: marks this item as representing the current page/section (not a checkbox/radio toggle) — adds a persistent bg-accent/font-medium treatment and fills any icon child, mirroring Button's own `active` and Sidebar's SidebarMenuButton.isActive convention.",
  },
  {
    prop: "isOpen",
    type: "boolean",
    default: "false",
    description:
      "DropdownMenuItem: marks this item's own destination (e.g. a panel or section it navigates to) as currently open, but nothing inside it chosen as the active leaf yet — a lighter bg-accent/text-accent-foreground treatment than isActive, distinct from it. Sets data-state=\"open\" and feeds the same icon-fill hook as isActive.",
  },
]

export function DropdownMenuShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dropdown Menu</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/dropdown-menu.tsx
          </code>{" "}
          , with three deliberate divergences: <code className="rounded bg-muted px-1 py-0.5 text-sm">
            DropdownMenuContent
          </code>{" "}
          composes the real <code className="rounded bg-muted px-1 py-0.5 text-sm">ScrollArea</code>{" "}
          primitive instead of shadcn&rsquo;s plain <code className="rounded bg-muted px-1 py-0.5 text-sm">overflow-y-auto</code>{" "}
          div (shadcn&rsquo;s own source never composes the two — see CLAUDE.md&rsquo;s Scroll region protocol);{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">DropdownMenuItem</code> gains an{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">isActive</code> prop shadcn&rsquo;s own source has
          no equivalent for — a persistent "this represents the current page/section" indicator (background,
          font weight, and icon fill together), mirroring the same concept <code className="rounded bg-muted px-1 py-0.5 text-sm">Button</code>{" "}
          and <code className="rounded bg-muted px-1 py-0.5 text-sm">SidebarMenuButton</code> already use; and both{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">DropdownMenuItem</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">DropdownMenuCheckboxItem</code> gain an{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">active:bg-accent active:text-accent-foreground</code>{" "}
          pressed-state rule (shadcn&rsquo;s source has no distinct mousedown/pressed background for any menu row),
          and <code className="rounded bg-muted px-1 py-0.5 text-sm">DropdownMenuCheckboxItem</code> gains{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">data-[state=checked]:bg-accent/50</code>{" "}
          for a checked-row resting tint. Both reuse the exact <code className="rounded bg-muted px-1 py-0.5 text-sm">--accent</code>{" "}
          token this component already uses for its own <code className="rounded bg-muted px-1 py-0.5 text-sm">focus:</code>{" "}
          state — never a new color — mirroring <code className="rounded bg-muted px-1 py-0.5 text-sm">SidebarMenuButton</code>&rsquo;s{" "}
          own already-established <code className="rounded bg-muted px-1 py-0.5 text-sm">active:bg-sidebar-accent</code>{" "}
          and <code className="rounded bg-muted px-1 py-0.5 text-sm">NavigationMenuLink</code>&rsquo;s own{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">data-[active=true]:bg-accent/50</code> conventions.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
