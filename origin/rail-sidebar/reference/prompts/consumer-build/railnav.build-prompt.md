# Build prompt — RailNav (Round 1)

You are a **consumer** of `@miguel/design-system`. Your job this round is to **consume the shipped `RailNav`
organism**, wire it into your app with your own data/config, get it rendering, and **report what is unclear or
breaks**. You do **not** re-author, fork, copy, or patch the component — you import it and use it.

This is a real production test. The DS side reads your committed repo and compares it to the shipped DS to
find doc/component/bundle gaps. **Honest friction is the deliverable** — a clean "it just worked" and a stack
of blockers are both useful; a *faked* "it worked" is a test failure.

---

## 0. Read first (fresh from `@master`, do not work from memory)
1. `docs/consumer-governance/COMMUNICATION-PROTOCOL.md` — the rules below are a summary; that file governs.
2. `docs/atomic/organism/railnav.spec.md` — the RailNav spec.
3. `docs/atomic/organism/RAILNAV-BEHAVIOR-CONTRACT.md` — behavior contract (what states/interactions exist).
4. `docs/interaction-patterns.md` — the "peek before committing" navigation model.
5. **BROWSER-BUNDLE PATH only:** `dist-browser/README.md` — the browser consumption contract (React external, one
   instance, provider theming).

## 1. Rule 8 — you CONSUME the DS, you never edit it
You import the shipped `RailNav` and its types. You do **not** edit `src/`, specs, tokens, or the bundle in
the DS repo, and you do **not** re-create `RailNav` (or any atom/molecule it uses) in your own tree. If the
component can't do what you need, that is a **finding to report**, not a thing to hand-build around. (A prior
round caught a consumer silently re-authoring `DS.Card` — don't repeat it.)

## 2. Connect to GitHub + verify the DS pin (both deployers, before building)
Everything flows through GitHub — you read the DS fresh from `master`, and you write your progress/findings to
**your own** repo (§6). Re-pull before you start and **verify the pin** — a stale copy invalidates your findings:
- **Pull the latest `master`** of `MiguelMyersMS/design-system` (the build prompt + docs live there). The
  RailNav render fixes **CD0.1** (`sections=[]` default) and **CD0.3** (`section.items ?? []` guard) have been
  on master since commit **`5e21f53`** — confirm your checkout/install is at or after it (contains both).
- **BROWSER-BUNDLE PATH:** read `window.DS.version` at runtime and assert it **equals `master`'s
  `dist-browser/ds-manifest.json` `version`** (currently **`1.0.0+bcd01d8`** — carries the R1 fixes: rail atoms
  on `window.DS`, leaf-nav, `defaultExpandedGroups`, and `dist-browser/API.md`). If your local copy differs,
  STOP — it is stale. Re-copy `dist-browser/` from `master` yourself (you have GitHub access now; the owner-export hop is retired), or report it. (Assert against the repo manifest, not a memorized literal —
  finding CD0.5.)
- **Follow the protocol** (`COMMUNICATION-PROTOCOL.md`) end to end — including §4 step 7 / §4a: **the owner
  resets the chat after every attempt, so you MUST finish by writing a ready-to-paste next-chat prompt** (§7
  below).

---

## 3. Ingestion stanza — THE ONLY PER-DEPLOYER DIFFERENCE

**Same component, two deliberately different approaches — that contrast is the point of the test.** You both
build **RailNav**, but through your own consumption path and into your own kind of app. Build only your own
stanza; do not adopt the other's path.

