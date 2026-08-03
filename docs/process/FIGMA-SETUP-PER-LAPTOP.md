# Figma Setup — per laptop (runbook for Claude)

**Purpose:** make Figma work in this repo on THIS machine exactly as it does on the owner's main laptop —
both **Claude Code** and **GitHub Copilot** able to READ and EDIT Figma. Any Claude session can execute
this runbook top-to-bottom on a fresh machine.

**When to run:** once per new laptop, or any time `claude mcp list` shows the Figma servers not connected.

**Done means:**
- `claude mcp list` shows **`figma` ✔ Connected** (the reader) AND **`figma-mcp` ✔ Connected** (the writer).
- In VS Code, the MCP panel shows `figma` + `figma-write` running (that's Copilot's copy).

---

## What makes Figma work here — 3 parts

1. **A token** — the `FIGMA_API_KEY` environment variable, a Figma personal access token (`figd_…`). Used by
   the reader server AND the repo's evidence/capture scripts. It lives ONLY in the env var, never in a file.
2. **The reader MCP** — `figma-developer-mcp` (fetch nodes, export images). Already configured for both
   tools and comes with the repo: Claude via `.mcp.json`, Copilot via `.vscode/mcp.json`. It just needs the
   token from part 1.
3. **The writer MCP** — the official `https://mcp.figma.com/mcp` (create/edit designs), browser-authorized.
   Already in `.vscode/mcp.json` for Copilot; must be ADDED for Claude with one command.

---

## Steps (run in order)

### 0. Prerequisites
- **Node.js** installed — check `node -v` prints a version (the reader runs via `npx`).
- Repo pulled up to date so you have `.vscode/mcp.json` + this file:
  ```bash
  git checkout master && git pull --ff-only
  ```
- The user is logged into Figma (desktop or web) on this machine.

### 1. Confirm the token is set (`FIGMA_API_KEY`)
```powershell
$env:FIGMA_API_KEY          # PowerShell — should print a value starting with figd_
```
- **Prints a `figd_…` value → go to step 2.**
- **Empty → ask the user for their Figma token.** They can reuse the main laptop's value, or generate a new
  one: Figma → avatar → **Settings → Security → Personal access tokens → Generate** (read scope is enough).
  Then set it as a persistent user env var:
  ```powershell
  setx FIGMA_API_KEY "figd_THE_TOKEN"
  ```
  ℹ️ Plain `setx` (no `/M`) stores it at the **User level** — which is exactly how it's set on the main
  laptop (User-level, *not* Machine-level). Do not add `/M`.
  ⚠️ `setx` only affects **new** processes — the user must **close and reopen VS Code and the terminal**,
  then re-check `$env:FIGMA_API_KEY` before continuing.
  🔑 The token is the same Figma personal access token from the main laptop (tied to the
  `miguel.myers@microsoft.com` account) — reuse that value, or generate a fresh one while signed into the
  *same* Figma account.

### 2. Add the writer server to Claude Code
```bash
claude mcp list          # if `figma-mcp` is already ✔ Connected, skip the add
claude mcp add --transport http figma-mcp https://mcp.figma.com/mcp
```

### 3. Confirm the reader + Copilot config is present (came with the repo — no edits)
- `.mcp.json` (repo root) → server **`figma`** (reader) for Claude. ✔ tracked in git.
- `.vscode/mcp.json` → **`figma`** (reader) + **`figma-write`** (writer) for Copilot. ✔ tracked in git; it
  reads the token via `${env:FIGMA_API_KEY}`, so nothing to paste.
- *Optional — to match the main laptop's Copilot auto-approve*, create `.vscode/settings.json` with:
  ```json
  { "chat.permissions.default": "autoApprove" }
  ```
  Leave it out to keep manual tool-approval prompts. (This file is intentionally NOT in git — it's a
  per-machine preference.)

### 4. Authorize Figma — one-time browser step (writer only)
The first time a Figma **write/design** tool runs, a browser opens to authorize Figma → click
**Authorize**. (Reading needs no browser step — it uses the token.)

### 5. Verify
```bash
claude mcp list          # expect BOTH:  figma ✔ Connected   and   figma-mcp ✔ Connected
```
- Reader smoke test: ask Claude to fetch metadata for a node in Figma file `EyYETHXMDDURPGK4PXTU5C`.
- VS Code: open the MCP servers view — `figma` + `figma-write` should be running (Copilot's side).

---

## Troubleshooting
| Symptom | Fix |
|---|---|
| `figma` reader not connected | Token missing/typo. Re-check `$env:FIGMA_API_KEY` starts `figd_`; re-`setx`; **restart VS Code**. |
| `figma-mcp` writer not connected | Re-run step 2's `claude mcp add`; complete the browser **Authorize**. |
| `npx` / "command not found" | Install Node.js, reopen the terminal. |
| Reader works, writer doesn't | That's the OAuth step — trigger any Figma write tool and Authorize in the browser. |

**Never commit the token.** It belongs only in the `FIGMA_API_KEY` env var. The config files reference it
by name (`${env:FIGMA_API_KEY}`) so no secret is ever stored in git.

---

*Related: `docs/process/TWO-LAPTOP-CHEAT-SHEET.md` (git rules for two machines) ·
`docs/process/TWO-LAPTOP-WORKFLOW.md` (technical protocol). Figma is the source of visual truth
(Golden Rule #4); this setup does not change the governed create/verify/deploy lifecycle.*
