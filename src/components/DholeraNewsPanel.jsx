import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Newspaper, Eye, Send, Power, Plus, Check, X, Undo2, Pencil, ExternalLink, Loader2, FileText,
} from 'lucide-react';

/**
 * The Dholera news desk — the agent proposes, the founder decides.
 *
 * At 12:30 the `dholera-news` agent writes up to three of the day's stories
 * and sends the founder one private WhatsApp with a link here. Each story is a
 * card: Share (goes at 2:10), Skip, or edit the Hindi headline if the wording
 * is not right. "Find more" asks the agent for different ones. At 2:10 every
 * shared story goes to the team in one message, with one link to all the
 * status images.
 *
 * If nothing here is touched, story no. 1 goes on its own — a busy day still
 * posts. Once anything is decided, even "skip all", that decision stands.
 *
 * The 👉 line on each card is for the salesperson, not the client: how to use
 * the story in a conversation. It goes in the team message, never on the
 * status image.
 */

const todayIst = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date());

const CATEGORY = {
  investment: 'Investment', government: 'Government', infrastructure: 'Infrastructure',
  jobs: 'Jobs', amenity: 'Amenity', other: 'News',
};

const STATUS = {
  candidate: { label: 'Waiting for you', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  approved: { label: 'Will be shared', cls: 'bg-green-50 text-green-700 border-green-200' },
  skipped: { label: 'Skipped', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
  posted: { label: 'Shared', cls: 'bg-[#10243E] text-white border-[#10243E]' },
  failed: { label: 'Send failed — retried at 2:25', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function DholeraNewsPanel({ mainGroup, teams = [], connected, me }) {
  const [cfg, setCfg] = useState(null);
  const [stories, setStories] = useState([]);
  const [runs, setRuns] = useState([]);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(null); // { id, headline_hi }
  const today = todayIst();

  const load = useCallback(async () => {
    const { data } = await supabase.from('cb_news_settings').select('*').eq('id', 1).maybeSingle();
    setCfg(data || { enabled: true, targets: [], auto_pick: true, notify_founder: true });
    const { data: rows } = await supabase.from('cb_dholera_news').select('*')
      .eq('news_date', today).order('rank');
    setStories(rows || []);
    const { data: r } = await supabase.from('cb_dholera_news_runs').select('*')
      .eq('news_date', today).order('ran_at', { ascending: false });
    setRuns(r || []);
  }, [today]);
  useEffect(() => { load(); }, [load]);

  const groups = [
    ...(mainGroup ? [{ id: mainGroup, name: 'Main group' }] : []),
    ...teams.filter((t) => t.wa_group_id).map((t) => ({ id: t.wa_group_id, name: t.name })),
  ];
  const chosen = cfg?.targets?.length ? cfg.targets : (mainGroup ? [mainGroup] : []);

  const saveCfg = async (patch) => {
    setCfg((c) => ({ ...c, ...patch }));
    await supabase.from('cb_news_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
  };
  const toggleGroup = (id) => {
    const set = new Set(chosen);
    if (set.has(id)) set.delete(id); else set.add(id);
    saveCfg({ targets: [...set] });
  };

  const run = async (body, label) => {
    setBusy(label); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('dholera-news', { body });
      if (error) throw new Error(error.message);
      setResult({ label, ...data });
      await load();
    } catch (e) {
      setResult({ label, reason: e.message });
    } finally {
      setBusy('');
    }
  };

  const decide = async (row, status) => {
    setStories((list) => list.map((r) => (r.id === row.id ? { ...r, status } : r)));
    await supabase.from('cb_dholera_news').update({
      status,
      decided_by: status === 'candidate' ? null : (me || 'admin'),
      decided_at: status === 'candidate' ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    load();
  };

  const saveEdit = async () => {
    const text = editing.headline_hi.trim();
    if (!text) return;
    await supabase.from('cb_dholera_news').update({ headline_hi: text, updated_at: new Date().toISOString() })
      .eq('id', editing.id);
    setEditing(null);
    load();
  };

  if (!cfg) return null;

  const shared = stories.filter((s) => s.status === 'approved' || s.status === 'posted');
  const anyDecided = stories.some((s) => s.decided_by);
  const plan = !stories.length
    ? 'The agent reads the news at 12:30 PM. Nothing to choose yet.'
    : shared.length
      ? `${shared.length} ${shared.length === 1 ? 'story' : 'stories'} for the team today.`
      : anyDecided
        ? 'Everything is skipped — nothing goes to the team today.'
        : cfg.auto_pick
          ? 'Nothing chosen yet — story 1 goes at 2:10 PM on its own.'
          : 'Nothing chosen yet — nothing will go until you pick.';

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h2 className="font-semibold text-[#10243E] flex items-center gap-2">
          <Newspaper size={18} className="text-[#9C7C1C]" /> Dholera news desk · 2:10 PM
        </h2>
        <button onClick={() => saveCfg({ enabled: !cfg.enabled })}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${
            cfg.enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-300 text-gray-500'
          }`}>
          <Power size={14} /> {cfg.enabled ? 'On' : 'Off'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Real Dholera news the team can put on their WhatsApp status. The agent picks the best stories
        each day — share one, two or three, skip what you don't like, or ask for more. Scams, crime and
        anything naming a developer never reach this list.
      </p>

      <div className="rounded-lg bg-[#10243E]/5 border border-[#10243E]/10 px-3 py-2 text-sm text-[#10243E] mb-4">
        <strong>Today:</strong> {plan}
      </div>

      {stories.length === 0 && (
        <p className="text-xs text-gray-500 mb-3">
          {runs[0]?.outcome ? <>Last run: {runs[0].outcome}</> : 'Not run yet today.'}
        </p>
      )}

      <div className="space-y-3 mb-4">
        {stories.map((s) => {
          const st = STATUS[s.status] || STATUS.candidate;
          const dim = s.status === 'skipped';
          return (
            <div key={s.id} className={`border rounded-lg p-4 ${dim ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#9C7C1C]">#{s.rank}</span>
                {s.category && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {CATEGORY[s.category] || s.category}
                  </span>
                )}
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${st.cls}`}>{st.label}</span>
              </div>

              {editing?.id === s.id ? (
                <div className="mb-2">
                  <textarea value={editing.headline_hi} rows={2}
                    onChange={(e) => setEditing({ ...editing, headline_hi: e.target.value.slice(0, 90) })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={saveEdit} className="text-xs px-3 py-1 rounded bg-[#10243E] text-white">Save</button>
                    <button onClick={() => setEditing(null)} className="text-xs px-3 py-1 rounded border">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className={`font-semibold ${dim ? 'text-gray-400' : 'text-[#10243E]'}`}>
                  {s.headline_hi || s.headline_en}
                </p>
              )}
              {s.headline_hi && <p className="text-xs text-gray-500 italic">{s.headline_en}</p>}
              {!dim && (s.points || []).length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {s.points.map((p, i) => <li key={i} className="text-sm text-gray-700">• {p}</li>)}
                </ul>
              )}
              {!dim && s.sales_angle && (
                <p className="mt-2 text-sm bg-green-50 border border-green-100 rounded px-2 py-1.5 text-green-900">
                  👉 {s.sales_angle}
                </p>
              )}
              {/* Whether this card was written from the full article or only the
                  headline — the founder asked for the whole story, so say which. */}
              {!dim && s.detail && (
                <p className={`text-[11px] mt-2 ${/^full story/.test(s.detail) ? 'text-green-700' : 'text-amber-700'}`}>
                  {/^full story/.test(s.detail) ? '✓ Written from the full article' : `Headline only — ${s.detail.split(' · ')[0]}`}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Source: {s.source_url
                  ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="underline">{s.source_name || 'report'}</a>
                  : (s.source_name || 'report')}
                {(s.also_reported || []).filter((x) => x !== s.source_name).length > 0 &&
                  ` · also ${(s.also_reported || []).filter((x) => x !== s.source_name).slice(0, 3).join(', ')}`}
              </p>

              {s.status !== 'posted' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.status !== 'approved' && s.status !== 'failed' && (
                    <button onClick={() => decide(s, 'approved')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700">
                      <Check size={14} /> Share
                    </button>
                  )}
                  {s.status !== 'skipped' && (
                    <button onClick={() => decide(s, 'skipped')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-600">
                      <X size={14} /> Skip
                    </button>
                  )}
                  {(s.status === 'approved' || s.status === 'skipped') && (
                    <button onClick={() => decide(s, 'candidate')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-500">
                      <Undo2 size={14} /> Undo
                    </button>
                  )}
                  {!dim && !/^full story/.test(s.detail || '') && (
                    <button onClick={() => run({ mode: 'enrich', id: s.id }, `full-${s.id}`)} disabled={!!busy}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-[#D4AF37] text-[#9C7C1C] hover:bg-amber-50 disabled:opacity-50">
                      {busy === `full-${s.id}` ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      {busy === `full-${s.id}` ? 'Reading the article…' : 'Get full story'}
                    </button>
                  )}
                  {!dim && (
                    <button onClick={() => setEditing({ id: s.id, headline_hi: s.headline_hi || '' })}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600">
                      <Pencil size={14} /> Edit headline
                    </button>
                  )}
                  {!dim && (
                    <a href={`/story/${s.news_date}?s=${s.rank}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-[#9C7C1C]">
                      <ExternalLink size={14} /> Status image
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => run({ mode: stories.length ? 'more' : 'prepare' }, 'more')} disabled={!!busy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37] disabled:opacity-50">
          {busy === 'more' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {busy === 'more' ? 'Reading the news…' : stories.length ? 'Find more stories' : 'Find today’s stories'}
        </button>
        <button onClick={() => run({ mode: 'publish', dry_run: true }, 'preview')} disabled={!!busy || !stories.length}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:border-[#D4AF37] disabled:opacity-50">
          <Eye size={14} /> Preview team message
        </button>
        <button onClick={() => run({ mode: 'publish', force: true }, 'send')} disabled={!!busy || !connected || !stories.length}
          title={connected ? 'Sends the shared stories now' : 'WhatsApp is not linked'}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#10243E] text-white hover:bg-[#1a365d] disabled:opacity-40">
          <Send size={14} /> {busy === 'send' ? 'Sending…' : 'Send now'}
        </button>
      </div>

      {result && (
        <div className="border-t border-gray-100 pt-3 mb-4">
          {result.text ? (
            <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap font-sans text-gray-800 max-h-96 overflow-auto">
{result.text}
            </pre>
          ) : result.label === 'more' ? (
            <p className="text-sm text-gray-600">{result.note || result.reason}</p>
          ) : String(result.label).startsWith('full-') ? (
            <p className="text-sm text-gray-600">{result.results?.[0]?.note || result.reason}</p>
          ) : (
            <p className="text-sm text-gray-600">
              {result.sent ? <>Sent {result.posted} {result.posted === 1 ? 'story' : 'stories'} to {result.targets?.length} group(s).</>
                : <><strong>Nothing went out:</strong> {result.reason}</>}
            </p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Posts to</p>
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
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={!!cfg.auto_pick} onChange={(e) => saveCfg({ auto_pick: e.target.checked })} className="mt-0.5" />
            <span>If I haven't chosen by 2:10 PM, share story no. 1 on its own</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={!!cfg.notify_founder} onChange={(e) => saveCfg({ notify_founder: e.target.checked })} className="mt-0.5" />
            <span>Send me the day's picks on WhatsApp at 12:30 PM</span>
          </label>
        </div>
      </div>
    </section>
  );
}
