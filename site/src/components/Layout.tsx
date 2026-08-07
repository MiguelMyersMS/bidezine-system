import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Button,
  ChevronDownIcon,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  ScrollArea,
  TooltipProvider,
} from "@bidezine/system"
import { navManifest } from "@/nav-manifest"
import { ThemeSwitcher } from "./ThemeSwitcher"

/**
 * Sidebar + content shell.
 *
 * Both columns scroll inside a ScrollArea rather than the page: the shell is
 * exactly 100vh, index.css sets html/body to overflow hidden, so the browser's
 * own scrollbar never appears and both columns use the system's thumb.
 */
export function Layout() {
  const location = useLocation()

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
          <NavLink to="/" className="mb-4 block text-lg font-semibold">
            bidezine<span className="text-muted-foreground">/system</span>
          </NavLink>

          <div className="mb-6">
            <ThemeSwitcher />
          </div>

          <ScrollArea className="-mr-2 min-h-0 flex-1 pr-2">
            <nav className="flex flex-col gap-6">
              {navManifest.map((category) => (
                <Collapsible key={category.slug} defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="group mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      {category.title}
                      <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="flex flex-col gap-0.5">
                      {category.components.map((component) => {
                        const isActive =
                          location.pathname === `/components/${component.slug}`
                        return (
                          <li key={component.slug}>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className={cn(
                                isActive && "bg-accent text-accent-foreground",
                                component.status === "pending" && "opacity-50"
                              )}
                            >
                              <NavLink to={`/components/${component.slug}`}>
                                <span>{component.name}</span>
                                {component.status === "pending" && (
                                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    soon
                                  </span>
                                )}
                              </NavLink>
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <ScrollArea className="h-screen min-w-0 flex-1">
          <main className="p-[10px]">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
