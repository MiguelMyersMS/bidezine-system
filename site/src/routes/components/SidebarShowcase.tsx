import {
  BookOpenIcon,
  ChevronRightIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FolderIcon,
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  PieChartIcon,
  SendIcon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const projects = [
  { name: "Design Engineering", url: "#design", icon: FrameIcon },
  { name: "Sales & Marketing", url: "#sales", icon: PieChartIcon },
  { name: "Travel", url: "#travel", icon: MapIcon },
  { name: "Support", url: "#support", icon: LifeBuoyIcon },
  { name: "Feedback", url: "#feedback", icon: SendIcon },
]

const examples: ShowcaseExample[] = [
  {
    label: "Controlled workspace layout",
    render: () => (
      <SidebarProvider className="min-h-[32rem] overflow-hidden rounded-lg border">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <a href="#workspace">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <FolderIcon className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Bidezine System</span>
                      <span className="truncate text-xs">Main workspace</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarSeparator className="mx-2 max-w-[calc(100%-1rem)]" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.name}>
                      <SidebarMenuButton asChild>
                        <a href={project.url}>
                          <project.icon />
                          <span>{project.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Docs</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <BookOpenIcon />
                          <span>Documentation</span>
                          <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#introduction">
                                <span>Introduction</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#components">
                                <span>Components</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#changelog">
                                <span>Changelog</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#account">
                    <LifeBuoyIcon />
                    <span>Support</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Workspace overview</span>
          </header>
          <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium">Active sprint</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Port remaining shadcn components and validate the preview site.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium">Today</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                12 components reviewed, 7 examples queued, 0 runtime errors spotted.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    ),
    code: `<SidebarProvider>
  <Sidebar>
    <SidebarHeader>...</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu>...</SidebarMenu></SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>...</SidebarInset>
</SidebarProvider>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "defaultOpen / open / onOpenChange",
    type: "boolean",
    description: "SidebarProvider: controls collapsed/expanded state, persisted via cookie by default.",
  },
  {
    prop: "collapsible",
    type: `"offcanvas" | "icon" | "none"`,
    default: `"offcanvas"`,
    description: "Sidebar: how the sidebar collapses on smaller viewports.",
  },
]

export function SidebarShowcase() {
  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Sidebar</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/sidebar.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} />
    </div>
  )
}
