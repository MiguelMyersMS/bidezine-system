---
pass: atoms-pass-1
components: Button, Input, Label
lifecycle: scoped
sync: pushed
owner-machine: —
last-updated: 2026-08-03
---

# Atoms Pass 1 — Decision Log

> `sync` records where the work physically lives and is set in the commit carrying it. It reads
> `pushed` only once that commit reaches `origin/main`, at which point the pass **leaves the hand-off
> queue** and `owner-machine` is released to `—`. If a session ends without pushing, `sync` must be
> corrected to `working` or `committed`, because unpushed work does not travel between the three
> machines.

Entries record **what was decided, why, and at which step**.

---

## Step 0 — Scope & Fence

**A-D-001 · Button, Input and Label share one pass; Field does not.** *(Owner, 2026-08-03)*
Per the CDP batching rule: components may share a pass only if none composes another. These three are
mutually independent. Field composes Label and Input, so batching it here would mean reviewing a
composition alongside its own parts — the failure the bottom-up order exists to prevent (D-001).

**A-D-002 · The batching rule and the per-pass fence clarification enter the CDP.** *(Owner, 2026-08-03)*
Both recorded in `docs/process/COMPONENT-DEVELOPMENT-PROTOCOL.md` §2 rather than left as a one-off
arrangement, since they will govern every future pass.

**A-D-003 · The fence resets per pass, but excludes adopted system architecture.** *(CDP, 2026-08-03)*
v1 being open for Dialog does not open it here. However, v1 scales already migrated into our token
source (radius tiers, z-index, motion, elevation) are **ours** now, and pretending not to know them
would be theatre rather than independence. The fence protects analysis of *a component* from v1's
answer for *that component* — it was never meant to un-decide settled system architecture.

**A-D-004 · Input's state model cannot be independent, and will be labelled as such.** *(Step 0)*
I have read v1's `inputtrigger.spec.md` including its complete six-state model, and the pre-protocol
Input I built was directly derived from it. Any resembling state model will carry
**`[contaminated — derived from v1 InputTrigger]`** rather than being presented as convergence. Step 6
must treat Input's state comparison as already decided.

Not contaminated for Input: v1's `TextInput.tsx`, unread, and possibly the truer counterpart to
shadcn's `Input` than `InputTrigger` is.

**A-D-005 · Label may have no v1 counterpart at all.** *(Step 0, provisional)*
Nothing matching in `src/gallery/` or `docs/atomic/`. If it holds at step 6, Label's comparison is
**two-way** rather than three-way — and the absence is itself a finding: a component the old system
never needed as a distinct part.

**A-D-006 · Button's sections carry more detail than the others, deliberately.** *(Step 0)*
It is a 6 × 8 CVA matrix against a single class string each. The known cost of batching is glossing the
largest component; this is the mitigation.
