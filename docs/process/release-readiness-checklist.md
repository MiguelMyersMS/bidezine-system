# Release Readiness Checklist — @miguel/design-system

> Run this checklist before any release tag. Do not tag until all gates pass
> and the user approves the exact tag command and release notes.

## Pre-Release Gates

### 1. Working Tree
- [ ] `git status --short` — clean (no uncommitted changes)
- [ ] `git stash list` — no unexpected stashes

### 2. Commit History
- [ ] `git log --oneline` — review commits since last tag
- [ ] All commit messages follow convention (`fix:`, `feat:`, `docs:`, `chore:`)
- [ ] No WIP or fixup commits remain

### 3. Tag Check
- [ ] `git tag --points-at HEAD` — no existing tag on HEAD (unless re-tagging)
- [ ] Previous tag verified: `git tag --sort=-v:refname | head -1`

### 4. Health (Strict)
- [ ] `npm run health:strict` — 0 findings all categories
- [ ] Token audit: 0 BLOCKER, 0 HIGH
- [ ] Icon audit: 0 BLOCKER, 0 HIGH
- [ ] Accessibility audit: 0 BLOCKER, 0 HIGH
- [ ] Component audit: 0 BLOCKER, 0 HIGH
- [ ] `tsc --noEmit` — 0 errors

### 5. Storybook
- [ ] `npm run test:storybook` — build succeeds
- [ ] All stories render without errors

### 6. Evidence Gate
- [ ] `npm run audit:evidence` — PASS (0 findings)
- [ ] Any failures confirmed as transient (re-run to verify)

### 7. Consumer Sync
- [ ] `npm run consumer:sync` — all active consumers clean
- [ ] 0 active findings (BLOCKER/HIGH/MEDIUM/LOW)
- [ ] Waived findings reviewed and still valid

### 8. Docs App Build (Consumer Integration Gate)
- [ ] `cd app && npm run build` — tsc + vite build succeeds
- [ ] No new TypeScript errors

> The docs app is a dogfooding consumer build gate. Visual validation has moved to Storybook foundation and component stories.

### 9. Registry / Audit Artifact Review
- [ ] `npm run registry:refresh` — run if source files changed
- [ ] If registry JSON files changed, summarize exactly what changed
- [ ] Audit JSON files: any diff under `docs/audits/` now means the audit RESULT changed (artifacts are
      written only on change — `writeJsonIfChanged` in `scripts/lib/audit-core.js`). Review it and
      COMMIT it; do **NOT** `git checkout --` it. (Before 2026-08-02 these churned on every run and
      discarding them was safe; it no longer is — that would destroy real audit data.)

### 10. Release Notes
- [ ] Release notes drafted with exact commit hashes
- [ ] Component maturity status stated accurately (e.g., "RailNav remains beta")
- [ ] No claims of stability, production readiness, or screen-reader testing unless verified
- [ ] User approved the exact release notes text

### 11. Tag
- [ ] Exact tag command shown to user
- [ ] User approved the tag command
- [ ] `git tag -a vX.Y.Z -m "..."` executed
- [ ] `git tag --points-at HEAD` confirms tag

### 12. Push
- [ ] `git push origin vX.Y.Z` — tag pushed
- [ ] `git push origin master` — branch pushed (if approved)
- [ ] GitHub release created with approved notes (if approved)

### 13. Package Publish
- [ ] **Not published unless explicitly approved**
- [ ] npm/package registry publish is a separate approval gate

---

## Bloodwork Consumer Verification (when applicable)

- [ ] `git status --short` — clean
- [ ] `git branch --show-current` — correct branch
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx vite build` — build succeeds
- [ ] Screenshots captured for visual changes (light + dark)
- [ ] No design-system internals modified from consumer
- [ ] Consumer evidence documented (branch, commits, what was validated)
