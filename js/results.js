const SETTINGS_KEY = 'coach.settings';
const PENDING_KEY = 'coach.pending-results';

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function readPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || {};
  } catch {
    return {};
  }
}

export function addResult(date, item) {
  const all = readPending();
  (all[date] ||= []).push({ ...item, at: new Date().toISOString() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(all));
}

export function mergeResultsItems(existing, newItems) {
  const prior = Array.isArray(existing?.items) ? existing.items : [];
  return [...prior, ...newItems];
}

export function buildResultsPayload(date, items) {
  const counts = { total: items.length, correct: 0, incorrect: 0, overridden: 0 };
  for (const it of items) {
    if (it.override) counts.overridden++;
    else if (it.correct) counts.correct++;
    else counts.incorrect++;
  }
  return { date, generated: new Date().toISOString(), counts, items };
}

// Commits each pending day's results to results/<date>.json in the
// configured repo. Pending entries are removed only after a successful PUT,
// so offline runs keep results locally until the next successful sync.
export async function syncPending() {
  const cfg = getSettings();
  if (!cfg.token || !cfg.owner || !cfg.repo) return { synced: 0, reason: 'settings mancanti' };
  const all = readPending();
  let synced = 0;
  for (const [date, items] of Object.entries(all)) {
    await putFile(
      cfg,
      `results/${date}.json`,
      (existing) => buildResultsPayload(date, mergeResultsItems(existing, items)),
      `Results ${date}`,
    );
    delete all[date];
    localStorage.setItem(PENDING_KEY, JSON.stringify(all));
    synced++;
  }
  return { synced };
}

async function putFile(cfg, path, builder, message) {
  const api = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
  };
  let sha;
  let existingPayload = null;
  const probe = await fetch(api, { headers });
  if (probe.ok) {
    const probeJson = await probe.json();
    sha = probeJson.sha;
    try {
      existingPayload = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(probeJson.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)),
        ),
      );
    } catch {
      // ignore malformed existing content
    }
  }
  const obj = builder(existingPayload);
  const body = { message, content: toBase64(JSON.stringify(obj, null, 2)) };
  if (sha) body.sha = sha;
  const res = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
}

function toBase64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
