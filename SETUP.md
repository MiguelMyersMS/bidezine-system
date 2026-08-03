# Machine Setup — bidezine-system

Setup for a new machine. **Every paste below is labeled with WHERE it goes:**
- ⌨️ **TERMINAL** = the panel at the bottom of VS Code (open it via **Terminal → New Terminal**).
- 💬 **CLAUDE CHAT** = the Claude chat box in VS Code.

Everything else is menu clicks.

---

## LAPTOP A — Miguel (already has `design-system`)

**Step 1 — Open his existing project.**
VS Code: **File → Open Folder…** → choose his **`design-system`** folder → **Select Folder**.

**Step 2 — Open a terminal.**
Menu: **Terminal → New Terminal** (opens at the bottom, already inside `design-system`).

**Step 3 — ⌨️ TERMINAL — paste this whole block, press Enter:**
```
git pull
cd ..
git clone https://github.com/MiguelMyersMS/bidezine-system.git
cd bidezine-system
cp ../design-system/.env .env
cp ../design-system/.env.copilot .env.copilot
```
(What it does: updates the old project, downloads `bidezine-system` next to it, copies the settings files in.)

**Step 4 — Open the new project.**
**File → Open Folder…** → choose the new **`bidezine-system`** folder → **Select Folder**.

**Step 5 — 💬 CLAUDE CHAT — open a NEW chat and paste this:**
```
Read CLAUDE.md, docs/decisions/ADR-006-shadcn-foundation.md,
docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md, and docs/reference/REFERENCE-MAP.md in full.
I'm Miguel on Laptop A. The entire shadcn site is already vendored and site-scope is resolved.
Let's begin the golden-path modal-form slice.
```
✅ Done.

---

## THE PC — third person (has neither project, no settings files yet)

**Step 1 — Pick where the projects will live.**
**File → Open Folder…** → choose or create ONE folder to hold both projects (e.g. `Documents\GitHub`) → **Select Folder**.

**Step 2 — Open a terminal.**
**Terminal → New Terminal** (opens inside that folder).

**Step 3 — ⌨️ TERMINAL — paste this block, press Enter:**
```
git clone https://github.com/MiguelMyersMS/design-system.git
git clone https://github.com/MiguelMyersMS/bidezine-system.git
```
(Downloads BOTH projects side by side — the new one needs the old one beside it for reference.)

**Step 4 — Add the settings files (NOT in git, on purpose).**
Get **`.env`** and **`.env.copilot`** from Miguel or Blair directly (email / USB / secure share — never committed).
Place a **copy of both files into each** project folder: into `design-system\` AND into `bidezine-system\`.
*(This is a file copy in the file explorer — not a terminal or chat paste.)*

**Step 5 — Open the new project.**
**File → Open Folder…** → choose **`bidezine-system`** → **Select Folder**.

**Step 6 — 💬 CLAUDE CHAT — open a NEW chat and paste this:**
```
Read CLAUDE.md, docs/decisions/ADR-006-shadcn-foundation.md,
docs/process/SHADCN-V2-FOUNDATION-HANDOFF.md, and docs/reference/REFERENCE-MAP.md in full.
I'm on the PC. The entire shadcn site is already vendored and site-scope is resolved.
Let's continue where the team left off.
```
✅ Done.

---

## Safety nets (why this is hard to get wrong)
- The only things anyone TYPES/pastes are the labeled blocks above. Everything else is menu clicks.
- When the Claude chat starts, the project auto-checks for the settings files and the sibling `design-system`,
  and prints the exact fix if either is missing — so no one gets silently stuck.
