// Rasterize each distinct glyph once; animation frames only copy cached pixels.
export function createGlyphAtlas(characters, font, fontSize, color, ratio) {
  const glyphs = [...new Set(characters.filter(character => !/\s/u.test(character)))];
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const columns = Math.max(1, Math.ceil(Math.sqrt(glyphs.length)));
  const cellWidth = Math.ceil(Math.max(1, ...glyphs.map(character => context.measureText(character).width)) + fontSize);
  const cellHeight = Math.ceil(fontSize * 2.5);
  canvas.width = Math.ceil(columns * cellWidth * ratio);
  canvas.height = Math.ceil(Math.ceil(glyphs.length / columns) * cellHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.font = font;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const cells = new Map();
  glyphs.forEach((character, index) => {
    const x = index % columns * cellWidth;
    const y = Math.floor(index / columns) * cellHeight;
    context.fillText(character, x + cellWidth / 2, y + cellHeight / 2);
    cells.set(character, { x: x * ratio, y: y * ratio });
  });
  return {
    draw(target, character) {
      const cell = cells.get(character);
      target.drawImage(canvas, cell.x, cell.y, cellWidth * ratio, cellHeight * ratio,
        -cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight);
    },
  };
}
