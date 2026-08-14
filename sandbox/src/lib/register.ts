import type { CorpusDivergence } from "@/data/corpus"

/**
 * Which of §3.10's three registers a row is written in.
 *
 * ── Why this exists as its own module ──────────────────────────────────────────────
 * The register decides what a human is being asked for, and that turns out to be a
 * DIFFERENT question from the gate's own "what is still unmet". Every one of the 11
 * `decide` rows reports `evidence.present` and `review.present` unmet, so the queue —
 * which buckets on gate status — filed all 11 under "waiting on a machine" and told the
 * human "No divergence is currently waiting on a decision from you." Eleven cards said
 * Decide; the list said nothing did.
 *
 * The asymmetry is real, not a bucketing slip:
 *
 *   confirm · close   the machine goes first — measure, review — and a human ratifies.
 *                     The gate's ordering is exactly right for these.
 *   decide            the human goes first. No measurement produces H-2's duration or
 *                     G-1's radius step; someone has to choose, and only then is there
 *                     something to measure. Gating these behind `evidence.present` waits
 *                     on evidence that cannot exist yet.
 *
 * ── The fallback is a CONVENTION, not a stored fact, and is checked ────────────────
 * `register` is not a column yet. Until it is, this reads the authoring convention: every
 * `decide` prompt contains the word "Decide" and no `confirm` prompt does — asserted
 * bidirectionally by each authoring script as it wrote, and re-asserted by Copilot before
 * each batch landed. That makes it reliable TODAY and fragile in exactly the way
 * CLAUDE.md checklist item 15 describes: it depends on a naming habit rather than on data.
 *
 * So it is not left to be trusted. `verify-review-cards.mjs` pins the derived `decide` set
 * against the 11 refs it is known to be, and fails if the convention ever drifts. When the
 * real column lands, `row.register` wins and the fallback stops being consulted — the
 * check keeps working either way, because it asserts the RESULT, not the mechanism.
 */
export type Register = "decide" | "confirm" | "close"

/** The close register's constant tail — §3.10. Its own presence IS the register. */
const CLOSE_TAIL = "Found and fixed during build"

export function registerOf(row: CorpusDivergence): Register | null {
  // The future column, once it exists. Preferred unconditionally: a stored fact beats a
  // convention, and this is the line that retires the fallback without touching callers.
  const stored = (row as { register?: string }).register
  if (stored === "decide" || stored === "confirm" || stored === "close") return stored

  const prompt = row.reviewPrompt
  // Not "confirm by default" — an undescribed row has no register at all, and saying
  // otherwise would put it in a bucket claiming a human had been asked something.
  if (!prompt) return null

  if (prompt.includes(CLOSE_TAIL)) return "close"
  if (/\bDecide\b/.test(prompt)) return "decide"
  return "confirm"
}
