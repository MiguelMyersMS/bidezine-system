#!/usr/bin/env bash
# Cloud-wave environment bootstrap — bring a fresh cloud session UP to wave-ready.
#
# WHY: the factory-line waves (/evidence-wave, /create-wave, /deploy-wave) require Storybook
# serving on http://localhost:6006, and their scout EXPLICITLY refuses to start it
# (create-pipeline.js / deploy-pipeline.js: "do NOT start it"). In an interactive session a human
# runs `npm run storybook`; an UNATTENDED cloud routine has no human, so this script is the
# environment's boot step: install deps, launch Storybook in the background, and block until it is
# actually serving — so when the routine's prompt (`/evidence-wave <level>`) fires, the scout finds
# storybookUp:true. Run this as the cloud environment's setup/startup command, BEFORE the routine.
#
# SECRETS (must be provided by the cloud environment, never committed):
#   FIGMA_API_KEY        — required: captures + the re-fetching reviewers need it.
#   EVIDENCE_CHECK_TOKEN — required for cryptographic signing (advisory/pilot until provisioned;
#                          see docs/FOLLOWUPS.md + docs/evidence/GUIDE.md §10).
#
# USAGE:  bash scripts/cloud-wave-env.sh        # blocks until Storybook is ready, then exits 0
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT="${STORYBOOK_PORT:-6006}"
READY_URL="http://localhost:${PORT}/index.json"
TIMEOUT="${STORYBOOK_TIMEOUT:-300}"   # seconds to wait for Storybook to serve
LOG="${STORYBOOK_LOG:-/tmp/storybook-cloud.log}"

say() { printf '[cloud-wave-env] %s\n' "$*"; }

# 1. Secrets present? Fail LOUD, not silently later inside the wave.
[ -n "${FIGMA_API_KEY:-}" ] || { say "FATAL: FIGMA_API_KEY not set — captures + reviewers cannot fetch Figma."; exit 2; }
if [ -z "${EVIDENCE_CHECK_TOKEN:-}" ]; then
  say "WARN: EVIDENCE_CHECK_TOKEN not set — evidence signing will be advisory, not cryptographic (docs/FOLLOWUPS.md)."
fi

# 2. Dependencies. npm ci is the CI-proven install (see .github/workflows/ci.yml).
if [ ! -d node_modules ]; then
  say "installing dependencies (npm ci)…"
  npm ci
else
  say "node_modules present — skipping install."
fi

# 3. If Storybook is already serving (idempotent re-run), don't launch a second one.
if curl -fsS "$READY_URL" >/dev/null 2>&1; then
  say "Storybook already serving on :${PORT} — env is wave-ready."
  exit 0
fi

# 4. Launch Storybook in the background (the wave will NOT do this).
say "launching Storybook on :${PORT} in the background (log: ${LOG})…"
nohup npm run storybook -- -p "$PORT" >"$LOG" 2>&1 &
SB_PID=$!
say "Storybook pid=${SB_PID}; waiting up to ${TIMEOUT}s for ${READY_URL}…"

# 5. Block until /index.json actually serves (the exact check the scout runs), or time out.
elapsed=0
until curl -fsS "$READY_URL" >/dev/null 2>&1; do
  if ! kill -0 "$SB_PID" 2>/dev/null; then
    say "FATAL: Storybook process died during startup. Last log lines:"; tail -n 40 "$LOG" || true
    exit 1
  fi
  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    say "FATAL: Storybook did not serve within ${TIMEOUT}s. Last log lines:"; tail -n 40 "$LOG" || true
    exit 1
  fi
  sleep 3; elapsed=$((elapsed + 3))
done

say "Storybook is serving on :${PORT} (waited ${elapsed}s) — env is WAVE-READY."
say "Next: the routine prompt (e.g. '/evidence-wave atoms') can now run; its scout will see storybookUp:true."
