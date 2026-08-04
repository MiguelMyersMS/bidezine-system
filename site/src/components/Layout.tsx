import { NavLink, Outlet } from "react-router-dom"
import { ScrollArea, TooltipProvider } from "@bidezine/system"
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
                <div key={category.slug}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {category.title}
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {category.components.map((component) => (
                      <li key={component.slug}>
                        <NavLink
                          to={`/components/${component.slug}`}
                          className={({ isActive }) =>
                            [
                              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/80 hover:bg-accent/50",
                              component.status === "pending" ? "opacity-50" : "",
                            ].join(" ")
                          }
                        >
                          <span>{component.name}</span>
                          {component.status === "pending" && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              soon
                            </span>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <ScrollArea className="h-screen min-w-0 flex-1">
          <main className="px-8 py-8">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
