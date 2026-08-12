# Visual QA Report — RailNav

**Golden reference:** bloodwork-dashboard-prototype (`localhost:5173`)
**Surfaces checked:** Storybook (`localhost:6007`), docs app (`localhost:5188`), bloodwork
**Timestamp:** 2026-05-24
**Report type:** DQA status audit (pre-implementation)

---

## 1. Current Maturity Status

| Field | Value | Issue? |
|---|---|---|
| Registry status | `beta` (in `docs/registry/components.json`) | **YES — see DQA-F1 below** |
| QA doc status | `experimental` (in `docs/qa/railnav-visual-qa.md` §1) | Correct |
| Visual approval | **NOT RECORDED** — approval log is empty (§5b) | Blocks promotion |
| Visual baselines | v0.1.2 (`06687bc`) — 140 tests, all passing | **FROZEN** — must not update |
| Git state | Dirty working tree — fixes uncommitted | — |

**Registry/QA mismatch:** `components.json` lists RailNav as `"beta"` but the QA
doc says `"experimental"` and no visual approval has ever been recorded. This
component should be `experimental` until the DQA gate is cleared.

---

## 2. Golden Reference

| Component | Consumer | Access | Status |
|---|---|---|---|
| RailNav | bloodwork-dashboard-prototype | `localhost:5173` | **Available** — page open in browser |

No `DQA.NO-GOLDEN-REFERENCE` — golden reference exists and is accessible.

---

## 3. Approval Status

- [ ] Owner visual approval recorded
- [ ] All BLOCKER findings resolved
- [x] All BLOCKER regression findings resolved (R2-01, R2-02, R2-03, R2-06 fixed in code)
- [x] Resolved-finding regression check passed (see §4)
- [x] Baselines NOT yet updated (still at v0.1.2)

**Gate decision:** Baselines are correctly frozen. No `DQA.BASELINE-BEFORE-APPROVAL`.

---

## 4. Resolved-Finding Regression Check

All previously resolved findings verified against current source:

| Finding | What to verify | Current code | Status |
|---|---|---|---|
| R2-01 panel title | `TYPE.headingM` + `tokens.ink` | Line 410: `...TYPE.headingM, color: tokens.ink` | ✅ intact |
| R2-02 collapse icon | `IconChevronDoubleLeft`, 40×40 | Line 996: `<IconChevronDoubleLeft size={18}` + lines 980–981: 40×40 | ✅ intact |
| R2-03 active row neutral | `tokens.bg` bg, `tokens.ink` color | Line 922: `selected ? tokens.bg`, line 923: `selected ? tokens.ink` | ✅ intact |
| R2-06 nested border | `tokens.border` | Line 1106: `2px solid ${tokens.border}` | ✅ intact |
| R2-12 logo slot | `<IconLogo />`, `tokens.onDark` | Line 303: `content={logo ?? <IconLogo />}`, line 519: `tokens.onDark` | ✅ intact |
| Logo tooltip | Always on hover, default "BiDezine" | Line 86: JSDoc, line 131: `logoLabel = "BiDezine"` | ✅ intact |
| Rail padding | `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` | Line 289: exact match | ✅ intact |
| Panel/rail alignment | Header height = `LAYOUT.hitTarget` | Line 401: `height: LAYOUT.hitTarget` | ✅ intact |
| Icon filled wiring | All call sites include `hovered` | 7 call sites verified (lines 675, 761, 888, 941, 996, 1085, 1094) — all include `hovered` | ✅ intact |
| Icon path integrity | Regular ≠ Filled for IconSettings | Regular path: 3183 chars (inner gear outlines), Filled: 1784 chars (solid) | ✅ distinct |
| Settings icon | Regular default, Filled on hover | `fluent.tsx:239` — `filled` prop switches paths | ✅ intact |
| Utility items | ThemeToggle + SettingsButton in all stories | `UtilityItems` helper used in all 13 stories | ✅ intact |

**Result:** 12/12 resolved findings still intact. No `DQA.RESOLVED-REGRESSION`.

---

## 5. Current DQA Findings

### New Findings

#### [HIGH] DQA-F1 — Registry status mismatch

| Field | Detail |
|---|---|
| **ID** | `DQA.BASELINE-BEFORE-APPROVAL` (variant) |
| **Severity** | HIGH |
| **File** | `docs/registry/components.json:210` |
| **Evidence** | `"status": "beta"` but no visual approval has ever been recorded |
| **Impact** | Registry claims RailNav has met beta requirements, but the visual acceptance gate was never cleared |
| **Recommended fix** | Set `"status": "experimental"` in `components.json` until DQA gate passes |
| **Blocks beta?** | Yes — must be corrected to reflect actual maturity |

### Unresolved Findings from QA Rounds (carried forward)

| ID | Severity | Area | Summary | Blocks beta? |
|---|---|---|---|---|
| F-02 | MEDIUM | sidebar | Panel header spacing cramped (8px total → should be 12–16px) | No |
| F-05 | MEDIUM | sidebar | Row height 36px vs bloodwork ~40–44px | No |
| F-06 | MEDIUM | sidebar | Panel item icons 18→20px (done for top-level, 18px for nested — verify) | No |
| F-08 | MEDIUM | sidebar | Nested group disclosure affordance weak (small chevron, no visual cue) | No |
| R2-04 | MEDIUM | sidebar | Row density tighter than bloodwork (~36px vs ~44px) | No |
| R2-05 | MEDIUM | sidebar | Nested children use `textSubtle` — too faint, should be `textMuted` | No |
| R2-07 | MEDIUM | rail | Logo visual weight in stories (story data, not component bug) | No |
| R2-09 | LOW | sidebar | Panel top padding 12px creates slight misalignment with bloodwork | No |
| R2-10 | LOW | sidebar | Scrollbar thumb visually heavy (cosmetic) | No |
| F-01 | LOW | rail | Button gap 4px feels tight with 5+ sections | No |
| F-09 | LOW | sidebar | Panel empty when few items (acceptable for persistent sidebar) | No |
| F-11 | LOW | rail | No visual separator between nav and utility items | No |
| R2-08 | LOW | rail | Docs app has no logo — top of rail looks abrupt | No |

