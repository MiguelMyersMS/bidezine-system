/**
 * The golden-path slice, rendered.
 *
 * Dialog (organism) → Field (molecule) → Label + Input (atoms) → Button (atoms).
 * This is the visual + behavioural proof surface for Step 4 of the handoff.
 */
import { useState } from "react"

import { Button } from "@/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/ui/field"
import { Input } from "@/ui/input"

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        document.documentElement.classList.toggle("dark")
        setDark((d) => !d)
      }}
    >
      {dark ? "Light" : "Dark"} mode
    </Button>
  )
}

export function ModalFormDemo() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-8 p-8 font-sans">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">@bidezine/system — golden path</h1>
        <p className="text-muted-foreground text-sm">
          Dialog → Field → Label + Input → Button. Theme flips via CSS variables
          only — no React re-render of the token layer.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Dialog>
          <DialogTrigger asChild>
            <Button>Edit profile</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="demo-name">Name</FieldLabel>
                <Input id="demo-name" defaultValue="Miguel Myers" />
                <FieldDescription>
                  This is the name shown to your team.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="demo-email">Email</FieldLabel>
                <Input
                  id="demo-email"
                  type="email"
                  defaultValue="miguel@bidezine.com"
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Button variant matrix — the CVA extraction, rendered. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(
          ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
        ).map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
    </div>
  )
}
