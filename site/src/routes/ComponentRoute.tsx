import type React from "react"
import { useParams } from "react-router-dom"
import { findComponent } from "@/nav-manifest"
import { ButtonShowcase } from "./components/ButtonShowcase"
import { AvatarShowcase } from "./components/AvatarShowcase"
import { BadgeShowcase } from "./components/BadgeShowcase"
import { SeparatorShowcase } from "./components/SeparatorShowcase"
import { SkeletonShowcase } from "./components/SkeletonShowcase"
import { AspectRatioShowcase } from "./components/AspectRatioShowcase"
import { LabelShowcase } from "./components/LabelShowcase"
import { KbdShowcase } from "./components/KbdShowcase"
import { SpinnerShowcase } from "./components/SpinnerShowcase"
import { ProgressShowcase } from "./components/ProgressShowcase"

/**
 * Showcase pages register here as components are ported (Phase 3 of the plan).
 * Everything else in the nav-manifest falls back to the "coming soon" state
 * below, so the full menu is always navigable even before a component lands.
 */
const showcases: Record<string, React.ComponentType> = {
  button: ButtonShowcase,
  avatar: AvatarShowcase,
  badge: BadgeShowcase,
  separator: SeparatorShowcase,
  skeleton: SkeletonShowcase,
  "aspect-ratio": AspectRatioShowcase,
  label: LabelShowcase,
  kbd: KbdShowcase,
  spinner: SpinnerShowcase,
  progress: ProgressShowcase,
}

export function ComponentRoute() {
  const { slug = "" } = useParams()
  const entry = findComponent(slug)
  const Showcase = showcases[slug]

  if (!entry) {
    return <p className="text-muted-foreground">Unknown component: {slug}</p>
  }

  if (entry.status === "pending" || !Showcase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">{entry.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Not ported yet. Reproduce → verify → adjust is tracked in the project
          plan; check back once this one clears the pipeline.
        </p>
      </div>
    )
  }

  return <Showcase />
}
