// ═══════════════════════════════════════════════════════════════════════════════════
// Proof that a rewired type slot actually ships what it claims.
//
//   npm run build && node scripts/check-type-slots.mjs
//
// Issue 05b, finding 3: the original plan for this proof pointed at verifier/ (retired
// Sandbox infra — see docs/PIVOT-2026-08-15.md) and at a component-render assertion this
// repo has no test runner to execute. Neither exists, so this is built on what the repo
// actually has: a real build, and files on disk.
//
// Two links per rewired slot, both required:
//
//   Link A — SOURCE: the named file's class string for that slot contains the role
//   utility (text-control, text-body, …) and none of R6's forbidden raw size/leading/
//   tracking utilities. This is "the component still asks for the role", not "the role
//   is correct" — Link B is what proves the value.
//
//   Link B — COMPILED: dist/system.css defines a `.text-<role>{…}` rule whose font-size,
//   line-height, font-weight and letter-spacing resolve to the expected literals. This is
//   read from the BUILT stylesheet, the artifact a consumer installs — the same reasoning
//   check-shipped-tokens.mjs is built on, and for the same reason: a source file or a
//   database row can say anything; only the shipped CSS says what ships.
//
// The expected values below are LITERALS, copied from Issue 05b's shipped-value table.
// They are never read back out of the current build. A check whose expectation is
// derived from the thing it is checking passes by construction and proves nothing — if
// Finding 3 taught this repo anything it is that a check must take its input from a
// source independent of what it verifies, not construct its own idea of "expected".
//
// Exit 1 on any violation.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT } from "../verifier/lib/db.mjs"
// Neutral parsing helper, not another gate — see scripts/lib/lexical-scan.mjs's own
// header. This is scripts/lib/dependencies.mjs's precedent (scan-dependencies.mjs
// already imports it): a shared scan/scope module has no opinion on which of its
// importers is blocking. As of Issue 06h both this file and R6 (check-rules.mjs) are
// wired into the blocking npm chain; sharing lexical-scan.mjs and variant-scope.mjs
// between them is what keeps their two answers from drifting apart again.
//
// Issue 06d: classLiterals and stripComments used to be answered independently — this
// file's own private stripComments (a bare `//`/`/* */` regex) and class-literals.mjs's
// literal scan (no comment awareness) each assumed the other's question was already
// solved. An intermediate fix that derived literal spans from raw source to protect
// them from comment-stripping (since deleted) was still backwards for the same reason.
// lexical-scan.mjs answers both from one pass, since comments and literals are
// mutually exclusive lexical states; classLiterals and stripComments below are both
// thin views over it, and neither file keeps a private copy of either's scanning logic.
import { classLiterals, stripComments } from "./lib/lexical-scan.mjs"

const SHIPPED_CSS = join(REPO_ROOT, "dist", "system.css")

const lineOf = (source, index) => source.slice(0, index).split("\n").length

// Issue 06c: this used to duplicate scripts/check-rules.mjs's R6 capture regex rather
// than import it, on self-contained-gate grounds — at the time, R6 was explicitly
// non-blocking, and a blocking script's exit code was not to depend on a module that
// said it must stay that way. As of Issue 06h R6 is blocking too, which removes that
// specific objection, but these four regexes remain independently defined below rather
// than newly shared — unlike scripts/lib/lexical-scan.mjs and scripts/lib/
// variant-scope.mjs (both genuinely neutral parsing/scoping code with no rule-specific
// content), FONT_SIZE_RE and friends ARE the rule's own definition of "forbidden," and
// this file and check-rules.mjs each keep their own copy so that either can be read on
// its own without cross-referencing the other for what it forbids. The duplicated
// CAPTURE regex (a different thing — the one that used to close a double-quoted
// literal on the FIRST embedded quote of ANY kind) is retired; the shared matcher in
// lexical-scan.mjs closes only on the SAME quote character it opened with.
const FONT_SIZE_RE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/
const FONT_SIZE_ARBITRARY_RE = /\btext-\[(?:length:[^\]]+|[\d.]+(?:px|rem|em))\]/
const LEADING_RE = /\bleading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])\b/
const TRACKING_RE = /\btracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])\b/

