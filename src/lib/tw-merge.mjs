// The configured tailwind-merge, shared verbatim by two importers so neither can hold a
// different idea of what a merge does (Issue 07l):
//   • src/lib/utils.ts re-exports cn from here — this is what ships.
//   • scripts/check-type-slots.mjs's Link C imports THIS cn — so the check runs the real
//     merge, never a reimplementation of it.
//
// Why it exists: tailwind-merge's DEFAULT config knows none of our custom named
// utilities. Its theme `color` group is declared [isAny] — a catch-all that matches any
// class part — so every `text-<role>` (text-body, text-control-sm, …) classifies as a
// COLOUR, not a font size. A role and a colour in one class string then land in the SAME
// conflict group and tailwind-merge keeps only the last, silently deleting the role at
// runtime with no visual symptom. `shadow-color` (also [isAny]) does the identical thing
// to `shadow-elevation-*`. extendTailwindMerge re-files each custom name under the group
// it actually sets, so a role and a colour become DIFFERENT groups and both survive.
//
// The name lists are DERIVED — src/tw-merge-groups.js is emitted by build-tokens.mjs from
// the same typography/shadow composites the CSS is built from — so this file never carries
// a hand-written second copy of the token vocabulary. This module is plain ESM (no CSS, no
// React, no TypeScript) precisely so the node-run check can import it unchanged.
import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

import { fontSizeRoles, ringWidthNames, shadowElevationNames } from "../tw-merge-groups.js"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Extends the stock font-size group (keyed by the `text` class part), so
      // `text-body` resolves to font-size and no longer collides with a text colour.
      "font-size": [{ text: fontSizeRoles }],
      // Extends the stock box-shadow group (keyed by the `shadow` class part), so
      // `shadow-elevation-md` resolves to box-shadow and no longer collides with a
      // shadow colour.
      shadow: [{ shadow: shadowElevationNames }],
      // Extends the stock ring-width group (keyed by the `ring` class part), so
      // `ring-focus` resolves to ring-width and no longer collides with a ring
      // colour — the [isAny] catch-all that would otherwise delete it (cn drops
      // `ring-focus` from "ring-focus ring-ring/50" without this). Tailwind v4 exposes
      // no --ring-* theme namespace, so unlike font-size/shadow the utility itself is
      // authored as an @utility in system.css; this only teaches the merge to keep it.
      "ring-w": [{ ring: ringWidthNames }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
