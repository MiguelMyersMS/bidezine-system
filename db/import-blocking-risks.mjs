// ═══════════════════════════════════════════════════════════════════════════════════
// One-off importer: Rail Sidebar's blockingQuestions (Q1–Q4) and notableRisks (R-1
// through R-10) into sandbox.divergence, component 'rail-sidebar'.
//
//   node import-blocking-risks.mjs [--dry-run]
//
// WHY this exists: the Sandbox app renders every reviewable thing through one card
// format with one process — a gate-computed checklist and an approval switch.
// Questions and risks were rendering in that view WITHOUT a gate, because they lived
// only in sandbox/src/data/rail-sidebar.ts rather than the corpus — a control that
// looks gated and isn't. The fix is to make them real rows, not to fake the controls.
//
// Same mechanism as import-rail-sidebar.mjs's original M4 import of the 154 A–M rows:
// origin_record stores each source object VERBATIM, so a question's `options` and a
// risk's `actionItems` are fully preserved even though neither has its own column.
// Nothing is flattened; the normalised columns (title, detail, category, ...) are a
// queryable projection of the same object, not a replacement for it.
//
// R-11 is deliberately excluded — it is a retrospective across the whole
// transformation with no decision left in it (already logged in
// SANDBOX-PROTOCOL-LOG.md and CLAUDE.md checklist items 11-15).
//
// Every row lands at 'legacy_unverified', per the same M4 precedent: nothing arrives
// pre-blessed, including risks/questions the source calls resolved. anchor_id/file
// are NULL — none of these is anchored in the component. scope/tier are left at their
// column defaults ('component'/'full'), since scope is detected from a diff, not
// asserted here (spec invariant 7) — none of this touches the app's source at all.
//
// This is a one-off migration tool, not a restore path (unlike import-rail-sidebar.mjs,
// which reads the frozen snapshot). It is not idempotent-by-design beyond the same
// UPDATE-then-INSERT-if-missing pattern used there, so re-running it is still safe.
//
// Runs as ADMIN: it writes state ('legacy_unverified' is a state value), which every
// other principal is denied.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect, sql } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const DRY = process.argv.includes("--dry-run")

