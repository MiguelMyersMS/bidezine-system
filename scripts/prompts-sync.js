#!/usr/bin/env node
// Single source of truth for skill commands: .claude/skills/<name>/SKILL.md
// This script GENERATES the catalog/Copilot mirror .github/prompts/<name>.prompt.md from it,
// so the two surfaces can never drift (you edit the skill; the prompt file regenerates).
//
//   node scripts/prompts-sync.js          → write/refresh every mirror
//   node scripts/prompts-sync.js --check  → assert every mirror is in sync; exit 1 on drift (CI/health)
//
// Prompts that have NO corresponding skill (a11y-audit, smell, sync-step, governor, …) are
// Copilot-only and are left untouched — only skill-backed commands are mirrored.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKILLS = path.join(ROOT, ".claude/skills");
const PROMPTS = path.join(ROOT, ".github/prompts");
const check = process.argv.includes("--check");

// Normalize away line-ending + BOM differences so a CRLF checkout / stray BOM is not false drift.
const norm = (s) => String(s || "").replace(/^﻿/, "").replace(/\r\n/g, "\n");

const names = fs.existsSync(SKILLS)
  ? fs.readdirSync(SKILLS).filter((d) => fs.existsSync(path.join(SKILLS, d, "SKILL.md"))).sort()
  : [];

const drift = [];
let wrote = 0;
for (const name of names) {
  const src = fs.readFileSync(path.join(SKILLS, name, "SKILL.md"), "utf8");
  const dest = path.join(PROMPTS, `${name}.prompt.md`);
  const cur = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : null;
  if (cur !== null && norm(cur) === norm(src)) continue;
  if (check) { drift.push(name); continue; }
  fs.writeFileSync(dest, src);
  wrote++;
  console.log(`  synced ${name}.prompt.md`);
}

if (check) {
  if (drift.length) {
    console.error(`✗ prompts out of sync: ${drift.join(", ")} — run \`npm run prompts:sync\` (the .claude/skills SKILL.md is the source of truth).`);
    process.exit(1);
  }
  console.log(`✓ prompts: ${names.length} skill mirror(s) in sync (.github/prompts/ generated from .claude/skills/)`);
} else {
  console.log(`✓ prompts: sync complete — ${wrote} updated of ${names.length} skill mirror(s)`);
}
