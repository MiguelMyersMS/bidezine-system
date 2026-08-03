// Health orchestrator — runs all audits, updates history, reports overall.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { updateAuditHistory, ROOT } from "./lib/audit-core.js";

const args = process.argv.slice(2);
const record = args.includes("--record");
const strict = args.includes("--strict");
const skipBehavior = args.includes("--skip-behavior");

// Probe a URL (Storybook index) — resolves true on HTTP 200, false on timeout/error.
function probeUrl(url, timeoutMs) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode === 200); });
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve(false); });
    req.on("error", () => resolve(false));
  });
}

const audits = [
  { name: "kernel-audit", cmd: "node scripts/audit-kernel.js" },
  { name: "task-audit", cmd: "node scripts/audit-tasks.js" },
  { name: "token-audit", cmd: "node scripts/audit-tokens.js" },
  { name: "icon-audit", cmd: "node scripts/audit-icons.js" },
  { name: "a11y-audit", cmd: "node scripts/audit-a11y.js" },
  { name: "component-audit", cmd: "node scripts/audit-components.js" },
  { name: "atom-composition-audit", cmd: "node scripts/audit-atom-composition.js" },
  { name: "spec-audit", cmd: "node scripts/audit-specs.js" },
  { name: "export-parity-audit", cmd: "node scripts/audit-export-parity.js" },
  { name: "example-audit", cmd: "node scripts/audit-example.js" },
  { name: "prompts-sync", cmd: "node scripts/prompts-sync.js --check" },
  { name: "workflows-parse", cmd: "node scripts/workflows-parse-check.js" },
  // NOTE: the deploy audits (audit-deployment / audit-deploy-lifecycle / audit-deploy-verify) are NOT in
  // DS health. Deploy handoffs are CONSUMER-OWNED and live in each consumer's workspace, not this
  // design-language repo — so DS health must not gate on per-project deploy data. Those scripts remain as
  // reusable deploy-run TOOLS: the deploy pipeline (and any consumer) runs them with DEPLOY_DIR pointed at
  // the consumer's own handoff root. See docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md.
];

let hasBlocker = false;

for (const { name, cmd } of audits) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT });
  } catch {
    hasBlocker = true;
  }
}

// Update audit history only when explicitly recording
if (record) {
  updateAuditHistory();
  console.log("\n[audit-history] Updated docs/registry/audit-history.json");
}

// Typecheck
console.log("\n[typecheck] Running tsc --noEmit...");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit", cwd: ROOT });
  console.log("[typecheck] PASS");
} catch {
  hasBlocker = true;
  console.log("[typecheck] FAIL");
}

// Behavioral tests (Storybook test-runner) — the browser-rendered BEHAVIOR gate.
// This is what makes component behavior machine-enforced (search filters, expand/collapse,
// scroll, disabled, etc.), not just static structure. Requires Storybook running and
// reachable at STORYBOOK_URL (defaults to http://localhost:6006 for backward compatibility).
// Under the multi-agent worktree workflow (docs/process/MULTI-AGENT-WORKTREES.md) each
// worktree runs its own Storybook on its own port — set STORYBOOK_URL (e.g.
// `STORYBOOK_URL=http://localhost:6100 npm run health:strict`) so the gate targets THIS
// worktree's Storybook instead of colliding with the main clone's :6006 instance.
// Pass `--skip-behavior` to bypass for quick audits-only runs.
if (!skipBehavior) {
  const storybookUrl = process.env.STORYBOOK_URL || "http://localhost:6006";
  console.log(`\n[behavior] Checking Storybook on ${storybookUrl} ...`);
  const sbUp = await probeUrl(`${storybookUrl}/index.json`, 2500);
  if (!sbUp) {
    hasBlocker = true;
    console.log(`[behavior] ✗ Storybook not reachable on ${storybookUrl} — start it (\`npm run storybook\`), or set STORYBOOK_URL to point at your worktree's instance, or pass \`--skip-behavior\`. The behavioral gate is REQUIRED.`);
  } else {
    console.log("[behavior] Running test-storybook ...");
    try {
      execSync(`npx test-storybook --no-index-json --url ${storybookUrl} --maxWorkers=2`, { stdio: "inherit", cwd: ROOT });
      console.log("[behavior] PASS");
    } catch {
      hasBlocker = true;
      console.log("[behavior] FAIL");
    }
  }
}