// ── the slot table ──────────────────────────────────────────────────────────────────
// expected values are [font-size, line-height, font-weight, letter-spacing] literals.
//
// `anchor` is a required, distinctive substring of the slot's OWN class literal —
// something structural (a utility combination, a data-attribute selector, a container
// name), never a bare word likely to recur. Link A uses it to find that ONE literal
// among possibly several in the same file that reference the same role utility; without
// it, Link A silently matched the FIRST literal referencing the role, which is how the
// Calendar weekday false pass (Issue 06a) happened — the table's own note described an
// "absorbed slot" change on src/ui/calendar.tsx's week_number cell, but the entry's
// literal match landed on the ALREADY-rewired weekday cell instead, so the check reported
// PASS while week_number's arbitrary text-[0.8rem] shipped unexamined.
const SLOT_TABLE = [
  { file: "src/ui/button.tsx", slot: "Button label", role: "control", anchor: "justify-center gap-2 rounded-md text-control" },
  { file: "src/ui/button-group.tsx", slot: "ButtonGroup text", role: "control", anchor: "rounded-md border bg-muted px-4 text-control" },
  { file: "src/ui/tabs.tsx", slot: "TabsTrigger label", role: "control", anchor: "h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5" },
  { file: "src/ui/toggle.tsx", slot: "Toggle label", role: "control", anchor: "rounded-md text-control whitespace-nowrap transition-[color,box-shadow]" },
  { file: "src/ui/accordion.tsx", slot: "AccordionTrigger label", role: "control", anchor: "justify-between gap-4 rounded-md py-4 text-left text-control" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuLabel", role: "control", anchor: "text-control text-foreground data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuLabel", role: "control", anchor: "text-control data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/menubar.tsx", slot: "MenubarTrigger", role: "control", anchor: "px-2 py-1 text-control", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/menubar.tsx", slot: "MenubarLabel", role: "control", anchor: "text-control data-[inset]:pl-8", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/navigation-menu.tsx", slot: "NavigationMenuTrigger style", role: "control", anchor: "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-control", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/field.tsx", slot: "FieldLegend (variant=label)", role: "control", anchor: "data-[variant=label]:text-control", note: "Issue 06e decision 1: FieldLegend does not compose Label (that is FieldLabel, a separate function) — its own unconditional \"mb-3 font-medium\" base supplies weight 500, so the shipped tuple (14/20/500/0em) is text-control, not text-body or text-label as the two suggested options implied." },
  { file: "src/ui/input-group.tsx", slot: "InputGroupAddon", role: "control", anchor: "py-1.5 text-control text-muted-foreground", note: "text-sm font-medium collapses to text-control; font-medium dropped." },
  { file: "src/ui/calendar.tsx", slot: "Calendar dropdowns", role: "control", anchor: "gap-1.5 text-control", note: "Issue 06g: text-sm font-medium collapses to text-control; font-medium dropped." },

  { file: "src/ui/table.tsx", slot: "Table root text", role: "body", anchor: "caption-bottom text-body" },
  { file: "src/ui/dialog.tsx", slot: "DialogDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/card.tsx", slot: "CardDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/select.tsx", slot: "SelectItem", role: "body", anchor: "pr-8 pl-2 text-body" },
  { file: "src/ui/select.tsx", slot: "SelectTrigger", role: "body", anchor: "data-[size=default]:h-9 data-[size=sm]:h-8", note: "text-sm with no weight utility is text-body even though the element reads semantically as a control." },
  { file: "src/ui/breadcrumb.tsx", slot: "Breadcrumb root text", role: "body", anchor: "flex-wrap items-center gap-1.5 text-body" },
  { file: "src/ui/item.tsx", slot: "ItemDescription", role: "body", anchor: "line-clamp-2 text-body text-balance", note: "absorbed slot — 21px → 20px line-height, deliberate." },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuSubTrigger", role: "body", anchor: "select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuItem", role: "body", anchor: "data-[variant=destructive]:text-destructive" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenuCheckboxItem/RadioItem", role: "body", anchor: "pr-2 pl-8 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none", literals: 2, note: "CheckboxItem and RadioItem share one byte-identical recipe — two consumers, one entry. Anchor repaired in Issue 07e after the rewire removed the py-1.5 substring this anchor used to quote (see docs on preferring a structural anchor over one that quotes a utility)." },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuItem", role: "body", anchor: "active:bg-[var(--accent-pressed,var(--accent))]" },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuCheckboxItem", role: "body", anchor: "data-[state=checked]:bg-accent/50" },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuRadioItem", role: "body", anchor: "focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4" },
  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenuSubTrigger", role: "body", anchor: "data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4" },
  { file: "src/ui/menubar.tsx", slot: "MenubarItem", role: "body", anchor: "data-[variant=destructive]:text-destructive" },
  { file: "src/ui/menubar.tsx", slot: "MenubarCheckboxItem/RadioItem", role: "body", anchor: "pl-8 text-body outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none", literals: 2, note: "CheckboxItem and RadioItem share one byte-identical recipe — two consumers, one entry. Anchor repaired in Issue 07e after the rewire removed the py-1.5 substring this anchor used to quote, and again in Issue 07f after pr-2 was rewired to pr-menu-item-padding-x — dropped the pr-2 substring entirely rather than repeat the failure mode a third time." },
  { file: "src/ui/menubar.tsx", slot: "MenubarSubTrigger", role: "body", anchor: "data-[inset]:pl-8 data-[state=open]:bg-accent" },
  { file: "src/ui/command.tsx", slot: "CommandInput", role: "body", anchor: "h-10 w-full rounded-md bg-transparent py-3 text-body outline-hidden placeholder:text-muted-foreground" },
  { file: "src/ui/command.tsx", slot: "CommandEmpty", role: "body", anchor: "py-6 text-center text-body" },
  { file: "src/ui/command.tsx", slot: "CommandItem", role: "body", anchor: "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground" },
  { file: "src/ui/combobox.tsx", slot: "Combobox item", role: "body", anchor: "data-highlighted:bg-accent data-highlighted:text-accent-foreground" },
  { file: "src/ui/combobox.tsx", slot: "Combobox empty", role: "body", anchor: "group-data-empty/combobox-content:flex" },
  { file: "src/ui/combobox.tsx", slot: "Combobox chips", role: "body", anchor: "min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input" },
  { file: "src/ui/navigation-menu.tsx", slot: "NavigationMenuLink", role: "body", anchor: "flex flex-col gap-1 rounded-sm p-2 text-body transition-all" },
  { file: "src/ui/form.tsx", slot: "FormDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/form.tsx", slot: "FormMessage", role: "body", anchor: "text-body text-destructive" },
  { file: "src/ui/field.tsx", slot: "FieldDescription", role: "body", anchor: "text-body text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance", note: "absorbed slot — text-sm leading-normal is 21px (14px × 1.5) → 20px, deliberate, same precedent as ItemDescription; leading-normal and font-normal both dropped." },
  { file: "src/ui/field.tsx", slot: "FieldSeparator", role: "body", anchor: "-my-2 h-5 text-body" },
  { file: "src/ui/field.tsx", slot: "FieldError", role: "body", anchor: "text-body text-destructive" },
  { file: "src/ui/input-group.tsx", slot: "InputGroupButton", role: "body", anchor: "gap-2 text-body shadow-none" },
  { file: "src/ui/input-group.tsx", slot: "InputGroupText", role: "body", anchor: "gap-2 text-body text-muted-foreground" },
  { file: "src/ui/input-otp.tsx", slot: "InputOTPSlot", role: "body", anchor: "border-input text-body shadow-xs" },
  { file: "src/ui/native-select.tsx", slot: "NativeSelect", role: "body", anchor: "pr-9 text-body shadow-xs" },
  { file: "src/ui/textarea.tsx", slot: "Textarea (md breakpoint)", role: "body", anchor: "md:text-body" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarGroupContent", role: "body", anchor: "w-full text-body" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarMenuButton base (cva)", role: "body", anchor: "text-left text-body ring-sidebar-ring" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarMenuSubButton (size=md)", role: "body", anchor: "text-body", exact: true, note: "Issue 06f: bare conditional literal (size===\"md\" && \"text-body\") is a strict substring of both SidebarGroupContent's and the menu-button cva base's literals — no substring anchor can isolate it. exact: true compares the whole literal instead, so the bare string addresses only itself." },
  { file: "src/ui/accordion.tsx", slot: "AccordionContent", role: "body", anchor: "overflow-hidden text-body data-[state=closed]:animate-accordion-up" },
  { file: "src/ui/alert-dialog.tsx", slot: "AlertDialogDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/drawer.tsx", slot: "DrawerDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/sheet.tsx", slot: "SheetDescription", role: "body", anchor: "text-body text-muted-foreground" },
  { file: "src/ui/popover.tsx", slot: "PopoverHeader", role: "body", anchor: "flex flex-col gap-1 text-body" },
  { file: "src/ui/table.tsx", slot: "TableCaption", role: "body", anchor: "mt-4 text-body text-muted-foreground" },
  { file: "src/ui/item.tsx", slot: "Item root (cva)", role: "body", anchor: "rounded-md border border-transparent text-body transition-colors duration-100" },
  { file: "src/ui/empty.tsx", slot: "EmptyContent", role: "body", anchor: "flex-col items-center gap-4 text-body text-balance" },
  { file: "src/ui/marker.tsx", slot: "Marker root (cva)", role: "body", anchor: "text-left text-body text-muted-foreground" },
  { file: "src/ui/message.tsx", slot: "Message root", role: "body", anchor: "w-full min-w-0 gap-2 text-body data-[align=end]:flex-row-reverse" },
  { file: "src/ui/bubble.tsx", slot: "BubbleReactions (cva)", role: "body", anchor: "rounded-full bg-muted px-1.5 py-0.5 text-body ring-3 ring-card" },
  { file: "src/ui/attachment.tsx", slot: "Attachment size=default (cva)", role: "body", anchor: "gap-2 text-body has-data-[slot=attachment-content]:px-2.5" },
  { file: "src/ui/avatar.tsx", slot: "AvatarFallback (base)", role: "body", anchor: "size-full items-center justify-center rounded-full bg-muted text-body" },
  { file: "src/ui/avatar.tsx", slot: "AvatarGroupCount", role: "body", anchor: "text-body text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10" },
  { file: "src/ui/calendar.tsx", slot: "Calendar caption_label (label layout)", role: "body", anchor: "text-body", exact: true, note: "Issue 06g: bare ternary branch (captionLayout===\"label\" ? \"text-body\" : ...) is a strict substring of the nav-layout branch's longer literal — exact: true isolates it, same technique as 06f." },
  { file: "src/ui/calendar.tsx", slot: "Calendar caption_label (nav layout)", role: "body", anchor: "pr-1 pl-2 text-body [&>svg]:size-3.5" },
  { file: "src/ui/rail-sidebar.tsx", slot: "Disabled leaf row", role: "body", anchor: "items-center gap-1.5 rounded-md px-2 py-2 text-body", note: "Issue 06h — see the QA finding at this element's site (divergence row L-13) for why py-2 was added; unrelated to this rewire." },
  { file: "src/ui/rail-sidebar.tsx", slot: "Leaf/group row (Button-recipe parity)", role: "body", anchor: "justify-start gap-1.5 rounded-md px-2 has-[>svg]:px-2 text-left text-body hover:bg-accent", literals: 2, note: "Issue 06h: the leaf row and the group-toggle row above it (see the QA finding at 977-1014) carry a byte-identical recipe on purpose — one entry, two consumers, same convention as context-menu.tsx's CheckboxItem/RadioItem." },
  { file: "src/ui/rail-sidebar.tsx", slot: "Panel search input (outer)", role: "body", anchor: "h-8 text-body" },
  { file: "src/ui/rail-sidebar.tsx", slot: "Panel search input (inputClassName)", role: "body", anchor: "text-body", exact: true, note: "Issue 06h decision 2: inputClassName is a prop reaching SearchInput's inner Input, not this element's own className — see the comment at this call site for why it deliberately overrides Input's own responsive text-body-lg md:text-body rather than being redundant or deleted. Bare literal, a strict substring of every other text-body literal in this file; exact: true isolates it, same technique as 06f." },

  { file: "src/ui/input.tsx", slot: "Input (base breakpoint)", role: "body-lg", anchor: "py-input-padding-y text-body-lg" },
  { file: "src/ui/field.tsx", slot: "FieldLegend (variant=legend)", role: "body-lg", anchor: "data-[variant=legend]:text-body-lg" },
  { file: "src/ui/textarea.tsx", slot: "Textarea (base breakpoint)", role: "body-lg", anchor: "px-3 py-2 text-body-lg" },
  { file: "src/ui/rail-sidebar.tsx", slot: "Panel title", role: "body-lg", anchor: "text-body-lg font-medium", note: "Issue 06h decision 1: 16px at weight 500 — no role is 16/24/500 (text-body-lg is weight 400), so this is the role plus a bare font-medium weight override, same pattern as empty.tsx's EmptyTitle." },

  { file: "src/ui/tooltip.tsx", slot: "TooltipContent", role: "caption", anchor: "bg-foreground px-3 py-1.5 text-caption" },
  { file: "src/ui/select.tsx", slot: "SelectLabel", role: "caption", anchor: "px-2 py-1.5 text-caption" },
  { file: "src/ui/badge.tsx", slot: "Badge regular", role: "caption", anchor: "text-caption" },
  { file: "src/ui/calendar.tsx", slot: "Calendar weekday", role: "caption", anchor: "flex-1 rounded-md text-caption", note: "absorbed slot — 12.8px → 12px line-height, deliberate." },
  { file: "src/ui/calendar.tsx", slot: "Calendar week number", role: "caption", anchor: "text-muted-foreground text-caption", note: "absorbed slot — 12.8px → 12px line-height, deliberate." },
  { file: "src/ui/combobox.tsx", slot: "Combobox group heading", role: "caption", anchor: "px-2 py-1.5 text-caption text-muted-foreground pointer-coarse:px-3", note: "condition-only pointer-coarse:text-sm variant is in scope per 05c and becomes pointer-coarse:text-body." },
  { file: "src/ui/sidebar.tsx", slot: "SidebarMenuButton (size=sm, cva)", role: "caption", anchor: "h-7 text-caption" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarMenuSubButton (size=sm)", role: "caption", anchor: "text-caption", exact: true, note: "Issue 06f: bare conditional literal (size===\"sm\" && \"text-caption\") is a strict substring of the cva sm-size variant's \"h-7 text-caption\" — no substring anchor can isolate it. exact: true compares the whole literal instead." },
  { file: "src/ui/attachment.tsx", slot: "Attachment size=sm (cva)", role: "caption", anchor: "gap-2.5 text-caption has-data-[slot=attachment-content]:px-2" },
  { file: "src/ui/attachment.tsx", slot: "Attachment size=xs (cva)", role: "caption", anchor: "rounded-lg text-caption has-data-[slot=attachment-content]:px-1.5" },
  { file: "src/ui/attachment.tsx", slot: "AttachmentDescription", role: "caption", anchor: "mt-0.5 block min-w-0 truncate text-caption text-muted-foreground" },
  { file: "src/ui/avatar.tsx", slot: "AvatarFallback (group-data-[size=sm] conditional)", role: "caption", anchor: "group-data-[size=sm]/avatar:text-caption", note: "Issue 06g decision 2: the condition-only group-data-[size=sm]/avatar:text-xs variant on the same literal as the body-role base is in scope and becomes its own verified role, not just a note — unlike the combobox precedent, which documents the conditional in a note without a second Link A/B entry." },
  { file: "src/ui/chart.tsx", slot: "ChartContainer", role: "caption", anchor: "aspect-video justify-center text-caption" },
  { file: "src/ui/chart.tsx", slot: "ChartTooltipContent", role: "caption", anchor: "px-2.5 py-1.5 text-caption shadow-xl" },
  { file: "src/ui/rail-sidebar.tsx", slot: "Panel subtitle", role: "caption", anchor: "line-clamp-3 pl-[22px] text-caption text-muted-foreground" },
  { file: "src/ui/rail-sidebar.tsx", slot: "Panel search empty state", role: "caption", anchor: "px-2 py-3 text-caption text-muted-foreground" },

  { file: "src/ui/kbd.tsx", slot: "Kbd", role: "control-sm", anchor: "text-control-sm text-muted-foreground" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarGroupLabel", role: "control-sm", anchor: "px-2 text-control-sm text-sidebar-foreground/70" },
  { file: "src/ui/sidebar.tsx", slot: "SidebarMenuBadge", role: "control-sm", anchor: "text-control-sm text-sidebar-foreground tabular-nums", note: "text-xs font-medium collapses to text-control-sm; font-medium dropped, tabular-nums kept." },
  { file: "src/ui/message.tsx", slot: "MessageHeader", role: "control-sm", anchor: "flex max-w-full min-w-0 items-center px-3 text-control-sm text-muted-foreground group-has-data-[variant=ghost]/message:px-0", exact: true, note: "Issue 06g decision 1: renamed from \"Message author\" — the data-slot is literally message-header, there is no message-author element. Rewiring MessageFooter (line 77) made this entry's old substring anchor (\"px-3 text-control-sm text-muted-foreground\") ambiguous, since MessageHeader's full literal is itself a strict prefix of MessageFooter's new literal (Footer = Header + \" group-data-[align=end]/message:justify-end\"). exact: true over the full literal isolates Header again; this is not a false pass — the entry always correctly matched MessageHeader, which already shipped text-control-sm with no weight utility." },
  { file: "src/ui/message.tsx", slot: "MessageFooter", role: "control-sm", anchor: "group-data-[align=end]/message:justify-end", note: "Issue 06g decision 1: a genuinely distinct, previously-unverified slot — shipped text-xs font-medium (collapses to text-control-sm; font-medium dropped) until this rewire, separate from MessageHeader above." },
  { file: "src/ui/combobox.tsx", slot: "Combobox chip", role: "control-sm", anchor: "bg-muted px-1.5 text-control-sm" },
  { file: "src/ui/badge.tsx", slot: "Badge emphasis", role: "control-sm", anchor: "text-control-sm" },
  { file: "src/ui/button.tsx", slot: "Button size=xs (cva)", role: "control-sm", anchor: "rounded-md px-button-padding-x-xs text-control-sm", note: "Issue 06g: base cva already supplies text-control unconditionally; size=xs previously overrode only the raw text-xs size utility, relying on the base's weight/tracking to still cascade. Replacing it with text-control-sm makes the recipe self-contained. Issue 07c/07d: anchor updated across two density rewires — first from the raw \"h-6 gap-1 rounded-md px-2\" substring to the now-retired control-padding-x-xs token, then to button-padding-x-xs when 07d split density into primitives and per-component semantics — the role check below is unaffected, only the source anchor moved." },

  { file: "src/ui/dropdown-menu.tsx", slot: "DropdownMenu shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/context-menu.tsx", slot: "ContextMenu shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/menubar.tsx", slot: "Menubar shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },
  { file: "src/ui/command.tsx", slot: "Command shortcut", role: "shortcut", anchor: "ml-auto text-shortcut" },

  { file: "src/ui/label.tsx", slot: "Label", role: "label", anchor: "flex items-center gap-2 text-label" },
  { file: "src/ui/item.tsx", slot: "ItemTitle", role: "label", anchor: "flex w-fit items-center gap-2 text-label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },
  { file: "src/ui/field.tsx", slot: "FieldTitle", role: "label", anchor: "flex w-fit items-center gap-2 text-label", note: "absorbed slot — 19.25px → 14px line-height, deliberate." },

  { file: "src/ui/dialog.tsx", slot: "DialogTitle", role: "heading-sm", anchor: "text-heading-sm" },

  { file: "src/ui/alert-dialog.tsx", slot: "AlertDialogTitle", role: "heading-sm-loose", anchor: "text-heading-sm-loose sm:group-data-[size=default]" },
  { file: "src/ui/empty.tsx", slot: "EmptyTitle", role: "heading-sm-loose", anchor: "text-heading-sm-loose font-medium" },
]

// Expected compiled values, keyed by role — the literal table from Issue 05b's spec.
// Roles NOT listed here (display, heading-lg, heading, body-strong, eyebrow, metric,
// metric-sm, code) have no consumer in src/ui, so Tailwind v4's source-scanning emitter
// never generates their utility class — @theme declares the custom properties regardless,
// but `.text-<role>{…}` only exists in dist/system.css if some source file's class string
// actually asked for it. A role missing from the build because nothing consumes it is
// expected, not a failure; it is why Link B only runs for roles that appear below.
const EXPECTED = {
  control: { fontSize: "14px", lineHeight: "20px", fontWeight: "500", letterSpacing: "0em" },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: "400", letterSpacing: "0em" },
  "body-lg": { fontSize: "16px", lineHeight: "24px", fontWeight: "400", letterSpacing: "0em" },
  caption: { fontSize: "12px", lineHeight: "16px", fontWeight: "400", letterSpacing: "0em" },
  "control-sm": { fontSize: "12px", lineHeight: "16px", fontWeight: "500", letterSpacing: "0em" },
  shortcut: { fontSize: "12px", lineHeight: "16px", fontWeight: "400", letterSpacing: "0.1em" },
  label: { fontSize: "14px", lineHeight: "14px", fontWeight: "500", letterSpacing: "0em" },
  "heading-sm": { fontSize: "18px", lineHeight: "18px", fontWeight: "600", letterSpacing: "0em" },
  "heading-sm-loose": { fontSize: "18px", lineHeight: "28px", fontWeight: "600", letterSpacing: "0em" },
}

// ── Link A ──────────────────────────────────────────────────────────────────────────
// A word-boundary match on "text-<role>" alone would let role="control" match inside the
// literal "text-control-sm" (there IS a \b between "control" and the following "-", since
// letter/hyphen is itself a word/non-word transition). The (?!-) guard refuses that: it
// only matches when the role name is not immediately followed by another hyphenated
// segment, so "control" cannot claim a hit that belongs to "control-sm", and "heading-sm"
// cannot claim one that belongs to "heading-sm-loose".
function roleRegex(role) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\btext-${escaped}(?!-)\\b`)
}

// ── Element-targeting vs condition-only variants ───────────────────────────────────
// Issue 06h: this used to be defined here only. R6 (scripts/check-rules.mjs) tested raw
// class strings with no variant-scoping at all, so the same literal (input.tsx's
// `file:text-sm`) was legal to this check and a violation to that one. Both checks now
// import one shared answer from scripts/lib/variant-scope.mjs — see its header for the
// element-targeting-vs-condition-only distinction itself; this file no longer keeps a
// private copy.
import { stripElementTargeting } from "./lib/variant-scope.mjs"

async function checkLinkA(entry) {
  const abs = join(REPO_ROOT, entry.file)
  const raw = await readFile(abs, "utf8").catch(() => null)
  if (raw === null) return { ok: false, detail: `file not found: ${entry.file}` }
  const source = stripComments(raw)
  const re = roleRegex(entry.role)
  const expectedCount = entry.literals ?? 1

  // Every literal in the file that carries BOTH the role utility and this slot's own
  // anchor. Zero means the anchor doesn't identify this slot's literal (wrong anchor, or
  // the rewire never happened); more than expected means the anchor is ambiguous — a
  // check that silently used the first match regardless is exactly the bug this file
  // exists to fix (Issue 06a: the Calendar weekday entry matched the ALREADY-rewired
  // weekday cell while the actually-unrewired week_number cell, the one the "absorbed
  // slot" note was written about, went unchecked). An ambiguous anchor must fail loudly,
  // not silently pick one.
  //
  // `literals` (default 1) exists for exactly one case: several elements sharing one
  // BYTE-IDENTICAL class string, one real recipe with several consumers (Issue 06b:
  // context-menu.tsx's CheckboxItem/RadioItem, menubar.tsx's same pair). The count is
  // EXACT, not a floor — "at least N" would let a slot silently grow a third consumer
  // that was never read against this table, and report PASS on two literals while a
  // new, unexamined third one ships untouched. Every one of the `literals` matches is
  // scanned; a violation in any of them fails the whole entry, and every line number is
  // reported. `checkTableIntegrity` below enforces that the matched literals really are
  // byte-identical — `literals` is never a substitute for "an anchor I could not make
  // unique"; that case is what `exact` (below) is for, or a more distinctive substring.
  //
  // `exact: true` compares the WHOLE literal against the anchor (`cls === entry.anchor`)
  // instead of substring-containment. Issue 06f: a bare literal like a lone `"text-body"`
  // conditional is a strict substring of every longer literal that also mentions the
  // role, so no substring anchor can isolate it — folding it into a `literals`-counted
  // entry with the containing literals was cheap but wrong: it turned the anchor into
  // "every literal in this file that mentions this role" instead of one identified slot,
  // which is exactly what anchors were introduced in 06a to stop being. `exact` addresses
  // the bare literal as itself; it still fails loudly if a second literal is ever
  // byte-identical to it, same as any other anchor collision.
  const matches = []
  for (const { value: cls, index, truncated } of classLiterals(source)) {
    if (truncated) {
      // Not silently consumed as a partial value — see lexical-scan.mjs's cap
      // comment. No literal in src/ui/ is anywhere near 2000 characters, so this is
      // expected to never fire; if it does, this entry must fail rather than risk
      // matching (or missing a forbidden utility in) a value it never fully read.
      return { ok: false, detail: `${entry.file}: a literal exceeds the ${cls.length}+ char cap and was truncated before it could be fully checked — see lexical-scan.mjs` }
    }
    const anchorHit = entry.exact ? cls === entry.anchor : cls.includes(entry.anchor)
    if (re.test(cls) && anchorHit) matches.push({ cls, index })
  }

  if (matches.length === 0) {
    return { ok: false, detail: `no literal in ${entry.file} contains both text-${entry.role} and the anchor "${entry.anchor}"` }
  }
  if (matches.length !== expectedCount) {
    return {
      ok: false,
      detail: `the anchor "${entry.anchor}" matches ${matches.length} literal(s) in ${entry.file}; entry declares literals: ${expectedCount}`,
    }
  }

  const lines = matches.map((m) => lineOf(source, m.index))
  for (const { cls, index } of matches) {
    const scoped = stripElementTargeting(cls)
    const forbidden =
      FONT_SIZE_RE.test(scoped) || FONT_SIZE_ARBITRARY_RE.test(scoped) || LEADING_RE.test(scoped) || TRACKING_RE.test(scoped)
    if (forbidden) {
      return { ok: false, detail: `${entry.file}:${lineOf(source, index)} carries a forbidden utility alongside text-${entry.role}: "${cls.slice(0, 120)}"` }
    }
  }
  return { ok: true, detail: `${entry.file}:${lines.join(",")}  "${matches[0].cls.slice(0, 120)}"` }
}

// ── Table integrity ─────────────────────────────────────────────────────────────────
// Checked once, before the per-slot loop, and reported in its own section. An anchor
// that collides with another entry's anchor in the same file is exactly the ambiguity
// checkLinkA above refuses to resolve silently — catching it here, against the table
// itself, is cheaper than waiting for checkLinkA to fail per-slot and gives one place
// that states the whole table's anchors are pairwise distinct.
async function checkTableIntegrity(table) {
  const problems = []

  for (const entry of table) {
    if (!entry.anchor || entry.anchor.trim() === "") {
      problems.push(`${entry.file} — ${entry.slot}: missing anchor`)
    }
  }

  const byFile = new Map()
  for (const entry of table) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, [])
    byFile.get(entry.file).push(entry)
  }

  for (const [file, entries] of byFile) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (entries[i].anchor && entries[i].anchor === entries[j].anchor) {
          problems.push(`${file}: "${entries[i].slot}" and "${entries[j].slot}" share the anchor "${entries[i].anchor}"`)
        }
      }
    }
  }

  // `literals` is for exactly one case — several elements sharing one byte-identical
  // class string — never for "an anchor I couldn't make unique" (that's what `exact`
  // above is for, or a better substring). This check makes the distinction enforced
  // rather than a convention: for any entry declaring literals > 1, every literal the
  // anchor matches must be byte-identical to the first. If they are not, the entry is
  // masking distinct slots behind one row (exactly the Issue 06f abuse: two elements
  // that merely share a substring, folded into one count so a swap between them would
  // still pass) and it fails here, naming the differing literals, before checkLinkA
  // ever gets to it.
  const literalsProblems = []
  const byteIdentical = new Map()
  for (const entry of table) {
    const expectedCount = entry.literals ?? 1
    if (expectedCount <= 1) continue
    const abs = join(REPO_ROOT, entry.file)
    const raw = await readFile(abs, "utf8").catch(() => null)
    if (raw === null) continue // checkLinkA reports the missing file; don't duplicate here
    const source = stripComments(raw)
    const re = roleRegex(entry.role)
    const found = []
    for (const { value: cls, truncated } of classLiterals(source)) {
      if (truncated) continue // checkLinkA reports the truncation failure; don't duplicate here
      const anchorHit = entry.exact ? cls === entry.anchor : cls.includes(entry.anchor)
      if (re.test(cls) && anchorHit) found.push(cls)
    }
    if (found.length < 2) continue // checkLinkA reports the count mismatch; nothing to compare here
    const distinct = [...new Set(found)]
    byteIdentical.set(entry, { found, distinct })
    if (distinct.length > 1) {
      literalsProblems.push(
        `${entry.file} — ${entry.slot}: literals: ${expectedCount} declares a shared recipe, but ${distinct.length} distinct literal(s) matched: ${distinct.map((d) => `"${d.slice(0, 120)}"`).join(" / ")}`,
      )
    }
  }
  problems.push(...literalsProblems)

  // Same-role entries in the same file are the exact condition that produced the
  // Calendar weekday false pass, and issue 06 is about to make it common (several
  // slots on text-body in one menu file) — called out separately even though it is
  // already covered by the no-duplicate-anchor-per-file check above.
  const byFileRole = new Map()
  for (const entry of table) {
    const key = `${entry.file}::${entry.role}`
    if (!byFileRole.has(key)) byFileRole.set(key, [])
    byFileRole.get(key).push(entry)
  }
  const sameFileRole = [...byFileRole.entries()].filter(([, entries]) => entries.length > 1)

  return { problems, sameFileRole, byteIdentical }
}

// ── Link B ──────────────────────────────────────────────────────────────────────────
// Pull the .text-<role>{…} rule body out of the (minified, single-line) shipped
// stylesheet, then resolve each of its four properties to the custom property it
// references and that property's declared value. Properties are located by name inside
// the rule body, not by position — Tailwind's own emit order is not a contract this
// script should depend on.
function extractRuleBody(css, role) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = css.match(new RegExp(`\\.text-${escaped}\\{([^}]*)\\}`))
  return m ? m[1] : null
}

function resolveVar(css, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = css.match(new RegExp(`${escaped}:([^;}]+)[;}]`))
  return m ? m[1].trim() : null
}

// CSS minifiers drop a leading zero ("0.1em" → ".1em") and this repo's own build does
// exactly that (confirmed against the real dist/system.css). Compared numerically so that
// is not mistaken for a value mismatch — the literal expectation stays "0.1em" per the
// issue's own table; only the comparison normalises. Parses via parseFloat rather than
// stripping the dot by hand — a hand-rolled "drop the leading zero" regex was tried first
// and silently mismatched ".1em" against "0.1em" (parseFloat(".1") === parseFloat("0.1")
// is true; a string-shaped regex missed that), so the fix is to compare numbers, not text.
function sameCssNumber(a, b) {
  const parse = (v) => {
    const m = String(v)
      .trim()
      .match(/^(-?[\d.]+)([a-z%]*)$/i)
    if (!m) return null
    return { num: parseFloat(m[1]), unit: m[2] }
  }
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return String(a).trim() === String(b).trim()
  return pa.num === pb.num && pa.unit === pb.unit
}

function checkLinkB(css, role) {
  const expected = EXPECTED[role]
  const body = extractRuleBody(css, role)
  if (!body) return { ok: false, detail: `.text-${role}{…} not found in dist/system.css` }

  const props = [
    { key: "fontSize", cssProp: "font-size", varRe: /font-size:var\((--type-[a-z0-9-]+-font-size)\)/ },
    {
      key: "lineHeight",
      cssProp: "line-height",
      varRe: /line-height:var\(--tw-leading,var\((--type-[a-z0-9-]+-line-height)\)\)/,
    },
    {
      key: "letterSpacing",
      cssProp: "letter-spacing",
      varRe: /letter-spacing:var\(--tw-tracking,var\((--type-[a-z0-9-]+-letter-spacing)\)\)/,
    },
    {
      key: "fontWeight",
      cssProp: "font-weight",
      varRe: /font-weight:var\(--tw-font-weight,var\((--type-[a-z0-9-]+-font-weight)\)\)/,
    },
  ]

  const mismatches = []
  for (const p of props) {
    const varMatch = body.match(p.varRe)
    if (!varMatch) {
      mismatches.push(`${p.cssProp}: no var(--type-${role}-${p.cssProp}) reference found in the compiled rule`)
      continue
    }
    const value = resolveVar(css, varMatch[1])
    if (value === null) {
      mismatches.push(`${p.cssProp}: ${varMatch[1]} is referenced but never declared in dist/system.css`)
      continue
    }
    if (!sameCssNumber(value, expected[p.key])) {
      mismatches.push(`${p.cssProp}: expected ${expected[p.key]}, compiled value is ${value}`)
    }
  }

  if (mismatches.length) return { ok: false, detail: mismatches.join("; ") }
  return {
    ok: true,
    detail: `font-size ${expected.fontSize} / line-height ${expected.lineHeight} / font-weight ${expected.fontWeight} / letter-spacing ${expected.letterSpacing}`,
  }
}

// ── the leading-axis slot table (Issue 07b) ────────────────────────────────────────
// SLOT_TABLE/EXPECTED/checkLinkA/checkLinkB above prove a ROLE: one utility that sets
// four properties, traced through the four-property EXPECTED table. The leading-*
// axis (tokens/base.tokens.json) is not that — each token sets exactly one CSS
// property (line-height) for an element whose size is inherited, so a role can't name
// it (every role sets its own size). Extending EXPECTED with three blank properties
// per entry would weaken Link B's four-property assertion for every role sharing this
// file, which the issue that added this axis explicitly ruled out. This is the
// smaller change instead: a second, one-property table with its own two links, same
// shape as Link A/Link B, never touching SLOT_TABLE, EXPECTED, checkLinkA or
// checkLinkB.
//
// Six of the eight slots below carry ONLY a leading-* token — no role, because the
// element's size still comes from its parent and was never claimed by a role.
// EmptyDescription and BubbleContent are the two that pair a role (`role: "body"`)
// with a leading-* override, the same role-plus-override shape rail-sidebar's Panel
// title already uses for a weight override (SLOT_TABLE's own comment on Link A notes
// font-weight isn't even in the forbidden-utility list for that reason). Where `role`
// is set, Link A2 requires BOTH the role utility and the leading-* utility in the same
// literal; text-body's own four properties are already proven by SLOT_TABLE/EXPECTED
// (see the "body" role entries above) — Link A2/B2 exist to prove the ONE property
// this axis owns, not to re-prove the role.
const LEADING_EXPECTED = {
  flush: "1",
  grouped: "1.25",
  clustered: "1.375",
  prose: "1.625",
}

const LEADING_SLOT_TABLE = [
  { file: "src/ui/card.tsx", slot: "CardTitle", leading: "flush", anchor: "leading-flush font-semibold" },
  { file: "src/ui/attachment.tsx", slot: "AttachmentContent", leading: "grouped", anchor: "flex-1 leading-grouped" },
  { file: "src/ui/field.tsx", slot: "FieldContent", leading: "clustered", anchor: "gap-1.5 leading-clustered" },
  { file: "src/ui/field.tsx", slot: "FieldLabel", leading: "clustered", anchor: "gap-2 leading-clustered" },
  { file: "src/ui/chart.tsx", slot: "ChartTooltipContent row", leading: "flush", anchor: "justify-between leading-flush" },
  { file: "src/ui/calendar.tsx", slot: "CalendarDayButton", leading: "flush", anchor: "gap-1 leading-flush font-normal" },
  { file: "src/ui/empty.tsx", slot: "EmptyDescription", leading: "prose", role: "body", anchor: "text-body leading-prose text-muted-foreground" },
  { file: "src/ui/bubble.tsx", slot: "BubbleContent", leading: "prose", role: "body", anchor: "text-body leading-prose wrap-break-word" },
]

function leadingRegex(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\bleading-${escaped}\\b`)
}

