import { captureLetters, animateLetters } from './transition.mjs';

export function createPlayground() {
  const dialog = document.createElement('dialog');
  dialog.className = 'circle-playground';
  dialog.setAttribute('aria-label', 'Material de clase: modo interactivo');
  dialog.tabIndex = -1;
  dialog.innerHTML = '<button class="playground-close" type="button" aria-label="Volver a la portada" title="Volver a la portada (Esc)">×</button>';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const home = [...document.querySelectorAll('.site-header, .page-main, .site-footer')];
  let frame;
  let previousFocus;
  let stage = 'idle';
  let motion;
  let homeAnimations = [];
  let timers = [];
  let effects = [];
  let generation = 0;
  document.body.append(dialog);

  const fadeHome = (opacity, duration, delay = 0) => {
    const current = home.map(element => getComputedStyle(element).opacity);
    homeAnimations.forEach(animation => animation.cancel());
    homeAnimations = home.map((element, index) => element.animate(
      [{ opacity: current[index] }, { opacity }],
      { duration, delay, fill: 'both', easing: 'ease-in-out' },
    ));
  };
  const send = type => frame?.contentWindow.postMessage({ type }, location.origin);
  const cleanup = () => {
    generation++;
    timers.forEach(clearTimeout);
    timers = [];
    motion?.cancel();
    motion = null;
    effects.forEach(animation => animation.cancel());
    effects = [];
    homeAnimations.forEach(animation => animation.cancel());
    homeAnimations = [];
    frame?.remove();
    frame = null;
    stage = 'idle';
    dialog.classList.remove('is-ready');
    document.body.classList.remove('playground-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
  const finishClose = () => {
    dialog.close();
    cleanup();
  };
  const fadeOut = () => {
    if (stage !== 'leaving') return;
    stage = 'fading-out';
    const duration = reducedMotion.matches ? 0 : 280;
    fadeHome(1, duration);
    const effect = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
    effects.push(effect);
    effect.finished.then(() => { if (stage === 'fading-out') finishClose(); }).catch(() => {});
  };
  const close = () => {
    if (!dialog.open || ['leaving', 'fading-out', 'returning'].includes(stage)) return;
    const wasActive = stage === 'active';
    stage = 'leaving';
    frame.style.pointerEvents = 'none';
    dialog.focus({ preventScroll: true });
    if (wasActive && !reducedMotion.matches) {
      send('slides-playground-snapshot');
      timers.push(setTimeout(fadeOut, 240));
    } else fadeOut();
  };
  const reveal = async () => {
    if (stage !== 'entering') return;
    stage = 'revealing';
    const opened = generation;
    frame.classList.add('is-visible');
    fadeHome(0, reducedMotion.matches ? 0 : 120);
    if (motion) {
      const effect = motion.canvas.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: reducedMotion.matches ? 0 : 160, fill: 'forwards' });
      effects.push(effect);
      await effect.finished.catch(() => {});
    }
    if (generation !== opened || stage !== 'revealing') return;
    motion?.cancel();
    motion = null;
    stage = 'active';
    send('slides-playground-begin');
    frame.contentWindow.focus();
  };
  const enter = data => {
    if (stage !== 'loading') return;
    stage = 'entering';
    dialog.classList.add('is-ready');
    const sources = captureLetters();
    fadeHome(0, reducedMotion.matches ? 0 : 180);
    motion = animateLetters(dialog, sources, data.glyphs, { reduced: reducedMotion.matches });
    motion.finished.then(reveal);
  };
  const returnLetters = data => {
    if (stage !== 'leaving') return;
    if (!data.glyphs) { fadeOut(); return; }
    stage = 'returning';
    const opened = generation;
    motion = animateLetters(dialog, captureLetters(), data.glyphs, { reverse: true });
    fadeHome(1, 270, 780);
    effects.push(frame.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: 850, fill: 'forwards', easing: 'ease-in-out' }));
    effects.push(motion.canvas.animate([{ opacity: 1 }, { opacity: 0 }],
      { delay: 780, duration: 270, fill: 'forwards' }));
    motion.finished.then(() => { if (generation === opened && stage === 'returning') finishClose(); });
  };
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    // A queued close event can arrive after a fast reopening.
    if (!dialog.open) cleanup();
  });
  dialog.addEventListener('keydown', event => {
    if (event.code === 'Space' && event.target === dialog) {
      event.preventDefault();
      if (!event.repeat) close();
    }
  });
  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    if (event.data?.type === 'slides-playground-close') close();
    if (event.data?.type === 'slides-playground-ready') enter(event.data);
    if (event.data?.type === 'slides-playground-snapshot') returnLetters(event.data);
    if (event.data?.type === 'slides-playground-theme') dialog.style.setProperty('--play-ink', event.data.color);
  });
  window.addEventListener('resize', () => {
    if (stage === 'entering') reveal();
    if (stage === 'returning') finishClose();
  });

  return {
    open() {
      if (dialog.open) return;
      generation++;
      stage = 'loading';
      previousFocus = document.activeElement;
      const appearance = getComputedStyle(document.body);
      dialog.style.setProperty('--play-ink', appearance.color);
      const name = document.querySelector('.site-name').textContent.trim();
      const title = document.querySelector('#page-title').textContent.trim();
      const sections = [...document.querySelectorAll('.section-nav a')].map(link => link.textContent.trim());
      frame = document.createElement('iframe');
      frame.className = 'playground-frame';
      frame.title = 'Círculo interactivo del material de clase de Diego Ayala';
      frame.dataset.circleText = `${name}. ${title}. ${sections.join(' · ')}.`;
      frame.dataset.morph = 'true';
      frame.dataset.background = appearance.backgroundColor;
      frame.dataset.foreground = appearance.color;
      frame.dataset.surface = appearance.background;
      frame.src = new URL('./frame.html', import.meta.url).href;
      dialog.prepend(frame);
      document.body.classList.add('playground-open');
      dialog.showModal();
      dialog.focus({ preventScroll: true });
      timers.push(setTimeout(() => {
        if (stage === 'loading') {
          console.error('No se ha podido cargar el modo interactivo.');
          close();
        }
      }, 10000));
    },
  };
}
