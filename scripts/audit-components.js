// Component audit — checks maturity, exports, and registry consistency.
import { SEV, finding, readSource, listFiles, writeAuditResult } from "./lib/audit-core.js";

const findings = [];

// Gallery source files (not stories, not index, not story-only helpers).
// Internal / story-only helpers — NOT shipped public design-system components, so the component-maturity
// audit (export + registry) must not demand they become public API. All are already exempt from the
// evidence gate (docs/evidence/exemptions.json):
//  · SurfaceSpecCanvas / MoleculeSpecHarness — Storybook-only FigmaSpec harnesses (imported only by *.stories.tsx).
//  · CompactTriggerShell — the shared INTERNAL Region.Trigger chrome for the 4 compact Select-family molecules
//    (imported by those molecules; verified transitively through each — see exemptions.json).
const STORY_ONLY_HELPERS = ["SurfaceSpecCanvas.tsx", "MoleculeSpecHarness.tsx", "CompactTriggerShell.tsx"];
const componentFiles = listFiles("src/gallery", ".tsx").filter(
  (f) =>
    !f.endsWith(".stories.tsx") &&
    !f.endsWith("index.ts") &&
    !STORY_ONLY_HELPERS.some((h) => f.endsWith(h)),
);
const componentNames = componentFiles.map((f) => f.split("/").pop().replace(".tsx", ""));

