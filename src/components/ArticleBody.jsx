import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb } from 'lucide-react';

/** Bold spans written as **…** in the content data. Keeps the data files
 *  readable without pulling in a markdown dependency for one feature. */
export function RichText({ children }) {
  const parts = String(children).split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="font-semibold text-[#10243E]">{p.slice(2, -2)}</strong>
          : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}

/**
 * The long-form section renderer shared by blog posts and the Dholera pillar
 * pages. Both are "answer the query, then expand" content, so they get the
 * same typography rather than two drifting copies of it.
 */
export default function ArticleBody({ sections }) {
  return (
    <>
      {sections.map((s, i) => (
        <motion.section
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          {s.h2 && (
            <h2 className="text-2xl lg:text-3xl font-heading text-[#10243E] mb-5 leading-snug">{s.h2}</h2>
          )}

          {(s.p || []).map((para, j) => (
            <p key={j} className="text-gray-600 leading-[1.85] mb-4 text-[15px] lg:text-base">
              <RichText>{para}</RichText>
            </p>
          ))}

          {s.list && (
            s.list.ordered ? (
              <ol className="space-y-3 my-6">
                {s.list.items.map((it, j) => (
                  <li key={j} className="flex gap-4 text-gray-600 leading-[1.8] text-[15px] lg:text-base">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#9C7C1C] text-xs font-bold flex items-center justify-center mt-0.5">
                      {j + 1}
                    </span>
                    <span><RichText>{it}</RichText></span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="space-y-3 my-6">
                {s.list.items.map((it, j) => (
                  <li key={j} className="flex gap-4 text-gray-600 leading-[1.8] text-[15px] lg:text-base">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-3" />
                    <span><RichText>{it}</RichText></span>
                  </li>
                ))}
              </ul>
            )
          )}

          {s.table && (
            <div className="overflow-x-auto my-7 -mx-6 px-6 lg:mx-0 lg:px-0">
              <table className="w-full text-sm border border-gray-200 min-w-[560px]">
                <thead>
                  <tr className="bg-[#10243E] text-white text-left">
                    {s.table.head.map((h, j) => (
                      <th key={j} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, j) => (
                    <tr key={j} className={j % 2 ? 'bg-gray-50' : 'bg-white'}>
                      {row.map((cell, k) => (
                        <td key={k} className={`px-4 py-3 border-t border-gray-100 align-top ${k === 0 ? 'text-[#10243E] font-medium' : 'text-gray-600'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {s.callout && (
            <aside className={`my-7 rounded-xl border p-5 flex gap-4 ${
              s.callout.tone === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-[#F5F1E4] border-[#E3D6A8]'
            }`}>
              <span className="shrink-0 mt-0.5">
                {s.callout.tone === 'warn'
                  ? <AlertTriangle size={20} className="text-amber-600" />
                  : <Lightbulb size={20} className="text-[#9C7C1C]" />}
              </span>
              <div>
                <p className="font-semibold text-[#10243E] mb-1">{s.callout.title}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{s.callout.text}</p>
              </div>
            </aside>
          )}
        </motion.section>
      ))}
    </>
  );
}
