# Consumer Communication & Governance Protocol

How the two deployers talk to the design system (DS), hand off, verify, and fail safely. The **findings are
the product** — this protocol exists to make them TRUSTWORTHY: no gap is ever papered over to "deliver."

This file is the **canonical, tool-neutral source of the consumer rules.** Every build prompt links here and
restates the load-bearing rules inline, so nothing depends on a tool auto-loading a particular filename.

## 0. Identity — defined by CONSUMPTION PATH, not by which AI

> **Changed 2026-07-31.** These two identities were originally named after the *agents* that held them
> ("COPILOT" and "CLAUDE DESIGN"). **GitHub Copilot now operates both.** The identities are therefore
> defined by **consumption path**, and the agent name is no longer part of the definition.
>
> This is a strengthening of the experiment, not a compromise of it. With the agent held constant,
> every difference that surfaces is attributable to **the documentation and the consumption path** —
> not to "one AI happens to be better than the other," which was always an uncontrolled variable.
> The docs become the isolated variable, which is the thing being measured.
>
> Historical records (`REQUESTS.md` GAP blocks, past `PROGRESS.md` entries) keep the old agent labels.
> They are append-only logs of who filed what — relabelling them would falsify the record.

Both deployers build the **same** owner-chosen component, but through **deliberately different approaches** —
that contrast is the experiment. Identical component + identical governance, divergent consumption path and
app type → the differences that surface are the signal.

- **RAW-TS PATH** *(historically "COPILOT")* — Rayfin / Vite consumer, repo `ADIAS-dashboard`.
  **Approach: builds the component directly in the live Rayfin app, wired to corporate data — a production
  integration, not a demo.** Consumes the **raw-TS** package (`@miguel/design-system` installed via
  `github:`; reads `.jsx`/`.d.ts` fresh), React 19, **dataset-connected**. Deploys from a **Figma file
  image** (reads the component's icons/text/layout in Figma) + the docs, OR from a **prompt only** (no
  image). The `dist-browser` bundle is NOT its artifact.
  **Source visibility:** this path **necessarily reads DS source**, because the package ships raw `.ts`/
  `.tsx` with no build step — that IS its consumption contract. See §2 for what that does and does not
  license.
- **BROWSER-BUNDLE PATH** *(historically "CLAUDE DESIGN")* — browser-only consumer, repo `ds-docs-site`
  (renamed from `claude-design-dashboard`). **Approach: builds the design system's documentation website —
  the site that explains the whole system, foundations through organisms, rendered live off the real
  bundle — while exercising the browser-bundle deployment flow. The app accumulates content round over
  round, and the deploy path itself is under test.** Consumes **`dist-browser/ds.umd.js` off `window.DS`**
  (React 18, provider theming) — **the bundle IS its artifact.** Places each tested component in its
  section, adds owner-named **stress-test controls**, and **generates its own content** (data, text, icon
  choices) — intelligently, from a simple prompt OR an image reference, **only where the prompt delegates
  generation** (never to fill a gap).
  **Source visibility: none, by construction.** A built bundle exposes no component source. This path is
  source-blind for free — no rule required.
- Both **CONSUME** the DS; **neither ever edits the DS repo** (Rule 8, below), and **neither ever opens the
  DS repo's local working tree** (§2a).
- **Neither deployer reads `CLAUDE.md`.** This protocol + the build prompt are the complete, self-contained
  rule source. Never let a load-bearing rule live only in a `CLAUDE.md`.

## 1. Communication topology (GitHub-mediated; owner-relay is FALLBACK ONLY)

The deployers and the DS **may now sit on the same filesystem**, but they still communicate **only** through
GitHub. That is deliberate — see §2a; sharing a disk is a hazard to be fenced off, never a channel to use.

- **DS repo** (`MiguelMyersMS/design-system @ master`) — the DS side WRITES (prompts, specs, this protocol,
  and `CLARIFICATIONS/<organism>.md` answers); deployers READ, **via GitHub only, never the local tree**
  (§2a). Deployers **never write here** (Rule 8).
