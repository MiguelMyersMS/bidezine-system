import * as React from "react"

type IconProps = {
  filled?: boolean
}

function isIconElement(child: React.ReactNode): child is React.ReactElement<IconProps> {
  if (!React.isValidElement(child) || typeof child.type === "string") return false
  const type = child.type as { displayName?: string; name?: string; isActionIcon?: boolean }
  // Prefer the explicit `isActionIcon` marker (set by scripts/build-icons.mjs on every
  // generated icon component) over `displayName`/`name` string matching: bundlers like
  // Rollup/esbuild routinely rename function declarations during tree-shaking/scope
  // hoisting (e.g. `BookOpenIcon` becomes `po` in the built `dist/`), which silently
  // breaks any check that relies on the function's runtime `.name`.
  if (type.isActionIcon === true) return true
  const name = type.displayName ?? type.name ?? ""
  return name.endsWith("Icon")
}

export function fillActionIcons(children: React.ReactNode, filled: boolean): React.ReactNode {
  const fillOne = (child: React.ReactNode): React.ReactNode => {
    if (isIconElement(child)) {
      return React.cloneElement(child, { filled })
    }

    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.props.children
    ) {
      return React.cloneElement(child, {
        children: fillActionIcons(child.props.children, filled),
      })
    }

    return child
  }

  // `React.Children.map` always normalizes its result into an array, even for a single
  // child — which breaks Radix `Slot` consumers (e.g. `asChild` buttons): Slot requires
  // exactly one raw React element, not an array wrapping one element. JSX itself already
  // gives us this shape for free: `children` is a bare node for a single child expression
  // and a real array only when there were multiple sibling child expressions. Checking
  // `Array.isArray` (instead of always going through `Children.map`) preserves that shape
  // instead of flattening every case into an array.
  if (Array.isArray(children)) {
    return React.Children.map(children, fillOne)
  }
  return fillOne(children)
}

export function useActionIconFill<T extends HTMLElement>({
  active = false,
  disabled = false,
}: {
  active?: boolean
  disabled?: boolean
} = {}) {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [dataActive, setDataActive] = React.useState(false)
  const observerRef = React.useRef<MutationObserver | null>(null)
  const nodeRef = React.useRef<T | null>(null)

  const update = React.useCallback((node: T) => {
    const next =
      node.getAttribute("data-state") === "on" ||
      node.getAttribute("data-state") === "open" ||
      node.getAttribute("data-active") === "true" ||
      node.getAttribute("data-highlighted") === "" ||
      node.getAttribute("data-selected") === "true" ||
      node.getAttribute("aria-pressed") === "true"
    setDataActive(next)
  }, [])

  // A callback ref (rather than `useRef` + `useLayoutEffect`) fires exactly when React
  // attaches/detaches the real DOM node, so the initial `data-state`/`data-active`/etc.
  // check always runs against the node that's actually in the document — no race with
  // effect ordering across parent/child boundaries (e.g. a Radix `Collapsible` that sets
  // `data-state="open"` on this element from a parent-level effect).
  const ref = React.useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      nodeRef.current = node
      if (!node) return

      update(node)
      const observer = new MutationObserver(() => update(node))
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["aria-pressed", "data-active", "data-highlighted", "data-selected", "data-state"],
      })
      observerRef.current = observer
    },
    [update]
  )

  // Belt-and-braces re-check after commit: some compositions (e.g. a Radix `Collapsible`
  // wrapping this element via `asChild`, already `defaultOpen`) can finish merging their
  // `data-state`/etc. attributes onto the node in a slightly later effect than the one
  // that calls this ref callback, so the very first render can miss an already-active
  // state until the next attribute mutation. Re-running `update` once after mount closes
  // that gap without affecting the callback-ref fix for the hover/toggle races above.
  React.useEffect(() => {
    if (nodeRef.current) update(nodeRef.current)
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [update])

  return {
    ref,
    filled: !disabled && (hovered || pressed || active || dataActive),
    onMouseDown: () => setPressed(true),
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => {
      setHovered(false)
      setPressed(false)
    },
    onMouseUp: () => setPressed(false),
  }
}