// Transcribed verbatim from sandbox/src/data/rail-sidebar.ts's `blockingQuestions`
// array (DecisionQuestion[], interface at line 39). Full objects, including
// `options`/`resolution`/`visual`, preserved for origin_record.
const blockingQuestions = [
  {
    id: "q1",
    priority: 1,
    title: "Icon `filled` prop system",
    blocks: "All interactive icon states (hover / active / browsing) across the whole component",
    context:
      "RailNav toggles every interactive icon between a \u201cregular\u201d and \u201cfilled\u201d SVG variant on hover, active, and browsing states. Our Fluent icon pipeline (icons/manifest.json \u2192 build-icons.mjs) only emits static regular-style icons \u2014 there is no filled prop and no filled SVGs generated for any current manifest entry.",
    options: [
      { label: "(a) Add filled-variant manifest entries only for the icons RailNav needs", detail: "e.g. MoreHorizontalFilledIcon \u2192 more_horizontal_20_filled. Smallest footprint; filled variants added case-by-case as needed." },
      { label: "(b) Drop the filled toggle entirely", detail: "Signal hover / active / browsing with color or opacity changes only \u2014 no fill change." },
      { label: "(c) Extend the icon pipeline to support `filled` natively \u2014 CHOSEN", detail: "Generated Fluent icons accept `filled?: boolean`. Actionable icons use filled variants for hover and selected states; non-interactive icon uses stay regular." },
    ],
    resolution: {
      chosenLabel: "(c) Filled variants for actionable hover/selected states",
      note: "New system-wide rule: actionable Fluent icons render regular at rest and filled on hover/selected/active states. Non-interactive icon usage remains regular. The icon generator now exposes `filled?: boolean`; components opt in only for actionable states.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "Origin: regular \u2192 filled swap on hover/active",
      beforeSvgPath: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      afterIconName: "MoreHorizontalIcon",
      afterLabel: "bidezine: regular -> filled for actionable states",
      afterNote: "Generated icons support filled?: boolean; non-interactive icons remain regular.",
    },
  },
  {
    id: "q2",
    priority: 2,
    title: "Dark rail surface token family",
    blocks: "The entire rail color system \u2014 background, hover/active/pressed states, borders, on-dark text/icon colors",
    context:
      "The rail needs a coherent family of ~8 dark-surface-specific tokens (darkSurface, darkHoverBg, darkActiveBg, darkPressedBg, darkBorderStrong, onDark, onDarkHover, onDarkSubtle) with no bidezine equivalent. CLAUDE.md's core rule is that tokens are authored only in tokens/*.tokens.json \u2014 never hand-written inline.",
    options: [
      { label: "(a) Author a new dark-surface token group in tokens/base.tokens.json \u2014 CHOSEN", detail: "Adds a dedicated token family, with light/dark values since they DO differ by the app's own theme (confirmed against the origin's tokens.ts \u2014 see the Color token lab tab)." },
      { label: "(b) Reuse existing sidebar / sidebar-foreground tokens where close enough", detail: "Add only the tokens that truly have no equivalent (e.g. the interactive overlay states)." },
      { label: "(c) Treat the rail as always-dark regardless of app theme", detail: "Ruled out \u2014 the origin's own tokens.ts proves the rail's exact values DO change between the app's light and dark theme (see Color token lab)." },
    ],
    resolution: {
      chosenLabel: "(a) Author a new dark-surface token group",
      note: "All 11 candidate tokens now have FINAL sign-off \u2014 see the \u201cColor token lab\u201d tab and the composed rail preview. This includes two later corrections found only once the tokens were actually built and exercised, not just approved as isolated swatches: darkSurface's dark-app-mode value was revised (it had been identical to bidezine's own --background, making the rail invisible against the page) and darkBorderStrong's value was revised (it had almost no contrast against the rail surface, making the browsing-state ring invisible) \u2014 plus a genuinely new 11th token, darkDividerSubtle, split out from darkBorderStrong once raising the border's brightness started also brightening the rail's own divider lines. All 11 are ready to be authored into tokens/base.tokens.json at Build time.",
    },
  },
  {
    id: "q3",
    priority: 3,
    title: "Default logo icon (IconLogo)",
    blocks: "The rail's default logo slot when no `logo` prop is supplied",
    context: "RailNav defaults to a custom IconLogo (the brand mark) when no logo prop is passed. It isn't in icons/manifest.json.",
    options: [
      { label: "(a) Add as a `custom` manifest entry \u2014 CHOSEN, with a standing rule", detail: "AI must never pick or invent a logo/brand icon. The rule going forward: always ask the user for an image link to import; if none is supplied, the logo slot renders empty (not a placeholder icon)." },
      { label: "(b) Remove the default entirely", detail: "Superseded by (a) with the standing rule \u2014 an explicit empty state covers this case too." },
      { label: "(c) Use an existing Fluent icon as a placeholder default", detail: "Rejected \u2014 a generic icon in a brand-mark slot is misleading, worse than an honest empty state." },
    ],
    resolution: {
      chosenLabel: "(a) Custom manifest entry, sourced from the origin project",
      note: "For Rail Sidebar specifically: use the exact bidezine mark from the origin project (design-system/src/icons/fluent.tsx \u2192 IconLogo) \u2014 that mark already IS the bidezine logo. Standing rule for every future logo/brand slot: AI asks for an image link; empty if none given; never auto-selects or invents one.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "Origin IconLogo (bidezine mark)",
      beforeViewBox: "0 0 26.064 24",
      afterLabel: "Same mark, added as a custom manifest entry",
      afterNote: "Not yet added to icons/manifest.json \u2014 happens at Build time, once the rest of Human Decisions is resolved.",
    },
  },
  {
    id: "q4",
    priority: 4,
    title: "Panel collapse icon \u2014 corrected: panel_left_contract, not double-chevron",
    blocks: "The panel's collapse/expand button",
    context:
      "CORRECTED after your feedback: the real, currently-shipping source (design-system/src/gallery/ExpandButton.tsx) imports IconPanelLeftContract, not IconChevronDoubleLeft \u2014 the earlier investigation trusted a stale QA doc instead of the actual component file. Verified against node_modules/@fluentui/svg-icons: panel_left_contract_20_regular and panel_left_expand_20_regular both exist natively, and the SVG path matches your screenshots exactly (two-panel rectangle + left-pointing arrow).",
    options: [
      { label: "(a) Add panel_left_contract_20_regular / panel_left_expand_20_regular to the manifest \u2014 CHOSEN", detail: "Exact 1:1 Fluent match, both regular and filled variants exist if Q1 is revisited later. No compromise needed." },
      { label: "(b) Use the existing PanelLeftIcon (panel_left_20_regular, no arrow)", detail: "Already in our manifest, but visually different \u2014 no collapse/expand direction shown." },
      { label: "(c) A different Fluent icon", detail: "Not needed \u2014 the exact source icon exists natively." },
    ],
    resolution: {
      chosenLabel: "(a) panel_left_contract_20_regular (+ panel_left_expand_20_regular for the open state)",
      note: "This is not really a divergence anymore \u2014 it's a clean 1:1 match, once traced to the real source file instead of a stale doc. Manifest addition happens at Build time.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "IconPanelLeftContract (real source: ExpandButton.tsx)",
      afterIconName: "PanelLeftIcon",
      afterLabel: "Closest current manifest icon (no arrow) \u2014 panel_left_contract to be added",
      afterNote: "panel_left_contract_20_regular verified to exist in @fluentui/svg-icons \u2014 exact match, just not in our manifest yet.",
    },
  },
]

