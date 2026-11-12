import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SCORE, MAX_NAME_LENGTH, normalizePlayerName, validateScore, replacementForScore } from '../assets/playground/leaderboard.mjs';

test('accepts names and nicknames with accents, spaces and their original case', () => {
  for (const name of ['D', 'DAM', 'Diego Ayala', 'Álex Núñez', 'Ana-María', "O'Connor", 'D’Angelo',
    'Pepe_24', '李明', 'Á'.repeat(MAX_NAME_LENGTH)]) assert.equal(validateScore(name, 1), name);
  assert.equal(normalizePlayerName('  A\u0301lex   Núñez  '), 'Álex Núñez');
  assert.deepEqual(replacementForScore(null, '  Álex   Núñez  ', 4), { initials: 'Álex Núñez', score: 4 });
  for (const name of ['', '   ', '<b>', 'Á'.repeat(MAX_NAME_LENGTH + 1), 'Ana\u0000',
    'Ana\u202e', '-Ana', null, ['Ana']]) assert.throws(() => validateScore(name, 1));
});

test('only accepts a nonnegative safe integer score', () => {
  for (const score of [0, 1, 999, 1000, 10_000, 16_384, 2 ** 30, MAX_SCORE]) {
    assert.doesNotThrow(() => validateScore('DAM', score));
  }
  for (const score of [NaN, -1, 1.5, '4', MAX_SCORE + 1]) {
    assert.throws(() => validateScore('Álex Núñez', score));
  }
});

test('a new player can save a mark and an existing player can only improve their own best', () => {
  assert.deepEqual(replacementForScore(null, 'DAM', 0), { initials: 'DAM', score: 0 });
  const previous = { initials: 'DAM', score: 8, updatedAt: 'unchanged' };
  assert.equal(replacementForScore(previous, 'DAW', 7), null);
  assert.equal(replacementForScore(previous, 'DAW', 8), null);
  assert.deepEqual(replacementForScore(previous, 'DAW', 9), { initials: 'DAW', score: 9 });
  assert.deepEqual(previous, { initials: 'DAM', score: 8, updatedAt: 'unchanged' });
  assert.deepEqual(replacementForScore({ initials: 'DAM', score: 999 }, 'DAM', 10_000),
    { initials: 'DAM', score: 10_000 });
});
