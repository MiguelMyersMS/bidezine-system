// Git stage snapshot — "where is my work?" across the full lifecycle:
//   working tree (unstaged) -> untracked -> staged -> committed(unpushed) -> pushed(unmerged) -> master.
// Prints a per-stage table with COUNT, OLDEST age, a NEXT-step hint, and the actual ITEMS, so nothing
// is sitting forgotten at a stage. Shown at session start (by the /session-start skill) and on demand
// via `npm run git:stages`. Read-only; never throws; always exits 0. execFileSync (no shell) so it is
// quoting-safe on Windows + POSIX. Complements scripts/session-brief.js (which is the higher-level
// orientation); this is the detailed stage ledger. See docs/GIT_WORKFLOW.md.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const lines = (s) => (s ? s.split("\n").filter(Boolean) : []);

function relAge(ms) {
  if (!ms) return "—";
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d` : h > 0 ? `${h}h` : m > 0 ? `${m}m` : `${s}s`;
}
function oldestMtime(files) {
  let oldest = null;
  for (const f of files) {
    try { const t = fs.statSync(path.join(ROOT, f)).mtimeMs; if (oldest === null || t < oldest) oldest = t; } catch {}
  }
  return oldest;
}
function oldestCommit(range) {
  const t = lines(git("log", "--format=%ct", range)).map(Number).filter(Boolean);
  return t.length ? Math.min(...t) * 1000 : null;
}
function summarize(items, n = 2) {
  if (!items.length) return "—";
  const head = items.slice(0, n).join(", ");
  return items.length > n ? `${head}, +${items.length - n} more` : head;
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD") || "(detached)";
const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
const trunk = git("rev-parse", "--verify", "--quiet", "origin/master") ? "origin/master"
  : git("rev-parse", "--verify", "--quiet", "master") ? "master" : "";

const unstaged = lines(git("diff", "--name-only"));
const untracked = lines(git("ls-files", "--others", "--exclude-standard"));
const staged = lines(git("diff", "--cached", "--name-only"));
const unpushedRange = upstream ? `${upstream}..HEAD` : "";
const unpushed = upstream ? lines(git("log", "--oneline", unpushedRange)) : lines(git("log", "--oneline", "-20"));
const unmergedRange = trunk && upstream ? `${trunk}..${upstream}` : "";
const unmerged = unmergedRange ? lines(git("log", "--oneline", unmergedRange)) : [];

const rows = [
  { stage: "working tree (unstaged)",        items: unstaged,  age: oldestMtime(unstaged),  next: "stage/discard" },
  { stage: "untracked (new)",                items: untracked, age: oldestMtime(untracked), next: "add/ignore/del" },
  { stage: "staged (uncommitted)",           items: staged,    age: oldestMtime(staged),    next: "commit" },
  { stage: "committed, not pushed",          items: unpushed,  age: upstream ? oldestCommit(unpushedRange) : null, next: "push", n0: !upstream },
  { stage: "pushed, not merged -> master",   items: unmerged,  age: unmergedRange ? oldestCommit(unmergedRange) : null, next: "open PR" },
];

const W = { stage: 32, n: 4, age: 7, next: 16 };
const pad = (s, w) => String(s).padEnd(w);
const out = [];
out.push(`Git stages — ${branch}${upstream ? "" : "  ⚠ NO UPSTREAM (git push -u origin " + branch + ")"}`);
out.push(`  (upstream: ${upstream || "none"} · trunk: ${trunk || "none"})`);
out.push("");
out.push(pad("STAGE", W.stage) + pad("N", W.n) + pad("OLDEST", W.age) + pad("NEXT", W.next) + "ITEMS");
for (const r of rows) {
  const count = r.n0 ? "?" : r.items.length;
  const age = r.items.length ? relAge(r.age) : "—";
  const next = r.items.length ? r.next : "—";
  out.push(pad(r.stage, W.stage) + pad(count, W.n) + pad(age, W.age) + pad(next, W.next) + summarize(r.items));
}
out.push("");
out.push(`trunk tip (merged): ${trunk ? git("log", "-1", "--format=%h %s", trunk) : "(no master ref)"}`);

const loose = unstaged.length + untracked.length + staged.length;
const risk = unpushed.length && upstream ? `${unpushed.length} committed but NOT pushed (not backed up — git push)` : "0 unpushed";
out.push(`summary: ${loose} loose file(s) in working tree · ${risk} · ${unmerged.length} unmerged to master`);

console.log(out.join("\n"));
