// Validates the daily pack format defined in the design spec.
// Returns an array of error strings; empty array means valid.
export function validatePack(p) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };
  need(p && typeof p === 'object', 'pack must be an object');
  if (errors.length) return errors;

  need(/^\d{4}-\d{2}-\d{2}$/.test(p.date || ''), 'date must be YYYY-MM-DD');
  need(typeof p.focus === 'string' && p.focus.length > 0, 'focus is required');

  need(p.dialogue && typeof p.dialogue === 'object', 'dialogue is required');
  need(typeof p.dialogue?.title === 'string', 'dialogue.title is required');
  need(Array.isArray(p.dialogue?.lines) && p.dialogue.lines.length > 0, 'dialogue.lines must be non-empty');
  for (const [i, l] of (p.dialogue?.lines || []).entries()) {
    need(
      typeof l.speaker === 'string' && typeof l.it === 'string' && typeof l.zh === 'string',
      `dialogue.lines[${i}] needs speaker/it/zh`,
    );
  }
  need(Array.isArray(p.dialogue?.questions) && p.dialogue.questions.length > 0, 'dialogue.questions must be non-empty');
  for (const [i, q] of (p.dialogue?.questions || []).entries()) {
    need(
      typeof q.q === 'string' && Array.isArray(q.options) && q.options.length >= 2,
      `dialogue.questions[${i}] needs q and 2+ options`,
    );
    need(
      Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options || []).length,
      `dialogue.questions[${i}].answer out of range`,
    );
  }

  need(
    Array.isArray(p.dictation) && p.dictation.length > 0 && p.dictation.every((d) => typeof d.it === 'string'),
    'dictation must be a non-empty array of items with it',
  );
  need(Array.isArray(p.speaking) && p.speaking.length > 0, 'speaking must be non-empty');
  for (const [i, s] of (p.speaking || []).entries()) {
    need(
      typeof s.prompt_zh === 'string' && Array.isArray(s.accepted) && s.accepted.length > 0,
      `speaking[${i}] needs prompt_zh and non-empty accepted[]`,
    );
  }
  need(
    Array.isArray(p.shadowing) && p.shadowing.length > 0 && p.shadowing.every((s) => typeof s.it === 'string'),
    'shadowing must be a non-empty array of items with it',
  );
  need(
    Array.isArray(p.vocab) && p.vocab.every((v) => typeof v.it === 'string' && typeof v.zh === 'string'),
    'vocab items need it/zh',
  );
  return errors;
}

export function pickLatestDate(dates) {
  return [...dates].sort().at(-1);
}