async function checkLinkA2(entry) {
  const abs = join(REPO_ROOT, entry.file)
  const raw = await readFile(abs, "utf8").catch(() => null)
  if (raw === null) return { ok: false, detail: `file not found: ${entry.file}` }
  const source = stripComments(raw)
  const re = leadingRegex(entry.leading)
  const roleRe = entry.role ? roleRegex(entry.role) : null

  const matches = []
  for (const { value: cls, index, truncated } of classLiterals(source)) {
    if (truncated) {
      return { ok: false, detail: `${entry.file}: a literal exceeds the ${cls.length}+ char cap and was truncated before it could be fully checked — see lexical-scan.mjs` }
    }
    if (!cls.includes(entry.anchor)) continue
    if (!re.test(cls)) continue
    if (roleRe && !roleRe.test(cls)) continue
    matches.push({ cls, index })
  }

  if (matches.length === 0) {
    return {
      ok: false,
      detail: entry.role
        ? `no literal in ${entry.file} contains both text-${entry.role} and leading-${entry.leading} alongside the anchor "${entry.anchor}"`
        : `no literal in ${entry.file} contains both leading-${entry.leading} and the anchor "${entry.anchor}"`,
    }
  }
  if (matches.length > 1) {
    return { ok: false, detail: `the anchor "${entry.anchor}" matches ${matches.length} literals in ${entry.file}; anchor is ambiguous` }
  }

  const { cls, index } = matches[0]
  return { ok: true, detail: `${entry.file}:${lineOf(source, index)}  "${cls.slice(0, 120)}"` }
}

