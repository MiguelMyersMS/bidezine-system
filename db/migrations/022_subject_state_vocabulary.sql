-- ═══════════════════════════════════════════════════════════════════════════════════
-- 022 — `subject_state` gains the two persistent states it never had, and loses a word
-- that already meant something else.
--
-- Migration 010 gave it `rest`, `hover`, `active`, `focus`, `focus-visible`, `disabled` —
-- five transient interaction states plus rest. It has never had a term for a state a thing
-- STAYS in. That is not a gap in the abstract: `B-5` (`darkBorderStrong`, the ring shown
-- while a section's panel is open) is the one dark-rail token that could not be declared at
-- all, and the mechanism to force that state for review was deliberately left unbuilt,
-- because building it first would have been a mechanism no row could legally address.
--
-- ── 1. `active` → `pressed`, because `active` already means two things here ────────
-- In this vocabulary `active` sits beside `hover` and `focus` and means CSS `:active` — a
-- press. In the rail it means CURRENT: `state: "default" | "browsing" | "active"`, and the
-- component's own comment calls that "the persistent active/browsing state". Seven
-- `src/ui` primitives use "active" the rail's way (`data-active` / `data-[active=true]` /
-- `aria-pressed`): button, dropdown-menu, sidebar, navigation-menu, input-otp,
-- message-scroller, pagination.
--
-- **That collision had already bent a real declaration before anyone named it.** `B-4`
-- (`darkPressedBg`) is declared `active`, and `B-3` (`darkActiveBg`) was routed to `rest`
-- to dodge it — a workaround written knowingly, by someone who had read the component's own
-- warning comment and still had to route around rather than being prevented from erring.
--
-- That is why this renames rather than documents. A comment is the weakest available fix
-- for a failure mode already demonstrated: the warning existed, was read, and the
-- workaround happened anyway. This is M9's whole thesis turned on the schema itself.
--
-- Blast radius, measured rather than estimated:
--   · ONE row uses it (`B-4`), updated below
--   · ONE case in `verifier/run-checks.mjs`, which does `mouse.down()` — the rename makes
--     the runner read as what it already does
--   · ONE fixture line, `verifier/checks/__verifier_test__/T-1.json`
--   · NO real check spec uses `active`; all eight rail-sidebar specs use `rest` or `hover`
-- The runner case and the fixture move in the SAME commit as this, or `verify-runner`
-- breaks — which is why this migration is not split.
--
-- ── 2. `selected` and `expanded`, not `browsing` ──────────────────────────────────
-- `browsing` was the rail's own word for a general concept, and adding it would have
-- encoded one component's vocabulary system-wide. The two concepts it actually needs are
-- already named by this design system:
--   · `selected` — persistently current. 7 primitives (`data-active`/`aria-pressed`).
--   · `expanded` — a disclosure is open. 13 primitives (`data-[state=open]`): accordion,
--     collapsible, dropdown-menu, context-menu, dialog, drawer, and the rest.
-- Counting files is a checkable test; "the next occupant will probably need it" is not.
--
-- ── The rule this is the second instance of ───────────────────────────────────────
-- Two enums in succession lacked a term because both were drawn from what the FIRST
-- occupant happened to need — the same defect as inventing a colour from one component's
-- palette. A vocabulary term IS a constant, so `CLAUDE.md` checklist item 26 governs it,
-- and now says so: (1) does an existing value already cover it — if the occupant merely
-- uses a different word, rename in the declaration rather than extend; (2) do bidezine's
-- own primitives already name the concept; (3) adding a value promises something renders it
-- DISTINCTLY. Test 1 is what caught `browsing`.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence DROP CONSTRAINT ck_divergence_state_vocab;
GO

-- Data first, while nothing constrains it. B-4 is `darkPressedBg` — a genuine press, so
-- this is a rename of the term, not a reclassification of the row.
UPDATE d
SET    d.subject_state = 'pressed', d.updated_at = SYSUTCDATETIME()
FROM   sandbox.divergence d
JOIN   sandbox.component c ON c.component_id = d.component_id
WHERE  c.slug = 'rail-sidebar' AND d.subject_state = 'active';
GO

ALTER TABLE sandbox.divergence ADD CONSTRAINT ck_divergence_state_vocab CHECK (
    subject_state IS NULL OR subject_state IN
        ('rest','hover','pressed','focus','focus-visible','disabled','selected','expanded'));
GO
