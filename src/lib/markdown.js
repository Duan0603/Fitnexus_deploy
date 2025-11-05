// Minimal, safe-ish Markdown renderer for common syntax
// Supports: headings, paragraphs, bold/italic, inline code, code fences, links, hr, blockquotes, lists
// Strategy: escape HTML first, then convert markdown to HTML and only inject our own tags

const escapeHtml = (s = '') =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sanitizeUrl = (url = '') => {
  const u = String(url).trim();
  // Allow only http(s) and mailto links
  if (/^(https?:|mailto:)/i.test(u)) return u;
  return '#';
};

export function renderMarkdown(md) {
  if (!md) return '';
  let src = escapeHtml(String(md).replaceAll('\r\n', '\n'));

  // Extract fenced code blocks first: ```lang\n...\n```
  const codeBlocks = [];
  src = src.replace(/```([\w+-]+)?\n([\s\S]*?)\n```/g, (_, lang, body) => {
    const index = codeBlocks.push({ lang: lang || '', body }) - 1;
    return `@@CODEBLOCK_${index}@@`;
  });
  // Handle unclosed last fence variant
  src = src.replace(/```([\w+-]+)?\n([\s\S]*?)```/g, (_, lang, body) => {
    const index = codeBlocks.push({ lang: lang || '', body }) - 1;
    return `@@CODEBLOCK_${index}@@`;
  });

  // Extract inline code `...`
  const inlineCodes = [];
  src = src.replace(/`([^`\n]+)`/g, (_, body) => {
    const index = inlineCodes.push(body) - 1;
    return `@@INLINE_${index}@@`;
  });

  // Block-level processing line by line
  const lines = src.split('\n');
  const out = [];
  let listType = null; // 'ul' | 'ol'

  const closeListIfNeeded = () => {
    if (listType) {
      out.push(listType === 'ul' ? '</ul>' : '</ol>');
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeListIfNeeded();
      out.push('<hr />');
      continue;
    }

    // Headings # .. ######
    const h = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (h) {
      closeListIfNeeded();
      const level = Math.min(6, h[1].length);
      out.push(`<h${level}>${h[2]}</h${level}>`);
      continue;
    }

    // Blockquote
    const bq = /^>\s?(.*)$/.exec(trimmed);
    if (bq) {
      closeListIfNeeded();
      out.push(`<blockquote><p>${bq[1]}</p></blockquote>`);
      continue;
    }

    // Ordered list
    let m = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (m) {
      if (listType !== 'ol') {
        closeListIfNeeded();
        listType = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${m[1]}</li>`);
      continue;
    }

    // Unordered list
    m = /^[-*+]\s+(.+)$/.exec(trimmed);
    if (m) {
      if (listType !== 'ul') {
        closeListIfNeeded();
        listType = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${m[1]}</li>`);
      continue;
    }

    // Blank line closes lists; also separate paragraphs
    if (!trimmed) {
      closeListIfNeeded();
      out.push('');
      continue;
    }

    // Normal paragraph
    closeListIfNeeded();
    out.push(`<p>${trimmed}</p>`);
  }
  closeListIfNeeded();

  let html = out.join('\n');

  // Inline transforms (bold, italic, links) — after paragraphs, before code restore
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) =>
    `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
  );

  // Bold: **text** or __text__
  html = html.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');
  // Italic: *text* or _text_
  html = html.replace(/(\*|_)([^*_][\s\S]*?)\1/g, '<em>$2</em>');

  // Restore inline code
  html = html.replace(/@@INLINE_(\d+)@@/g, (_, idx) => {
    const body = inlineCodes[Number(idx)] ?? '';
    return `<code>${body}</code>`;
  });

  // Restore code blocks
  html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => {
    const b = codeBlocks[Number(idx)] || { lang: '', body: '' };
    const cls = b.lang ? ` class="language-${b.lang.toLowerCase()}"` : '';
    return `<pre><code${cls}>${b.body}</code></pre>`;
  });

  return html;
}

export default renderMarkdown;