// In strict mode, HIGH findings also fail.
//
// ORPHAN GUARD (added 2026-08-01, owner-approved). This block used to sum `summary.high` across
// EVERY `*-latest.json` in docs/audits/ — including artifacts left behind by audits that no longer
// run. That is how the required CI gate went red on master for a day: an untracked
// `story-shape-audit-latest.json` — produced by an `audit-story-shape.js` that does NOT exist in this
// repo — was swept into commit 21907be by a `git add docs/audits/`. It reported `high: 5` with five
// EMPTY finding objects — no id, no file, no message — and nothing could ever clear it, because no
// audit regenerates it. (That script lived on `chore/molecule-gate-tightenings`, held unmerged since
// 2026-07-09; the owner ABANDONED it on 2026-08-02 and the branch was deleted. No audit produces
// `story-shape-audit-latest.json` anymore — if one ever reappears, this guard is what catches it.)
//
// The fix TIGHTENS the gate rather than loosening it: an artifact with no producing audit is now a
// LOUD BLOCKER naming the file, instead of a silent phantom added to the HIGH count. A stale file can
// no longer fail the build for an unfixable reason, and it equally cannot hide a real finding — the
// only way to satisfy the gate is to delete the artifact or re-wire the audit that produces it.
if (strict && !hasBlocker) {
  const auditsDir = path.join(ROOT, "docs/audits");
  if (fs.existsSync(auditsDir)) {
    const latestFiles = fs.readdirSync(auditsDir).filter((f) => f.endsWith("-latest.json"));
    // Every artifact a real audit produces. NOT derivable from the `audits` array above: several of
    // these are written by audits invoked through their own npm scripts rather than this runner
    // (consumer-sync, deployment-audit, evidence-audit), and `example-audit` writes `example-latest.json`
    // — the name does not match its entry. Inferring producers by grep proved fragile, so this list is
    // explicit and reviewable: ADD A NAME HERE when you add an audit that writes an artifact.
    const KNOWN_ARTIFACTS = new Set([
      "a11y-audit",
      "atom-composition-audit",
      "component-audit",
      "consumer-sync",
      "deployment-audit",
      "evidence-audit",
      "example",
      "icon-audit",
      "kernel-audit",
      "spec-audit",
      "task-audit",
      "token-audit",
    ]);
    const orphans = latestFiles.filter((f) => !KNOWN_ARTIFACTS.has(f.replace(/-latest\.json$/, "")));
    let highCount = 0;

    for (const f of latestFiles) {
      if (orphans.includes(f)) continue; // never counted — reported as a blocker below
      const data = JSON.parse(fs.readFileSync(path.join(auditsDir, f), "utf-8"));
      highCount += data.summary?.high ?? 0;
    }

    if (orphans.length > 0) {
      hasBlocker = true;
      console.log(
        `\n✗ health:strict — ${orphans.length} ORPHANED audit artifact(s) in docs/audits/ with no ` +
          `audit to produce them:`
      );
      for (const f of orphans) console.log(`    ${f}`);
      console.log(
        `  Each is stale output from an audit that no longer runs, so its findings can never be\n` +
          `  cleared. Delete the file, or re-wire its audit into the \`audits\` array in this script.`
      );
    }

    if (highCount > 0) {
      hasBlocker = true;
      console.log(`\n✗ health:strict — ${highCount} HIGH findings also fail in strict mode`);
    }
  }
}

// Overall summary
console.log(hasBlocker ? "\n✗ health: FAIL" : "\n✓ health: all checks passed");
process.exit(hasBlocker ? 1 : 0);
