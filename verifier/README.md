# The verifier

Milestone 2 of [the Sandbox](../docs/SANDBOX-SPEC.md). The process that turns a claim
into evidence.

## Why it exists

An agent can write a plausible number. `CLAUDE.md` records the case that proves it: an AI
produced SVG path data by reasoning about what the icon probably looked like — valid
syntax, plausible shape, completely wrong, and it passed typecheck, build and a live
smoke test. A fabricated `getBoundingClientRect` result is the same trick and easier,
because numbers look like numbers.

So the division is absolute:

> **The agent chooses what to verify. The runner produces the result. The agent never
> authors a value.**

The runner holds the `runner_evidence` credential — the only identity in the system
permitted to `INSERT` into `sandbox.evidence`. An agent connecting with its own
credential cannot write that table at all; `db/verify-invariant.mjs` proves it against
the live database rather than asserting it.

## What a check spec is

A JSON file under `checks/<component>/<ref-code>.json`, committed to git.

Specs live in the repository, not in the database, on purpose. A weak spec — one that
measures nothing meaningful, or asserts what it already knows to be true — is a real
risk, and the defence against it is that the spec appears in a diff where a human or a
reviewing agent can see it. A spec hidden in a table is a spec nobody reads.

```json
{
  "component": "rail-sidebar",
  "divergence": "L-34",
  "url": "http://localhost:4199/",
  "anchor": "L-34",
  "checks": [
    {
      "kind": "computed-style",
      "state": "rest",
      "expect": { "line-height": "20px", "font-weight": "500" }
    },
    {
      "kind": "box",
      "state": "rest",
      "expect": { "height": 36 },
      "tolerance": 0.5
    },
    {
      "kind": "computed-style",
      "state": "hover",
      "expect": { "background-color": "oklch(0.269 0 0)" }
    },
    { "kind": "screenshot", "state": "hover" }
  ]
}
```

`anchor` is the `data-divergence` attribute value in the component's own markup. The
anchor lives in the code so it moves when the code moves; the spec only names it. An
anchor that resolves to nothing produces a **failing** evidence row, not a crash — a
check that cannot find its subject has failed, and the gate must see that.

### Kinds

| Kind | Measures | Asserts? |
|---|---|---|
| `computed-style` | `getComputedStyle` properties | yes |
| `box` | `getBoundingClientRect` — `width`, `height`, `top`, `left`, `right`, `bottom` | yes |
| `screenshot` | a PNG of the element, hashed | **no** |

Screenshots record what something looked like. They do not claim anything is correct, so
they cannot satisfy the gate's evidence requirement on their own — `db/migrations/005`
enforces that. They are supporting material for a human's eye, captured by the runner so
an agent cannot substitute an image.

### States

Each check names the interaction state to measure in. The runner drives the real thing;
it does not read a class name and infer.

| State | How the runner produces it |
|---|---|
| `rest` | no interaction |
| `hover` | `locator.hover()` |
| `active` | `mouse.down()` held for the measurement |
| `focus` | `locator.focus()` |
| `focus-visible` | `Tab` pressed first to set keyboard modality, then `focus()` — Chromium grants `:focus-visible` on the last input modality, so a bare `focus()` will not show the ring |
| `disabled` | none; point the spec at an element that is already disabled |

### Expectations are mandatory

A check with no `expect` fails, with `no expectations declared` as the reason. This is
deliberate: a measurement that asserts nothing would otherwise be a passing evidence row
that proves nothing, which is precisely the hole `005` closed for screenshots.

`tolerance` applies to numeric comparisons only and defaults to `0`.

## Running it

```bash
npm --prefix verifier install
npm --prefix verifier run check -- checks/rail-sidebar/L-34.json   # one spec
npm --prefix verifier run check -- --all                           # every spec
npm --prefix verifier run sync-source                              # git → source_file
npm --prefix verifier run verify                                   # M2's proof
```

`sync-source` runs as the **admin** principal, not the runner: it maintains
`sandbox.source_file`, which is how the gate answers "is this evidence older than the
code it describes?" without trusting its caller. Run it after any commit that touches an
anchored file, or the gate will keep refusing on `evidence.current`.

## What lands in the database

One evidence row per check, written by the runner:

- `check_spec` — the exact check that ran, so it can be re-run and reproduce
- `raw_output` — every value measured, not a summary of them; a summary is an assertion
- `passed` — whether every expectation held
- `verified_at_commit` / `verified_at_commit_at` — the working tree's HEAD and its date
- `run_id` — one UUID per invocation, so a batch is traceable
- `artifact_hash` — sha256 of a screenshot, so the image cannot be swapped
- `created_by` — defaults to `SUSER_SNAME()`; the runner cannot forge it, and no other
  principal can write the row at all

## The rule that keeps this honest

Never run the verifier — or anything else — under the `admin` or `runner` principal to
get past a permission error while doing agent work. The agent principal's inability to
write evidence is not an obstacle to route around. It is the single control the entire
Sandbox rests on.
