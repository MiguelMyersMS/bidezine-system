import type { ClassValue } from "clsx"

import { cn as cnImpl } from "./tw-merge.mjs"

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 * Borrowed from shadcn (MIT) — behaviour only; see THIRD-PARTY-LICENSES.md.
 *
 * The merge itself is configured in ./tw-merge.mjs (Issue 07l): our custom named
 * utilities (text-<role>, shadow-elevation-*) are registered with tailwind-merge so its
 * default catch-all colour groups stop deleting them. That module is plain ESM so the
 * node-run scripts/check-type-slots.mjs Link C imports the SAME cn this ships — the check
 * exercises the real merge, not a copy of it. The type is re-annotated explicitly here so
 * the emitted declaration never has to reach into the .mjs.
 */
export const cn: (...inputs: ClassValue[]) => string = cnImpl
