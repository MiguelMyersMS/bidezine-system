import type React from "react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@bidezine/system"
import { Example } from "./Example"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "#alert-dialog",
    description: "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "#hover-card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "#progress",
    description: "Displays an indicator showing the completion progress of a task.",
  },
  {
    title: "Scroll-area",
    href: "#scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "#tabs",
    description: "A set of layered sections of content displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "#tooltip",
    description: "A popup that displays information related to an element when it receives focus or hover.",
  },
]

export function NavigationMenuShowcase() {
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Navigation Menu</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/navigation-menu.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <Example title="Demo">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-96">
                  <ListItem href="#intro" title="Introduction">
                    Re-usable components built with Tailwind CSS.
                  </ListItem>
                  <ListItem href="#installation" title="Installation">
                    How to install dependencies and structure your app.
                  </ListItem>
                  <ListItem href="#typography" title="Typography">
                    Styles for headings, paragraphs, and lists.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden md:flex">
              <NavigationMenuTrigger>Components</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {components.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a href="#docs">Docs</a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Example>
    </div>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <a href={href}>
          <div className="flex flex-col gap-1 text-sm">
            <div className="leading-none font-medium">{title}</div>
            <div className="line-clamp-2 text-muted-foreground">{children}</div>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  )
}