// Transcribed verbatim from sandbox/src/data/rail-sidebar.ts's `notableRisks` array
// (RiskNote[], interface at line 510). R-11 deliberately excluded (see header).
const notableRisks = [
  {
    id: "R-1",
    title: "Icon `filled` prop support must be used deliberately",
    detail: "Q1 is resolved: the icon pipeline now supports `filled?: boolean`. Build must apply it only to actionable hover/selected/active states; static/non-interactive icon display remains regular.",
    actionItems: [
      { id: "R-1a", text: "Q1 answered \u2014 generated icons now expose filled?: boolean for actionable states", done: true, refs: ["Q1", "A-9"] },
      { id: "R-1b", text: "During Build, audit actionable icon usages so filled is opt-in by state and non-interactive icons remain regular \u2014 done: L-20/L-27 ran a full, exhaustive hover/press/select sweep across every actionable icon in the component (5 pinned rail buttons, footer, Collapse sidebar, all 11 overflow-menu items, all 23 leaf/group tree items across both panel trees) with zero failures on the final pass", done: true, refs: ["A-1", "A-8", "A-9", "L-20", "L-27"] },
    ],
  },
  {
    id: "R-2",
    title: "Dark surface token family has zero bidezine equivalents",
    detail: "The whole rail color system is missing. Authoring ad-hoc inline values would violate the tokens-only rule in CLAUDE.md.",
    actionItems: [
      { id: "R-2a", text: "Q2 answered \u2014 author new tokens (option a)", done: true, refs: ["Q2"] },
      { id: "R-2b", text: "Color Token Lab built so proposed values can be visually approved before authoring", done: true, refs: ["proposedDarkRailTokens"] },
      { id: "R-2c", text: "User approves each of the 11 proposed dark-rail tokens in the lab \u2014 all 11 approved (incl. 2 corrections found only once built/exercised, plus 1 new divider token)", done: true, refs: ["proposedDarkRailTokens", "M-13", "M-14", "M-15"] },
      { id: "R-2d", text: "Approved tokens written to tokens/*.tokens.json (Build phase only)", done: false },
    ],
  },
  {
    id: "R-3",
    title: "Inline CSS-in-JS is incompatible with our Tailwind v4 paradigm",
    detail: "A large, trap-prone mechanical translation task \u2014 some values have no Tailwind utility without arbitrary-value syntax.",
    actionItems: [
      { id: "R-3a", text: "Category H (Motion) items individually decided (duration/easing per transition) \u2014 H-1 (rail hover/press, 150ms) done; H-2 through H-6 (panel reveal + Collapse) closed via explicit user deferral (\u201cno need to resolve it at this instance\u201d), pending a planned system-wide animation-token upgrade \u2014 not a per-item timing/easing resolution, but a real, closed decision for this phase", done: true, refs: ["H-1", "H-2", "H-3", "H-4", "H-5", "H-6"] },
      { id: "R-3b", text: "Category K (focus ring / scrollbar CSS injection) individually decided", done: true, refs: ["K-1", "K-2", "K-3", "K-4"] },
      { id: "R-3c", text: "Independent Audit agent confirms no runtime <style> injection survived into Build output", done: false },
    ],
  },
  {
    id: "R-4",
    title: "History of design instability in the origin",
    detail: "At least 7 visual decisions changed mid-development (button size, radius, panel typography, active-row background, etc.). Confirm which version is \u201cfinal\u201d before Build starts.",
    actionItems: [
      { id: "R-4a", text: "Confirm current live ExpandButton.tsx source (not stale QA docs) is the reference for Q4", done: true, refs: ["Q4"] },
      { id: "R-4b", text: "Spot-check remaining categories (F, G) against origin source, not just docs, before Build \u2014 done: F-3 re-derived against bidezine's own Sidebar default (not origin's bare 300px literal), F-7 re-derived from bidezine's own RailIconButton/footer constants (not origin's bare 122px literal), G-1 confirmed against FunctionalRailSidebar.tsx's live raw 12px value and visually approved", done: true, refs: ["F-3", "F-7", "G-1"] },
    ],
  },
  {
    id: "R-5",
    title: "Our own Sidebar primitive defines conflicting concepts",
    detail: "Both could be called \u201csidebar\u201d but are architecturally incompatible organisms \u2014 risk of consumer confusion and token collisions.",
    actionItems: [
      { id: "R-5a", text: "Decide final naming (\u201cRail Sidebar\u201d vs existing \u201cSidebar\u201d) to avoid nav-manifest / export collisions \u2014 decided (see M-8): no rename, no merged API; the two stay architecturally distinct organisms for this phase, with existing Sidebar deliberately revisited at Promote time to borrow proven Rail Sidebar patterns rather than the two being unified now", done: true, refs: ["M-8"] },
      { id: "R-5b", text: "Confirm neither component's token names or CSS classes collide at Promote time", done: false, refs: ["M-8"] },
    ],
  },
  {
    id: "R-6",
    title: "The `Collapse` animation component isn't in the reference copy",
    detail: "Its behavior is documented but exact timing/easing values live only in the origin project's MOTION constants, not captured here \u2014 a documentation gap.",
    actionItems: [
      { id: "R-6a", text: "MOTION constants (fast/medium/reveal, easing curves) sourced directly from origin tokens.ts", done: true, refs: ["H-1", "H-2", "H-3", "H-4"] },
      { id: "R-6b", text: "Collapse.tsx (grid-template-rows, deterministic unmount) copied into the self-contained reference before Build \u2014 superseded: L-7 explicitly decided NOT to reimplement origin's bespoke Collapse.tsx, reusing bidezine's own Radix Collapsible + tw-animate-css pattern instead (same technique Accordion already uses), so the exact timing/easing values this row worried about are no longer needed at all \u2014 the gap this risk described was closed by a different, deliberately chosen path, not by copying the file", done: true, refs: ["H-6", "L-7"] },
    ],
  },
  {
    id: "R-7",
    title: "Runtime <style> tag injection conflicts with our build-time CSS approach",
    detail: "Hostile to Tailwind v4's source(none)/@source pattern in CLAUDE.md if carried over as-is.",
    actionItems: [
      { id: "R-7a", text: "K-1/K-2 (focus ring CSS) translated to Tailwind focus-visible: classes, not injected <style>", done: true, refs: ["K-1", "K-2"] },
      { id: "R-7b", text: "K-3 (scrollbar styling) resolved to one of: ScrollArea component, browser default, or a static stylesheet rule \u2014 decided: real ScrollArea component", done: true, refs: ["K-3"] },
    ],
  },
  {
    id: "R-8",
    title: "RailButtonDark is exported from the origin package",
    detail: "Consumers compose their own utility items with it \u2014 our export chain (src/index.ts) must be ready at graduation time.",
    actionItems: [{ id: "R-8a", text: "Decide bidezine-equivalent export name and confirm it's added to src/index.ts at Promote time", done: false }],
  },
  {
    id: "R-9",
    title: "Collapse's deterministic unmount isn't covered by Radix's CollapsibleContent by default",
    detail: "If Build uses Radix Collapsible, unmount timing must be verified against the behavior contract or it will be flagged as a regression by the Escalation agent.",
    actionItems: [
      { id: "R-9a", text: "Explicitly decided: reuse Radix Collapsible (with tw-animate-css's collapsible-down/-up keyframes) rather than reimplement origin's custom JS-timer unmount \u2014 see L-7", done: true, refs: ["H-6", "L-7"] },
      { id: "R-9b", text: "Escalation agent independently verifies chosen approach preserves deterministic unmount before Audit", done: false },
    ],
  },
  {
    id: "R-10",
    title: "Sandbox fidelity gate \u2014 className-override-vs-primitive-shorthand bugs found twice in one session (M-18, M-19)",
    detail: "Two separate rendering bugs (search icon overlapping text, rail buttons rendering 2px undersized) traced to the identical root cause: a className meant to override a bidezine primitive's own built-in shorthand utility class (Input's px-3, Button's size-9) silently lost the compiled Tailwind stylesheet's cascade tie, even though the override looked correct in source and appeared later in the className string. Because the same failure class repeated on two different primitives in one session, the lesson was generalized directly into CLAUDE.md's new \u201cSandbox/Limbo fidelity\u201d section (covering className-override verification, suppressed-state replacement wiring, hand-rolled markup, isolated-swatch re-verification, doc-vs-code drift, faithfully-reproduced origin bugs, and short-demo-content overflow testing) rather than left as a one-off fix, so future Limbo occupants inherit the check automatically. See LIMBO-PROTOCOL-LOG.md's flaws log for the full rationale.",
    actionItems: [
      { id: "R-10a", text: "Full sweep of FunctionalRailSidebar.tsx for any other className overriding a primitive's own shorthand utility class (size-*, px-*/py-*, etc.) \u2014 the 3 known instances (RailIconButton, overflow trigger, Profile button) are fixed; no others found on this pass", done: true, refs: ["M-18", "M-19"] },
      { id: "R-10b", text: "Independent Audit agent explicitly re-checks the component against CLAUDE.md's new \u201cSandbox/Limbo fidelity\u201d checklist before promotion, not just the original Intake divergence list", done: false },
    ],
  },
]

