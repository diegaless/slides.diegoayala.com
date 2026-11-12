const INTERACTIVE = 'a, button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

export function createShortcutHint() {
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hint = document.createElement('aside');
  hint.className = 'playground-hint';
  hint.setAttribute('aria-label', 'Sugerencia de teclado');
  hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = '<span>psst… prueba</span><kbd>espacio</kbd>';
  document.body.append(hint);

  let timer;
  let stopped = false;
  const nextDelay = () => 75_000 + Math.random() * 45_000;
  const hide = () => {
    hint.classList.remove('is-visible');
    hint.setAttribute('aria-hidden', 'true');
  };
  const schedule = delay => {
    clearTimeout(timer);
    if (!stopped && !document.hidden && pointer.matches) timer = setTimeout(show, delay);
  };
  const show = () => {
    if (stopped || document.hidden || !pointer.matches) return;
    if (document.querySelector('dialog[open]') || document.activeElement?.closest(INTERACTIVE)) {
      schedule(nextDelay());
      return;
    }
    hint.classList.add('is-visible');
    hint.setAttribute('aria-hidden', 'false');
    timer = setTimeout(() => {
      hide();
      schedule(nextDelay());
    }, 6_500);
  };
  const defer = () => {
    hide();
    schedule(nextDelay());
  };
  const onFocus = event => {
    if (event.target.closest(INTERACTIVE)) defer();
  };
  document.addEventListener('visibilitychange', defer);
  document.addEventListener('focusin', onFocus);
  pointer.addEventListener('change', defer);
  schedule(12_000);

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      hide();
      document.removeEventListener('visibilitychange', defer);
      document.removeEventListener('focusin', onFocus);
      pointer.removeEventListener('change', defer);
    },
  };
}
