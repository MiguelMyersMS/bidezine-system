import { NavLink, Outlet } from "react-router-dom"
import { TooltipProvider } from "@bidezine/system"
import { navManifest } from "@/nav-manifest"

export function Layout() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 border-r border-border bg-card px-4 py-6 overflow-y-auto">
          <NavLink to="/" className="mb-6 block text-lg font-semibold">
            bidezine<span className="text-muted-foreground">/system</span>
          </NavLink>
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
        </aside>
        <main className="flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