function checkLinkB2(css, leading) {
  const expected = LEADING_EXPECTED[leading]
  const escapedName = leading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const body = css.match(new RegExp(`\\.leading-${escapedName}\\{([^}]*)\\}`))?.[1]
  if (!body) return { ok: false, detail: `.leading-${leading}{…} not found in dist/system.css` }

  const varMatch = body.match(/line-height:var\((--leading-[a-z0-9-]+)\)/)
  if (!varMatch) return { ok: false, detail: `no var(--leading-${leading}) reference found in the compiled rule: ${body}` }

  // The token's own custom property is declared twice in dist/system.css: once inside
  // @theme's self-referencing mapping (`--leading-flush: var(--leading-flush);`, the
  // same radius-sm precedent noted in system.css — a marker telling Tailwind the
  // namespace key exists, not a real value) and once as the literal DTCG value
  // (`--leading-flush: 1;`) carried in unlayered from tokens.css. Unlayered beats
  // layered regardless of source order, so the literal is what a browser resolves —
  // but resolveVar's plain first-match would find the self-referencing one first and
  // report a token resolving to itself. Skip any declaration whose value is itself a
  // var() reference and take the first literal one, exactly the value a browser uses.
  const declRe = new RegExp(`${varMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:([^;}]+)[;}]`, "g")
  let value = null
  let m
  while ((m = declRe.exec(css))) {
    const v = m[1].trim()
    if (!v.startsWith("var(")) {
      value = v
      break
    }
  }
  if (value === null) return { ok: false, detail: `${varMatch[1]} is referenced but never resolves to a literal value in dist/system.css` }
  if (!sameCssNumber(value, expected)) return { ok: false, detail: `line-height: expected ${expected}, compiled value is ${value}` }
  return { ok: true, detail: `line-height ${expected} (unitless, via var(${varMatch[1]}))` }
}

