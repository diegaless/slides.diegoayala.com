import test from 'node:test';
import assert from 'node:assert/strict';
import { readLeaderboard, saveScore } from '../assets/playground/leaderboard.mjs';

function memoryStorage(initial = []) {
  let value = JSON.stringify(initial);
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('keeps the ten highest scores, persists them and rejects a tied eleventh score', () => {
  const storage = memoryStorage();
  for (let score = 0; score < 12; score++) saveScore('DAM', score, storage);
  assert.deepEqual(readLeaderboard(storage).map(entry => entry.score), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  assert.equal(saveScore('DAW', 2, storage).qualified, false);
  assert.equal(saveScore('SEF', 12, storage).persisted, true);
  assert.deepEqual(readLeaderboard(storage)[0], { initials: 'SEF', score: 12 });
});

test('ignores invalid saved values and never retains extra fields', () => {
  const storage = memoryStorage([
    { initials: 'ABC', score: 8, unexpected: 'discard' },
    { initials: '<b>', score: 99 }, null, { initials: 'DEF', score: '10' },
    { initials: 'GHI', score: -1 }, { initials: 'JKL', score: 1.5 },
    { initials: 'MNO', score: 1_000_001 },
  ]);
  assert.deepEqual(readLeaderboard(storage), [{ initials: 'ABC', score: 8 }]);
  for (const [initials, score] of [['AA', 1], ['abc', 1], ['ABC', NaN], ['ABC', -1]]) {
    assert.throws(() => saveScore(initials, score, storage));
  }
});

test('continues a game session when browser storage is blocked or malformed', () => {
  readLeaderboard(memoryStorage());
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  const saved = saveScore('ABC', 4, blocked);
  assert.equal(saved.persisted, false);
  assert.deepEqual(readLeaderboard(blocked), [{ initials: 'ABC', score: 4 }]);
  assert.deepEqual(readLeaderboard({ getItem: () => '{broken' }), [{ initials: 'ABC', score: 4 }]);
  const entries = readLeaderboard(blocked);
  entries[0].score = 999;
  assert.equal(readLeaderboard(blocked)[0].score, 4);
});
