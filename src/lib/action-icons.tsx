import * as React from "react"

type IconProps = {
  filled?: boolean
}

function isIconElement(child: React.ReactNode): child is React.ReactElement<IconProps> {
  if (!React.isValidElement(child) || typeof child.type === "string") return false
  const type = child.type as { displayName?: string; name?: string }
  const name = type.displayName ?? type.name ?? ""
  return name.endsWith("Icon")
}

export function fillActionIcons(children: React.ReactNode, filled: boolean): React.ReactNode {
  return React.Children.map(children, (child) => {
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
  })
}

export function useActionIconFill<T extends HTMLElement>({
  active = false,
  disabled = false,
}: {
  active?: boolean
  disabled?: boolean
} = {}) {
  const ref = React.useRef<T | null>(null)
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  const [dataActive, setDataActive] = React.useState(false)

  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      setDataActive(
        node.getAttribute("data-state") === "on" ||
          node.getAttribute("data-state") === "open" ||
          node.getAttribute("data-active") === "true" ||
          node.getAttribute("data-highlighted") === "" ||
          node.getAttribute("data-selected") === "true" ||
          node.getAttribute("aria-pressed") === "true"
      )
    }

    update()
    const observer = new MutationObserver(update)
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["aria-pressed", "data-active", "data-highlighted", "data-selected", "data-state"],
    })

    return () => observer.disconnect()
  }, [])

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
