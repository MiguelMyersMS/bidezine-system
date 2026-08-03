// Consumer governance sync — check/apply generated governance docs.
// Default mode is read-only. Apply requires --consumer and never commits.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib/audit-core.js";

const KIT_DIR = path.join(ROOT, "docs/consumer-governance");
const MANIFEST_PATH = path.join(KIT_DIR, "manifests/consumer-governance-manifest.json");
const GENERATED_MARKER = "Generated from @miguel/design-system consumer governance kit. Do not edit directly.";
const LOCAL_OVERRIDE = "docs/process/local-governance-overrides.md";

const args = process.argv.slice(2);
const mode = args.includes("--apply") ? "apply" : "check";
const consumerArg = readArg("--consumer");

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function normalize(relPath) {
  return relPath.replace(/\\/g, "/");
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeKitHash(manifest) {
  const parts = [JSON.stringify(manifest)];
  for (const file of manifest.files) {
    parts.push(file.template);
    parts.push(fs.readFileSync(path.join(KIT_DIR, file.template), "utf-8"));
  }
  return sha256(parts.join("\n"));
}

function renderTemplate(template, metadata) {
  return template
    .replaceAll("{{kitVersion}}", metadata.kitVersion)
    .replaceAll("{{kitHash}}", metadata.kitHash)
    .replaceAll("{{generatedAt}}", metadata.generatedAt)
    .replaceAll("{{consumerName}}", metadata.consumerName);
}

function resolveConsumerRoot(input) {
  const fullPath = path.resolve(ROOT, input);
  if (!fs.existsSync(fullPath)) fail(`consumer path does not exist: ${input}`);
  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) fail(`consumer path is not a directory: ${input}`);
  return fullPath;
}

function consumerName(consumerRoot) {
  const pkgPath = path.join(consumerRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = loadJson(pkgPath);
      if (pkg.name) return pkg.name;
    } catch {
      // Fall through to directory name.
    }
  }
  return path.basename(consumerRoot);
}

function gitStatusShort(repoRoot) {
  try {
    return execFileSync("git", ["-C", repoRoot, "status", "--short"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : "";
    fail(`could not read consumer git status${stderr ? `: ${stderr}` : ""}`);
  }
}

function isAllowedTarget(target, manifest) {
  const normalized = normalize(target);
  if (normalized === normalize(LOCAL_OVERRIDE)) return false;
  return manifest.safety.allowed_target_prefixes.some((prefix) => {
    const p = normalize(prefix);
    return normalized === p || normalized.startsWith(p);
  });
}

function analyzeTarget(consumerRoot, target, content) {
  const targetPath = path.join(consumerRoot, target);
  if (!fs.existsSync(targetPath)) {
    return { target, status: "missing", action: "create", targetPath };
  }

  const current = fs.readFileSync(targetPath, "utf-8");
  if (!current.includes(GENERATED_MARKER)) {
    return { target, status: "local-owned", action: "refuse", targetPath };
  }

  if (current === content) {
    return { target, status: "current", action: "none", targetPath };
  }

  return { target, status: "outdated", action: "update", targetPath };
}

function printPlan({ mode, consumerRoot, kitVersion, kitHash, results }) {
  console.log("Consumer governance sync");
  console.log(`Mode: ${mode}`);
  console.log(`Kit version: ${kitVersion}`);
  console.log(`Kit hash: ${kitHash}`);
  console.log(`Consumer: ${consumerRoot ? consumerRoot : "(none; kit self-check only)"}`);
  console.log();

  if (!consumerRoot) {
    console.log("No --consumer target provided. Check mode validated kit metadata only.");
    console.log("Apply mode requires --consumer and was not run.");
    return;
  }

  console.log("File plan:");
  for (const result of results) {
    console.log(`  ${result.action.padEnd(6)} ${result.target} (${result.status})`);
  }
  console.log();
}

if (args.includes("--help")) {
  console.log(`Usage:
  node scripts/consumer-governance-sync.js [--check]
  node scripts/consumer-governance-sync.js --check --consumer ../consumer
  node scripts/consumer-governance-sync.js --apply --consumer ../consumer

Safety:
  --check is default and read-only.
  --apply requires --consumer, refuses dirty consumers, and writes only generated governance docs.`);
  process.exit(0);
}

if (mode === "apply" && !consumerArg) {
  fail("--apply requires an explicit --consumer target");
}

if (!fs.existsSync(MANIFEST_PATH)) fail(`manifest not found: ${MANIFEST_PATH}`);

const manifest = loadJson(MANIFEST_PATH);
const kitHash = computeKitHash(manifest);
const generatedAt = new Date().toISOString();
const consumerRoot = consumerArg ? resolveConsumerRoot(consumerArg) : null;
const metadata = {
  kitVersion: manifest.version,
  kitHash,
  generatedAt,
  consumerName: consumerRoot ? consumerName(consumerRoot) : "Consumer Project",
};

const rendered = manifest.files.map((file) => {
  if (!isAllowedTarget(file.target, manifest)) {
    fail(`manifest target is outside allowed governance paths: ${file.target}`);
  }
  const template = fs.readFileSync(path.join(KIT_DIR, file.template), "utf-8");
  return {
    ...file,
    content: renderTemplate(template, metadata),
  };
});

const results = consumerRoot
  ? rendered.map((file) => analyzeTarget(consumerRoot, file.target, file.content))
  : [];

printPlan({ mode, consumerRoot, kitVersion: manifest.version, kitHash, results });

if (!consumerRoot) {
  process.exit(0);
}

const refused = results.filter((result) => result.action === "refuse");
if (refused.length > 0) {
  console.log("Refused files:");
  for (const result of refused) {
    console.log(`  ${result.target} — existing file does not contain generated marker`);
  }
  if (mode === "apply") {
    fail("apply refused to overwrite local-owned governance files");
  }
}

const drift = results.filter((result) => ["create", "update"].includes(result.action));

if (mode === "check") {
  console.log(`Drift: ${drift.length === 0 && refused.length === 0 ? "none" : "detected"}`);
  console.log("No files written.");
  process.exit(refused.length > 0 ? 1 : 0);
}

const status = gitStatusShort(consumerRoot);
if (status) {
  fail(`consumer working tree is dirty; refusing apply\n${status}`);
}

console.log("Apply target files:");
for (const result of drift) {
  console.log(`  ${result.action} ${result.target}`);
}
console.log();

for (const file of rendered) {
  const result = results.find((item) => item.target === file.target);
  if (!result || !["create", "update"].includes(result.action)) continue;
  fs.mkdirSync(path.dirname(result.targetPath), { recursive: true });
  fs.writeFileSync(result.targetPath, file.content);
}

console.log(`Applied ${drift.length} governance file(s).`);
console.log("No commits, pushes, tags, releases, packages, baselines, or app/source/component files were modified by this script.");