> ### If you are the **RAW-TS PATH** (`ADIAS-dashboard`) — historically "Copilot"
> - **Approach:** build RailNav **directly in Rayfin (your live app) with corporate data** — a production
>   integration, not a demo. It renders in the real shell against the real dataset.
> - Consume via the raw-TS `github:` install (React 19, Vite). `import { RailNav } from "@miguel/design-system"`
>   — or the deep path `import { RailNav } from "@miguel/design-system/gallery"`. Import the types you need
>   from the same entry (`RailSection`, `RailPanelItem`, `RailNavProps`, `RailBadge`).
> - Vite: keep the **installed-package** dep contract — `optimizeDeps.include: ["@miguel/design-system"]`
>   (NOT `exclude`; finding B0.5) and `resolve.dedupe: ["react","react-dom"]`.
> - **Pure prompt, no image.** Your target is the written IA in **§4A** — there is no Figma image this round.
>   Realize that intent with the shipped `RailNav`, making your **own best decisions from the repository +
>   docs** (icon choices, prop wiring, structure) wherever the prompt leaves a call open. Where the component
>   or docs genuinely **cannot** express the intent, STOP and report it (§5) — never invent to fill it.
> - **Data source:** build the `sections` (and any `footerSections`) from your **connected dataset**
>   (`azureDataInsights`, the Direct Lake tables). Map real navigation to real sections — don't mock nav data.
> - This prompt is **self-contained** — everything you need is here or in the linked governance files. You do
>   **not** read `CLAUDE.md` (a Claude-Code file you can't see); do not assume any rule that isn't written here.

> ### If you are the **BROWSER-BUNDLE PATH** (`ds-docs-site`) — historically "Claude Design"
> - **Approach:** build RailNav inside your **new Storybook-style app that collects each tested component while
>   exercising the deployment/consumption flow.** The app accumulates content across rounds; this round adds
>   RailNav to its section. You are simultaneously (a) consuming the shipped component and (b) stress-testing
>   the browser-bundle deploy path itself — friction in *either* is a finding.
> - Consume via the browser bundle: `window.DS.RailNav` (React 18, `dist-browser/ds.umd.js`). React and
>   ReactDOM must be the single instance loaded **before** the bundle (see `dist-browser/README.md`).
> - Theming is **provider-only**: swap the `ThemeContext` provider value to retheme. A CSS-var toggle does
>   **not** retheme the component — if you reach for one, that's a finding.
> - **Target:** reproduce the design system's **`Organisms/RailNav → Default`** Storybook story (details in
>   **§4B**) inside your collecting doc app. That story is the canonical shipped view — a faithful replica, not
>   a generate-content task. A gap in the spec/prop surface is still a §5 STOP-and-report, never something to
>   invent your way past.
> - You **cannot push to GitHub.** Commit locally, then follow your `EXPORT-MANIFEST.md`: the owner exports
>   your project and the DS side pushes it. Watch for a **stale download card** — re-export if in doubt.

---

## 4. What to build
Mount a working `RailNav` in your app driven by the required props — `sections`, `activeSection`, `activeItem`,
`onNavigate` — and then build **your stanza's target** (§4A or §4B). You do **not** hand-roll any part of the
component; you configure the shipped one. Report any prop/slot you needed but couldn't make work (§5).

