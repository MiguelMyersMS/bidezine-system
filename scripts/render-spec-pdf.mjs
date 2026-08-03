#!/usr/bin/env node
// Render a Markdown spec to a print-friendly PDF using Playwright.
// Usage: node scripts/render-spec-pdf.mjs <input.md> [output.pdf] [--html]
//
// Minimal Markdown -> HTML converter (no external deps).
// Then Playwright renders to A4 PDF with DS-aligned print CSS.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

// ───────────── Markdown → HTML (small but covers the spec's needs) ─────────────

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text) {
  // Order matters: code first (so its content isn't re-escaped/processed)
  const codeSpans = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(esc(code));
    return `@@C${codeSpans.length - 1}@@`;
  });

  text = esc(text);

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
    `<a href="${url}">${label}</a>`,
  );

  // Bold **x**
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic *x*  (avoid matching ** which we already handled)
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

  // Restore code spans
  text = text.replace(/@@C(\d+)@@/g, (_, i) => `<code>${codeSpans[+i]}</code>`);
  return text;
}

function renderTable(lines) {
  // First line is header, second is delimiter, rest are rows.
  const split = (l) => l.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
  const header = split(lines[0]);
  const align = split(lines[1]).map((d) => {
    const left = d.startsWith(":");
    const right = d.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
  const rows = lines.slice(2).map(split);
  const th = header
    .map((h, i) => `<th${align[i] ? ` style="text-align:${align[i]}"` : ""}>${renderInline(h)}</th>`)
    .join("");
  const trs = rows
    .map(
      (r) =>
        "<tr>" +
        r
          .map(
            (c, i) =>
              `<td${align[i] ? ` style="text-align:${align[i]}"` : ""}>${renderInline(c)}</td>`,
          )
          .join("") +
        "</tr>",
    )
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let listKind = null; // 'ul' | 'ol' | null
  let listItems = [];

  function flushList() {
    if (listKind) {
      out.push(`<${listKind}>${listItems.map((it) => `<li>${renderInline(it)}</li>`).join("")}</${listKind}>`);
      listKind = null;
      listItems = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushList();
      const lang = fence[1] || "";
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<pre class="lang-${lang}"><code>${esc(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }

    // Table (header line followed by delimiter line of pipes/dashes/colons)
    if (
      /^\s*\|.*\|\s*$/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?[\s\-:|]+\|?\s*$/.test(lines[i + 1]) &&
      /[-]/.test(lines[i + 1])
    ) {
      flushList();
      const tbl = [line.trim(), lines[i + 1].trim()];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        tbl.push(lines[i].trim());
        i++;
      }
      out.push(renderTable(tbl));
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      flushList();
      out.push("<hr/>");
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushList();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${mdToHtml(buf.join("\n"))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listKind !== "ul") {
        flushList();
        listKind = "ul";
      }
      listItems.push(ul[1]);
      i++;
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listKind !== "ol") {
        flushList();
        listKind = "ol";
      }
      listItems.push(ol[1]);
      i++;
      continue;
    }

    // Blank line
    if (/^\s*$/.test(line)) {
      flushList();
      i++;
      continue;
    }

    // Paragraph (consume consecutive non-blank, non-special lines)
    flushList();
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(buf.join(" "))}</p>`);
  }

  flushList();
  return out.join("\n");
}

// ───────────── Print template (DS-aligned typography & color) ─────────────

const PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  :root {
    --ink: #1c2024;
    --muted: #60646c;
    --subtle: #8b8d98;
    --hairline: #d9d9e0;
    --surface: #ffffff;
    --bgSubtle: #f9f9fb;
    --bgFaint: #f0f0f3;
    --accent: #5b5bd6;
    --accentText: #5753c6;
    --danger: #ce2c31;
    --code-bg: #f0f0f3;
    --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-display: 'Inter', system-ui, sans-serif;
    --font-mono: 'Consolas', 'Menlo', 'Courier New', monospace;
  }
  html, body { background: var(--surface); color: var(--ink); }
  body {
    font-family: var(--font-body);
    font-size: 10.5pt;
    line-height: 1.55;
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 {
    font-family: var(--font-display);
    font-size: 22pt;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.4pt;
    margin: 0 0 6pt;
    color: var(--ink);
  }
  h2 {
    font-family: var(--font-display);
    font-size: 14pt;
    font-weight: 600;
    line-height: 1.3;
    margin: 18pt 0 6pt;
    padding-bottom: 4pt;
    border-bottom: 0.75pt solid var(--hairline);
    color: var(--ink);
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    line-height: 1.3;
    margin: 14pt 0 4pt;
    color: var(--ink);
    page-break-after: avoid;
  }
  h4 {
    font-size: 10.5pt;
    font-weight: 600;
    line-height: 1.3;
    margin: 10pt 0 3pt;
    color: var(--ink);
    page-break-after: avoid;
  }
  p { margin: 0 0 6pt; }
  ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
  li { margin-bottom: 3pt; }
  li > p { margin: 0 0 3pt; }
  a { color: var(--accent); text-decoration: none; }
  a:visited { color: var(--accentText); }
  strong { font-weight: 600; color: var(--ink); }
  em { font-style: italic; }
  hr { border: 0; border-top: 0.5pt solid var(--hairline); margin: 12pt 0; }
  blockquote {
    margin: 8pt 0;
    padding: 8pt 12pt;
    border-left: 2pt solid var(--accent);
    background: var(--bgSubtle);
    color: var(--ink);
    border-radius: 4pt;
  }
  blockquote p:last-child { margin-bottom: 0; }
  code {
    font-family: var(--font-mono);
    font-size: 9pt;
    background: var(--code-bg);
    padding: 1pt 4pt;
    border-radius: 3pt;
    color: var(--ink);
  }
  pre {
    font-family: var(--font-mono);
    font-size: 8.5pt;
    line-height: 1.5;
    background: var(--code-bg);
    padding: 8pt 10pt;
    border-radius: 4pt;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 6pt 0 10pt;
    page-break-inside: avoid;
  }
  pre code { background: transparent; padding: 0; font-size: inherit; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 6pt 0 12pt;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 0.5pt solid var(--hairline);
    padding: 5pt 7pt;
    vertical-align: top;
    text-align: left;
  }
  th {
    background: var(--bgSubtle);
    font-weight: 600;
    color: var(--ink);
  }
  tbody tr:nth-child(even) td { background: #fafafb; }
  /* Page-break hints */
  h2, h3, h4 { break-after: avoid; }
  table, pre, blockquote { break-inside: avoid; }
  /* Cover header */
  .cover-meta {
    color: var(--muted);
    font-size: 9.5pt;
    margin: 0 0 16pt;
  }
  .cover-meta strong { color: var(--ink); }
`;

function wrapHtml(bodyHtml, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${PRINT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

// ───────────── Main ─────────────

async function main() {
  const args = process.argv.slice(2);
  const writeHtml = args.includes("--html");
  const positional = args.filter((arg) => arg !== "--html");

  const input = positional[0];
  if (!input) {
    console.error("Usage: node scripts/render-spec-pdf.mjs <input.md> [output.pdf] [--html]");
    process.exit(2);
  }
  const output = positional[1] || input.replace(/\.md$/, ".pdf");

  const md = await readFile(input, "utf8");
  const bodyHtml = mdToHtml(md);
  const title = path.basename(input, ".md");
  const html = wrapHtml(bodyHtml, title);

  // Optional: write intermediate HTML only in debug mode.
  const htmlPath = output.replace(/\.pdf$/, ".html");
  if (writeHtml) {
    await writeFile(htmlPath, html, "utf8");
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({
      path: output,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `<div style="font-family: Inter, sans-serif; font-size: 8pt; color: #80838d; width: 100%; text-align: center; padding: 0 16mm;">
        <span class="title"></span>
        <span style="margin: 0 6pt;">·</span>
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
    });
  } finally {
    await browser.close();
  }

  if (writeHtml) {
    console.log(`HTML written: ${htmlPath}`);
  }
  console.log(`PDF written:  ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
