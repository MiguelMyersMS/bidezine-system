// Hand-authored declaration for the plain-ESM tw-merge.mjs (Issue 07l). tw-merge.mjs is
// JavaScript on purpose — the node-run check imports it unchanged — but this package
// compiles under verbatimModuleSyntax with no allowJs, so utils.ts needs a type for its
// import. cn's public type is pinned here (and re-declared explicitly in utils.ts) so the
// emitted dist/lib/utils.d.ts stays self-contained and never references this .mjs path.
import type { ClassValue } from "clsx"

export declare function cn(...inputs: ClassValue[]): string