// Fixed by the user's own table, per the corpus retrieval enum (validated against
// sandbox.divergence_category before running). "structure" as a catch-all for a row
// that doesn't cleanly fit any other bucket already has precedent in
// import-rail-sidebar.mjs's own CATEGORY_MAP (category M: "also covers naming-api and
// component gaps").
const QUESTION_CATEGORY = { q1: "icons", q2: "color", q3: "icons", q4: "icons" }
const RISK_CATEGORY = {
  "R-1": "icons",
  "R-2": "color",
  "R-3": "structure",
  "R-4": "structure",
  "R-5": "naming-api",
  "R-6": "motion",
  "R-7": "structure",
  "R-8": "naming-api",
  "R-9": "motion",
  "R-10": "structure",
}

const rows = [
  ...blockingQuestions.map((q) => ({
    ref: q.id.toUpperCase(), // "q1" -> "Q1"
    category: QUESTION_CATEGORY[q.id],
    title: q.title,
    detail: q.context,
    originCategory: "Q \u2014 Blocking questions",
    record: q,
  })),
  ...notableRisks.map((r) => ({
    ref: r.id, // already "R-1".."R-10"
    category: RISK_CATEGORY[r.id],
    title: r.title,
    detail: r.detail,
    originCategory: "R \u2014 Notable risks",
    record: r,
  })),
]

