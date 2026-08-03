import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 * Borrowed from shadcn (MIT) — behaviour only; see THIRD-PARTY-LICENSES.md.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
