export const MOTION_DURATION = 1120;

export function subjectsText(names) {
  return names.map(name => name.trim().replace(/\s+/gu, ' ')).join('   ');
}

// The nth subject letter becomes the nth ring letter, preserving case and accents.
export function pairLetters(sources, targets) {
  if (sources.length !== targets.length || sources.some((source, index) => source.character !== targets[index].character)) {
    throw new Error('Las letras del círculo deben coincidir con las asignaturas, en el mismo orden.');
  }
  return sources.map((source, index) => ({ source, target: targets[index] }));
}

export function letterTransform(source, pose) {
  const size = pose.fontSize / source.fontSize;
  return `translate3d(${pose.x - source.width / 2}px, ${pose.y - source.height / 2}px, 0) rotate(${pose.rotation || 0}rad) scale(${size * (pose.scale ?? 1)}, ${size})`;
}

export function captureSubjects() {
  const labels = [...document.querySelectorAll('[data-subject-resources] .subject-link > span')];
  const letters = [];
  for (const label of labels) {
    const style = getComputedStyle(label);
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node;
    while ((node = walker.nextNode())) {
      let offset = 0;
      for (const character of node.textContent) {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        if (/\s/u.test(character)) continue;
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        letters.push({ character, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          width: rect.width, height: rect.height, rotation: 0, scale: 1,
          fontSize: parseFloat(style.fontSize), fontFamily: style.fontFamily,
          weight: style.fontWeight, color: style.color });
      }
    }
  }
  return { labels, letters, text: subjectsText(labels.map(label => label.textContent)) };
}

export function animateLetters(dialog, sources, targets, { reverse = false, reduced = false } = {}) {
  const pairs = pairLetters(sources, targets);
  const layer = document.createElement('div');
  layer.className = 'playground-transition';
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.letters = String(pairs.length);
  const fragment = document.createDocumentFragment();
  const nodes = pairs.map(({ source }) => {
    const node = document.createElement('span');
    node.className = 'playground-letter';
    node.textContent = source.character;
    Object.assign(node.style, {
      width: `${source.width}px`, height: `${source.height}px`, lineHeight: `${source.height}px`,
      fontSize: `${source.fontSize}px`, fontFamily: source.fontFamily, fontWeight: source.weight,
      color: source.color,
    });
    fragment.append(node);
    return node;
  });
  layer.append(fragment);
  dialog.append(layer);
  const startTime = document.timeline.currentTime;
  const animations = pairs.map(({ source, target }, index) => {
    const keyframes = [{ transform: letterTransform(source, source) }, { transform: letterTransform(source, target) }];
    if (reverse && source.color !== target.color) {
      keyframes[0].color = source.color;
      keyframes[1].color = target.color;
    }
    const animation = nodes[index].animate(reverse ? keyframes.reverse() : keyframes,
      { duration: reduced ? 0 : MOTION_DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' });
    if (startTime !== null) animation.startTime = startTime;
    return animation;
  });
  return {
    layer,
    finished: Promise.all(animations.map(animation => animation.finished.catch(() => {}))),
    cancel() { animations.forEach(animation => animation.cancel()); layer.remove(); },
  };
}
