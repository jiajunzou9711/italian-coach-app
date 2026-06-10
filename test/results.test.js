import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResultsPayload } from '../js/results.js';

test('buildResultsPayload summarizes counts', () => {
  const items = [
    { mode: 'parlato', correct: true },
    { mode: 'parlato', correct: false },
    { mode: 'parlato', correct: true, override: true },
    { mode: 'dettato', correct: true },
  ];
  const p = buildResultsPayload('2026-06-10', items);
  assert.equal(p.date, '2026-06-10');
  assert.deepEqual(p.counts, { total: 4, correct: 2, incorrect: 1, overridden: 1 });
  assert.equal(p.items.length, 4);
  assert.ok(typeof p.generated === 'string');
});
