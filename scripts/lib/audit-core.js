// Shared audit infrastructure — findings, severity, output.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");

export const SEV = { BLOCKER: "blocker", HIGH: "high", MEDIUM: "medium", LOW: "low" };

function writeJsonWithRetry(targetPath, payload, attempts = 3) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });

  for (let i = 0; i < attempts; i += 1) {
    const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${i}`;
    try {
      fs.writeFileSync(tmpPath, payload);
      fs.renameSync(tmpPath, targetPath);
      return true;
    } catch {
      // Best-effort cleanup for failed temp writes.
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup failures
      }
    }
  }

  return false;
}

export function finding(id, severity, message, file, line, extras) {
  return { primary_id: id, severity, message, file: file ?? undefined, line: line ?? undefined, ...extras };
}

/** Read a source file relative to ROOT. Returns empty string if missing. */
export function readSource(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
}

/** List files in a directory matching an extension. Returns relative paths. */
export function listFiles(dir, ext) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(ext))
    .map((f) => dir.replace(/\\/g, "/") + "/" + f);
}

/**
 * Write `nextObject` as pretty JSON to `targetPath` ONLY IF its content actually changed,
 * ignoring the provenance keys in `ignoreKeys` (e.g. date/timestamp).
 *
 * WHY (2026-08-02, governor-vetted): every audit used to rewrite its `*-latest.json` on EVERY run,
 * so a `npm run health` left ~12 tracked files "modified" with nothing but a new timestamp. That made
 * a genuinely clean tree impossible and manufactured phantom "pending work" — the owner lost days to it.
 * After this change, a diff under docs/audits/ means the audit's ANSWER changed, which is the only
 * diff worth reading. Consequence to know: `date`/`timestamp` now record when the RESULT last changed,
 * NOT when the audit last ran. Run provenance lives in the console + CI log (see the skip marker).
 *
 * HARD CONSTRAINT — the comparison is on PARSED OBJECTS, never on bytes/strings/hashes. The repo is
 * used on Windows with core.autocrlf=true, so the on-disk file is CRLF while this writer emits LF; a
 * byte comparison would never match and the guard would silently do nothing. (Worse, an LF-over-CRLF
 * rewrite shows as ` M` in `git status` while `git diff` prints NOTHING — invisible, non-self-healing
 * dirt. That is why .gitattributes pins these paths to eol=lf.)
 *
 * Compares the FULL object minus `ignoreKeys` — never an allowlist of kept keys — so any field added
 * to the result later is automatically compared instead of being silently frozen on disk forever.
 * FAIL-OPEN: any parse failure, missing file, or shape drift falls through to writing. The failure
 * mode is "writes when it need not", never "keeps a wrong file".
 *
 * @returns {{ok: boolean, skipped: boolean}}
 */
export function writeJsonIfChanged(targetPath, nextObject, ignoreKeys = []) {
  // Deterministic serialization: sort keys so parse/insertion order can never fake a difference.
  const canonical = (value) => {
    const strip = (v) => {
      if (Array.isArray(v)) return v.map(strip);
      if (v && typeof v === "object") {
        return Object.keys(v)
          .sort()
          .reduce((acc, k) => {
            acc[k] = strip(v[k]);
            return acc;
          }, {});
      }
      return v;
    };
    const clone = JSON.parse(JSON.stringify(value));
    for (const k of ignoreKeys) delete clone[k];
    return JSON.stringify(strip(clone));
  };

  try {
    if (fs.existsSync(targetPath)) {
      const prev = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      if (canonical(prev) === canonical(nextObject)) return { ok: true, skipped: true };
    }
  } catch {
    // Unreadable/unparseable/shape drift → fall through and write.
  }

  const ok = writeJsonWithRetry(targetPath, JSON.stringify(nextObject, null, 2) + "\n");
  return { ok, skipped: false };
}

/**
 * Write audit result JSON (only when findings/summary changed), print summary, return exit code.
 * NOTE: `date`/`timestamp` therefore record when the RESULT last changed, not when the audit last ran.
 */
export function writeAuditResult(auditName, findings) {
  const now = new Date();
  const summary = {
    blocker: findings.filter((f) => f.severity === SEV.BLOCKER).length,
    high: findings.filter((f) => f.severity === SEV.HIGH).length,
    medium: findings.filter((f) => f.severity === SEV.MEDIUM).length,
    low: findings.filter((f) => f.severity === SEV.LOW).length,
    total: findings.length,
  };
  const result = {
    audit: auditName,
    date: now.toISOString().slice(0, 10),
    timestamp: now.toISOString(),
    summary,
    findings,
  };

  const auditsDir = path.join(ROOT, "docs/audits");
  const latestPath = path.join(auditsDir, `${auditName}-latest.json`);
  const { ok: writeOk, skipped } = writeJsonIfChanged(latestPath, result, ["date", "timestamp"]);

  // Console output. The skip marker is REQUIRED, not cosmetic: once an unchanged artifact stops being
  // rewritten, this line is the only evidence the audit actually executed — run provenance moved here.
  const tag = summary.blocker > 0 ? "FAIL" : "PASS";
  console.log(
    `[${auditName}] ${tag} — ${summary.total} findings (${summary.blocker}B ${summary.high}H ${summary.medium}M ${summary.low}L)` +
      (skipped ? " (unchanged — artifact not rewritten)" : ""),
  );
  for (const f of findings) {
    const loc = f.file ? ` ${f.file}${f.line ? `:${f.line}` : ""}` : "";
    console.log(`  ${f.severity.toUpperCase().padEnd(7)} ${f.primary_id}${loc}`);
    console.log(`          ${f.message}`);
  }

  if (!writeOk) {
    console.warn(`[${auditName}] WARN — could not write ${latestPath} (continuing with in-memory audit result)`);
  }

  return { summary, exitCode: summary.blocker > 0 ? 1 : 0 };
}

/** Aggregate latest audit JSONs into docs/registry/audit-history.json */
export function updateAuditHistory() {
  const auditsDir = path.join(ROOT, "docs/audits");
  const registryDir = path.join(ROOT, "docs/registry");
  fs.mkdirSync(registryDir, { recursive: true });

  const latestFiles = fs.existsSync(auditsDir)
    ? fs.readdirSync(auditsDir).filter((f) => f.endsWith("-latest.json"))
    : [];

  const audits = latestFiles.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(auditsDir, f), "utf-8"));
    return { audit: data.audit, date: data.date, timestamp: data.timestamp, scope: "full", summary: data.summary };
  });

  const history = {
    _meta: {
      generated: new Date().toISOString().slice(0, 10),
      source: "docs/audits/",
      description: "Audit history index. Populated by running audit skills.",
    },
    audits,
  };

  const historyPath = path.join(registryDir, "audit-history.json");
  const ok = writeJsonWithRetry(historyPath, JSON.stringify(history, null, 2) + "\n");
  if (!ok) {
    console.warn(`[audit-history] WARN — could not write ${historyPath}`);
  }
}

/** Scan lines of a source file with a callback. */
export function scanLines(relPath, callback) {
  const content = readSource(relPath);
  if (!content) return;
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;
    callback(line, i + 1, relPath);
  }
}
