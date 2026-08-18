// ═══════════════════════════════════════════════════════════════════════════════════
// One lexical scan, answering both "where are the comments" and "where are the string/
// template literals" from a single pass — because those two questions cannot be
// answered independently.
//
// Issue 06d: the first attempt at fixing stripComments (scripts/lib/strip-comments.mjs,
// now deleted) computed literal spans by running classLiterals over the RAW,
// still-commented source, then only blanked a comment marker that fell outside one of
// those spans. That is backwards: classLiterals had no way to know a `"var(--foreground)"`
// sitting inside a `//`-prefixed line comment was punctuation inside prose, not a real
// string opening — it saw the quote, started scanning for a close, and (finding more
// quote/backtick punctuation later in the same multi-line comment) ran on until the cap
// fired. Computing literal spans requires already knowing what's a comment, and
// stripping comments requires already knowing what's a literal. Deriving one from the
// other is an ordering bug by construction, not something patchable in either function
// — comments and string literals are mutually exclusive LEXICAL states, and only a
// single scan that is, at every character, in exactly one of them can tell the two
// apart correctly.
//
// ── The states ───────────────────────────────────────────────────────────────────────
//   CODE           — the default: a `/` here might start a comment (checked first); a
//                    quote or backtick here starts a literal. Anything else is plain code.
//   LINE_COMMENT   — from `//` to the next `\n` (exclusive) or EOF.
//   BLOCK_COMMENT  — from `/*` to the matching `*/` (inclusive), or EOF if unterminated.
//   LITERAL        — from an opening `"`, `'` or `` ` `` to its matching close, per the
//                    same rules classLiterals has always used: a backslash escapes the
//                    next character, the quote closes only on its OWN kind, a template
//                    literal may contain `${...}` interpolation (tracked by brace depth)
//                    and literal newlines, and a length cap (LITERAL_CAP) yields a
//                    `truncated` span rather than silently dropping an oversized one.
//
// A `/` is only ever treated as a comment marker, never as a possible regex-literal
// delimiter. This is a decision, not an oversight: every regex literal found in the
// directories these gates scan (src/, site/src/, sandbox/src/ — six call sites, all
// `.replace(/…/, …)`) was checked by hand, and none contains a quote or backtick
// character inside the pattern. A scanner that treated `/` as regex-aware would need to
// disambiguate "divide" from "regex start" using the preceding token, which this file's
// callers never need since no literal quote/backtick sits inside any regex here — so
// that complexity is not built. If a future regex literal in these directories ever
// contains a quote or backtick, this scanner will misread it as opening a string/
// comment; this comment is the flag for whoever adds one to come back here.
//
// ── What each existing consumer becomes ─────────────────────────────────────────────
//   classLiterals   — a thin filter over this scan's `literal` spans; same cap, same
//                      `truncated` flag, same `{ value, index }` shape it always yielded.
//   stripComments   — a thin blanking pass over this scan's `line-comment` and
//                      `block-comment` spans, preserving newlines exactly as before.
// Neither keeps its own scanning logic, and no call site keeps a private copy of either.
//
// ── scripts/lib/ is not another gate ────────────────────────────────────────────────
// Same reasoning as this module's predecessor: this exports no verdict, no exit code,
// no notion of "passing" — the role scripts/lib/dependencies.mjs already plays for
// scan-dependencies.mjs. check-rules.mjs and check-type-slots.mjs each import from here
// independently; neither imports the other, and neither's exit code depends on the
// other's.
// ═══════════════════════════════════════════════════════════════════════════════════

// See class-literals.mjs's retired header for the full history of this cap; unchanged
// here — a literal longer than this is reported as `truncated: true`, never dropped.
export const LITERAL_CAP = 2000

/**
 * Yields one span per comment or literal found in `source`, in source order, as
 * `{ kind, start, end, value, truncated }`:
 *
 *   - `kind: "line-comment"`  — `start`/`end` bracket `//` through the `\n` it stops at
 *     (exclusive) or EOF. No `value`/`truncated`.
 *   - `kind: "block-comment"` — `start`/`end` bracket `/*` through the matching `*\/`
 *     (inclusive), or through EOF if unterminated. No `value`/`truncated`.
 *   - `kind: "literal"`       — `start` is the opening quote's offset, `end` is one
 *     past the closing quote (or one past the last character actually scanned, if
 *     `truncated`). `value` is the literal's content (capped at LITERAL_CAP characters
 *     if truncated); `truncated` is `true` only when the literal ran past the cap
 *     before closing.
 *
 * Plain code between spans is not yielded — callers only need to know where comments
 * and literals are, never the code around them.
 */
