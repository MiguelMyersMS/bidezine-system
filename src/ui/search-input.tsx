"use client"

import * as React from "react"

import { SearchIcon, XIcon } from "@/icons/generated"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/ui/input-group"

/**
 * A dedicated search-input primitive — there is no equivalent in shadcn's own upstream source
 * (verified: shadcn only ever *demonstrates* a search-style field as an ad-hoc `InputGroup`
 * composition in its own examples, e.g. `input-group-button.tsx`'s "Type to search..." row; it
 * has no standalone registry component for one). This is therefore a deliberate Adjustment, not a
 * port, built entirely from bidezine's own already-shipped primitives (`InputGroup`,
 * `InputGroupAddon`, `InputGroupInput`, `InputGroupButton`) — never hand-rolled markup.
 *
 * The trailing clear (X) button reuses the exact pattern validated for `CommandInput` (A-6/L-5):
 * a reserved 24×24px slot (`icon-xs`) that's hidden via `aria-hidden`/`tabIndex={-1}`/`invisible`
 * rather than unmounted, so its appearance never shifts layout; clearing goes through the real
 * native `<input>` value setter + a dispatched `input` event so it fires the same `onChange` path
 * a user's own keystroke would, in both controlled and uncontrolled usage; and `Escape` clears
 * first and calls `stopPropagation()` so it doesn't bubble into a parent dialog/sheet/dropdown.
 *
 * **Corner-radius note (verified NOT a bug/contamination, measured live)**: this clear button
 * renders at a visibly tighter 5px radius (`InputGroupButton`'s `icon-xs` recipe:
 * `rounded-[calc(var(--radius)-5px)]`) than `CommandInput`'s own clear button or `Attachment`'s
 * remove button, both of which use plain `Button`'s full 8px `rounded-md`. Diffed byte-for-byte
 * against shadcn's own real upstream `input-group.tsx` — this formula is unchanged, unmodified
 * shadcn convention, not something carried over from any origin design system. It's shadcn's
 * intentional "nested corner radius" math: a button sitting flush inside a bordered, rounded
 * container (`InputGroup`) reduces its own radius by the border inset so its corner nests
 * concentrically with the container's outer corner, rather than clashing with it. `CommandInput`'s
 * clear button and `Attachment`'s remove button both sit in a flat, unbordered row/absolute
 * position (no outer rounded box to nest against), so plain `Button`'s full radius is the correct
 * choice there instead. Each is individually correct for its own structural context — the two
 * values are not meant to match.
 */
export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "className"> {
  /**
   * className applied to the outer `InputGroup` (the actual visible bordered box) — matches
   * `InputGroup`'s own convention (e.g. `<InputGroup className="max-w-xs">` in
   * `InputGroupShowcase`) and the natural expectation that a component's own `className` sizes
   * that component. `InputGroup` itself always renders `w-full`, so putting a size-constraining
   * class only on the inner `<input>` (an earlier version of this component's actual, shipped
   * bug) would cap the text column while leaving the surrounding bordered box stretched to its
   * parent's full width — a real, visible gap between the clear button and the box's own right
   * edge in any full-width container (headers, toolbars, sidebars), which is the single most
   * common real placement for a search box.
   */
  className?: string
  /** Called after the clear button (or Escape) clears the field. */
  onClear?: () => void
  /** Accessible label for the clear button. Defaults to "Clear search". */
  clearLabel?: string
  /** className applied to the actual `<input>` element, not the outer container. */
  inputClassName?: string
}

function SearchInput({
  className,
  inputClassName,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  onClear,
  clearLabel = "Clear search",
  disabled,
  ...props
}: SearchInputProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  )
  const currentValue = isControlled ? value : uncontrolledValue
  const hasValue = String(currentValue ?? "").length > 0

  const clear = () => {
    const input = containerRef.current?.querySelector(
      '[data-slot="input-group-control"]'
    ) as HTMLInputElement | null
    if (!input) return
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set
    setter?.call(input, "")
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.focus()
    onClear?.()
  }

  // `InputGroup` (like `Input`) is not forwardRef-wrapped, so a `ref` prop on it would silently
  // no-op — the ref instead goes on a plain wrapping `<div>`, matching the same
  // `querySelector`-based workaround already used elsewhere in this codebase (e.g.
  // `InputGroupAddon`'s own internal click handler, `CommandInput`'s clear button).
  return (
    <div ref={containerRef} data-slot="search-input-wrapper">
      <InputGroup className={className}>
        <InputGroupAddon align="inline-start">
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          className={inputClassName}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={(event) => {
            if (!isControlled) setUncontrolledValue(event.target.value)
            onChange?.(event)
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            // Escape clears first instead of bubbling up to close a parent
            // dialog/sheet/dropdown this search box may be nested inside — matches the same
            // origin D3 contract already applied to CommandInput's clear button.
            if (event.key === "Escape" && hasValue) {
              event.stopPropagation()
              clear()
            }
          }}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={clearLabel}
            aria-hidden={!hasValue}
            tabIndex={hasValue ? 0 : -1}
            disabled={disabled}
            className={cn(!hasValue && "invisible")}
            onClick={clear}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export { SearchInput }
