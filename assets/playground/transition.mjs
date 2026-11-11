const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (from, to, t) => from + (to - from) * t;
const letterKey = text => text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '');

// Each visible letter can supply at most one character of the ring.
export function matchLetters(sources, targets) {
  const used = new Set();
  return targets.map(target => {
    let best = -1, distance = Infinity;
    for (let index = 0; index < sources.length; index++) {
      if (used.has(index) || letterKey(sources[index].character) !== letterKey(target.character)) continue;
      const delta = Math.hypot(sources[index].x - target.x, sources[index].y - target.y);
      if (delta < distance) { best = index; distance = delta; }
    }
    if (best !== -1) used.add(best);
    return best;
  });
}

export function letterPose(from, to, progress) {
  const t = ease(progress);
  const bend = Math.sin(Math.PI * t) * Math.min(70, Math.hypot(to.x - from.x, to.y - from.y) * 0.13);
  return {
    x: mix(from.x, to.x, t) + Math.cos(to.rotation || 0) * bend,
    y: mix(from.y, to.y, t) + Math.sin(to.rotation || 0) * bend,
    rotation: mix(from.rotation || 0, to.rotation || 0, t),
    fontSize: mix(from.fontSize, to.fontSize, t),
    scale: mix(from.scale ?? 1, to.scale ?? 1, t),
  };
}

export function captureLetters() {
  const letters = [];
  for (const section of document.querySelectorAll('.site-header, .page-main, .site-footer')) {
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest('.sr-only, [aria-hidden="true"], [hidden], script, style')) continue;
      const style = getComputedStyle(parent);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const range = document.createRange();
      let offset = 0;
      for (const original of node.textContent) {
        range.setStart(node, offset);
        offset += original.length;
        range.setEnd(node, offset);
        if (/\s/u.test(original)) continue;
        const rect = range.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 2 || rect.bottom <= 0 || rect.top >= innerHeight ||
            rect.right <= 0 || rect.left >= innerWidth) continue;
        const character = style.textTransform === 'uppercase' ? original.toLocaleUpperCase('es') :
          style.textTransform === 'lowercase' ? original.toLocaleLowerCase('es') : original;
        letters.push({ character, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          rotation: 0, fontSize: parseFloat(style.fontSize), fontFamily: style.fontFamily,
          weight: style.fontWeight, color: style.color, scale: 1 });
      }
    }
  }
  return letters;
}

function colorChannels(color) {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const expanded = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex;
    return [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16));
  }
  return (color.match(/[\d.]+/g) || ['255', '255', '255']).slice(0, 3).map(Number);
}

export function animateLetters(dialog, sources, targets, { reverse = false, reduced = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'playground-transition';
  canvas.setAttribute('aria-hidden', 'true');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(innerWidth * ratio);
  canvas.height = Math.ceil(innerHeight * ratio);
  dialog.append(canvas);
  const context = canvas.getContext('2d');
  const matches = matchLetters(sources, targets);
  const used = new Set(matches.filter(index => index !== -1));
  const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const moves = targets.map((target, index) => {
    const source = sources[matches[index]];
    const start = source || { ...target, x: innerWidth / 2, y: innerHeight / 2,
      fontFamily, weight: '400', scale: 1 };
    return { source: start, target: { ...target, fontFamily, weight: '400' },
      introduced: !source, delay: index / Math.max(1, targets.length - 1) * 100,
      fromColor: colorChannels(start.color), toColor: colorChannels(target.color) };
  });
  const leftovers = sources.filter((_source, index) => !used.has(index));
  let animationFrame;
  let resolveFinished;
  let cancelled = false;
  const finished = new Promise(resolve => { resolveFinished = resolve; });

  const paint = (pose, opacity, character, color, family, weight) => {
    if (opacity <= 0) return;
    context.save();
    context.translate(pose.x, pose.y);
    context.rotate(pose.rotation);
    context.scale(pose.scale, 1);
    context.font = `${weight} ${pose.fontSize}px ${family}`;
    context.fillStyle = color;
    context.globalAlpha = opacity;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(character, 0, 0);
    context.restore();
  };

  const started = performance.now();
  const duration = reduced ? 0 : 1050;
  const draw = now => {
    if (cancelled) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, innerWidth, innerHeight);
    const elapsed = now - started;
    const overall = duration ? clamp(elapsed / duration) : 1;
    const visible = reverse ? 1 - overall : overall;
    for (const move of moves) {
      const progress = duration ? clamp((elapsed - move.delay) / (duration - 100)) : 1;
      const t = reverse ? 1 - progress : progress;
      const pose = letterPose(move.source, move.target, t);
      const crossfade = ease((t - 0.12) / 0.7);
      const opacity = (move.introduced ? ease(t) : 1) * (reverse ? 1 : ease(overall / 0.12));
      const color = `rgb(${move.fromColor.map((channel, index) => Math.round(mix(channel, move.toColor[index], ease(t)))).join(',')})`;
      const weight = String(Math.round(mix(parseInt(move.source.weight, 10) || 400, 400, ease(t))));
      paint(pose, opacity * (1 - crossfade), move.source.character, color, move.source.fontFamily, weight);
      paint(pose, opacity * crossfade, move.target.character, color, fontFamily, weight);
    }
    for (const source of leftovers) {
      const fade = 1 - ease(visible / 0.48);
      const pose = { ...source, x: source.x + (innerWidth / 2 - source.x) * ease(visible) * 0.12,
        y: source.y + (innerHeight / 2 - source.y) * ease(visible) * 0.12 };
      paint(pose, fade * (reverse ? 1 : ease(overall / 0.12)), source.character, source.color, source.fontFamily, source.weight);
    }
    if (overall < 1) animationFrame = requestAnimationFrame(draw);
    else resolveFinished();
  };
  animationFrame = requestAnimationFrame(draw);
  return {
    canvas, finished,
    cancel() { cancelled = true; cancelAnimationFrame(animationFrame); canvas.remove(); resolveFinished(); },
  };
}
