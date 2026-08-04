import { ThemeProvider } from "next-themes"
import { toast } from "sonner"

import { Button, Toaster } from "@bidezine/system"
import { ExampleBrowser, type ShowcaseExample } from "@/components/ExampleBrowser"
import { ApiReference, type ApiRow } from "@/components/ApiReference"

const examples: ShowcaseExample[] = [
  {
    label: "Toast demo",
    render: () => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast("Event has been created", {
                description: "Sunday, December 03, 2023 at 9:00 AM",
                action: {
                  label: "Undo",
                  onClick: () => undefined,
                },
              })
            }
          >
            Show Toast
          </Button>
          <Toaster closeButton />
        </div>
      </ThemeProvider>
    ),
    code: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  <div className="flex items-center gap-3">
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => undefined,
          },
        })
      }
    >
      Show Toast
    </Button>
    <Toaster closeButton />
  </div>
</ThemeProvider>`,
  },
]

const apiRows: ApiRow[] = [
  {
    prop: "theme",
    type: "ToasterProps[\"theme\"]",
  },
  {
    prop: "className",
    type: "string",
    default: "\"toaster group\"",
  }
]

export function SonnerShowcase() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Sonner</h1>
        <p className="mt-2 text-muted-foreground">
          Ported from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/sonner.tsx
          </code>{" "}
          unchanged.
        </p>
      </div>
      <ExampleBrowser examples={examples} />
      <ApiReference rows={apiRows} title="Toaster" />
    </div>
  )
}
