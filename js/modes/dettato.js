import { speak } from '../speech.js';
import { fuzzyMatch, wordDiff } from '../matching.js';
import { addResult } from '../results.js';

export function renderDettato(screen, pack) {
  let i = 0;
  const item = () => pack.dictation[i];
  screen.innerHTML = `
    <h2>Dettato (${pack.dictation.length} frasi)</h2>
    <p id="progress"></p>
    <button id="play">🔊 Ascolta</button>
    <p id="hint" class="zh"></p>
    <textarea id="answer" rows="2" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
    <button id="check">Controlla</button>
    <div id="feedback"></div>
    <button id="next" class="hidden">Avanti →</button>`;

  const show = () => {
    screen.querySelector('#progress').textContent = `Frase ${i + 1} di ${pack.dictation.length}`;
    screen.querySelector('#hint').textContent = item().hint || '';
    screen.querySelector('#answer').value = '';
    screen.querySelector('#feedback').innerHTML = '';
    screen.querySelector('#next').classList.add('hidden');
    screen.querySelector('#check').disabled = false;
  };

  screen.querySelector('#play').onclick = () => speak(item().it, { rate: 0.85 });
  screen.querySelector('#check').onclick = () => {
    const given = screen.querySelector('#answer').value.trim();
    if (!given) return;
    const r = fuzzyMatch(given, [item().it]);
    const diff = wordDiff(item().it, given);
    screen.querySelector('#feedback').innerHTML =
      (r.ok ? '<p>✅ Giusto!</p>' : '<p>❌ Quasi:</p>') +
      `<p>${diff.map((w) => `<span class="w-${w.status}">${w.word}</span>`).join(' ')}</p>` +
      `<p class="expected">Testo: ${item().it}</p>`;
    addResult(pack.date, { mode: 'dettato', expected: item().it, given, correct: r.ok });
    screen.querySelector('#check').disabled = true;
    screen.querySelector('#next').classList.remove('hidden');
  };
  screen.querySelector('#next').onclick = () => {
    if (i < pack.dictation.length - 1) {
      i++;
      show();
    } else {
      screen.querySelector('#feedback').innerHTML = '<p>🎉 Dettato finito!</p>';
      screen.querySelector('#next').classList.add('hidden');
    }
  };
  show();
}