### 4A. Copilot target — RailNav for Azure Data Insights (written IA, no image)
This is the design **intent** in words. Realize it with the shipped `RailNav`, choosing the exact Fluent icons
(`@miguel/design-system/icons` — Fluent System Icons only), prop wiring, and structure that best express it
from the repo + docs; bind the navigation to your real `azureDataInsights` tables (don't mock nav data).

- **Rail (icon column), top → bottom:**
  - Product logo mark at the top (your app's mark; interactive if you have a logo action → `logo`/`onLogoClick`).
    **Pass your own `logoLabel`** — it defaults to `"BiDezine"`, so an Azure build must override it (contract G14).
  - Primary `sections` — each a rail icon whose hover tooltip is its `label`, with an apt Fluent icon:
    1. **Azure Data Insights & Analytics**
    2. **Fabric Telemetry**
    3. **Azure Data Revenue**  ← the active/open section this round
    4. **NPS**
    5. **Customer Reporting**
- **Footer utility zone** (`footerSections` and/or `utilityItems`), bottom-anchored: **Alerts**,
  **Info & Feedback**, **Report Settings** (Settings anchored at the very bottom).
- **Open secondary panel for "Azure Data Revenue"** (`activeSection` = that section):
  - Panel header title **"Azure Data Revenue"**, the panel-actions menu (ellipsis → `panelMenuItems`), and the
    collapse control.
  - `panelSubtitle`: **"Know how Azure Data products generate and retain revenue."**
  - Search bar visible (`searchable`).
  - Nav tree (`items`), with **Overview** active (`activeItem`):
    - **Overview** (active)
    - **Annual recurring revenue**
    - **Fabric workloads** — expandable group, expanded (`children`):
      - **P+F SKU Allocated** · **F SKU Allocated** · **P SKU Allocated** · **Net Revenue Retention**
- Where the intent leaves a decision open (icon choice, extra sections beyond the five, tooltip wording), make
  the best call for your data + context. Where the component/docs genuinely can't express it → STOP + report.

### 4B. BROWSER-BUNDLE PATH target — reproduce the `RailNav → Default` Storybook story
Your target is the design system's canonical **`Organisms/RailNav → Default`** story, rebuilt in your
collecting doc app on `window.DS.RailNav`.

- You **may read** the story source `src/gallery/RailNav.stories.tsx` (the `Default` story + its
  `SECTIONS_DEFAULT` / `FOOTER_SECTIONS_DEFAULT` data) from GitHub to get the exact sections/items/config —
  **reading the named reference view is allowed; re-authoring the component is not.**
- Match the Default configuration: the 16-section rail lineup (excess → the **"More"** overflow/ellipsis menu),
  the deeply-nested **Slides** tree + **Documents** tree, the footer **Settings** section (opens its own
  panel), the searchable panel with its panel-actions menu (**Search box / Expand all / Collapse all**), the
  `panelSubtitle`, and the pinned bottom-rail **utility button**. Set `activeSection="slides"` and
  `activeItem="monthly"` (so the "System logic" group auto-expands).
- **Embedded-replica height (finding CD1.1):** `Default` is a fullscreen story with no pinned rail height, so
  which sections bury into "More" is viewport-derived. For an embedded replica, give the rail the assembled-frame
  reference height **730px** (`railnav.spec.md` `container.height: 730`) — it yields the canonical **12 sections
  + "More"** lineup. See `docs/consumer-governance/CLARIFICATIONS/railnav.md`.
- This target's content is **fixed by the story** — do **not** swap in generated content; it's a faithful
  replica. (Your content-generation intelligence is for future delegated rounds, not this one.)
- Apply the owner's named **stress-test controls** if/when given; otherwise exercise the Default as-is.

## 5. How to work (the protocol, in brief)
- **Gap → STOP → request.** If the spec, the types, or the component don't tell you what you need — a prop is
  ambiguous, a default surprises you, something crashes — **stop and write it down as a finding**; ask the DS
  side via `docs/consumer-governance/CLARIFICATIONS/`. **Do not guess and move on**, and do not invent
  behavior to paper over a gap (invented content = failure).
- **Independent verification (doer ≠ checker).** Whoever wired it up is not the sole judge that it "works" —
  verify against the rendered output and the behavior contract, not against your own intent.
- **Failure → total reset.** If the build goes off the rails, delete the code + scratch notes + chat and
  restart clean from this prompt; **keep only your findings** and hand them back.

## 6. Report back (the actual deliverable)
Commit to **your** repo (Rule 8 — nothing in the DS repo):
1. The working integration code (your app consuming `RailNav`).
2. A **findings list** — one entry per point of friction: what you were doing, what you expected, what
   happened, the exact prop/doc/file involved, and whether you're **blocked** or **worked around it**. Include
   the pin you verified (§2 — the DS commit / `window.DS.version`). "No friction on X" is a valid, useful entry.

The DS side reads your committed repo (`gh`) — **not** a chat summary — and files each defect in
`docs/consumer-governance/CONSUMER-FRICTION-LEDGER.md`.

## 7. Before you stop — write the next-chat prompt (MANDATORY, every attempt)
**The owner resets the chat after every attempt — pass, blocked, or failed — so nothing survives in the
conversation.** Your last act is to write a **ready-to-paste next-chat prompt** as your repo's `HANDOFF.md`
(the first file a fresh chat reads), per `COMMUNICATION-PROTOCOL.md` §4a. It MUST:
- Name the state: **organism = RailNav**, round #, the just-finished attempt #, and its outcome
  (**PASSED / BLOCKED / FAILED-RESET**).
- Tell the fresh chat to re-read fresh from GitHub: this prompt, `COMMUNICATION-PROTOCOL.md`, the RailNav spec
  + behavior-contract, and your own `PROGRESS.md` / `REQUESTS.md`. Re-verify the pin (§2).
- State the immediate next action + WHY: **PASSED** → advance / await the owner; **BLOCKED** → the exact open
  gap in `REQUESTS.md`; **FAILED-RESET** → rebuild from scratch reading only docs + this prompt + findings.
- Carry **findings only, never fix-hints** — say what was wrong, never how it was patched (a hint hides the gap
  we're measuring and voids the next attempt).

A handoff that leaks how a problem was fixed, or lets the next chat skip re-reading the docs, is itself a
protocol violation.