- **Each deployer's OWN app repo** — the deployer WRITES its `HANDOFF.md` / `PROGRESS.md` / `REQUESTS.md`
  into ITS OWN GitHub repo; the DS side READS them via GitHub (read-only). Outbound channel:
  - **Raw-TS path** → `MiguelMyersMS/ADIAS-dashboard` (it already commits there — add the three files).
  - **Browser-bundle path** → `MiguelMyersMS/ds-docs-site`. **It pushes directly.**
- **Owner-relay is now RETIRED as a routine step.** It survives only as a genuine emergency fallback.
- **⚠️ The export hop is GONE, and that closed a real defect class.** Until 2026-07-31 the browser-bundle
  deployer could not push, so the owner exported the project by hand each round. That hop is exactly where
  the CD1.7 bundle drift happened: a 1.05 MB `ds.umd.js` was rejected by the old environment's ingestion
  path, the project silently kept a stale bundle, and a whole round was lost at the pin gate. **Any future
  arrangement that reintroduces a manual copy step should be treated as reintroducing that defect class.**
- **Round-0 capability check:** confirm both deployer repos are pushable by their deployer and readable by
  the DS side via `gh`.

## 2. Where to read (source of truth = GitHub, read FRESH every round)

Your build prompt names the exact files. At minimum, read IN ORDER:

1. **This protocol** — the consumer rules, **especially Rule 8**. (`CLAUDE.md` is a Claude-Code convention
   Copilot does not read; this file is the tool-neutral source, and the prompt restates the key rules inline.)
2. **Your round's build prompt** — `prompts/consumer-build/<organism>.build-prompt.md` (identical for both
   deployers; it lists every file to read for the round).
3. The organism's **spec** (`docs/atomic/.../<organism>.spec.md`), its **behavior-contract**, and
   (browser-bundle path) **`dist-browser/README.md`** + **`API.md`** (the consumption contract and prop
   surface).
4. **Your own handoff files** (§3) — so you resume knowing what's done/next/how/why.

Read the prompt/spec/`.jsx`/`.d.ts` **fresh from the repo each round** — never from memory, a screenshot, or a
prior build. Never read `src/` to reverse-engineer behavior the docs don't state — **a behavior only
discoverable from source IS a gap to report** (§5), not a licence to copy.

## 2a. 🚧 The DS working-tree fence (added 2026-07-31 — load-bearing)

**No deployer may open the design system's local working tree.** On the owner's machine that is
`C:\Users\miguelmyers\Workspaces\systems\design-system`. Do not read it, `cd` into it, grep it, or open
any file inside it — including via an editor tab that happens to already be open.

**Read the design system ONLY through GitHub:** `gh api` / `gh repo view` against
`MiguelMyersMS/design-system @ master`, or its raw file URLs.

**Why this exists, and why it is not paperwork.** Until 2026-07-31 the browser-bundle deployer ran in a
separate environment that could not reach the DS repo at all — its isolation was a *physical fact*. Both
deployers now run as agents on the owner's own laptop, one directory away from the DS tree. The same
isolation must therefore be a *written rule*, or it does not exist.

What is at stake is the finding itself. The working tree holds in-progress specs, audit evidence, internal
sync notes and `src/` — material no real consumer would ever have. If a deployer reads it, then a build
that comes out correct can no longer be distinguished between:

- **"the published documentation was sufficient"** ← the result the project exists to produce, and
- **"the agent found the answer in material a consumer would never see"** ← a result worth nothing.

Those are opposite conclusions. Once they are indistinguishable, the round produced no information.

**Distinguish two things that sound similar:**

| Legitimate | Forbidden |
|---|---|
| Reading the **installed package** (`node_modules/@miguel/design-system`) — raw-TS deployers must, it is their consumption contract | Browsing the **DS repo working tree** for anything |
| Fetching published docs/specs/prompts **via GitHub** | Opening those same files from the local folder |
| Reading `dist-browser/README.md` + `API.md` | Reading `src/` to answer a question the docs left open (§5 gap) |

A deployer that opens the DS tree has voided the round (§6), exactly as if it had edited it.

## 3. Handoff files — always sufficient for a zero-memory chat to resume

