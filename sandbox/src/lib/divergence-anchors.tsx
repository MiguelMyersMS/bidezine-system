import { createContext, useContext } from "react"

/**
 * `data-divergence` anchors — the link between a divergence record in the database and the exact
 * rendered element it describes (SANDBOX-SPEC §5.5).
 *
 * The attribute lives in the component's own markup rather than as a selector string stored in the
 * DB, deliberately: a selector rots silently on refactor, whereas an attribute moves with the code,
 * its deletion shows up in the diff, and "every divergence id has a matching attribute in source"
 * becomes a CI query. `verifier/run-checks.mjs` resolves each spec with
 * `[data-divergence="<ref>"]`, and — this is the part that shapes the design below — **fails the
 * check if that selector matches anything other than exactly one element.** Ambiguity is a failure,
 * not something to resolve by taking the first match (CLAUDE.md checklist item 10).
 *
 * ## Why this is a Context rather than a plain attribute written straight into the markup
 *
 * Found by measuring the live DOM, not by reading the code: the Sandbox app renders
 * `FunctionalRailSidebar` **twice** — once inside a `dark:hidden` wrapper and once inside a
 * `hidden dark:block` one (see `FullRailPreview.tsx`), so light and dark can be switched without
 * remounting. Both copies are in the DOM at all times; one is merely `display: none`. A
 * `data-divergence` attribute written directly into the component's markup would therefore match
 * **two** elements on every single check, and every check would fail as ambiguous — with a message
 * about ambiguity that says nothing about the real cause.
 *
 * So anchors are opt-in per rendered instance. `FullRailPreview` enables them on the light copy
 * only. Everything else renders identically, with no attributes at all.
 *
 * ## The known limit of anchoring a repeated element
 *
 * A divergence like F-2 ("every rail button is 38px") can only be anchored to **one** representative
 * button, because the anchor must be unique. The resulting evidence proves that instance, not the
 * class of them. That is a real limit of §5.5's model and worth stating plainly rather than leaving
 * implied — a passing F-2 row means "the first rail button measured 38x38", not "all 27 did".
 */
const DivergenceAnchorContext = createContext(false)

/**
 * The single implementation, shared by both call styles below so they can never disagree.
 *
 * Returning an object to spread — rather than a bare string — is what lets a disabled instance emit
 * no attribute at all, instead of an empty `data-divergence=""` that would still match a selector.
 */
export function anchorAttrs(enabled: boolean, ref: string): { "data-divergence"?: string } {
  return enabled ? { "data-divergence": ref } : {}
}

export function DivergenceAnchorProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  return <DivergenceAnchorContext.Provider value={enabled}>{children}</DivergenceAnchorContext.Provider>
}

/**
 * For DESCENDANTS of the provider. Spread the result onto the element:
 *
 *   const anchor = useDivergenceAnchor()
 *   <div {...anchor("L-34")} />
 *
 * **Not usable by the component that renders the provider itself.** `useContext` resolves to the
 * nearest provider *above* the calling component, so a component that returns
 * `<DivergenceAnchorProvider>` in its own JSX still reads the value from further up — for
 * `FunctionalRailSidebar` that is the default `false`, and every anchor it writes directly would
 * silently vanish with no error. That component passes its own `anchors` prop to `anchorAttrs`
 * instead; only its children use this hook.
 */
export function useDivergenceAnchor() {
  const enabled = useContext(DivergenceAnchorContext)
  return (ref: string) => anchorAttrs(enabled, ref)
}
