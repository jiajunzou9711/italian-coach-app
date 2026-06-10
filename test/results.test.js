import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildResultsPayload, mergeResultsItems } from '../js/results.js';

test('mergeResultsItems appends new items after existing ones', () => {
  const existing = { items: [{ mode: 'dettato', correct: true }] };
  const merged = mergeResultsItems(existing, [{ mode: 'parlato', correct: false }]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].mode, 'dettato');
  assert.equal(merged[1].mode, 'parlato');
});

test('mergeResultsItems handles missing existing payload', () => {
  assert.deepEqual(mergeResultsItems(null, [{ mode: 'ascolto', correct: true }]).length, 1);
});

test('buildResultsPayload summarizes counts', () => {
  const items = [
    { mode: 'parlato', correct: true },
    { mode: 'parlato', correct: false },
    { mode: 'parlato', correct: true, override: true },
    { mode: 'dettato', correct: true },
    { mode: 'parlato', correct: false, override: true },
  ];
  const p = buildResultsPayload('2026-06-10', items);
  assert.equal(p.date, '2026-06-10');
  assert.deepEqual(p.counts, { total: 5, correct: 2, incorrect: 1, overridden: 2 });
  assert.equal(p.items.length, 5);
  assert.ok(typeof p.generated === 'string');
});