Maintain, at all times, enough state in YOUR OWN repo (never the DS repo) that a brand-new chat with no memory
can continue knowing **what's done, what's next, HOW, and WHY**:

- **`HANDOFF.md`** — current state: the organism in flight, round #, attempt #, what's blocked, the immediate
  next action, and WHY. The first thing a fresh chat reads.
- **`PROGRESS.md`** — append-only round log: attempt counts, **findings (what was wrong, NEVER how it was
  fixed** — so a rebuild can't inherit hints), decisions, and interpretation records (how you read the prompt).
- **`REQUESTS.md`** — outbound gap-requests + any DS bug/gap you found (§5). The DS reads this from your repo.

## 4. The round protocol

1. **READ** everything in §2.
2. **GAP CHECK FIRST — before building.** If the prompt/spec is ambiguous, half-instructed, or silent on
   something you need, **STOP. Do not build.** Write the exact gap to `REQUESTS.md` (§5) and hand back. **A
   blocked round is a VALID result, not a failure.** Never proceed on an assumption.
3. **BUILD — only what the prompt names.** Consume the SHIPPED component; never re-author/fork it. Add EXACTLY
   the named controls (not more, not fewer). Copilot: build from the Figma image + docs (or prompt + docs) and
   **wire the connected dataset** into the props/slots. Browser-bundle path: place in the correct site section
   and generate content/data/icons intelligently.
4. **VERIFY with an INDEPENDENT agent (doer ≠ checker).** A SEPARATE agent — never the builder — confirms the
   result **matches the GitHub spec AND that nothing was invented to fill a gap. Invented content is a FAILURE
   even if it looks right.** The verifier compares the rendering element-by-element against the spec, not the
   code.
5. **RECORD** — findings list + a `PROGRESS.md` entry + interpretation record + a diff note vs the previous
   round.
6. **GRADE** — the owner grades; you log. You never score your own pass.
7. **HAND OFF TO THE NEXT CHAT (mandatory — every attempt ends here).** The owner **resets the chat after
   every attempt, whether it passed, is blocked, or failed** — so no memory survives in the conversation.
   Before you stop, emit a **ready-to-paste next-chat prompt** (write it as your `HANDOFF.md`, the first file a
   fresh chat reads) that lets a brand-new zero-memory chat continue correctly. See §4a for exactly what it
   must contain.

## 4a. The next-chat handoff prompt (continuity across a full chat reset)

Because the chat is reset every attempt, **`HANDOFF.md` IS the handoff** — make it a self-contained prompt the
owner can paste into a fresh chat verbatim. It MUST:

- **Name the state:** organism, round #, the just-finished attempt #, and its **outcome** (PASSED / BLOCKED /
  FAILED-RESET).
- **Point to fresh reads (never memory):** this protocol, the round's build prompt
  (`prompts/consumer-build/<organism>.build-prompt.md`), the organism spec + behavior-contract, and your own
  `PROGRESS.md` / `REQUESTS.md` in your repo. Re-pull all of it from GitHub.
