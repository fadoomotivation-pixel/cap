// Constrained markdown for the Dholera pillar and the four research posts.
// Enough for headings, tables, lists, blockquotes, anchors and inline links.
// Not a general markdown engine.

const DEFAULT_WA =
  'Hi Capital Brix, please send the current Dholera plot list, with distances to the expressway, airport and activation area.';

// Phone is passed in so this parser stays free of the site data module.
let waPhone = '917048917300';

export function setWhatsappPhone(phone) {
  if (phone) waPhone = String(phone);
}

export function whatsappHref(message = DEFAULT_WA) {
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message || DEFAULT_WA)}`;
}

export function resolveHref(href) {
  if (!href) return href;
  if (href === '{{WHATSAPP_URL}}') return whatsappHref();
  if (href.startsWith('{{WHATSAPP:')) {
    const msg = href.slice('{{WHATSAPP:'.length).replace(/\}\}$/, '');
    return whatsappHref(msg);
  }
  if (href === '{{SITE_VISIT_URL}}' || href === '{{CALLBACK_URL}}') return '/contact';
  if (href === '{{CHECKLIST_URL}}') return '/blog/how-to-verify-a-dholera-plot';
  if (href === '{{SEMINAR_URL}}') return '/events/dholera-wealth-2026';
  return href;
}

function parseInline(src) {
  const out = [];
  let i = 0;
  const pushText = (s) => {
    if (!s) return;
    const prev = out[out.length - 1];
    if (prev && prev.type === 'text') prev.text += s;
    else out.push({ type: 'text', text: s });
  };

  while (i < src.length) {
    if (src.startsWith('**', i)) {
      const end = src.indexOf('**', i + 2);
      if (end !== -1) {
        out.push({ type: 'strong', children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (src[i] === '*' && src[i + 1] !== '*') {
      const end = src.indexOf('*', i + 1);
      if (end !== -1 && !src.slice(i + 1, end).includes('\n')) {
        out.push({ type: 'em', children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    if (src.startsWith('[cta:', i)) {
      const end = src.indexOf(']', i);
      if (end !== -1) {
        out.push({ type: 'cta', id: src.slice(i + 5, end).trim() });
        i = end + 1;
        continue;
      }
    }
    if (src[i] === '[') {
      const close = src.indexOf(']', i + 1);
      if (close !== -1 && src[close + 1] === '(') {
        const hrefEnd = src.indexOf(')', close + 2);
        if (hrefEnd !== -1) {
          const label = src.slice(i + 1, close);
          const href = src.slice(close + 2, hrefEnd).trim();
          out.push({ type: 'link', href: resolveHref(href), children: parseInline(label) });
          i = hrefEnd + 1;
          continue;
        }
      }
    }
    const next = nextSpecial(src, i + 1);
    pushText(src.slice(i, next));
    i = next;
  }
  return attachCtas(out);
}

function nextSpecial(src, from) {
  const idxs = ['**', '*', '[cta:', '['].map((t) => {
    const at = src.indexOf(t, from);
    return at === -1 ? src.length : at;
  });
  return Math.min(...idxs, src.length);
}

function attachCtas(nodes) {
  const out = [];
  for (const node of nodes) {
    if (node.type === 'cta') {
      const prev = findLastLink(out);
      if (prev) prev.cta = node.id;
      continue;
    }
    out.push(node);
  }
  return out;
}

function findLastLink(nodes) {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const n = nodes[i];
    if (n.type === 'link') return n;
    if (n.children) {
      const inner = findLastLink(n.children);
      if (inner) return inner;
    }
  }
  return null;
}

function plainText(nodes) {
  return nodes.map((n) => {
    if (n.type === 'text') return n.text;
    if (n.children) return plainText(n.children);
    return '';
  }).join('');
}

function isTableSep(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function splitRow(line) {
  let raw = line.trim();
  if (raw.startsWith('|')) raw = raw.slice(1);
  if (raw.endsWith('|')) raw = raw.slice(0, -1);
  return raw.split('|').map((cell) => parseInline(cell.trim()));
}

export function parseMarkdown(markdown) {
  const lines = String(markdown || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const blocks = [];
  let i = 0;

  const push = (block) => blocks.push(block);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const anchor = trimmed.match(/^<a id="([^"]+)"><\/a>$/);
    if (anchor) {
      push({ type: 'anchor', id: anchor[1] });
      i += 1;
      continue;
    }

    if (trimmed === '{{TIMELINE}}' || trimmed === '{{TOUR}}' || trimmed === '{{INFRA}}' || trimmed === '{{PHOTOS}}') {
      push({ type: trimmed.slice(2, -2).toLowerCase() });
      i += 1;
      continue;
    }

    if (trimmed === '---') {
      push({ type: 'hr' });
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      push({ type: 'heading', level: heading[1].length, children: parseInline(heading[2]) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoted = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoted.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const text = quoted.join('\n');
      const parts = text.split(/\n\s*\n/).filter(Boolean);
      push({
        type: 'quote',
        paragraphs: parts.map((p) => parseInline(p.replace(/\n/g, ' '))),
      });
      continue;
    }

    if (trimmed.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!isTableSep(lines[i])) rows.push(splitRow(lines[i]));
        i += 1;
      }
      const [head, ...body] = rows;
      push({ type: 'table', head: head || [], rows: body });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^[-*]\s+/, '')));
        i += 1;
      }
      push({ type: 'list', ordered: false, items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^\d+\.\s+/, '')));
        i += 1;
      }
      push({ type: 'list', ordered: true, items });
      continue;
    }

    const para = [line];
    i += 1;
    while (
      i < lines.length
      && lines[i].trim()
      && !lines[i].trim().startsWith('#')
      && !lines[i].trim().startsWith('|')
      && !lines[i].trim().startsWith('>')
      && !lines[i].trim().startsWith('<a ')
      && lines[i].trim() !== '---'
      && !/^[-*]\s+/.test(lines[i].trim())
      && !/^\d+\.\s+/.test(lines[i].trim())
      && !lines[i].trim().startsWith('{{')
    ) {
      para.push(lines[i]);
      i += 1;
    }
    push({ type: 'p', children: parseInline(para.join(' ')) });
  }

  return blocks;
}

/** FAQ pairs actually rendered, so JSON-LD cannot drift from the page. */
export function faqsFromMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const faqs = [];
  let inFaq = false;
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (/^##\s+/.test(t) && /faq/i.test(t)) {
      inFaq = true;
      continue;
    }
    if (inFaq && /^##\s+/.test(t)) break;
    if (!inFaq) continue;

    let question = null;
    const h3 = t.match(/^###\s+(.*)$/);
    const bold = t.match(/^\*\*(.+)\*\*$/);
    if (h3) question = h3[1].trim();
    else if (bold) question = bold[1].trim();
    if (!question) continue;

    const answer = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j += 1;
    while (
      j < lines.length
      && lines[j].trim()
      && !lines[j].trim().startsWith('#')
      && !/^\*\*.+\*\*$/.test(lines[j].trim())
      && lines[j].trim() !== '---'
    ) {
      answer.push(lines[j].trim());
      j += 1;
    }
    const text = answer.join(' ').replace(/\*\*/g, '').replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1$2').trim();
    if (text) faqs.push({ q: question, a: text });
    i = j - 1;
  }
  return faqs;
}

export { plainText };
