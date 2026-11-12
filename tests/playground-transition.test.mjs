import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { subjectsText, pairLetters, letterTransform } from '../assets/playground/transition.mjs';
import { createGlyphAtlas } from '../assets/playground/glyph-atlas.mjs';

test('the ring contains exactly the six subject names from the homepage, preserving case and accents', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const names = [...html.matchAll(/<summary class="subject-link"><span>(.*?)<\/span>/gu)].map(match => match[1]);
  assert.deepEqual(names, ['Lenguaje de Marcas', 'Desarrollo de Interfaces',
    'Programación de Servicios y Procesos', 'Despliegue de aplicaciones Web',
    'Proyecto Intermodular', 'Sistemas informáticos']);
  const circle = subjectsText(names);
  assert.equal(circle.replace(/\s/gu, ''), names.join('').replace(/\s/gu, ''));
  assert.equal(subjectsText([' Lenguaje\n de Marcas ', 'Programación']), 'Lenguaje de Marcas   Programación');
});

test('duplicate letters retain their original identity and order, regardless of their distance to the ring', () => {
  const sources = [{ character: 'a', x: 0 }, { character: 'a', x: 100 }, { character: 'í', x: 50 }];
  const targets = [{ character: 'a', x: 95 }, { character: 'a', x: 5 }, { character: 'í', x: 20 }];
  const pairs = pairLetters(sources, targets);
  pairs.forEach((pair, index) => {
    assert.equal(pair.source, sources[index]);
    assert.equal(pair.target, targets[index]);
  });
  for (const invalid of [targets.slice(1), [...targets, { character: '.' }],
    [targets[0], targets[1], { character: 'i' }]]) assert.throws(() => pairLetters(sources, invalid));
});

test('movement scales the original glyph uniformly and lands on the ring anchor', () => {
  const source = { x: 30, y: 40, width: 12, height: 36, fontSize: 32, scale: 1 };
  assert.equal(letterTransform(source, source), 'translate3d(24px, 22px, 0) rotate(0rad) scale(1, 1)');
  assert.equal(letterTransform(source, { x: 900, y: 700, fontSize: 24, rotation: -2.4, scale: 1 }),
    'translate3d(894px, 682px, 0) rotate(-2.4rad) scale(0.75, 0.75)');
});

test('the ring rasterizes each distinct glyph only once instead of drawing text in every animation frame', () => {
  const originalDocument = globalThis.document;
  let rasterized = 0, copied = 0;
  const context = { measureText: () => ({ width: 12 }), setTransform() {}, fillText() { rasterized++; } };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  try {
    const atlas = createGlyphAtlas(Array.from('Marcas Marcas'), '300 26px sans-serif', 26, '#fff', 2);
    assert.equal(rasterized, 5);
    const target = { drawImage() { copied++; } };
    for (let frame = 0; frame < 120; frame++) for (const character of 'Marcas') atlas.draw(target, character);
    assert.equal(copied, 720);
    assert.equal(rasterized, 5);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
