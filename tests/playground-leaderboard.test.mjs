import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SCORE, validateScore, replacementForScore } from '../assets/playground/leaderboard.mjs';

test('only accepts three uppercase initials and a bounded integer score', () => {
  for (const score of [0, 1, MAX_SCORE]) assert.doesNotThrow(() => validateScore('DAM', score));
  for (const [initials, score] of [['AA', 1], ['ABCD', 1], ['abc', 1], ['<b>', 1],
    ['ABC', NaN], ['ABC', -1], ['ABC', 1.5], ['ABC', '4'], ['ABC', MAX_SCORE + 1]]) {
    assert.throws(() => validateScore(initials, score));
  }
});

test('a new player can save a mark and an existing player can only improve their own best', () => {
  assert.deepEqual(replacementForScore(null, 'DAM', 0), { initials: 'DAM', score: 0 });
  const previous = { initials: 'DAM', score: 8, updatedAt: 'unchanged' };
  assert.equal(replacementForScore(previous, 'DAW', 7), null);
  assert.equal(replacementForScore(previous, 'DAW', 8), null);
  assert.deepEqual(replacementForScore(previous, 'DAW', 9), { initials: 'DAW', score: 9 });
  assert.deepEqual(previous, { initials: 'DAM', score: 8, updatedAt: 'unchanged' });
});
