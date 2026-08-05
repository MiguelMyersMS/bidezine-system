import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Demo",
    render: () => (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuGroup>
            <ContextMenuItem>
              Back
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              Forward
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Reload
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuGroup>
                  <ContextMenuItem>Save Page...</ContextMenuItem>
                  <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                  <ContextMenuItem>Name Window...</ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                  <ContextMenuItem>Developer Tools</ContextMenuItem>
                </ContextMenuGroup>
                <ContextMenuSeparator />
                <ContextMenuGroup>
                  <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuCheckboxItem checked>Show Bookmarks</ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuRadioGroup value="pedro">
              <ContextMenuLabel>People</ContextMenuLabel>
              <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
              <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    ),
    code: `<ContextMenu>
  <ContextMenuTrigger>Right click here</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Back<ContextMenuShortcut>⌘[</ContextMenuShortcut></ContextMenuItem>
    ...
  </ContextMenuContent>
</ContextMenu>`,
  },
  {
    label: "Checkboxes",
    render: () => (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuCheckboxItem defaultChecked>
              Show Bookmarks Bar
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem defaultChecked>
              Show Developer Tools
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    ),
    code: `<ContextMenuCheckboxItem defaultChecked>Show Bookmarks Bar</ContextMenuCheckboxItem>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "variant",
    type: `"default" | "destructive"`,
    default: `"default"`,
    description: "ContextMenuItem: visual style, destructive uses the destructive color token.",
  },
  {
    prop: "checked / defaultChecked",
    type: "boolean",
    description: "ContextMenuCheckboxItem: controlled/uncontrolled checked state.",
  },
]

export function ContextMenuShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Context Menu</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/context-menu.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
