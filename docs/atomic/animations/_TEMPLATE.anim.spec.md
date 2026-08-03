---
# Animation spec — copy this file to <name>.anim.spec.md and fill every field.
name: ""                       # kebab-case, e.g. sidebar-expand-collapse
title: ""                      # human title, e.g. "Sidebar group expand / collapse"
status: draft                  # draft | reviewed | shipped
surfaces: []                   # components this animation runs on, e.g. [RailNav]
primitive: ""                  # the motion.ts primitive used, e.g. Collapse | cssTransition
trigger: ""                    # what starts it, e.g. "user toggles a panel group"

motion:
  properties: []               # CSS properties animated, e.g. [grid-template-rows, opacity]
  duration_token: ""           # MOTION.* token, e.g. MOTION.medium (200ms) — NEVER a raw ms
  easing_token: ""             # MOTION.* token, e.g. MOTION.expressive
  enter: ""                    # what the enter (open) transition does
  exit: ""                     # what the exit (close) transition does

reduced_motion:                # REQUIRED — prefers-reduced-motion fallback
  fallback: ""                 # e.g. "instant: no transition, immediate mount/unmount"

verification:
  behavior_test: ""            # Storybook play-test story id that locks this, e.g. gallery-railnav--... 
  storybook: ""                # specimen story, e.g. foundations-motion--...
---

# <Title>

## Intent
<Why this animation exists and the feel it should convey. One or two sentences.>

## Behavior (per state)
| Phase | Properties | Token (duration · easing) | Notes |
|-------|-----------|---------------------------|-------|
| enter | … | MOTION.… · MOTION.… | … |
| exit  | … | MOTION.… · MOTION.… | … |
| reduced-motion | none | — | instant fallback |

## Anatomy
<How it's wired in code: which primitive, where it wraps, any mount/unmount nuance.>

## Guards (what must stay true)
- [ ] Uses MOTION tokens only (no raw ms / cubic-bezier at the call site).
- [ ] Has a `prefers-reduced-motion: reduce` instant fallback.
- [ ] Behaviour is machine-verified (the `behavior_test` story above runs in `npm run test:behavior`).
- [ ] Does not break the component's interaction contracts (e.g. collapsed content leaves the DOM).

## Connects to
- `src/motion.ts` (primitive) · `docs/registry/animations.json` (inventory) · `Foundations/Motion` (specimen).
