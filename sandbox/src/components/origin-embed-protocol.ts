// The embed contract between the Sandbox app and the quarantined origin page it frames.
//
// This file is DUPLICATED, by design. Its counterpart is
// `origin/rail-sidebar/app/src/embed-protocol.ts`. Sharing one module between the two would mean an
// import crossing the quarantine boundary — the exact thing the quarantine exists to make
// impossible, and the thing `scripts/check-quarantine.mjs` fails this app's build over. A contract
// between two isolated realms is a wire format, not a shared type: the honest way to express it is
// two copies that agree, each naming the other.
//
// **If you change anything here, change the origin copy in the same commit.** The two are checked
// against each other by `scripts/check-quarantine.mjs`, which compares the constants below with the
// ones on the other side and fails the build if they drift.

/** Prefix on every message in both directions. Bumped only if the contract changes shape. */
export const MESSAGE_NAMESPACE = "origin-rail-sidebar"

/** Here -> origin frame: swap the rendered theme without remounting it. */
export const VARIANT_MESSAGE = `${MESSAGE_NAMESPACE}:variant`

/** Origin frame -> here: its variant listener is attached and the current theme can be re-sent. */
export const READY_MESSAGE = `${MESSAGE_NAMESPACE}:ready`

export type Variant = "light" | "dark"

/**
 * Where the built origin page is served from. `origin/rail-sidebar/app` builds into
 * `sandbox/public/origin/rail-sidebar/` (gitignored — a build artifact of that project, not source),
 * so one static path works identically in dev, preview and build with no proxy and no second dev
 * server. Run `npm --prefix sandbox run origin:build` if this 404s.
 *
 * **`index.html` is spelled out on purpose — do not shorten this to the directory.** Vite's dev
 * server applies its SPA history fallback to a bare directory URL, so `/origin/rail-sidebar/` is
 * answered with the *Sandbox app's own* `index.html` rather than the origin page sitting in
 * `public/` at that path. The frame then quietly renders a second, nested copy of the Sandbox app,
 * and does so with HTTP 200 and no error anywhere — it was caught only by reading the frame's real
 * DOM and finding Tailwind classes (`bg-card`, `h-screen`) that the origin material, which is
 * entirely inline-styled, could not have produced. Requesting the file explicitly bypasses the
 * fallback and is served straight from `public/`.
 */
export const ORIGIN_EMBED_PATH = "/origin/rail-sidebar/index.html"

/**
 * The panel's own `box-shadow` needs transparent room around the rail to render un-clipped, and an
 * iframe is a hard paint boundary — anything outside its physical box is never painted, whatever
 * `overflow` any wrapper sets. This app owns the number: it sizes the frame larger by this amount on
 * every side and pulls it back with an equal negative margin (so the layout box every ancestor sees
 * is unchanged), and passes the same value to the origin page in the URL, which pads the rail's own
 * `aside` to match. One source of truth, on this side.
 */
export const SHADOW_BLEED = 12
