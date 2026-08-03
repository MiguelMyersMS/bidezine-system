# Verifier Checklist

Status: required before marking tasks done

## A) Criteria Validation

For each acceptance criterion:
- Criterion ID:
- Result: PASS or FAIL
- Evidence:

A task cannot be completed if any mandatory criterion is FAIL.

## B) Source Authority Validation

1. Was authority order applied?
- AGENTS.md
- Active atomic spec
- Code
- Historical docs
Result: PASS or FAIL

2. Any unresolved contradiction?
- If yes, stop and escalate.
Result: PASS or FAIL

## C) Protocol Validation

1. Were required approval gates respected?
Result: PASS or FAIL

2. Any Golden Rule risk introduced?
Result: PASS or FAIL

3. If risk exists, was explicit approval captured?
Result: PASS or FAIL or N/A

## D) Technical Validation

Run relevant checks and record outcome:
- npm run health
- npm run test:storybook
- npm run audit:evidence
- npm run consumer:sync
- component-specific checks

Result: PASS or FAIL per check

## E) Evidence Quality

1. Is evidence concrete and reproducible?
Result: PASS or FAIL

2. Is there at least one external signal?
Examples: test output, lint output, signed evidence, Figma data
Result: PASS or FAIL

3. Is completion based on proof, not narrative?
Result: PASS or FAIL

## F) Final Verdict

Overall result:
- PASS: all mandatory sections pass
- FAIL: one or more mandatory sections fail

Residual risks:
- 

Next action:
- Complete
- Fix and re-verify
- Escalate to owner
