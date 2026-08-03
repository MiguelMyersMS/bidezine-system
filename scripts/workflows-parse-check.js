#!/usr/bin/env node
/**
 * workflows-parse-check.js — parse-gate for the factory-line workflow scripts.
 *
 * WHY: the Workflow harness loads each `scripts/workflows/*.js` file, strips the
 * leading `export ` from `export const meta`, and evaluates the REST as the body of an
 * async function (top-level `return`/`await` are legal there). A plain `node --check`
 * therefore CANNOT validate these files — it rejects the top-level `return` and never
 * reaches a real bug. So a genuine syntax error (an unescaped apostrophe inside a
 * single-quoted string, a stray TypeScript annotation, an unterminated template) slips
 * past every local check and only surfaces at run time as
 *   "Script parse error: Unexpected token (L:C)"
 * which aborts the ENTIRE wave for every slug with an identical, misleading message.
 *
 * This guard parses each workflow script exactly the way the harness does (acorn, wrapped
 * in an async function, with `export ` stripped) so the SAME class of error is caught up
 * front — before any wave launches — with the precise file + line:col.
 *
 * Ref: LESSONS.md L9 (railbuttondark/logoslotdark errored on `spec's` in the GUIDE string).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let acorn
try { acorn = require('acorn') } catch {
  console.error('workflows-parse-check: `acorn` is not installed; cannot parse-gate workflow scripts.')
  process.exit(2)
}

const dir = path.join(__dirname, 'workflows')
let files = []
try { files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort() } catch {
  console.log('workflows-parse-check: no scripts/workflows dir; nothing to check.')
  process.exit(0)
}

let failed = 0
for (const f of files) {
  const p = path.join(dir, f)
  const src = fs.readFileSync(p, 'utf8')
  // Mirror the harness: drop the leading `export ` from `export const meta`, then wrap
  // the remaining body as an async function so top-level return/await are legal.
  const body = src.replace(/^export\s+/m, '')
  const wrapped = '(async function(args){\n' + body + '\n});'
  try {
    acorn.parse(wrapped, { ecmaVersion: 'latest', sourceType: 'script' })
  } catch (e) {
    failed++
    const line = e.loc ? e.loc.line - 1 : '?'   // -1 for the wrapper line we prepended
    const col = e.loc ? e.loc.column : '?'
    console.error(`FAIL  ${path.posix.join('scripts/workflows', f)}  (${line}:${col})  ${e.message}`)
    console.error(`      Common causes: an unescaped ' inside a single-quoted string, a stray`)
    console.error(`      TypeScript annotation (\`: string[]\`), or an unterminated template literal.`)
  }
}

if (failed) {
  console.error(`\nworkflows-parse-check: ${failed} workflow script(s) will fail to parse in the harness.`)
  process.exit(1)
}
console.log(`workflows-parse-check: ${files.length} workflow script(s) parse clean.`)
