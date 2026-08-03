import "./styles/system.css"

// Tokens (generated from the DTCG source in tokens/).
export { tokenNames, token, type TokenName } from "./tokens"

// Utilities
export { cn } from "./lib/utils"

/*
 * No components are exported yet — deliberately.
 *
 * Components enter this package through the Component Development Protocol
 * (docs/process/COMPONENT-DEVELOPMENT-PROTOCOL.md). Figma becomes the source of
 * truth first (Phase A, steps 0-10); code is written to match it afterwards
 * (Phase B, step 11). Anything exported here before that has skipped the process.
 */
