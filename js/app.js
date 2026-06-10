import { pickLatestDate } from './pack-schema.js';
import { getSettings, saveSettings, syncPending } from './results.js';
import { loadItalianVoice, setDefaultVoice } from './speech.js';
import { renderAscolto } from './modes/ascolto.js';
import { renderDettato } from './modes/dettato.js';
import { renderParlato } from './modes/parlato.js';
import { renderShadowing } from './modes/shadowing.js';

const screen = document.getElementById('screen');
const info = document.getElementById('pack-info');
let pack = null;

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function loadPack() {
  const idx = await fetchJson('packs/index.json');
  const date = pickLatestDate(idx.dates);
  pack = await fetchJson(`packs/${date}.json`);
  const today = new Date().toISOString().slice(0, 10);
  info.textContent = pack.date === today
    ? `Pacchetto di oggi: ${pack.focus}`
    : `Ultimo pacchetto (${pack.date}): ${pack.focus}`;
}

function renderHome() {
  if (!pack) {
    screen.innerHTML = '<p>Nessun pacchetto disponibile. Controlla la connessione e ricarica.</p>';
    return;
  }
  screen.innerHTML = `
    <h2>${pack.date}</h2>
    <p><strong>Focus:</strong> ${pack.focus}</p>
    <h3>Parole nuove</h3>
    <ul>${pack.vocab.map((v) => `<li><strong>${v.it}</strong> — ${v.zh}</li>`).join('')}</ul>
    <p>Scegli una modalità qui sopra. 👆</p>`;
}

function renderSettings() {
  const s = getSettings();
  screen.innerHTML = `
    <h2>Impostazioni</h2>
    <label>GitHub owner <input id="owner" autocapitalize="off"></label>
    <label>Repo <input id="repo" autocapitalize="off"></label>
    <label>Token (fine-grained, solo questo repo) <input id="token" type="password"></label>
    <button id="save">Salva</button>
    <button id="sync">Sincronizza risultati</button>
    <p id="sync-status"></p>`;
  screen.querySelector('#owner').value = s.owner || '';
  screen.querySelector('#repo').value = s.repo || 'italian-coach-app';
  screen.querySelector('#token').value = s.token || '';
  const status = screen.querySelector('#sync-status');
  screen.querySelector('#save').onclick = () => {
    saveSettings({
      owner: screen.querySelector('#owner').value.trim(),
      repo: screen.querySelector('#repo').value.trim(),
      token: screen.querySelector('#token').value.trim(),
    });
    status.textContent = 'Salvato.';
  };
  screen.querySelector('#sync').onclick = async () => {
    status.textContent = 'Sincronizzo…';
    try {
      const r = await syncPending();
      status.textContent = r.reason ? `Niente da fare: ${r.reason}` : `Giorni sincronizzati: ${r.synced}`;
    } catch (e) {
      status.textContent = `Errore: ${e.message}`;
    }
  };
}

const modes = {
  home: renderHome,
  ascolto: () => renderAscolto(screen, pack),
  dettato: () => renderDettato(screen, pack),
  parlato: () => renderParlato(screen, pack),
  shadowing: () => renderShadowing(screen, pack),
  settings: renderSettings,
};

document.querySelectorAll('nav button').forEach((b) => {
  b.onclick = () => {
    const m = b.dataset.mode;
    if (!pack && m !== 'home' && m !== 'settings') return;
    modes[m]();
  };
});

(async () => {
  loadItalianVoice().then(setDefaultVoice).catch(() => {});
  try {
    await loadPack();
  } catch (e) {
    info.textContent = `Nessun pacchetto: ${e.message}`;
  }
  renderHome();
  syncPending().catch(() => {});
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