console.log(`source: ${blockingQuestions.length} questions, ${notableRisks.length} risks, ${rows.length} rows total`)
if (rows.length !== 14) throw new Error(`expected 14 rows, got ${rows.length}`)

const missingCategory = rows.filter((r) => !r.category)
if (missingCategory.length) throw new Error(`no category mapped for: ${missingCategory.map((r) => r.ref).join(", ")}`)

if (DRY) {
  console.log("\n--dry-run: nothing written.")
  console.log(rows.map((r) => `${r.ref}  [${r.category}]  ${r.title}`).join("\n"))
  process.exit(0)
}

let pool
try {
  pool = await connect("ADMIN")

  const componentId = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query("SELECT component_id FROM sandbox.component WHERE slug = @slug")
  ).recordset[0]?.component_id
  if (!componentId) throw new Error(`component '${SLUG}' not found`)

  // Hard abort gate: no existing Q*/R-* ref_code may already exist for this component.
  const existing = await pool
    .request()
    .input("component_id", sql.Int, componentId)
    .query(`SELECT ref_code FROM sandbox.divergence WHERE component_id = @component_id AND (ref_code LIKE 'Q%' OR ref_code LIKE 'R-%')`)
  if (existing.recordset.length) {
    throw new Error(`ref_code collision \u2014 already present: ${existing.recordset.map((r) => r.ref_code).join(", ")}`)
  }

  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const r = await pool
      .request()
      .input("component_id", sql.Int, componentId)
      .input("ref", sql.NVarChar(20), row.ref)
      .input("category", sql.NVarChar(30), row.category)
      .input("title", sql.NVarChar(400), row.title.slice(0, 400))
      .input("detail", sql.NVarChar(sql.MAX), row.detail ?? null)
      .input("origin_record", sql.NVarChar(sql.MAX), JSON.stringify(row.record))
      .input("origin_category", sql.NVarChar(80), row.originCategory)
      .query(`
        UPDATE sandbox.divergence
           SET category = @category, title = @title, detail = @detail,
               origin_record = @origin_record, origin_category = @origin_category,
               updated_at = SYSUTCDATETIME()
         WHERE component_id = @component_id AND ref_code = @ref;

        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO sandbox.divergence
            (component_id, ref_code, category, title, detail, state,
             origin_record, origin_category, anchor_id, anchor_file)
          VALUES
            (@component_id, @ref, @category, @title, @detail, 'legacy_unverified',
             @origin_record, @origin_category, NULL, NULL);
          SELECT 'inserted' AS action;
        END
        ELSE SELECT 'updated' AS action;`)

    if (r.recordset[0].action === "inserted") inserted++
    else updated++
  }

  const dbCount = (await pool.request().input("component_id", sql.Int, componentId).query(`SELECT COUNT(*) AS n FROM sandbox.divergence WHERE component_id = @component_id`))
    .recordset[0].n

  console.log(`\n${inserted} inserted, ${updated} updated.`)
  console.log(`total rail-sidebar rows in database: ${dbCount}`)

  if (dbCount !== 168) {
    console.log(`\nUNEXPECTED COUNT \u2014 expected 168, got ${dbCount}. Investigate before relying on it.`)
    process.exitCode = 1
  }
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
