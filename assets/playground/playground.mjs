import { captureSubjects, animateLetters, MOTION_DURATION } from './transition.mjs?v=3';

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
  let subjectLabels = [];
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
    subjectLabels.forEach(label => label.classList.remove('playground-source-hidden'));
    subjectLabels = [];
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
  const reveal = () => {
    if (stage !== 'entering') return;
    stage = 'revealing';
    frame.classList.add('is-visible');
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
    const { labels, letters } = captureSubjects();
    motion = animateLetters(dialog, letters, data.glyphs, { reduced: reducedMotion.matches });
    subjectLabels = labels;
    subjectLabels.forEach(label => label.classList.add('playground-source-hidden'));
    fadeHome(0, reducedMotion.matches ? 0 : 180);
    motion.finished.then(reveal);
  };
  const returnLetters = data => {
    if (stage !== 'leaving') return;
    if (!data.glyphs) { fadeOut(); return; }
    stage = 'returning';
    const opened = generation;
    motion = animateLetters(dialog, captureSubjects().letters, data.glyphs, { reverse: true });
    fadeHome(1, 200, MOTION_DURATION - 200);
    effects.push(frame.animate([{ opacity: 1 }, { opacity: 0 }],
      { duration: MOTION_DURATION - 200, fill: 'forwards', easing: 'ease-in-out' }));
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
      const subjects = captureSubjects();
      const typography = subjects.letters[0];
      frame = document.createElement('iframe');
      frame.className = 'playground-frame';
      frame.title = 'Círculo interactivo de las asignaturas';
      frame.dataset.circleText = subjects.text;
      frame.dataset.fontFamily = typography.fontFamily;
      frame.dataset.fontWeight = typography.weight;
      frame.dataset.glyphColors = JSON.stringify(subjects.letters.map(letter => letter.color));
      frame.dataset.morph = 'true';
      frame.dataset.background = appearance.backgroundColor;
      frame.dataset.foreground = appearance.color;
      frame.dataset.surface = appearance.background;
      if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
          new URLSearchParams(location.search).get('scores') === 'emulator') frame.dataset.scoreEmulator = 'true';
      frame.src = new URL('./frame.html?v=7', import.meta.url).href;
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
