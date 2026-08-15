-- ═══════════════════════════════════════════════════════════════════════════════════
-- 030 — the thirteen decisions the record can actually support.
--
-- Decision coverage across rail-sidebar, measured rather than estimated:
--
--     close     63 rows    0 decisions
--     confirm   94 rows    9 decisions      <- 85 unrecorded
--     decide    12 rows    0                <- pending the owner
--
-- Those 85 are the precedent step 3 exists to accumulate, and a component arriving next month
-- would get 11 examples instead of 96. But most of them cannot be recorded honestly, and this
-- migration takes only the group where the record supports it.
--
--     13   names a token that RESOLVES in tokens/     <- this migration
--      3   names a literal value, no token            <- left; see below
--     69   no structured after-value at all           <- left; prose only
--
-- ── Why these thirteen and no others ───────────────────────────────────────────────
-- `disposition = 'reused'` is PROVABLE here, not read out of prose: each row's own
-- `visual.afterVar` names a token, and that token resolves in `sandbox.design_token`, synced
-- from the real files. The join is the evidence. 028 does not interrogate a reuse for what it
-- rejected, and correctly so — a reuse names an existing value by definition — so nothing here
-- has to be invented to satisfy a constraint. Same standard as 024, and no prose extraction
-- anywhere in it.
--
-- The 69 fail that standard outright. 46 of them contain approval language ("Approved",
-- "Decided", "confirmed as final"); only 14 also name something weighed and set aside. **32 rows
-- assert that a decision happened without recording what it was against.** Backfilling those
-- means either failing 028's constraint or inventing a rejection to satisfy it, which is the
-- fabrication this table exists to prevent — and extracting `chosen_value` and `disposition`
-- from prose is the technique behind both of today's worst errors.
--
-- ── The three literals, and why C-5 is not merely a judgement call ─────────────────
-- `J-1` (z-50) and `J-2` (z-30) name a literal with no token; whether that is `authored` is a
-- reading, and a reading is not a provenance. Left.
--
-- `C-5` is stronger than that: its record names #B9B9B9/#585858 while the shipped component
-- uses `--muted-foreground` at 50% opacity — traced with the owner and the CODE ruled correct
-- (CLAUDE.md item 29). Deriving a decision from that record would store a choice that
-- contradicts the component. The record needs correcting on its own merits before anything is
-- derived from it. This is the F-1/G-1 lesson applied before the mistake instead of after.
--
-- ── What is asserted, and what is proven ──────────────────────────────────────────
-- `decided_by = 'owner'` and `provenance = 'migrated'`, exactly as 024 discloses: the source
-- attributes these to owner review sessions without naming a person, and inventing one would be
-- worse than the gap. `chosen_value` is `var(--token)` rather than a copied literal — a reuse
-- decision chooses the TOKEN, and its value tracks `tokens/`; copying the value here would
-- freeze a number that is meant to move, and would go stale silently the first time the token
-- changed.
--
-- `rationale` carries the row's own `detail` AND its `review_prompt`, both verbatim. On these
-- rows the detail states the decision ("Approved: use --card for the panel surface.") and the
-- prompt states the reason ("Origin ships its own value; we map it onto our card surface rather
-- than introduce a second one") — the mirror of the F-1/G-1 case, where the detail held the
-- reasoning and the summary dropped it. Neither layer is reliably the fuller one, so both are
-- kept and neither is summarised.
--
-- After this: 24 recorded decisions, and a gap of 72 rows stated as a number rather than as
-- "most rows lack decisions". `node scripts/check-decision-coverage.mjs` reports it.
-- ═══════════════════════════════════════════════════════════════════════════════════

DECLARE @component_id INT = (SELECT component_id FROM sandbox.component WHERE slug = 'rail-sidebar');

DECLARE @seed TABLE (
    ref_code  NVARCHAR(20)  NOT NULL,
    concept   NVARCHAR(100) NOT NULL,
    token     NVARCHAR(100) NOT NULL,
    origin_l  NVARCHAR(100) NULL,
    origin_d  NVARCHAR(100) NULL,
    rationale NVARCHAR(MAX) NOT NULL);

INSERT INTO @seed (ref_code, concept, token, origin_l, origin_d, rationale)
VALUES
    (N'C-1', N'surface', N'--card',
     N'#ffffff', N'#272a2d', N'Approved: use --card for the panel surface.

The panel''s own background surface. Origin ships its own value; we map it onto our card surface rather than introduce a second one. Confirm that is right for a panel floating over content.'),
    (N'C-10', N'focusOverlay', N'--ring',
     N'#f0f0f3', N'#363a3f', N'Approved: use --ring as the focus-color source while preserving the correct focus mechanism during Build.

Keyboard focus. Origin fills the whole element; we take the colour from our ring token and keep our own focus mechanism. Confirm the mechanism matters more than matching the fill.'),
    (N'C-11', N'hairline', N'--border',
     N'#d9d9e0', N'#363a3f', N'Approved: use --border for the color and preserve the 0.5px divider weight during Build.

Half-pixel dividers. The colour maps onto our border token; the 0.5px weight is the half that must survive the port. Confirm both halves are intended.'),
    (N'C-12', N'borderStrong', N'--border',
     N'#b9bbc6', N'#5a6169', N'Approved: use --border; Build must preserve the stronger/pressed border treatment where the component requires it.

The stronger inset ring on pressed light menu rows. Colour maps onto our border token, with the heavier treatment kept where the component needs it. Confirm where that actually is.'),
    (N'C-13', N'statusRedText', N'--destructive',
     N'#ce2c31', N'#ff9592', N'Approved: maps directly to --destructive.

Danger rows in a menu. Maps straight onto our destructive token. Confirm the direct mapping, and that nothing else in the rail needs a danger tier.'),
    (N'C-14', N'onInk', N'--primary-foreground',
     N'#ffffff', N'#111113', N'Approved: maps to --primary-foreground.

Text sitting on a filled, dark, active row. Maps onto our primary-foreground token. Confirm it stays legible against the real active background rather than against a swatch.'),
    (N'C-2', N'ink', N'--foreground',
     N'#1c2024', N'#edeef0', N'Approved: maps directly to --foreground.

Full-strength body text. Maps straight onto our foreground token with no new value invented. Confirm the direct mapping still holds once composed on the real panel.'),
    (N'C-3', N'textMuted', N'--muted-foreground',
     N'#60646c', N'#b0b4ba', N'Approved: maps directly to --muted-foreground.

Subordinate text, around 60% presence in origin. Maps onto our muted-foreground token. Confirm that one token covers this tier — the tier below maps onto it too.'),
    (N'C-4', N'textSubtle', N'--muted-foreground',
     N'#8b8d98', N'#696e77', N'Approved: use the proposed --muted-foreground mapping.

Faint text, around 40% presence in origin. Also maps onto muted-foreground, collapsing two of origin''s tiers into one token. Confirm losing that distinction is acceptable.'),
    (N'C-6', N'hoverBg', N'--accent',
     N'#f0f0f3', N'#2e3135', N'Location: the panel-header “⋯” (More) menu''s plain rows — “Expand all” and “Collapse all” (src/ui/dropdown-menu.tsx''s DropdownMenuItem, composed in FunctionalRailSidebar.tsx around line 1232). Resolved: ALREADY native, no code change needed — DropdownMenuItem''s own real base recipe already applies `focus:bg-accent focus:text-accent-foreground` on hover/keyboard-highlight, reusing the same --accent token this component uses everywhere else.

Hover on the panel menu''s plain rows. Already native to our menu primitive — nothing had to be added. Confirm the primitive''s own hover is what this should use.'),
    (N'C-7', N'bgSubtle', N'--accent',
     N'#f9f9fb', N'#212225', N'Location: the SAME panel-header “⋯” menu''s “Search box” row (src/ui/dropdown-menu.tsx''s DropdownMenuCheckboxItem, composed around line 1239) — the toggle that shows/hides the search box. RESOLVED by reusing an existing convention, not inventing a new color: added `data-[state=checked]:bg-accent/50` directly to DropdownMenuCheckboxItem''s own base recipe — the exact same --accent token this component already uses for `focus:`, at the same reduced opacity NavigationMenuLink''s own `data-[active=true]:bg-accent/50` rule (src/ui/navigation-menu.tsx) already establishes for an identical “distinct-but-related resting tint” pattern. No --muted, no new hex — this was flagged by the user as an unforced divergence and corrected system-wide at the primitive level (benefits every DropdownMenuCheckboxItem in bidezine, not just this rail).

The checked state of the menu''s Search box toggle. Reuses the accent token at reduced opacity, matching what our nav link already does, rather than a new tint. Confirm that reuse.'),
    (N'C-8', N'activeBg', N'--accent',
     N'#e8e8ec', N'#2e3135', N'Location: the SAME panel-header “⋯” menu, all three rows (“Expand all”, “Collapse all”, “Search box”) — specifically their mouse-DOWN/pressed instant, not the hover/focus state C-6 already covers. RESOLVED by reusing an existing convention: added `active:bg-accent active:text-accent-foreground` (a true CSS :active pseudo-class) to both DropdownMenuItem and DropdownMenuCheckboxItem''s own base recipes — the exact --accent token pair already used for `focus:`, mirroring SidebarMenuButton''s own identical `active:bg-sidebar-accent active:text-sidebar-accent-foreground` rule (src/ui/sidebar.tsx) and Button''s own new `ghost` variant `active:` rule (see C-9). No new/invented color; this deliberately looks the same as hover/focus by design, since --accent IS this system''s single “highlighted state” token.

The pressed instant on all three panel-menu rows, distinct from the hover above. Reuses the accent token the way our sidebar button already does. Confirm rather than a new pressed colour.'),
    (N'C-9', N'pressedOverlay', N'--accent',
     N'#e0e1e6', N'#363a3f', N'Location: the panel-header “⋯” TRIGGER button itself (the small icon-only Button that OPENS the menu above — src/ui/button.tsx `variant="ghost" size="icon-xs"`, composed in FunctionalRailSidebar.tsx around line 1221) — distinct from C-6/C-7/C-8, which are all about rows INSIDE the opened menu, not the trigger that opens it. RESOLVED: the originally-proposed #E0E1E6/#363A3F hex values were a genuine, unforced divergence (flagged by the user: “we already have way to manage menus... why diverge and come up with different color tokens”) — corrected by adding `active:bg-accent active:text-accent-foreground dark:active:bg-accent/50` to Button''s own `ghost` variant (src/ui/button.tsx), reusing the SAME --accent token the variant''s own `hover:` already uses, mirroring SidebarMenuButton''s already-established active: convention system-wide (every ghost Button in bidezine, not just this trigger). No new hex values anywhere.

The ellipsis trigger''s own pressed state, not the menu rows it opens. Reuses the ghost button''s pressed treatment, applied system-wide. Confirm a shared rule beats a local value.');

INSERT INTO sandbox.divergence_decision
    (component_id, divergence_id, concept, origin_value, origin_value_dark,
     chosen_value, chosen_token, disposition, rationale, decided_by, provenance)
SELECT  @component_id,
        d.divergence_id,
        s.concept,
        s.origin_l,
        s.origin_d,
        CONCAT('var(', s.token, ')'),
        s.token,
        'reused',
        s.rationale,
        'owner',
        'migrated'
FROM    @seed s
JOIN    sandbox.divergence d
     ON d.component_id = @component_id AND d.ref_code = s.ref_code
-- Belt and braces: the token must still resolve at APPLY time, not merely when the migration
-- was generated. A reuse naming a token that no longer exists is not a reuse.
WHERE   EXISTS (SELECT 1 FROM sandbox.design_token t WHERE t.name = s.token);
GO