// ── the density slot table (Issue 07c, renamed by Issue 07d) ───────────────────────
// Neither the role table above nor the leading-axis table fits this axis. A role is
// one utility setting four properties; leading-* is one token setting one property.
// Density is neither: each rewired slot mixes several DIFFERENT CSS properties
// (height, padding-inline, padding-block), each traced to its OWN token, and one
// height token (`control-height-*`) is consumed by two different Tailwind utility
// namespaces at once — `h-<name>` on a control with content, `size-<name>` on an
// icon-only one, both compiling to the same custom property. So a slot here is a
// small list of (utility, token) pairs, not a fixed four-property shape — extending
// EXPECTED/SLOT_TABLE would force every role's four-property check to grow columns
// it doesn't have, and reusing LEADING_SLOT_TABLE's one-token-one-property shape
// would silently drop everything but one of a slot's several properties. A third,
// small parallel table with its own two links, same as 07b did for leading-*.
//
// Only button.tsx and input.tsx are rewired this issue (Issue 07c scope), so this
// table proves exactly those two files' slots — one entry per CVA size variant plus
// one for Input, never a role, since none of these elements' sizes were ever claimed
// by a role in the first place (that is the whole reason this axis exists).
//
// Issue 07d split the padding tokens into two layers: padding-{4,6,8,10,12,16}
// primitives (named for their value, consumed by nothing outside tokens/base.
// tokens.json) and button-padding-*/input-padding-* semantics (named for the job,
// the only thing a class string ever spells). This table only ever checks semantic
// names — a primitive has no utility mapping of its own to check (see system.css's
// Issue 07d comment) — so DENSITY_EXPECTED below still keys by the name a class
// string actually uses; only the names themselves changed, not the shape of the
// check. control-height-* is untouched from 07c.
//
// Issue 07e added three more semantics from rewiring badge/toggle/kbd and
// dropdown-menu/context-menu/menubar — menu-item-padding-y (shared, multi-file),
// toggle-padding-x-lg and kbd-padding-x — and no new primitive.
//
// Issue 07f removed the per-primitive numeric cap 07e had imposed and
// re-adjudicated the four padding-8 slots it had blocked, on the description
// test alone. One survives: menu-item-padding-x, the menu row's own
// horizontal counterpart to menu-item-padding-y, wired to menubar.tsx only
// this commit (dropdown-menu.tsx/context-menu.tsx are out of this issue's
// file scope, though they share the same job). badge.tsx's own px-2,
// toggle.tsx default's own px-2 and menubar.tsx's own MenubarTrigger px-2
// stay raw — each is a distinct job but single-consumer, so no semantic was
// authored for any of them.
const DENSITY_EXPECTED = {
  "control-height-xs": "1.5rem",
  "control-height-sm": "2rem",
  "control-height-default": "2.25rem",
  "control-height-lg": "2.5rem",
  "button-padding-x-icon-xs": ".375rem",
  "button-padding-x-xs": ".5rem",
  "button-padding-x-icon-sm": ".625rem",
  "button-padding-x-sm": ".75rem",
  "button-padding-x-default": "1rem",
  "button-padding-y-default": ".5rem",
  "input-padding-x": ".75rem",
  "input-padding-y": ".25rem",
  "menu-item-padding-y": ".375rem",
  "toggle-padding-x-lg": ".625rem",
  "kbd-padding-x": ".25rem",
  "menu-item-padding-x": ".5rem",
}