- **State the immediate next action + WHY:**
  - **PASSED** → advance (next round/component, or await the owner's next prompt); confirm findings are logged.
  - **BLOCKED** → the exact open gap-request in `REQUESTS.md` the DS must answer before rebuilding.
  - **FAILED-RESET** → trigger the §7 total reset: rebuild from scratch reading ONLY docs + prompt + findings.
- **Carry findings, NEVER fix-hints (§7).** Say what was wrong, never how it was patched — a hint hides the
  gap we are measuring and voids the next attempt.
- **Confirm the pin** to re-verify (the component SHA / `window.DS.version`).

A next-chat prompt that leaks how a problem was fixed, or that lets the fresh chat skip re-reading the docs, is
itself a protocol violation.

## 5. Requesting missing info (gap → STOP → structured request)

When blocked, append to your `REQUESTS.md` (the DS reads it from your repo). Exact format:

```text
### GAP — <organism|page> — round <n> — attempt <a> — <RAW-TS|BROWSER-BUNDLE>
- Where:             <the exact prompt/spec line or the missing artifact>
- Ambiguous/missing: <precisely what is unclear or absent>
- To proceed I need: <the specific answer / value / artifact>
- Status:            BLOCKED — not built
```

For a suspected DS bug (build followed the docs but the shipped component is wrong): same block, `Status:
DS-BUG SUSPECTED`, attach evidence (screenshot + the spec line it violates), and **pause**. The DS answers by
updating the prompt/spec/bundle or posting to `CLARIFICATIONS/<organism>.md`; you re-read fresh next round.

## 6. What NOT to do (the protective core — violations invalidate the round)

- **Never guess / never fill a gap to ship.** Ambiguity → STOP → request.
- **Never invent data, text, or icons to paper over a MISSING INSTRUCTION.** (The browser-bundle path's
  content intelligence applies ONLY where the prompt DELEGATES generation — never to cover a gap.)
- **Never open the DS repo's local working tree (§2a).** Read the DS through GitHub only. Reading the tree
  voids the round exactly as editing it does.
- **Never edit the DS repo (Rule 8).** Found a DS bug/gap → log + report it, do not fix it. Working in the DS
  tree at all voids the round.
- **Never re-author or fork a DS component** — consume the shipped one.
- **Never patch a failed build** — destroy and restart (§7). A repaired build proves nothing.
- **Never carry hints across a rebuild** — findings say what was wrong, not how it was fixed.
- **Never sign your own verification.**

## 7. Failure → TOTAL RESET (hard rule)

### 7.0 Reset SCOPE — what a round covers (added 2026-07-31)

**A round covers ONE component, page, or section — never a whole app or site.** The owner names the
scope in the build prompt. "Foundations → Tokens" is a round. "Every organism page" is not.

This matters because §7 destroys whatever the round covered. Scoped to a component or a page, that
costs an afternoon and the rigor is worth it. Scoped to an entire documentation website, a single
defect would wipe weeks of work and the team would quietly start patching instead — which converts
the hard rule into a dead letter and silently ends the measurement.

**A reset destroys the round's scope only.** The rest of the site is untouched.

On ANY defect or failed attempt, reset so the next attempt is TRULY from scratch:

1. **DELETE the round's code entirely** — the component, page, or section that round covered. No
   patching, no leftovers.
2. **PURGE the registry notes / hints** for that component (anything that could seed the next build with a
   remembered answer — a hint hides the exact gap we are measuring).
3. **ELIMINATE the attempt's chat** — start the rebuild in a FRESH conversation with no carried context.
4. **The ONLY survivors:** the **findings** in `PROGRESS.md` (what was wrong, *not* how it was fixed) and the
   `HANDOFF.md` next-chat prompt (§4a — so the new chat knows what failed and where to resume). Everything
   else is gone. The chat is reset **every** attempt (pass or fail), so this handoff is written every time,
   not only on failure.
5. **Count the attempt.** A component that needed a rebuild **did not pass.** Convergence = it passes with
   ZERO rebuilds on a fresh chat reading only the docs + prompt.

## 8. Per-deployer specifics

> **Both paths are operated by GitHub Copilot as of 2026-07-31** (§0). The headings below name the
> **consumption path**; the parenthetical is the historical agent label kept so older records still
> resolve. Each deployer's own repo carries a **self-contained** `.github/copilot-instructions.md`
> restating these rules — never let a load-bearing rule live only in a file the agent may not load.

### RAW-TS PATH — `ADIAS-dashboard` *(historically "COPILOT")*

- **Approach:** builds the component **directly in the live Rayfin app, wired to corporate data** — a real
  production integration, not a demo screen.
- **Consumes:** raw-TS `@miguel/design-system` via the **`github:` install** (an INSTALLED package →
  `optimizeDeps.include: ["@miguel/design-system"]`, NOT `exclude`; finding B0.5) + `resolve.dedupe:
  ["react","react-dom"]`, React 19. Reads `.jsx`/`.d.ts` fresh. NOT the `dist-browser` bundle. (`exclude` is
  only correct for a live-edited local `file:` link — which is not Copilot's setup.)
- **Input modes:** (a) **Figma file image** — read the component's icons, text, and layout in Figma and match
  it against the DS docs; (b) **prompt only** — no image, build from the prompt + docs.
- **Dataset:** the deployment must connect to its dataset — wire the real connected data into the component's
  props/slots (this is also the composition/own-data test).
- **Theming:** `ThemeContext.Provider` value-swap in React state (a CSS toggle does NOT retheme).
- **Instruction reach:** Copilot does not read `CLAUDE.md`. The build prompt (read fresh each round) states the
  rules inline; the owner should also add a `.github/copilot-instructions.md` to **Copilot's own app repo**
  pointing here.

### BROWSER-BUNDLE PATH — `ds-docs-site` *(historically "CLAUDE DESIGN")*

- **Repo:** `MiguelMyersMS/ds-docs-site`, renamed from `claude-design-dashboard` on 2026-07-31.
- **⚠️ It can push to GitHub now.** The old environment could not, so the owner had to export the project
  by hand every round — and that manual hop is precisely where the CD1.7 bundle drift happened. The
  export hop is **gone**; the deployer commits and pushes its own work, and §1's owner-relay fallback no
  longer applies to this path.
- **Builds:** the design system's **documentation website** — the site explaining the whole system
  (foundations, tokens, icons, components) rendered live off the real bundle. It grew out of the
  component-collecting storybook and still accumulates each tested component round over round.
  Private behind Cloudflare Access at `https://ds.bidezine.systems`.
- **Consumes:** `dist-browser/ds.umd.js` → `window.DS` (React 18.3.1 UMD globals, provider theming). Load
  order: React/ReactDOM UMD → `ds.umd.js`; render via `window.React.createElement(window.DS.<Component>, …)`.
  Assert `window.DS.version` == the pinned manifest SHA each round (a stale copy is a reported bug).
- **Builds:** the Storybook/doc app — atomic-element + UI-component sections; place each tested component in its
  section with the owner-named stress-test controls (exactly those).
- **Content intelligence:** generate data/text/icon choices intelligently from a simple prompt OR an image
  reference (sensible content, realistic values, correct Fluent icons). **This intelligence is for CONTENT the
  prompt delegates; it is NEVER a way to fill a missing instruction** (that's a §5 gap).
- **Globals:** wrap in `DS.ThemeContext.Provider`, add the Inter/DM-Sans/Raleway font `<link>` (or self-host
  woff2 for offline export), and inject `<style>{DS.FOCUS_GLOBAL_CSS(tokens)}</style>`.

## 9. What the DS side (owner + design-system) owns

**Core duty (the reason the DS sits in the middle):** keep the docs, specs, prompt, and shipped code the
**single codified source of truth**, so a deployer never has to hallucinate — never has to guess, infer from
`src/`, or invent content — to fill something that isn't written down. Every deployer gap is a signal that the
*documentation/code* is under-specified: the fix is to **codify it** (in the spec, the behavior-contract, the
prop surface, or the prompt) and make it a gated change — not to answer once in chat and move on. A behavior
that only works if the deployer assumes it is a DS defect, not a deployer error.

- Author + commit the round's build prompt at `prompts/consumer-build/<organism>.build-prompt.md` (self-
  contained: it restates the rules + links this protocol + lists every file to read). **Copilot cannot read
  `CLAUDE.md`** — never let a load-bearing rule live only there; restate it in the prompt or this protocol.
- Read each deployer's `REQUESTS.md` from its repo; answer by updating the prompt/spec/bundle or posting to
  `docs/consumer-governance/CLARIFICATIONS/<organism>.md` — never by letting the deployer guess. Fold every gap
  into the prompt so it never recurs.
- Keep `dist-browser/` fresh on master (`npm run build:umd`; CI `check:umd-fresh`).
- Log each defect in `docs/consumer-governance/CONSUMER-FRICTION-LEDGER.md` and convert it to a **gated** DS
  change (an export assert / audit / contract story) — a prose-only fix does not close a finding.

## Rule 8 (the load-bearing one, verbatim from the DS `CLAUDE.md`)

> **Consumers never edit the design-system repo.** A consumer app CONSUMES the DS — it imports the raw-TS
> package or the `dist-browser` bundle; it does not edit `src/`, specs, or tokens here. If a consumer needs a
> DS change, it goes through the DS repo's own flow, never as an edit from inside the consumer's build.