export function* lexicalScan(source) {
  const len = source.length
  let i = 0

  while (i < len) {
    const c = source[i]

    // A `/` in plain code is only ever a comment marker here — see this module's
    // header for why regex-literal delimiters are deliberately not disambiguated.
    if (c === "/" && source[i + 1] === "/") {
      const start = i
      let j = i + 2
      while (j < len && source[j] !== "\n") j++
      yield { kind: "line-comment", start, end: j }
      i = j
      continue
    }

    if (c === "/" && source[i + 1] === "*") {
      const start = i
      let j = i + 2
      while (j < len && !(source[j] === "*" && source[j + 1] === "/")) j++
      const end = j < len ? j + 2 : len
      yield { kind: "block-comment", start, end }
      i = end
      continue
    }

    if (c === '"' || c === "'" || c === "`") {
      const quote = c
      const start = i
      let j = i + 1
      let closed = false
      let truncated = false
      let templateDepth = 0 // depth inside a `${ ... }` interpolation; 0 = plain literal text

      while (j < len) {
        const ch = source[j]

        if (ch === "\\") {
          j += 2 // the escape and the character it escapes are never a closing quote
          continue
        }

        if (quote === "`") {
          if (templateDepth === 0 && ch === "$" && source[j + 1] === "{") {
            templateDepth = 1
            j += 2
            continue
          }
          if (templateDepth > 0) {
            // Inside `${...}`, braces are counted to find the interpolation's own end;
            // a quote character in here (e.g. `${a ? "x" : "y"}`) is not itself
            // re-scanned as a nested literal — it contains no `{`/`}` of its own, so it
            // cannot desynchronize the depth count. See this module's header: a nested
            // literal whose OWN content held an unbalanced brace would, and the safe
            // direction on that (never seen in this codebase) is to over-count depth,
            // which keeps scanning rather than closing the template literal early.
            if (ch === "{") templateDepth++
            else if (ch === "}") templateDepth--
            j++
            continue
          }
          if (ch === "`") {
            closed = true
            break
          }
          // a literal newline is legal inside a template literal — keep scanning
        } else {
          if (ch === "\n") break // real JS string literals can't hold a literal newline: not a match
          if (ch === quote) {
            closed = true
            break
          }
        }

        if (j - start - 1 >= LITERAL_CAP) {
          truncated = true
          break
        }
        j++
      }

      if (!closed && !truncated) {
        // Hit EOF, or (for a "/'-quoted attempt) a literal newline before any closing
        // quote — this opening character does not start a literal this scan can
        // resolve. Resume one character past it so a later quote in the same run of
        // text still gets its own independent attempt.
        i = start + 1
        continue
      }

      const end = truncated ? start + 1 + LITERAL_CAP : j + 1
      yield { kind: "literal", start, end, value: source.slice(start + 1, truncated ? start + 1 + LITERAL_CAP : j), truncated }
      i = end
      continue
    }

    i++
  }
}

/**
 * Yields `{ value, index, truncated }` for every string/template literal in `source`,
 * in source order — a thin filter over lexicalScan's `literal` spans. `index` is the
 * character offset of the OPENING quote. See lexicalScan's header for the four cases
 * this is correct on (embedded opposite-kind quotes, backslash-escaped same-kind
 * quotes, template-literal `${...}` interpolation, and the non-silent cap).
 */
export function* classLiterals(source) {
  for (const span of lexicalScan(source)) {
    if (span.kind !== "literal") continue
    yield { value: span.value, index: span.start, truncated: span.truncated }
  }
}

/** Strips line comments and block comments (including the JSX brace-wrapped form),
 * preserving line numbering so a reported line still points at the right place — a
 * thin blanking pass over lexicalScan's comment spans. Because the comment and literal
 * questions are answered by the same scan, a `//` or `/*` sitting inside a real string
 * or template literal (a doc-page code sample deliberately displaying commented-out
 * example text, say) is never mistaken for a real comment marker, and a quote or
 * backtick sitting inside a real comment (prose describing code, containing `` ` ``
 * or `"`/`'` as ordinary punctuation) is never mistaken for a literal opening. */
export function stripComments(source) {
  let result = source
  for (const span of lexicalScan(source)) {
    if (span.kind === "literal") continue
    const blanked = source.slice(span.start, span.end).replace(/[^\n]/g, " ")
    result = result.slice(0, span.start) + blanked + result.slice(span.end)
  }
  return result
}
