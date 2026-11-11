import test from 'node:test';
import assert from 'node:assert/strict';
import { matchLetters, letterPose } from '../assets/playground/transition.mjs';

test('takes each original letter only once, matching case and accents and preferring nearby letters', () => {
  const sources = [
    { character: 'A', x: 0, y: 0 }, { character: 'a', x: 100, y: 100 },
    { character: 'í', x: 30, y: 50 }, { character: 'Z', x: 10, y: 10 },
  ];
  const targets = [
    { character: 'a', x: 90, y: 90 }, { character: 'a', x: 80, y: 80 },
    { character: 'a', x: 70, y: 70 }, { character: 'i', x: 0, y: 0 },
    { character: '.', x: 0, y: 0 },
  ];
  assert.deepEqual(matchLetters(sources, targets), [1, 0, -1, 2, -1]);
});

test('meets the source and drawn ring poses without a visible jump at either endpoint', () => {
  const from = { x: 40, y: 50, fontSize: 12, rotation: 0, scale: 1 };
  const to = { x: 900, y: 700, fontSize: 26, rotation: -2.4, scale: 0.82 };
  for (const [progress, expected] of [[0, from], [1, to], [-1, from], [2, to]]) {
    const actual = letterPose(from, to, progress);
    for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-9, key);
  }
  for (const [progress, expected] of [[0.001, from], [0.999, to]]) {
    const actual = letterPose(from, to, progress);
    assert.ok(Math.hypot(actual.x - expected.x, actual.y - expected.y) < 0.01);
  }
  for (let progress = 0; progress <= 1; progress += 0.01) {
    const actual = letterPose(from, to, progress);
    assert.ok(Object.values(actual).every(Number.isFinite));
    assert.ok(actual.fontSize >= from.fontSize && actual.fontSize <= to.fontSize);
  }
});
