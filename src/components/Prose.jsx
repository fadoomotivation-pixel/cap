import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { parseMarkdown, setWhatsappPhone } from '../lib/prose';
import { site } from '../data/site';

function trackCta(id) {
  if (!id || typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'cta_click', { cta_id: id });
  }
}

function Inline({ nodes }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'text') return <React.Fragment key={i}>{n.text}</React.Fragment>;
        if (n.type === 'strong') {
          return <strong key={i} className="font-semibold text-[#10243E]"><Inline nodes={n.children} /></strong>;
        }
        if (n.type === 'em') {
          return <em key={i}><Inline nodes={n.children} /></em>;
        }
        if (n.type === 'link') {
          const className = 'text-[#9C7C1C] hover:underline font-medium';
          const cta = n.cta ? { 'data-cta': n.cta } : {};
          if (n.href.startsWith('http')) {
            return (
              <a key={i} href={n.href} className={className} target="_blank" rel="noopener noreferrer" {...cta}>
                <Inline nodes={n.children} />
              </a>
            );
          }
          if (n.href.startsWith('#')) {
            return (
              <a key={i} href={n.href} className={className} {...cta}>
                <Inline nodes={n.children} />
              </a>
            );
          }
          return (
            <Link key={i} to={n.href} className={className} {...cta}>
              <Inline nodes={n.children} />
            </Link>
          );
        }
        return null;
      })}
    </>
  );
}

function Table({ head, rows }) {
  const cols = Math.max(head.length, ...rows.map((r) => r.length), 1);
  return (
    <div className="overflow-x-auto my-7 -mx-6 px-6 lg:mx-0 lg:px-0">
      <table className="w-full text-sm border border-gray-200" style={{ minWidth: `${Math.max(520, cols * 160)}px` }}>
        {head.length > 0 && head.some((c) => c.length) && (
          <thead>
            <tr className="bg-[#10243E] text-white text-left">
              {head.map((cell, j) => (
                <th key={j} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider align-top">
                  <Inline nodes={cell} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, j) => (
            <tr key={j} className={j % 2 ? 'bg-gray-50' : 'bg-white'}>
              {row.map((cell, k) => (
                <td key={k} className={`px-4 py-3 border-t border-gray-100 align-top ${k === 0 ? 'text-[#10243E] font-medium' : 'text-gray-600'}`}>
                  <Inline nodes={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders the research markdown with the site's article typography.
 * `slots` swaps {{TIMELINE}}, {{TOUR}}, {{INFRA}} and {{PHOTOS}} for React nodes.
 */
export default function Prose({ markdown, slots = {}, contained = false }) {
  setWhatsappPhone(site.phone);
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div
      className="prose-cb"
      onClick={(e) => {
        const el = e.target.closest?.('[data-cta]');
        if (el) trackCta(el.getAttribute('data-cta'));
      }}
    >
      {blocks.map((b, i) => {
        const inner = renderBlock(b, i, slots);
        if (!inner) return null;
        if (contained || b.type === 'timeline' || b.type === 'tour' || b.type === 'infra' || b.type === 'photos') {
          return <React.Fragment key={i}>{inner}</React.Fragment>;
        }
        const shell = b.type === 'table' ? 'max-w-5xl mx-auto px-6' : 'max-w-3xl mx-auto px-6';
        return <div key={i} className={shell}>{inner}</div>;
      })}
    </div>
  );
}

function renderBlock(b, i, slots) {
        if (b.type === 'anchor') {
          return <span key={i} id={b.id} className="block scroll-mt-28" />;
        }
        if (b.type === 'timeline' || b.type === 'tour' || b.type === 'infra' || b.type === 'photos') {
          return <React.Fragment key={i}>{slots[b.type] || null}</React.Fragment>;
        }
        if (b.type === 'hr') {
          return <hr key={i} className="my-10 border-gray-200" />;
        }
        if (b.type === 'heading') {
          const Tag = `h${b.level}`;
          const cls = b.level === 2
            ? 'text-2xl lg:text-3xl font-heading text-[#10243E] mt-14 mb-5 leading-snug'
            : b.level === 3
              ? 'text-xl font-heading text-[#10243E] mt-8 mb-3 leading-snug'
              : 'text-lg font-semibold text-[#10243E] mt-6 mb-2';
          return <Tag key={i} className={cls}><Inline nodes={b.children} /></Tag>;
        }
        if (b.type === 'p') {
          return (
            <p key={i} className="text-gray-600 leading-[1.85] mb-4 text-[15px] lg:text-base">
              <Inline nodes={b.children} />
            </p>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} className="my-8 border-l-2 border-[#D4AF37] pl-6 text-[#10243E]">
              {b.paragraphs.map((p, j) => (
                <p key={j} className="text-lg lg:text-xl font-light leading-relaxed mb-3 last:mb-0">
                  <Inline nodes={p} />
                </p>
              ))}
            </blockquote>
          );
        }
        if (b.type === 'list') {
          const List = b.ordered ? 'ol' : 'ul';
          return (
            <List key={i} className="space-y-3 my-6">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-4 text-gray-600 leading-[1.8] text-[15px] lg:text-base">
                  {b.ordered ? (
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#9C7C1C] text-xs font-bold flex items-center justify-center mt-0.5">
                      {j + 1}
                    </span>
                  ) : (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-3" />
                  )}
                  <span><Inline nodes={item} /></span>
                </li>
              ))}
            </List>
          );
        }
        if (b.type === 'table') {
          return <Table key={i} head={b.head} rows={b.rows} />;
        }
        return null;
}
