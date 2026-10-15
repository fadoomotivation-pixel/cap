import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Newspaper, Eye, Send, Power, RefreshCw, ExternalLink } from 'lucide-react';

/**
 * The daily Dholera update — 2:10 PM, real news, a status image for the team.
 *
 * The `dholera-news` Edge Function picks one fresh story from Google News and
 * posts it with a link to /story/<date>. This panel is its control: on/off,
 * which groups get it, Preview (what would go out today), Pick again, and
 * Send now. Preview saves a draft, and that draft is what 2:10 sends — so
 * what the founder looked at is what the team receives.
 *
 * Groups are ticked from the ones the attendance messages already use, never
 * typed: a WhatsApp group id is shown nowhere inside WhatsApp, and a wrong one
 * does not fail loudly.
 */
export default function DholeraNewsPanel({ mainGroup, teams = [], connected }) {
  const [cfg, setCfg] = useState(null);
  const [recent, setRecent] = useState([]);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('cb_news_settings').select('enabled, targets').eq('id', 1).maybeSingle();
    setCfg(data || { enabled: true, targets: [] });
    const { data: rows } = await supabase
      .from('cb_dholera_news')
      .select('news_date, status, headline_hi, headline_en, source_name, detail, posted_at')
      .order('news_date', { ascending: false })
      .limit(5);
    setRecent(rows || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const groups = [
    ...(mainGroup ? [{ id: mainGroup, name: 'Main group' }] : []),
    ...teams.filter((t) => t.wa_group_id).map((t) => ({ id: t.wa_group_id, name: t.name })),
  ];
  // Empty means "the main group", so it works before anybody edits it.
  const chosen = cfg?.targets?.length ? cfg.targets : (mainGroup ? [mainGroup] : []);

  const save = async (patch) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    await supabase.from('cb_news_settings')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
  };
  const toggleGroup = (id) => {
    const set = new Set(chosen);
    if (set.has(id)) set.delete(id); else set.add(id);
    save({ targets: [...set] });
  };

  const run = async (body, label) => {
    setBusy(label); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('dholera-news', { body });
      if (error) throw new Error(error.message);
      setResult(data);
      load();
    } catch (e) {
      setResult({ reason: e.message });
    } finally {
      setBusy('');
    }
  };

  if (!cfg) return null;

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
      <h2 className="font-semibold text-[#10243E] mb-1 flex items-center gap-2">
        <Newspaper size={18} className="text-[#9C7C1C]" /> Daily Dholera update · 2:10 PM
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        One real news story about Dholera each afternoon — an investment, a government visit, new
        infrastructure — with an image the team can put on their WhatsApp status. Scams, crime and
        anything naming a developer are filtered out before the AI sees them, and a day with no fresh
        story posts nothing.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => run({ dry_run: true }, 'preview')} disabled={!!busy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37] disabled:opacity-50">
          <Eye size={14} /> {busy === 'preview' ? 'Reading the news…' : 'Preview today'}
        </button>
        <button onClick={() => run({ dry_run: true, regenerate: true }, 'again')} disabled={!!busy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37] disabled:opacity-50">
          <RefreshCw size={14} /> {busy === 'again' ? 'Picking…' : 'Pick again'}
        </button>
        <button onClick={() => run({ force: true }, 'send')} disabled={!!busy || !connected}
          title={connected ? 'Posts it now, for real' : 'WhatsApp is not linked'}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#10243E] text-white hover:bg-[#1a365d] disabled:opacity-40">
          <Send size={14} /> {busy === 'send' ? 'Sending…' : 'Send now'}
        </button>
        <button onClick={() => save({ enabled: !cfg.enabled })}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${
            cfg.enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-300 text-gray-500'
          }`}>
          <Power size={14} /> {cfg.enabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1.5">Posts to:</p>
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g) => {
            const on = chosen.includes(g.id);
            return (
              <button key={g.id} onClick={() => toggleGroup(g.id)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  on ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-white text-gray-400 border-gray-200 line-through'
                }`}>
                {g.name}
              </button>
            );
          })}
          {!groups.length && <span className="text-xs text-gray-400">No WhatsApp group is set yet.</span>}
        </div>
      </div>

      {result && (
        <div className="border-t border-gray-100 pt-3 mb-4">
          {result.text ? (
            <>
              <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap font-sans text-gray-800 max-h-80 overflow-auto">
{result.text}
              </pre>
              {result.story && (
                <a href={result.story.replace('https://www.capitalbrix.co.in', '')} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#9C7C1C] mt-2 underline">
                  See the status image <ExternalLink size={12} />
                </a>
              )}
              {result.row?.detail && <p className="text-[11px] text-gray-400 mt-1">{result.row.detail}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-600">
              {result.sent ? <>Posted to {result.targets?.length} group(s).</> : <><strong>Nothing went out:</strong> {result.reason}</>}
            </p>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Recent days</p>
          <ul className="space-y-1">
            {recent.map((r) => (
              <li key={r.news_date} className="text-xs text-gray-600 flex gap-2">
                <span className="font-mono text-gray-400 shrink-0">{r.news_date}</span>
                <span className={`shrink-0 uppercase font-bold text-[10px] ${
                  r.status === 'posted' ? 'text-green-700' : r.status === 'failed' ? 'text-red-600' : 'text-gray-400'
                }`}>{r.status}</span>
                <span className="truncate">
                  {r.headline_hi || r.headline_en || r.detail}
                  {r.source_name ? <span className="text-gray-400"> · {r.source_name}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
