import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  Badge,
  Button,
  FolderIcon,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
} from "@bidezine/system"
import { navManifest } from "@/nav-manifest"

/**
 * Heading and copy are the original HomeRoute's, unchanged. The progress bar
 * and the Groups list are additions — navigation aids for browsing 59 pages.
 */
export function HomeRoute() {
  const navigate = useNavigate()
  const all = navManifest.flatMap((category) => category.components)
  const ready = all.filter((component) => component.status === "ready")

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">bidezine/system showcase</h1>
        <p className="mt-2 text-muted-foreground">
          Every component from shadcn/ui, reproduced through{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">@bidezine/system</code>,
          verified against the source, then adjusted to taste.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {ready.length} of {all.length} components ported so far. Pick one from the sidebar
          to see it live.
        </p>
        <div className="mt-4 max-w-xs">
          <Progress value={(ready.length / all.length) * 100} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Groups</h2>
        <ItemGroup className="gap-2">
          {navManifest.map((category) => (
            <Item key={category.slug} variant="outline" size="sm">
              <ItemMedia variant="icon">
                <FolderIcon />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>
                  {category.title}
                  <Badge variant="secondary">{category.components.length}</Badge>
                </ItemTitle>
                <ItemDescription>
                  {category.components.map((component) => component.name).join(" · ")}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    navigate(`/components/${category.components[0].slug}`)
                  }
                >
                  Open <ArrowRightIcon />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </section>
    </div>
  )
}