const DENSITY_SLOT_TABLE = [
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="default"',
    anchor: "button-padding-y-default",
    props: [
      { util: "h", token: "control-height-default" },
      { util: "px", token: "button-padding-x-default" },
      { util: "py", token: "button-padding-y-default" },
      { util: "px", token: "button-padding-x-sm", compound: true },
    ],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="xs"',
    anchor: "text-control-sm",
    props: [
      { util: "h", token: "control-height-xs" },
      { util: "px", token: "button-padding-x-xs" },
      { util: "px", token: "button-padding-x-icon-xs", compound: true },
    ],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="sm"',
    anchor: "gap-1.5 rounded-md",
    props: [
      { util: "h", token: "control-height-sm" },
      { util: "px", token: "button-padding-x-sm" },
      { util: "px", token: "button-padding-x-icon-sm", compound: true },
    ],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="lg"',
    anchor: "rounded-md px-6",
    props: [
      { util: "h", token: "control-height-lg" },
      { util: "px", token: "button-padding-x-default", compound: true },
    ],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="icon"',
    anchor: "size-control-height-default",
    exact: true,
    props: [{ util: "size", token: "control-height-default" }],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="icon-xs"',
    anchor: "size-control-height-xs rounded-md",
    props: [{ util: "size", token: "control-height-xs" }],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="icon-sm"',
    anchor: "size-control-height-sm",
    exact: true,
    props: [{ util: "size", token: "control-height-sm" }],
  },
  {
    file: "src/ui/button.tsx",
    slot: 'Button size="icon-lg"',
    anchor: "size-control-height-lg",
    exact: true,
    props: [{ util: "size", token: "control-height-lg" }],
  },
  {
    file: "src/ui/input.tsx",
    slot: "Input",
    anchor: "input-padding-y",
    props: [
      { util: "h", token: "control-height-default" },
      { util: "px", token: "input-padding-x" },
      { util: "py", token: "input-padding-y" },
    ],
  },
  // Issue 07e — toggle.tsx: heights are Finding 1 (control-height-* ladder,
  // already job-named). lg's own padding is Finding 2 (toggle-padding-x-lg,
  // a genuine second job on padding-10). default/sm's own padding stays raw
  // — both landed on primitives already at their two-semantic cap.
  {
    file: "src/ui/toggle.tsx",
    slot: 'Toggle size="default"',
    anchor: "h-control-height-default",
    props: [
      { util: "h", token: "control-height-default" },
      { util: "min-w", token: "control-height-default" },
    ],
  },
  {
    file: "src/ui/toggle.tsx",
    slot: 'Toggle size="sm"',
    anchor: "h-control-height-sm",
    props: [
      { util: "h", token: "control-height-sm" },
      { util: "min-w", token: "control-height-sm" },
    ],
  },
  {
    file: "src/ui/toggle.tsx",
    slot: 'Toggle size="lg"',
    anchor: "h-control-height-lg",
    props: [
      { util: "h", token: "control-height-lg" },
      { util: "min-w", token: "control-height-lg" },
      { util: "px", token: "toggle-padding-x-lg" },
    ],
  },
  // Issue 07e — kbd.tsx: px-1 is Finding 2 (kbd-padding-x, a horizontal job
  // distinct from input-padding-y's vertical one). h-5/min-w-5 (20px) stay
  // raw — no ladder rung matches, single consumer.
  {
    file: "src/ui/kbd.tsx",
    slot: "Kbd",
    anchor: "text-control-sm",
    props: [{ util: "px", token: "kbd-padding-x" }],
  },
  // Issue 07e — menubar.tsx: root height is Finding 1 (control-height-
  // default). Item/Label/SubTrigger's own vertical padding is Finding 1
  // against menu-item-padding-y, shared identically with dropdown-menu.tsx
  // and context-menu.tsx's own Item/Label/SubTrigger. CheckboxItem and
  // RadioItem are rewired in source too but share one byte-identical
  // literal each with the other, so no anchor can distinguish them for
  // this table — see the file's own comment; proven only via Item/Label/
  // SubTrigger, which is enough to prove the shared token compiles.
  {
    file: "src/ui/menubar.tsx",
    slot: "Menubar root",
    anchor: "border bg-background",
    props: [{ util: "h", token: "control-height-default" }],
  },
  {
    file: "src/ui/menubar.tsx",
    slot: "MenubarItem",
    anchor: "dark:data-[variant=destructive]:focus:bg-destructive/20",
    props: [
      { util: "py", token: "menu-item-padding-y" },
      { util: "px", token: "menu-item-padding-x" },
    ],
  },
  {
    file: "src/ui/menubar.tsx",
    slot: "MenubarLabel",
    anchor: "text-control data-[inset]:pl-8",
    props: [
      { util: "py", token: "menu-item-padding-y" },
      { util: "px", token: "menu-item-padding-x" },
    ],
  },
  {
    file: "src/ui/menubar.tsx",
    slot: "MenubarSubTrigger",
    anchor: "outline-none",
    props: [
      { util: "py", token: "menu-item-padding-y" },
      { util: "px", token: "menu-item-padding-x" },
    ],
  },
  // Issue 07e — dropdown-menu.tsx: Item/CheckboxItem/RadioItem/Label/
  // SubTrigger's own vertical padding is Finding 1 against menu-item-
  // padding-y, shared identically with context-menu.tsx and menubar.tsx's
  // own equivalents.
  {
    file: "src/ui/dropdown-menu.tsx",
    slot: "DropdownMenuItem",
    anchor: "data-[active=true]:font-medium",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/dropdown-menu.tsx",
    slot: "DropdownMenuCheckboxItem",
    anchor: "data-[state=checked]:bg-accent/50",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/dropdown-menu.tsx",
    slot: "DropdownMenuRadioItem",
    anchor: "focus:text-accent-foreground data-[disabled]:pointer-events-none",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/dropdown-menu.tsx",
    slot: "DropdownMenuLabel",
    anchor: "text-control data-[inset]:pl-8",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/dropdown-menu.tsx",
    slot: "DropdownMenuSubTrigger",
    anchor: "dm-subicon-fg",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  // Issue 07e — context-menu.tsx: Item/Label/SubTrigger's own vertical
  // padding is Finding 1 against menu-item-padding-y. CheckboxItem and
  // RadioItem are rewired in source too but share one byte-identical
  // literal each with the other — same mechanism limitation as menubar.tsx,
  // not proven individually here.
  {
    file: "src/ui/context-menu.tsx",
    slot: "ContextMenuSubTrigger",
    anchor: "data-[state=open]:bg-accent",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/context-menu.tsx",
    slot: "ContextMenuItem",
    anchor: "dark:data-[variant=destructive]:focus:bg-destructive/20",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
  {
    file: "src/ui/context-menu.tsx",
    slot: "ContextMenuLabel",
    anchor: "text-control text-foreground",
    props: [{ util: "py", token: "menu-item-padding-y" }],
  },
]

function densityClass(prop) {
  return `${prop.compound ? "has-[>svg]:" : ""}${prop.util}-${prop.token}`
}

async function checkLinkA3(entry) {
  const abs = join(REPO_ROOT, entry.file)
  const raw = await readFile(abs, "utf8").catch(() => null)
  if (raw === null) return { ok: false, detail: `file not found: ${entry.file}` }
  const source = stripComments(raw)

  const matches = []
  for (const { value: cls, index, truncated } of classLiterals(source)) {
    if (truncated) {
      return { ok: false, detail: `${entry.file}: a literal exceeds the ${cls.length}+ char cap and was truncated before it could be fully checked — see lexical-scan.mjs` }
    }
    const anchorHit = entry.exact ? cls === entry.anchor : cls.includes(entry.anchor)
    if (!anchorHit) continue
    matches.push({ cls, index })
  }

  if (matches.length === 0) {
    return { ok: false, detail: `no literal in ${entry.file} contains the anchor "${entry.anchor}"` }
  }
  if (matches.length > 1) {
    return { ok: false, detail: `the anchor "${entry.anchor}" matches ${matches.length} literals in ${entry.file}; anchor is ambiguous` }
  }

  const { cls, index } = matches[0]
  const missing = entry.props.map(densityClass).filter((c) => !cls.includes(c))
  if (missing.length > 0) {
    return { ok: false, detail: `literal at ${entry.file}:${lineOf(source, index)} is missing: ${missing.join(", ")}` }
  }
  return { ok: true, detail: `${entry.file}:${lineOf(source, index)}  "${cls.slice(0, 140)}"` }
}

// Same skip-to-literal reasoning as checkLinkB2: the token's custom property is
// declared twice (the @theme self-reference marker, and the literal DTCG value
// carried in unlayered from tokens.css); unlayered wins regardless of source order,
// so the first declaration whose value is not itself a var() is what a browser uses.
function resolveDensityVar(css, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const declRe = new RegExp(`${escaped}:([^;}]+)[;}]`, "g")
  let value = null
  let m
  while ((m = declRe.exec(css))) {
    const v = m[1].trim()
    if (!v.startsWith("var(")) {
      value = v
      break
    }
  }
  return value
}

function checkLinkB3(css, prop) {
  const expected = DENSITY_EXPECTED[prop.token]
  const escapedToken = prop.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const cls = densityClass(prop)

  // Tailwind escapes each special character in a compound variant's own class name
  // ([, ], :, >) but leaves the real, following pseudo-class (`:has(>svg)`) alone —
  // confirmed against dist/system.css's own compiled output before this literal was
  // written, not assumed from the plain utility's escaping scheme.
  const selectorLiteral = prop.compound
    ? `.has-\\[\\>svg\\]\\:${prop.util}-${escapedToken}:has(>svg){`
    : `.${prop.util}-${escapedToken}{`
  const selectorRe = new RegExp(selectorLiteral.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^}]*)}")
  const m = css.match(selectorRe)
  if (!m) return { ok: false, detail: `.${cls}{…} not found in dist/system.css` }
  const body = m[1]

  if (prop.util === "size") {
    const widthMatch = body.match(/width:var\((--[a-z0-9-]+)\)/)
    const heightMatch = body.match(/height:var\((--[a-z0-9-]+)\)/)
    if (!widthMatch || !heightMatch) return { ok: false, detail: `size-${prop.token} did not compile both width and height: ${body}` }
    if (widthMatch[1] !== heightMatch[1]) {
      return { ok: false, detail: `size-${prop.token} compiled width (${widthMatch[1]}) and height (${heightMatch[1]}) reference different custom properties` }
    }
    const value = resolveDensityVar(css, widthMatch[1])
    if (value === null) return { ok: false, detail: `${widthMatch[1]} is referenced but never resolves to a literal value in dist/system.css` }
    if (!sameCssNumber(value, expected)) return { ok: false, detail: `size-${prop.token}: expected ${expected}, compiled value is ${value}` }
    return { ok: true, detail: `size-${prop.token} → width/height ${expected} (both, via var(${widthMatch[1]}))` }
  }

  // Issue 07e: toggle.tsx pairs min-w-<name> with h-<name> to keep an
  // icon-only toggle square, the first min-w- consumer this table has
  // ever needed — added alongside height/padding, not folded into the
  // catch-all "else" that used to mean only height.
  const cssProp =
    prop.util === "px"
      ? "padding-inline"
      : prop.util === "py"
        ? "padding-block"
        : prop.util === "min-w"
          ? "min-width"
          : "height"
  const varMatch = body.match(new RegExp(`${cssProp}:var\\((--[a-z0-9-]+)\\)`))
  if (!varMatch) return { ok: false, detail: `no ${cssProp}:var(--${prop.token}) reference found in the compiled rule: ${body}` }
  const value = resolveDensityVar(css, varMatch[1])
  if (value === null) return { ok: false, detail: `${varMatch[1]} is referenced but never resolves to a literal value in dist/system.css` }
  if (!sameCssNumber(value, expected)) return { ok: false, detail: `${cssProp}: expected ${expected}, compiled value is ${value}` }
  return { ok: true, detail: `${cssProp} ${expected} (via var(${varMatch[1]}))` }
}

