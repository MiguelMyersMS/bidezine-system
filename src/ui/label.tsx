/**
 * Label — ATOM.
 *
 * Behaviour: borrowed from shadcn/ui (MIT) — Radix `Label`, which wires the
 * label→control association and forwards clicks to the control.
 * See THIRD-PARTY-LICENSES.md.
 *
 * ⚠️ PHASE 4 PENDING (re-skin) — see button.tsx for what that means.
 */
import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
