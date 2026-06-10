import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, levenshtein, fuzzyMatch, wordDiff } from '../js/matching.js';

test('normalize lowercases, strips accents and punctuation, collapses spaces', () => {
  assert.equal(normalize('  Perché, no!  '), 'perche no');
  assert.equal(normalize("C'è una penna."), "c'e una penna");
});

test('levenshtein distance', () => {
  assert.equal(levenshtein('casa', 'casa'), 0);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('vuole', 'voule'), 2);
});

test('fuzzyMatch accepts exact and near matches', () => {
  const r = fuzzyMatch('voglio andare al negozio', ['Voglio andare al negozio.']);
  assert.equal(r.ok, true);
  assert.equal(r.distance, 0);
});

test('fuzzyMatch rejects a real grammar error', () => {
  const r = fuzzyMatch('voglio leggo un libro', ['voglio leggere un libro']);
  assert.equal(r.ok, false);
  assert.equal(r.expected, 'voglio leggere un libro');
});

test('fuzzyMatch picks the closest of multiple accepted answers', () => {
  const r = fuzzyMatch('possiamo cucinare a casa', [
    'noi possiamo cucinare a casa',
    'possiamo cucinare a casa',
  ]);
  assert.equal(r.ok, true);
});

test('fuzzyMatch handles empty accepted list', () => {
  assert.deepEqual(fuzzyMatch('ciao', []), { ok: false, expected: null, distance: Infinity });
});

test('wordDiff marks ok/missing/extra words', () => {
  assert.deepEqual(wordDiff('voglio leggere un libro', 'voglio leggo un libro'), [
    { word: 'voglio', status: 'ok' },
    { word: 'leggere', status: 'missing' },
    { word: 'leggo', status: 'extra' },
    { word: 'un', status: 'ok' },
    { word: 'libro', status: 'ok' },
  ]);
});
