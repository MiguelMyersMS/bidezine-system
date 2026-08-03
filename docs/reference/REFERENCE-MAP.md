# Reference Map — old design-system ↔ shadcn ↔ bidezine (v2)

When building or improving a v2 component you have **two reference sources**. This file says where they are,
what's in them, and how to compare-and-harvest. **Both are READ-ONLY from here — never edit them.**

## The two references

| Source | Path (from this repo) | What it is |
|---|---|---|
| **Old design-system** (Miguel's built work) | `../design-system/` (sibling folder) | ~90 components + a full spec catalog Miguel already built. **Legacy mold** (inline `CSSProperties`, JS-context tokens) — so harvest its **look, tokens, and design decisions**, not its code verbatim. |
| **shadcn** (vendored) | `reference/shadcn-ui/` | The entire shadcn source — behaviour (Radix) + Tailwind/CVA. Borrow **behaviour/structure/a11y**, never its styling. |

> **Sibling requirement:** the old DS is referenced by relative path `../design-system`, so **each machine
> must have BOTH repos cloned side-by-side** (Laptop A & B already do; the PC needs both). The SessionStart
> hook warns if `../design-system` isn't found beside this repo.

### Where the old-DS pieces live
- **Component code:** `../design-system/src/gallery/<Name>.tsx` (+ `<Name>.stories.tsx`)
- **Specs (the design contract):** `../design-system/docs/atomic/{atom,molecule,organism}/<slug>.spec.md`
- **Tokens / foundations:** `../design-system/src/tokens.ts`, `src/layout.ts`, `src/status.ts`, `src/foundations/*`
- **Evidence (what it should look like vs Figma):** `../design-system/docs/evidence/<slug>/`
- **Registry / catalog:** `../design-system/docs/registry/*`

## Three-way comparison — where they overlap and where they don't

**A · Both old-DS AND shadcn have it → compare all three, take the best.**
Dialog · Tabs · Tooltip · Badge/Tag · Card/CardHeader · Slider · ToggleSwitch↔Switch · ToggleButton↔Toggle ·
TextInput/InputTrigger↔Input · SearchBar↔Input+Command · SelectDropdown/SelectField↔Select+Combobox ·
ActionMenu/Menu↔Dropdown/Context/Menubar · DataTable/TreeDataTable/Table*↔Data Table+Table ·
Calendar*/CalendarField↔Calendar+Date Picker · Divider↔Separator · Spinner · EmptyState↔Empty ·
Accordion*↔Accordion · Scrollbar↔Scroll Area · Segmented↔Toggle Group · Charts↔Chart.

**B · Old-DS HAS it, shadcn LACKS it → candidates to bring over / keep as ours** (these are your differentiators):
RailNav / RailButton / RailMenu / NavRow / NavPanelShell / SidebarPanel · MetricSummaryCard / TrendRow /
TrendArrow · FilterPane / FilterBar / FilterButton · PageHeaderTitle / PageShell / PanelHeader ·
AIPill / InfoPill / DarkPillButton · DateChip · the SelectSlicerCompact + *Compact* family · the whole
dark-surface atom system.

**C · shadcn HAS it, old-DS LACKS it → net-new from shadcn:**
Command · Combobox · Breadcrumb · Pagination · Resizable · Carousel · Input OTP · Hover Card · Aspect Ratio ·
Toast/Sonner · Drawer/Sheet · Alert / Alert Dialog · Avatar · Progress · Skeleton · Kbd · Field (form).

## The compare-and-harvest workflow (per ADR-006 + PRIMITIVES-FIRST)

For each candidate component:
1. **Look at the old DS** — read `../design-system/src/gallery/<Name>.tsx` + its `.spec.md` + its evidence.
   This tells you the **look, tokens, states, and decisions** Miguel already settled (and any hard-won
   fixes in its spec's `EX-` deviations).
2. **Look at shadcn** — read `reference/shadcn-ui/…` for the same component. This gives the **behaviour**
   (Radix), variant structure (CVA), and a11y.
3. **Decide** — harvest the old DS's *look/tokens/decisions*, adopt shadcn's *behaviour*, or merge the best
   of both. Where the old DS already does something shadcn omits (group B above), that's a keeper.
4. **Build in bidezine** through the pipeline — re-skinned to v2 tokens, never pasting either source's code
   verbatim (old DS = legacy mold; shadcn = Tailwind mold). Ship via the evidence/deploy waves.

> Rule of thumb: **old DS answers "what should it look like and what did we already decide?"** · **shadcn
> answers "how does it behave?"** · **bidezine is where the answer is re-authored as ours.**