// ── run ─────────────────────────────────────────────────────────────────────────────
let css
try {
  await stat(SHIPPED_CSS)
  css = await readFile(SHIPPED_CSS, "utf8")
} catch {
  console.error("\ndist/system.css is missing. Run `npm run build` first.")
  console.error("Refusing to report success against a build that does not exist.\n")
  process.exit(1)
}

console.log(`\ntable integrity — ${SLOT_TABLE.length} entries\n`)
const integrity = await checkTableIntegrity(SLOT_TABLE)
if (integrity.problems.length === 0) {
  console.log(`  PASS  every entry has a non-empty anchor, and no two entries in the same file share one`)
} else {
  console.log(`  FAIL  ${integrity.problems.length} table integrity problem(s):`)
  for (const p of integrity.problems) console.log(`    ${p}`)
}
if (integrity.byteIdentical.size === 0) {
  console.log(`  (no entry currently declares literals > 1)`)
} else {
  console.log(`  ${integrity.byteIdentical.size} entr(y/ies) declaring literals > 1 — matched literals checked for byte-identity:`)
  for (const [entry, { found, distinct }] of integrity.byteIdentical) {
    const verdict = distinct.length === 1 ? "PASS byte-identical" : "FAIL distinct literals"
    console.log(`    ${verdict}  ${entry.file} — ${entry.slot} (literals: ${entry.literals}, matched: ${found.length})`)
    console.log(`        "${distinct[0].slice(0, 120)}"${distinct.length > 1 ? ` vs ${distinct.length - 1} other(s)` : ""}`)
  }
}
if (integrity.sameFileRole.length === 0) {
  console.log(`  (no file currently holds more than one entry on the same role)`)
} else {
  console.log(`  ${integrity.sameFileRole.length} file/role pair(s) with multiple entries — anchors distinct per the check above:`)
  for (const [key, entries] of integrity.sameFileRole) {
    console.log(`    ${key}: ${entries.map((e) => `"${e.slot}" (${e.anchor})`).join(", ")}`)
  }
}
if (integrity.problems.length > 0) {
  console.log(`\nRefusing to run per-slot checks against a table that failed its own integrity check.\n`)
  process.exit(1)
}

