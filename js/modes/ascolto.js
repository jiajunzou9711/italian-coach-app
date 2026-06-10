import { speak } from '../speech.js';
import { addResult } from '../results.js';

export function renderAscolto(screen, pack) {
  const d = pack.dialogue;
  screen.innerHTML = `
    <h2>Ascolto: ${d.title}</h2>
    <label>Velocità
      <select id="rate">
        <option value="0.7">lenta</option>
        <option value="0.85" selected>media</option>
        <option value="1">normale</option>
      </select>
    </label>
    <button id="play-all">▶︎ Tutto il dialogo</button>
    <ol class="lines">${d.lines.map((l, i) => `
      <li>
        <button class="play" data-i="${i}">▶︎</button>
        <strong>${l.speaker}:</strong>
        <span class="it hidden">${l.it}</span>
        <span class="zh hidden">（${l.zh}）</span>
      </li>`).join('')}
    </ol>
    <button id="show-text">Mostra testo</button>
    <button id="show-zh">Mostra cinese</button>
    <div id="questions"></div>`;

  const rate = () => parseFloat(screen.querySelector('#rate').value);
  screen.querySelectorAll('.play').forEach((b) => {
    b.onclick = () => speak(d.lines[b.dataset.i].it, { rate: rate() });
  });
  screen.querySelector('#play-all').onclick = async () => {
    for (const l of d.lines) await speak(l.it, { rate: rate() });
  };
  screen.querySelector('#show-text').onclick = () =>
    screen.querySelectorAll('.it').forEach((e) => e.classList.remove('hidden'));
  screen.querySelector('#show-zh').onclick = () =>
    screen.querySelectorAll('.zh').forEach((e) => e.classList.remove('hidden'));

  const qEl = screen.querySelector('#questions');
  qEl.innerHTML = '<h3>Domande</h3>' + d.questions.map((q, qi) => `
    <div class="q">
      <p>${q.q}</p>
      ${q.options.map((o, oi) => `<button class="opt" data-qi="${qi}" data-oi="${oi}">${o}</button>`).join('')}
      <span class="verdict"></span>
    </div>`).join('');
  qEl.querySelectorAll('.opt').forEach((b) => {
    b.onclick = () => {
      const q = d.questions[b.dataset.qi];
      const ok = Number(b.dataset.oi) === q.answer;
      b.closest('.q').querySelector('.verdict').textContent = ok ? '✅' : `❌ → ${q.options[q.answer]}`;
      addResult(pack.date, {
        mode: 'ascolto',
        item: q.q,
        expected: q.options[q.answer],
        given: q.options[b.dataset.oi],
        correct: ok,
      });
    };
  });
}
