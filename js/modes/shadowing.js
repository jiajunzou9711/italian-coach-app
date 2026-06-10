import { speak, speechSupport } from '../speech.js';

export function renderShadowing(screen, pack) {
  let i = 0;
  let recorder = null;
  let chunks = [];
  let url = null;
  const item = () => pack.shadowing[i];
  const canRecord = speechSupport().record;

  screen.innerHTML = `
    <h2>Shadowing (${pack.shadowing.length} frasi)</h2>
    <p id="progress"></p>
    <p id="text" class="prompt"></p>
    <button id="play">🔊 Modello</button>
    <button id="rec" ${canRecord ? '' : 'disabled'}>⏺ Registra</button>
    <button id="stop" class="hidden">⏹ Stop</button>
    <button id="mine" class="hidden">▶︎ La mia voce</button>
    <button id="next">Avanti →</button>
    ${canRecord ? '' : '<p>Registrazione non disponibile su questo browser.</p>'}`;

  const recBtn = screen.querySelector('#rec');
  const stopBtn = screen.querySelector('#stop');
  const mineBtn = screen.querySelector('#mine');

  const show = () => {
    screen.querySelector('#progress').textContent = `Frase ${i + 1} di ${pack.shadowing.length}`;
    screen.querySelector('#text').textContent = item().it;
    mineBtn.classList.add('hidden');
    if (url) URL.revokeObjectURL(url);
    url = null;
  };

  screen.querySelector('#play').onclick = () => speak(item().it, { rate: 0.85 });

  recBtn.onclick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
        mineBtn.classList.remove('hidden');
      };
      recorder.start();
      recBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
    } catch (e) {
      screen.querySelector('#text').textContent = `Microfono negato: ${e.message}`;
    }
  };
  stopBtn.onclick = () => {
    recorder.stop();
    stopBtn.classList.add('hidden');
    recBtn.classList.remove('hidden');
  };
  mineBtn.onclick = () => new Audio(url).play();
  screen.querySelector('#next').onclick = () => {
    i = (i + 1) % pack.shadowing.length;
    show();
  };
  show();
}
