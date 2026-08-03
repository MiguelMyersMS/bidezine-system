# Clarifications

The DS side's ANSWERS to deployer gap-requests. When a deployer files a `GAP` in its own `REQUESTS.md` (see
`../COMMUNICATION-PROTOCOL.md` §5), the design-system answers here — one file per organism,
`<organism>.md` — and, where possible, also folds the answer into the build prompt so the gap never recurs.

Deployers **read these fresh from GitHub each round**. This is the DS→deployer reply channel; the deployer→DS
request channel is the deployer's own `REQUESTS.md` (which the DS reads from the deployer's repo).

Entry format:

```text
## <organism> — answering GAP round <n> attempt <a> (<consumer>)
- Question: <the gap as filed>
- Answer:   <the specific value / artifact / decision>
- Folded into: <prompt/spec/bundle change ref, or "prompt updated inline"> (so it can't recur)
- Date: <YYYY-MM-DD>
```