### Stale Documentation Finding

#### [MEDIUM] DQA-F2 — Section 6 "Approved Visual Constants" is stale

| Field | Detail |
|---|---|
| **ID** | `DQA.ANATOMY-INCOMPLETE` |
| **Severity** | MEDIUM |
| **File** | `docs/qa/railnav-visual-qa.md` §6 |
| **Evidence** | Section 6 says: active row bg = `tokens.accentSubtle`, collapse = `IconPanelLeftContract`, title = `TYPE.bodyM + medium`. All three were overridden by Round 2 fixes (R2-03, R2-02, R2-01). |
| **Impact** | A future agent reading §6 as the approved spec would implement the wrong values |
| **Recommended fix** | Archive §6 as "Round 1 (superseded)" and add a §6b with current approved values |
| **Blocks beta?** | No, but must be fixed before committing |

---

## 6. Findings That Block Beta Promotion

| # | Finding | What must happen |
|---|---|---|
| 1 | DQA-F1 — Registry status mismatch | Set `components.json` status to `"experimental"` |
| 2 | No visual approval recorded | Owner must review screenshots across all 3 surfaces and record approval in §5b |
| 3 | No screen-reader testing | NVDA/JAWS (Windows) or VoiceOver (macOS) pass required |
| 4 | No consumer integration confirmation | At least one consumer (bloodwork or docs app) confirms API usability |

All HIGH-severity Round 2 findings (R2-01, R2-02, R2-03) are **resolved in code**.
No BLOCKER findings remain.

---

## 7. Visual Baselines — Frozen

| Baseline set | Tag | Tests | Status |
|---|---|---|---|
| v0.1.2 | `06687bc` | 70 stories × 2 themes = 140 | **FROZEN** |

Baselines must NOT be regenerated (`test:visual:update`) until:
1. All working-tree fixes are committed
2. Owner reviews screenshots (Storybook + docs app + bloodwork)
3. Owner records approval in `docs/qa/railnav-visual-qa.md` §5b
4. All BLOCKER + HIGH findings are confirmed resolved

Current visual regression tests will **fail** because the code has changed since
the baseline was captured. This is expected and correct — the old baselines
represent the pre-fix state.

---

## 8. Screenshots Needed for Approval

The owner must review the following before any baseline update or promotion:

### Storybook (localhost:6007) — all stories, light + dark

| Story | What to check |
|---|---|
| DefaultWithLogo | Logo slot, panel title (headingM + ink), header alignment with logo |
| WithSidebarCollapse | Collapse button (ChevronDoubleLeft), collapse/expand behavior |
| WithItemIcons | Item icons (20px top-level), active row (neutral bg + ink + weight 500) |
| WithNestedGroup (collapsed) | Group header, chevron affordance |
| WithNestedGroup (expanded) | Nested border (neutral `tokens.border`), child items |
| ActiveNestedItem | Active child inside expanded group, group header active color |
| OverflowRailItems | Rail overflow menu behavior |
| LongSidebarScroll | Scroll behavior, row density |
| BloodworkReference | Closest match to golden reference |
| WithInteractiveLogo | Logo hover/pressed/focus states, tooltip |
| WithCustomLogo | Custom logo rendering |
| WithoutLogo | Rail without logo — top padding |
| CollapsedSidebar | Rail-only state |

### Docs app (localhost:5188)
- RailNav rendering with 4 sections
- Utility items placement
- Panel title and item styling

### Bloodwork (localhost:5173)
- Side-by-side comparison with Storybook `BloodworkReference` story
- Logo, collapse icon, active row, item icons, overall density

---

## 9. Next Implementation Scope

**No implementation until this report is reviewed and the owner confirms scope.**

Based on the current findings, the approved-and-implemented fixes (Round 2) are
already in the working tree but **uncommitted**. The next actions are:

### Immediate (before commit)
1. **Fix DQA-F1** — Set `components.json` RailNav status to `"experimental"`
2. **Fix DQA-F2** — Archive §6 in QA doc as "Round 1 (superseded)"

### After owner screenshot review
3. Owner reviews screenshots across 3 surfaces
4. Owner records approval or identifies additional issues
5. Only then: commit, regenerate baselines, run visual regression, tag

### NOT in scope (deferred to post-approval)
- F-02, F-05, F-06, F-08, R2-04, R2-05 (MEDIUM density/typography refinements)
- F-01, F-09, F-11, R2-07, R2-08, R2-09, R2-10 (LOW cosmetic items)
- Screen-reader testing (required for beta but separate workflow)

---

## Synthesis

RailNav is **visually improving but not yet approved**. All 3 HIGH-severity Round 2
findings (panel title, collapse icon, active row) are resolved in code and verified
by regression check. The resolved-finding regression checklist passes 12/12. No
DQA.RESOLVED-REGRESSION. No DQA.BASELINE-BEFORE-APPROVAL (baselines are correctly
frozen). Two documentation issues need fixing (registry status mismatch, stale §6).
The primary gate is **owner visual approval** — no screenshots have been reviewed
and approved yet. Until that happens, the component remains `experimental` and
baselines stay frozen at v0.1.2.