// Gallery barrel export
const barrelSrc = readSource("src/gallery/index.ts");
const barrelExports = [...barrelSrc.matchAll(/from\s+["']\.\/(\w+)["']/g)].map((m) => m[1]);

// Story files
const storyFiles = listFiles("src/gallery", ".stories.tsx");
const storyComponents = storyFiles.map((f) => f.split("/").pop().replace(".stories.tsx", ""));

// Registry
let registryComponents = [];
try {
  const registry = JSON.parse(readSource("docs/registry/components.json"));
  registryComponents = registry.components;
} catch { /* skip */ }

// ── CP.NOT-EXPORTED: component not in gallery barrel ──
for (const name of componentNames) {
  if (!barrelExports.includes(name)) {
    findings.push(
      finding("CP.NOT-EXPORTED", SEV.BLOCKER, `${name} exists but is not exported from gallery/index.ts`, `src/gallery/${name}.tsx`),
    );
  }
}

// ── CP.MISSING-REGISTRY: component not in components.json ──
const registryNames = registryComponents.map((c) => c.name);
for (const name of componentNames) {
  if (!registryNames.includes(name)) {
    findings.push(
      finding("CP.MISSING-REGISTRY", SEV.HIGH, `${name} is not registered in components.json`, `src/gallery/${name}.tsx`),
    );
  }
}

// ── CP.STALE-REGISTRY: registered component not in source ──
for (const entry of registryComponents) {
  if (!componentNames.includes(entry.name)) {
    findings.push(
      finding("CP.STALE-REGISTRY", SEV.HIGH, `${entry.name} is in registry but no source file exists`, "docs/registry/components.json"),
    );
  }
}

// ── CP.STORYBOOK-MISSING: beta+ component without stories ──
for (const entry of registryComponents) {
  if (!componentNames.includes(entry.name)) continue;
  const needsStory = entry.status === "beta" || entry.status === "stable";
  if (needsStory && !storyComponents.includes(entry.name)) {
    findings.push(
      finding("CP.STORYBOOK-MISSING", SEV.HIGH, `${entry.name} is ${entry.status} but has no stories`, `src/gallery/${entry.name}.tsx`),
    );
  }
}

// ── CP.MATURITY-EVIDENCE: stable component missing required evidence ──
for (const entry of registryComponents) {
  if (entry.status !== "stable") continue;
  if (entry.a11y_status === "untested") {
    findings.push(
      finding("CP.STABLE-INCOMPLETE", SEV.HIGH, `${entry.name} is stable but a11y_status is untested`, `src/gallery/${entry.name}.tsx`),
    );
  }
}

const FIXED_LIGHT_ALLOWED_COMPONENTS = new Set([
  "LogoSlot",
  "RailButton",
]);

const FIXED_DARK_ALLOWED_COMPONENTS = new Set([
  "AccordionHeaderDark",
  "DarkPillButton",
]);

// ── CP.ATOM-THEME-TOKEN-BYPASS: live atom mode must not hard-bind light tokens ──
for (const file of componentFiles) {
  const name = file.split("/").pop().replace(".tsx", "");
  if (FIXED_LIGHT_ALLOWED_COMPONENTS.has(name)) continue;

  const src = readSource(file);
  if (!src.includes("TOKENS_LIGHT")) continue;

  const importsFixedLight = /\bTOKENS_LIGHT\b/.test(src);
  const usesThemeContext = src.includes("useTokens(");
  const declaresAtomSurface = src.includes("atomSurface?:") || src.includes('atomSurface = "atom"');
  const hardBindsAtomToLight =
    src.includes('atomSurface === "atom" ? TOKENS_LIGHT')
    || src.includes('const tokens = TOKENS_LIGHT')
    || src.includes('bg: TOKENS_LIGHT')
    || src.includes('border: `1px solid ${TOKENS_LIGHT')
    || src.includes('textColor: TOKENS_LIGHT')
    || src.includes('iconColor: TOKENS_LIGHT');

  if (importsFixedLight && (!usesThemeContext || declaresAtomSurface || hardBindsAtomToLight)) {
    findings.push(
      finding(
        "CP.ATOM-THEME-TOKEN-BYPASS",
        SEV.HIGH,
        `${name} uses fixed light tokens in shipped gallery code. Atom mode must read ThemeContext; only explicit *Light components may hard-bind TOKENS_LIGHT. `
        + `usesThemeContext=${usesThemeContext}, declaresAtomSurface=${declaresAtomSurface}, hardBindsAtomToLight=${hardBindsAtomToLight}`,
        file,
      ),
    );
  }
}

// ── CP.DARK-SURFACE-TOKEN-BYPASS: fixed dark tokens must stay in explicit dark-surface paths ──
for (const file of componentFiles) {
  const name = file.split("/").pop().replace(".tsx", "");
  if (FIXED_DARK_ALLOWED_COMPONENTS.has(name)) continue;

  const src = readSource(file);
  if (!src.includes("TOKENS_DARK")) continue;

  const declaresDarkSurfaceContract =
    src.includes("darkAtom")
    || src.includes("atomDark")
    || src.includes("ThemeContext.Provider");

  if (!declaresDarkSurfaceContract) {
    findings.push(
      finding(
        "CP.DARK-SURFACE-TOKEN-BYPASS",
        SEV.HIGH,
        `${name} imports fixed dark tokens without an explicit dark-surface contract. Fixed TOKENS_DARK usage must be isolated to darkAtom/atomDark paths or explicit dark-only components.`,
        file,
      ),
    );
  }
}

// ── STORY.THEME-HELPER-BYPASS: story globals must be normalized through storyTheme helpers ──
for (const file of storyFiles) {
  const src = readSource(file);
  if (!src) continue;

  const readsRawAtomSurface = src.includes("context.globals.atomSurface") || src.includes("globals?.atomSurface");
  const readsRawTheme = src.includes("context.globals.theme") || src.includes("globals?.theme");
  const importsStoryTheme = src.includes('from "./storyTheme"') || src.includes("from './storyTheme'");
  const usesAtomSurfaceHelper = src.includes("getStoryAtomSurface(");
  const usesThemeHelper = src.includes("getStoryThemeTokens(") || src.includes("getStoryThemeMode(");

  if ((readsRawAtomSurface || readsRawTheme) && !importsStoryTheme) {
    findings.push(
      finding(
        "STORY.THEME-HELPER-BYPASS",
        SEV.HIGH,
        `Story reads raw Storybook theme globals without importing ./storyTheme helpers. Normalize globals through getStoryAtomSurface/getStoryThemeTokens/getStoryThemeMode so story chrome cannot hide component token bugs.`,
        file,
      ),
    );
    continue;
  }

  if (readsRawAtomSurface && !usesAtomSurfaceHelper) {
    findings.push(
      finding(
        "STORY.THEME-HELPER-BYPASS",
        SEV.HIGH,
        `Story reads atomSurface from Storybook globals without getStoryAtomSurface(). Normalize the surface contract through storyTheme helpers.`,
        file,
      ),
    );
  }

  if (readsRawTheme && !usesThemeHelper) {
    findings.push(
      finding(
        "STORY.THEME-HELPER-BYPASS",
        SEV.HIGH,
        `Story reads theme from Storybook globals without getStoryThemeTokens() or getStoryThemeMode(). Normalize the theme contract through storyTheme helpers.`,
        file,
      ),
    );
  }
}

// ── IC.CALLSITE-FILLED-WIRING: RailNav primary icon must include hover/browsing wiring ──
try {
  const railNavSrc = readSource("src/gallery/RailNav.tsx");
  const requiredFilledExpr = "filled={active || browsing || hovered || pressed}";
  if (!railNavSrc.includes(requiredFilledExpr)) {
    findings.push(
      finding(
        "IC.CALLSITE-FILLED-WIRING",
        SEV.HIGH,
        "RailNav primary icon call site must include active, browsing, hovered, and pressed in filled state wiring",
        "src/gallery/RailNav.tsx",
      ),
    );
  }
} catch {
  // Skip if source is unavailable in current environment.
}

// ── CP.CARDHEADER-INFOICON-VISIBILITY: CardHeader must manage InfoIcon visibility ──
try {
  const cardHeaderSrc = readSource("src/gallery/CardHeader.tsx");
  // Check that CardHeader tracks hover state and passes visible prop to InfoIcon
  // Pattern-based (not exact-string): CardHeader may name its hover setter setHovered/setHeaderHovered and
  // pass a COMBINED visibility expr (owner 2026-07-15 card-hover reveal: visible={actionsPersistent || hovered}).
  // This checks the INTENT — a hover state is tracked AND a hover-derived `visible` is passed to InfoIcon —
  // not the literal legacy strings.
  const hasHoverTracking = cardHeaderSrc.includes("useState(false)") && /\bset[A-Za-z]*Hover/.test(cardHeaderSrc);
  const hasVisibleProp = /visible=\{[^}]*[Hh]over/.test(cardHeaderSrc);
  const hasHoverListeners = cardHeaderSrc.includes("onMouseEnter") && cardHeaderSrc.includes("onMouseLeave");
  
  if (!hasHoverTracking || !hasVisibleProp || !hasHoverListeners) {
    findings.push(
      finding(
        "CP.CARDHEADER-INFOICON-VISIBILITY",
        SEV.HIGH,
        "CardHeader must track hover state and pass visible={hovered} to InfoIcon per spec protocol. Currently: " +
        `hasHoverTracking=${hasHoverTracking}, hasVisibleProp=${hasVisibleProp}, hasHoverListeners=${hasHoverListeners}`,
        "src/gallery/CardHeader.tsx",
      ),
    );
  }
} catch {
  // Skip if source is unavailable in current environment.
}

// ── CP.INFOPILL-VISIBILITY-CONTRACT: InfoPill is stateless with controlled visibility ──
try {
  const infoPillSrc = readSource("src/gallery/InfoPill.tsx");
  // InfoPill must remain non-interactive and stateless while exposing visible control.
  const hasStateManagement = infoPillSrc.includes("useState(") || infoPillSrc.includes("useReducer(");
  const hasVisibleProp = infoPillSrc.includes("visible?:") || infoPillSrc.includes("visible = true");
  const hasNullReturnForHidden = infoPillSrc.includes("if (!visible)") && infoPillSrc.includes("return null");
  const hasFilledProp = infoPillSrc.includes("filled:") || infoPillSrc.includes("filled,");
  
  if (hasStateManagement || !hasVisibleProp || !hasNullReturnForHidden || hasFilledProp) {
    findings.push(
      finding(
        "CP.INFOPILL-VISIBILITY-CONTRACT",
        SEV.HIGH,
        "InfoPill must be stateless, expose controlled visibility, and reject icon fill state props. Currently: " +
        `hasStateManagement=${hasStateManagement}, hasVisibleProp=${hasVisibleProp}, hasNullReturnForHidden=${hasNullReturnForHidden}, hasFilledProp=${hasFilledProp}`,
        "src/gallery/InfoPill.tsx",
      ),
    );
  }
} catch {
  // Skip if source is unavailable in current environment.
}

const { exitCode } = writeAuditResult("component-audit", findings);
process.exit(exitCode);
