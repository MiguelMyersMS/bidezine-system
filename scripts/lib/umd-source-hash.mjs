// Deterministic hash of the inputs that shape the UMD bundle, used by the freshness gate.
// Hashing SOURCE TEXT (newline-normalized) rather than the built bytes avoids OS/tooling nondeterminism
// (CRLF, minifier order) that would make a byte-diff of the bundle false-positive across Windows/Linux.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const SRC = path.join(ROOT, "src");
const SKIP = new Set([".stories.tsx", ".stories.ts", ".test.ts", ".test.tsx"]);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name) && ![...SKIP].some((s) => e.name.endsWith(s))) out.push(full);
  }
  return out;
}

/** sha256 over all src/*.ts(x) (excluding stories/tests) + package.json dependencies, newline-normalized. */
export function sourceHash() {
  const files = walk(SRC).sort();
  const h = crypto.createHash("sha256");
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, "/");
    const body = fs.readFileSync(f, "utf-8").replace(/\r\n/g, "\n");
    h.update(rel + "\0" + body + "\0");
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
  h.update("deps\0" + JSON.stringify(pkg.dependencies || {}));
  return h.digest("hex");
}
