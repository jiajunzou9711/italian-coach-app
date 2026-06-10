// iOS loads voices asynchronously; resolve when an Italian voice appears.
export function loadItalianVoice() {
  return new Promise((resolve) => {
    const pick = () => {
      const vs = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('it'));
      if (vs.length) resolve(vs.find((v) => v.localService) || vs[0]);
      return vs.length > 0;
    };
    if (!pick()) speechSynthesis.onvoiceschanged = pick;
  });
}

let defaultVoice = null;
export function setDefaultVoice(v) { defaultVoice = v; }

export function speak(text, { rate = 1, voice = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    const v = voice || defaultVoice;
    if (v) u.voice = v;
    u.rate = rate;
    u.onend = resolve;
    u.onerror = (e) => reject(new Error(e.error || 'TTS error'));
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

// One recognition turn; resolves with the alternatives (best first).
export function recognizeOnce() {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('riconoscimento vocale non disponibile'));
    const r = new SR();
    r.lang = 'it-IT';
    r.interimResults = false;
    r.maxAlternatives = 3;
    let done = false;
    r.onresult = (e) => {
      done = true;
      resolve([...e.results[0]].map((a) => a.transcript));
    };
    r.onerror = (e) => {
      if (!done) reject(new Error(e.error));
    };
    r.onend = () => {
      if (!done) reject(new Error('non ho sentito niente'));
    };
    r.start();
  });
}

export function speechSupport() {
  return {
    tts: 'speechSynthesis' in window,
    stt: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    record: typeof MediaRecorder !== 'undefined',
  };
}
