---
name: figma-use
description: Mandatory low-level Figma MCP guardrail skill for any task that writes to Figma via `use_figma`, or performs a unique Figma read that requires Plugin API JavaScript execution. Use this skill to enforce safe `use_figma` scripting rules, page-loading rules, text/font mutation rules, incremental write discipline, and reliable return-value patterns. It is the write-safety layer for all Figma MCP work in this repo.
version: 1.0.0
---

# /figma-use — low-level Figma Plugin API guardrails

Use this skill whenever a task needs direct Figma Plugin API execution through `use_figma`.
It is the low-level write-safety layer for Figma MCP work in this repo.

Use this skill when the job is: inspect or mutate Figma directly, safely, with the Plugin API.

## When To Use It

Load this skill before any `use_figma` call that:

1. creates, edits, deletes, or rearranges Figma nodes
2. creates variables, styles, components, or variants in Figma
3. needs a unique read that must execute JavaScript in the Figma file context
4. needs page inspection, node discovery, or structural analysis beyond static Figma data reads

## Core Rule

**Work incrementally in small, validated `use_figma` steps.**

Large one-shot scripts are the main failure mode. Prefer a short sequence of narrow writes:

1. inspect
2. create one unit
3. validate
4. continue

## Critical Rules

1. **Use `return` as the output channel.** The agent only receives what the script returns.
2. **Return all created and mutated node IDs.** Every write script must return structured IDs, for example:
   ```js
   return {
     createdNodeIds: [...],
     mutatedNodeIds: [...],
   };
   ```
3. **Do not call `figma.closePlugin()` and do not wrap the script in an async IIFE.** Write plain JavaScript with top-level `await` and `return`.
4. **Do not use `figma.notify()`.** It is not a reliable output or status channel here.
5. **Do not rely on `console.log()`.** Return data explicitly.
6. **Colors use 0–1 values, not 0–255.** Example: `{ r: 1, g: 0, b: 0 }` is red.
7. **Fills and strokes are read-only arrays.** Clone, modify, then reassign.
8. **Always `await` every Promise.** Unawaited calls create silent failures and race conditions.
9. **On script error, stop and correct the script before retrying.** Treat errors as atomic failures, not partial-success writes.
10. **Never parallelize Figma writes.** Mutating `use_figma` calls must run sequentially.

## Page Rules

Page context resets between `use_figma` invocations. Do not assume the previous call's page is still active.

1. Use `await figma.setCurrentPageAsync(page)` to switch pages.
2. Do not use `figma.currentPage = page`; it is not the supported page-switch path here.
3. At the start of each invocation that targets a non-default page, switch to that page explicitly.
4. Inside one `use_figma` script, switch pages at most once.
5. If work spans multiple pages, split it into separate `use_figma` calls rather than looping page changes inside a single mutating script.

## Text Mutation Rules

Text operations fail unless the required fonts are loaded first.

Before mutating any text node:

1. load the current font or fonts with `await figma.loadFontAsync(...)`
2. then mutate the text node
3. then return the affected node IDs

When changing existing text, prefer reading the node's current font data first rather than assuming a default font.

## Layout And Sizing Rules

`layoutSizingHorizontal` and `layoutSizingVertical` are context-sensitive.

1. `FIXED` is the safest value
2. `HUG` and `FILL` only work in the right structural context
3. if a child needs `HUG` or `FILL`, append it into the correct auto-layout parent before assigning those values
4. do not confuse child `layoutSizing*` values with frame `primaryAxisSizingMode` and `counterAxisSizingMode`

When children have a structural relationship, use auto-layout containers instead of absolute-positioned freehand grouping.

## Variable Rules

When creating variables:

1. set scopes explicitly
2. avoid broad default scopes when a narrower scope is correct
3. use semantic naming that matches the intended role

If the broader workflow already defines the token architecture, follow that architecture rather than inventing a new one inside the Figma script.

## Positioning Rule

New top-level nodes appended directly to the page default to `(0,0)`.

Before placing page-level nodes:

1. inspect existing page children
2. find a clear position
3. place the new node intentionally rather than stacking accidental overlaps at the origin

This rule applies to top-level canvas nodes, not to children governed by auto-layout containers.

## Read-Then-Write Discipline

For non-trivial work, inspect first.

Typical sequence:

1. read node or page structure
2. return exact IDs, names, and current properties
3. decide the narrow write
4. apply that write in the next `use_figma` call
5. validate immediately

Do not guess IDs. Do not reconstruct missing context from memory.

## Validation Discipline

After a substantive write, the next action should be validation.

Prefer:

1. a narrow Figma re-read of the changed nodes
2. screenshot or metadata validation when available
3. the smallest check that proves the intended structure or property change landed correctly

Do not keep writing blindly across several steps without checking the last mutation.

## Repo Boundary

The only design source in this repo is `reference/shadcn-ui/`. Anything written into Figma must trace
back to it — never to another design system.

## Known Figma limitations, learned the hard way

1. **A drop shadow with zero blur AND zero offset renders nothing**, whatever its spread. The node's
   export bounds still grow, so it looks applied when inspected. Focus rings must be a real **OUTSIDE
   stroke**, not a shadow.
2. **A `clipsContent` ancestor erases anything drawn outside a child's bounds** — outside strokes,
   shadows, focus rings. Turn clipping off on the container.
3. **A variable-bound paint still carries a literal colour.** If the literal is left on a placeholder,
   that is what renders. Write the resolved value into the paint as well as binding it.
4. **Effect styles have no modes.** A theme-aware shadow needs its layer colours bound to colour
   variables; the style itself cannot vary by mode.
5. In a VERTICAL auto-layout, **width is the COUNTER axis** — mixing this up silently collapses frames.

## Done Well Looks Like

1. small, sequential scripts
2. explicit page selection
3. explicit `return` payloads with created and mutated IDs
4. no guessed IDs or hidden decisions
5. immediate validation after each meaningful mutation — **look at the render, do not just read back
   the properties**