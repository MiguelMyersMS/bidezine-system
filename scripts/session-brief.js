// Session brief — read-only orientation printed at session start (via a SessionStart hook) and by the
// /session-start skill. It surfaces UNFINISHED WORK that a plain `git status` misses and that has been
// silently dropped here before: stashes, OTHER branches carrying unpushed / no-upstream commits, and
// the open follow-ups backlog. Single source of truth for the mechanical state (the skill interprets
// it + runs the gate audits). Uses execFileSync (no shell) so it is quoting-safe on Windows + POSIX.
// NEVER throws; always exits 0 — a session-start hook must not break the session.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gitRaw = (...args) => {
  try { return execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString(); }
  catch { return ""; }
};
const git = (...args) => gitRaw(...args).trim();
// `git status --porcelain` encodes staged/unstaged in columns 1 and 2, so the LEADING SPACE of an
// unstaged line (" M file") is significant — `.trim()` eats it on the first line and that file then
// reads as staged. Always parse porcelain from the untrimmed output.
const porcelain = (...args) => gitRaw(...args).split("\n").filter((l) => l.trim() !== "");
const out = [];
const p = (s) => out.push(s);

try {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD") || "(unknown)";
  const detached = branch === "HEAD";
  const sb = (git("status", "-sb").split("\n")[0] || "").replace(/^## /, "");

  p("═══ session brief ═══");
  if (detached) p("⚠ DETACHED HEAD — commits here are LOST on checkout; create a branch first.");
  p(`branch: ${branch}   ${sb}`);

  // uncommitted (staged / unstaged / untracked)
  const porc = porcelain("status", "--porcelain");
  if (!porc.length) p("uncommitted: clean");
  else {
    const staged = porc.filter((l) => /^[MARCD]/.test(l[0])).length;
    const unstaged = porc.filter((l) => /[MD]/.test(l[1])).length;
    const untracked = porc.filter((l) => l.startsWith("??")).length;
    p(`uncommitted: ${porc.length} file(s) — ${staged} staged, ${unstaged} unstaged, ${untracked} untracked  ⚠ commit FINISHED work so it isn't silently reverted`);
  }

  // unpushed on THIS branch
  const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
  if (!upstream) p(`unpushed: this branch has NO upstream — \`git push -u origin ${branch}\``);
  else {
    const ahead = git("log", "@{u}..HEAD", "--oneline").split("\n").filter(Boolean);
    p(ahead.length ? `unpushed (this branch): ${ahead.length}\n${ahead.map((l) => "  " + l).join("\n")}  ← git push` : "unpushed (this branch): none");
  }

  // stashes (git status NEVER shows these — the false-all-clear path)
  const stash = git("stash", "list").split("\n").filter(Boolean);
  p(stash.length ? `stashes: ${stash.length}  ⚠ hidden WIP\n${stash.map((l) => "  " + l).join("\n")}` : "stashes: none");

  // OTHER branches with unpushed (ahead) or NO upstream (unpushed work invisible)
  const refs = git("for-each-ref", "--format=%(refname:short)|%(upstream:short)|%(upstream:track)", "refs/heads").split("\n").filter(Boolean);
  const flagged = refs.map((r) => r.split("|")).filter(([name, ups, track]) => name !== branch && (!ups || /ahead/.test(track || "")));
  if (flagged.length) p(`other branches needing attention:\n${flagged.map(([n, ups, t]) => `  - ${n} ${ups ? (t || "") : "[no upstream]"}`).join("\n")}`);

  // Backlog — reported as BLOCKING vs PARKED (restructured 2026-08-02).
  // Before this split, the brief printed one "N open" number that read as a debt gate you had to pay
  // down before starting work. It never was: the only REQUIRED gate is CI (`health:strict`); the
  // evidence gate is ADVISORY by its own declaration (.github/workflows/evidence.yml:7). Three days
  // were lost to that misreading. Blocking is the number that matters; parked is FYI, never a to-do.
  const fu = path.join(ROOT, "docs/FOLLOWUPS.md");
  let followupsMd = "";
  if (!fs.existsSync(fu)) p("follow-ups: docs/FOLLOWUPS.md MISSING");
  else {
    followupsMd = fs.readFileSync(fu, "utf-8");
    const section = (title) => followupsMd.split(/^## /m).find((s) => s.startsWith(title)) || "";
    const count = (s) => (s.match(/^- \[ \]/gm) || []).length;
    const blocking = count(section("Blocking"));
    const parked = count(section("Parked"));
    const tracked = git("ls-files", "docs/FOLLOWUPS.md");
    p(blocking
      ? `⛔ BLOCKING: ${blocking} — these genuinely stop a merge/deploy; clear them first (docs/FOLLOWUPS.md § Blocking)`
      : "blocking: 0  ✓ nothing stands between you and new work");
    p(`parked: ${parked} (optional / deferred / owner decisions — NOT a to-do list; pull only what intersects today's work)${tracked ? "" : "\n  ⚠ docs/FOLLOWUPS.md UNTRACKED — commit it or the backlog is lost"}`);
  }

  // VANISHED BRANCHES — the backlog says work is preserved on a branch, but the ref is gone.
  // This has happened TWICE (2026-08-02): `feat/filter-fields` (22 commits) and
  // `chore/molecule-gate-tightenings` (sole carrier of scripts/audit-story-shape.js) both lost their
  // refs and survived only as garbage-collectable dangling objects. A plain `git status`, `git branch`
  // and even `git stash list` ALL show clean in that state — the work is invisible until gc eats it.
  // We check names the BACKLOG itself claims, because that is a precise signal: a generic dangling-tip
  // scan costs ~13s and returns ~50 hits here, almost all harmless squash-merge residue.
  if (followupsMd) {
    // Scope to the LIVE sections only — `## Done (recent)` legitimately names branches that were merged
    // and deleted on purpose, and flagging those is pure noise.
    const live = (t) => followupsMd.split(/^## /m).find((s) => s.startsWith(t)) || "";
    const openMd = live("Blocking") + "\n" + live("Parked");
    // Only `backticked` two-segment tokens with no file extension: `feat/foo-bar` is a branch,
    // `docs/evidence/GUIDE.md` and `docs/atomic/atom/trendarrow.spec.md` are paths.
    const claimed = new Set();
    for (const m of openMd.matchAll(/`((?:feat|fix|chore|docs|refactor)\/[A-Za-z0-9._\-]+)`/g)) {
      if (!m[1].includes(".")) claimed.add(m[1]);
    }
    const gone = [];
    for (const name of claimed) {
      if (git("rev-parse", "--verify", "--quiet", `refs/heads/${name}`)) continue;
      if (git("rev-parse", "--verify", "--quiet", `refs/remotes/origin/${name}`)) continue;
      // Suppress branches the backlog explicitly records as merged/deleted on purpose.
      const mentions = openMd.split("\n").filter((l) => l.includes(`\`${name}\``)).join(" ");
      if (/DELETED|deleted|merged|MERGED|archive|ARCHIVE/.test(mentions)) continue;
      // If the backlog also pins a SHA, say whether the work is still recoverable.
      const shaHit = mentions.match(new RegExp("`" + name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "`[^\\n]{0,120}?`?@?([0-9a-f]{7,40})`?"));
      const sha = shaHit && git("cat-file", "-t", shaHit[1]) === "commit" ? shaHit[1] : "";
      gone.push(`  - ${name} — REF GONE${sha ? `, recoverable: \`git branch ${name} ${sha}\`` : " (search: git fsck --dangling)"}`);
    }
    if (gone.length) p(`⚠⚠ VANISHED BRANCHES — the backlog claims work here, but the ref no longer exists\n${gone.join("\n")}\n  ↑ recover + \`git push -u origin <name>\` NOW; a \`git gc\` prunes dangling commits permanently`);
  }

  const kernel = path.join(ROOT, "docs/process/SPEC_KERNEL_COMPACT.md");
  if (!fs.existsSync(kernel)) {
    p("kernel: docs/process/SPEC_KERNEL_COMPACT.md MISSING  ⚠ execution contract unavailable");
  } else {
    p("kernel: present — load docs/process/SPEC_KERNEL_COMPACT.md before non-trivial work; use TASK_BRIEF_TEMPLATE + VERIFIER_CHECKLIST for medium/large tasks");
  }

  p("→ run /session-start for full orientation (factory-line context + fast gate audits + interpretation).");
} catch (e) {
  p(`session-brief: could not complete (${(e && e.message) || e}) — run \`git status\` + /session-start manually.`);
}
console.log(out.join("\n"));
