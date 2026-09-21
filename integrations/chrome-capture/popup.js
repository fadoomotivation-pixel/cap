import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const $ = (id) => document.getElementById(id);

/**
 * Pull whatever the page already shows.
 *
 * Finding the number is the actual work — the listing is usually open in
 * front of the telecaller and the alternative is retyping it into a second
 * window, which is where a lead gets dropped or mistyped. Selected text wins
 * over a page-wide scan, because a person selecting something has told us
 * exactly which of the six numbers on a directory page they mean.
 */
function scrapeCurrentPage() {
  const selection = String(window.getSelection?.() ?? '').trim();
  const body = document.body?.innerText ?? '';
  const scope = selection || body;

  // Indian mobile numbers, with or without +91 / 0 / spaces / dashes.
  const phones = [...scope.matchAll(/(?:\+?91[\s-]?|0)?([6-9]\d{4}[\s-]?\d{5})\b/g)]
    .map((m) => m[1].replace(/\D/g, ''))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5);

  return {
    selection,
    title: document.title || '',
    url: location.href,
    phones,
  };
}

async function prefill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeCurrentPage,
    });
    if (!result) return;

    // A selection is a deliberate act, so it becomes the name. Otherwise the
    // page title is the best guess and the person edits it — which is faster
    // than an empty field either way.
    const firstLine = (result.selection || result.title).split('\n')[0].trim();
    $('name').value = firstLine.slice(0, 80);
    if (result.phones[0]) $('phone').value = result.phones[0];
    $('notes').value = result.url ? `Found at ${result.url}`.slice(0, 200) : '';
  } catch {
    // A page the extension cannot read (chrome://, the web store) is not an
    // error worth showing — the form still works, typed by hand.
  }
}

async function loadToken() {
  const { captureToken } = await chrome.storage.local.get('captureToken');
  if (captureToken) $('token').value = captureToken;
  // No token yet means the first run, so open settings rather than letting
  // somebody fill the form and fail at the last step.
  if (!captureToken) $('settings').hidden = false;
  return captureToken;
}

function say(text, ok) {
  const el = $('result');
  el.textContent = text;
  el.className = ok ? 'ok' : 'bad';
  el.hidden = false;
}

$('settings-toggle').addEventListener('click', () => {
  $('settings').hidden = !$('settings').hidden;
});

$('save-token').addEventListener('click', async () => {
  const token = $('token').value.trim();
  await chrome.storage.local.set({ captureToken: token });
  $('settings').hidden = true;
  say('Token saved on this computer.', true);
});

$('capture').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = (await chrome.storage.local.get('captureToken')).captureToken;
  if (!token) {
    $('settings').hidden = false;
    return say('Paste your capture token first.', false);
  }
  const name = $('name').value.trim();
  if (!name) return say('A name is needed.', false);

  $('submit').disabled = true;
  say('Saving…', true);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cb_capture_partner_target`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_token: token,
        p_row: {
          name,
          phone: $('phone').value.trim(),
          firm: $('firm').value.trim(),
          city: $('city').value.trim(),
          notes: $('notes').value.trim(),
        },
      }),
    });

    const body = await res.json().catch(() => null);

    // 42501 is the function refusing the token. Saying so plainly beats a
    // generic failure: the fix is a different token, not a retry.
    if (!res.ok) {
      const msg = body?.message || '';
      return say(
        /not authorised/i.test(msg)
          ? 'That token is not recognised. Ask HR for a fresh one.'
          : `Could not save it — ${msg || res.status}`,
        false,
      );
    }
    if (body?.ok === false) return say(body.reason || 'Not saved.', false);

    say(`Saved to ${body?.assigned_to || 'your'} list.`, true);
    $('capture').reset();
  } catch (err) {
    say(`Could not reach Capital Brix — ${String(err).slice(0, 80)}`, false);
  } finally {
    $('submit').disabled = false;
  }
});

loadToken();
prefill();
