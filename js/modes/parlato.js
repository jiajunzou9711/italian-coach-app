import { recognizeOnce, speechSupport } from '../speech.js';
import { fuzzyMatch, wordDiff } from '../matching.js';
import { addResult } from '../results.js';

export function renderParlato(screen, pack) {
  if (!speechSupport().stt) {
    screen.innerHTML = '<h2>Parlato</h2><p>Riconoscimento vocale non disponibile su questo browser. Usa Safari su iPhone.</p>';
    return;
  }
  let i = 0;
  let last = null;
  const item = () => pack.speaking[i];
  screen.innerHTML = `
    <h2>Parlato (${pack.speaking.length} frasi)</h2>
    <p id="progress"></p>
    <p id="prompt" class="prompt"></p>
    <button id="mic">🎤 Parla</button>
    <div id="feedback"></div>
    <button id="override" class="hidden">Ho detto giusto</button>
    <button id="next" class="hidden">Avanti →</button>`;

  const fb = screen.querySelector('#feedback');
  const overrideBtn = screen.querySelector('#override');
  const nextBtn = screen.querySelector('#next');

  const show = () => {
    screen.querySelector('#progress').textContent = `Frase ${i + 1} di ${pack.speaking.length}`;
    screen.querySelector('#prompt').textContent = item().prompt_zh;
    fb.innerHTML = '';
    overrideBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    last = null;
  };

  screen.querySelector('#mic').onclick = async () => {
    fb.innerHTML = '<p>🎙️ Ascolto…</p>';
    try {
      const alts = await recognizeOnce();
      let best = null;
      for (const t of alts) {
        const r = fuzzyMatch(t, item().accepted);
        if (!best || r.distance < best.r.distance) best = { t, r };
      }
      const diff = wordDiff(best.r.expected, best.t);
      fb.innerHTML =
        `<p>Ho sentito: «${best.t}»</p>` +
        (best.r.ok
          ? '<p>✅ Giusto!</p>'
          : `<p>❌</p><p>${diff.map((w) => `<span class="w-${w.status}">${w.word}</span>`).join(' ')}</p>` +
            `<p class="expected">Risposta: ${item().accepted[0]}</p>`);
      last = {
        mode: 'parlato',
        expected: item().accepted[0],
        given: best.t,
        correct: best.r.ok,
        target: item().target_point,
      };
      addResult(pack.date, last);
      overrideBtn.classList.toggle('hidden', best.r.ok);
      nextBtn.classList.remove('hidden');
    } catch (e) {
      fb.innerHTML = `<p>Errore microfono: ${e.message}. Riprova.</p>`;
    }
  };

  overrideBtn.onclick = () => {
    if (!last) return;
    addResult(pack.date, { ...last, correct: true, override: true });
    fb.innerHTML += '<p>✅ Segnato come giusto (override).</p>';
    overrideBtn.classList.add('hidden');
  };

  nextBtn.onclick = () => {
    if (i < pack.speaking.length - 1) {
      i++;
      show();
    } else {
      fb.innerHTML = '<p>🎉 Parlato finito!</p>';
      nextBtn.classList.add('hidden');
      overrideBtn.classList.add('hidden');
    }
  };
  show();
}
