import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePack, pickLatestDate } from '../js/pack-schema.js';

test('the shipped sample pack is valid', () => {
  const pack = JSON.parse(readFileSync(new URL('../packs/2026-06-10.json', import.meta.url), 'utf8'));
  assert.deepEqual(validatePack(pack), []);
});

test('validatePack reports missing fields', () => {
  const errors = validatePack({ date: 'oggi' });
  assert.ok(errors.some((e) => e.includes('date')));
  assert.ok(errors.some((e) => e.includes('focus')));
  assert.ok(errors.some((e) => e.includes('dialogue')));
});

test('validatePack rejects out-of-range question answer', () => {
  const pack = JSON.parse(readFileSync(new URL('../packs/2026-06-10.json', import.meta.url), 'utf8'));
  pack.dialogue.questions[0].answer = 99;
  assert.ok(validatePack(pack).some((e) => e.includes('answer')));
});

test('pickLatestDate returns the newest date', () => {
  assert.equal(pickLatestDate(['2026-06-08', '2026-06-10', '2026-06-09']), '2026-06-10');
});