const failures = []
let linksChecked = 0

console.log(`\nchecking ${SLOT_TABLE.length} rewired type slot(s), 2 links each\n`)

// Link B only needs to run once per distinct role, not once per slot — the compiled rule
// is the same regardless of how many components consume it — but is reported per slot so
// a failure is legible against the exact component it was raised for.
const rolesChecked = new Set()

for (const entry of SLOT_TABLE) {
  const a = await checkLinkA(entry)
  linksChecked++
  const b = checkLinkB(css, entry.role)
  linksChecked++
  rolesChecked.add(entry.role)

  const label = `${entry.slot} (${entry.file} → text-${entry.role})${entry.note ? `  [${entry.note}]` : ""}`
  if (a.ok && b.ok) {
    console.log(`  PASS  ${label}`)
    console.log(`        A: ${a.detail}`)
    console.log(`        B: ${b.detail}`)
  } else {
    console.log(`  FAIL  ${label}`)
    console.log(`        A: ${a.ok ? "ok — " + a.detail : "FAIL — " + a.detail}`)
    console.log(`        B: ${b.ok ? "ok — " + b.detail : "FAIL — " + b.detail}`)
    failures.push({ entry, a, b })
  }
}

console.log(`\n${SLOT_TABLE.length} slot(s), ${linksChecked} link(s) checked, ${new Set(SLOT_TABLE.map((e) => e.role)).size} distinct role(s)`)

if (failures.length === 0) {
  console.log(`\n  PASS  all ${SLOT_TABLE.length} slots trace from source through to the compiled stylesheet`)
  console.log(`\n${SLOT_TABLE.length}/${SLOT_TABLE.length} checks passed.`)
} else {
  console.log(`\n  FAIL  ${failures.length} of ${SLOT_TABLE.length} slot(s) did not verify:`)
  for (const f of failures) {
    console.log(`    ${f.entry.file} — ${f.entry.slot} (text-${f.entry.role})`)
    if (!f.a.ok) console.log(`      Link A: ${f.a.detail}`)
    if (!f.b.ok) console.log(`      Link B: ${f.b.detail}`)
  }
  console.log(`\n${SLOT_TABLE.length - failures.length}/${SLOT_TABLE.length} checks passed.`)
  process.exitCode = 1
}

// ── the leading-axis slots (Issue 07b) ─────────────────────────────────────────────
const leadingFailures = []
let leadingLinksChecked = 0

console.log(`\nchecking ${LEADING_SLOT_TABLE.length} leading-axis slot(s), 2 links each\n`)

for (const entry of LEADING_SLOT_TABLE) {
  const a = await checkLinkA2(entry)
  leadingLinksChecked++
  const b = checkLinkB2(css, entry.leading)
  leadingLinksChecked++

  const roleTag = entry.role ? ` + text-${entry.role}` : ""
  const label = `${entry.slot} (${entry.file} → leading-${entry.leading}${roleTag})`
  if (a.ok && b.ok) {
    console.log(`  PASS  ${label}`)
    console.log(`        A: ${a.detail}`)
    console.log(`        B: ${b.detail}`)
  } else {
    console.log(`  FAIL  ${label}`)
    console.log(`        A: ${a.ok ? "ok — " + a.detail : "FAIL — " + a.detail}`)
    console.log(`        B: ${b.ok ? "ok — " + b.detail : "FAIL — " + b.detail}`)
    leadingFailures.push({ entry, a, b })
  }
}

console.log(
  `\n${LEADING_SLOT_TABLE.length} slot(s), ${leadingLinksChecked} link(s) checked, ${new Set(LEADING_SLOT_TABLE.map((e) => e.leading)).size} distinct leading token(s)`,
)

if (leadingFailures.length === 0) {
  console.log(`\n  PASS  all ${LEADING_SLOT_TABLE.length} leading-axis slots trace from source through to the compiled stylesheet`)
  console.log(`\n${LEADING_SLOT_TABLE.length}/${LEADING_SLOT_TABLE.length} checks passed.`)
} else {
  console.log(`\n  FAIL  ${leadingFailures.length} of ${LEADING_SLOT_TABLE.length} leading-axis slot(s) did not verify:`)
  for (const f of leadingFailures) {
    console.log(`    ${f.entry.file} — ${f.entry.slot} (leading-${f.entry.leading})`)
    if (!f.a.ok) console.log(`      Link A: ${f.a.detail}`)
    if (!f.b.ok) console.log(`      Link B: ${f.b.detail}`)
  }
  console.log(`\n${LEADING_SLOT_TABLE.length - leadingFailures.length}/${LEADING_SLOT_TABLE.length} checks passed.`)
  process.exitCode = 1
}

// ── the density slots (Issue 07c) ──────────────────────────────────────────────────
const densityFailures = []
let densityLinksChecked = 0
let densityPropsChecked = 0

console.log(`\nchecking ${DENSITY_SLOT_TABLE.length} density slot(s), 2 links each\n`)

for (const entry of DENSITY_SLOT_TABLE) {
  const a = await checkLinkA3(entry)
  densityLinksChecked++
  const bResults = entry.props.map((prop) => ({ prop, result: checkLinkB3(css, prop) }))
  densityLinksChecked++
  densityPropsChecked += entry.props.length
  const bOk = bResults.every((r) => r.result.ok)

  const label = `${entry.slot} (${entry.file} → ${entry.props.map(densityClass).join(", ")})`
  if (a.ok && bOk) {
    console.log(`  PASS  ${label}`)
    console.log(`        A: ${a.detail}`)
    for (const { prop, result } of bResults) console.log(`        B (${densityClass(prop)}): ${result.detail}`)
  } else {
    console.log(`  FAIL  ${label}`)
    console.log(`        A: ${a.ok ? "ok — " + a.detail : "FAIL — " + a.detail}`)
    for (const { prop, result } of bResults) {
      console.log(`        B (${densityClass(prop)}): ${result.ok ? "ok — " + result.detail : "FAIL — " + result.detail}`)
    }
    densityFailures.push({ entry, a, bResults })
  }
}

console.log(
  `\n${DENSITY_SLOT_TABLE.length} slot(s), ${densityLinksChecked} link(s) (${densityPropsChecked} propert(y/ies) via Link B) checked, ${new Set(DENSITY_SLOT_TABLE.flatMap((e) => e.props.map((p) => p.token))).size} distinct density token(s)`,
)

if (densityFailures.length === 0) {
  console.log(`\n  PASS  all ${DENSITY_SLOT_TABLE.length} density slots trace from source through to the compiled stylesheet`)
  console.log(`\n${DENSITY_SLOT_TABLE.length}/${DENSITY_SLOT_TABLE.length} checks passed.`)
} else {
  console.log(`\n  FAIL  ${densityFailures.length} of ${DENSITY_SLOT_TABLE.length} density slot(s) did not verify:`)
  for (const f of densityFailures) {
    console.log(`    ${f.entry.file} — ${f.entry.slot}`)
    if (!f.a.ok) console.log(`      Link A: ${f.a.detail}`)
    for (const { prop, result } of f.bResults) {
      if (!result.ok) console.log(`      Link B (${densityClass(prop)}): ${result.detail}`)
    }
  }
  console.log(`\n${DENSITY_SLOT_TABLE.length - densityFailures.length}/${DENSITY_SLOT_TABLE.length} checks passed.`)
  process.exitCode = 1
}
