export function createPlayground() {
  const dialog = document.createElement('dialog');
  dialog.className = 'circle-playground';
  dialog.setAttribute('aria-label', 'Material de clase: modo interactivo');
  dialog.innerHTML = `
    <button class="playground-close" type="button" aria-label="Volver a la portada" title="Volver a la portada (Esc)">×</button>
    <p class="playground-hint" id="playground-hint">Arrastra y lanza el círculo · Apriétalo contra un borde · Doble clic para jugar · Esc para volver<br>Teclado: flechas para mover · Intro para jugar · Espacio para volver</p>`;
  dialog.setAttribute('aria-describedby', 'playground-hint');
  const hint = dialog.querySelector('.playground-hint');
  let frame;
  let previousFocus;
  let hintTimer;
  document.body.append(dialog);

  const cleanup = () => {
    clearTimeout(hintTimer);
    // Removing the browsing context releases its audio, animation and timers.
    frame?.remove();
    frame = null;
    document.body.classList.remove('playground-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
  const close = () => {
    if (!dialog.open) return;
    dialog.close();
    cleanup();
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
    if (event.code === 'Space' && !event.repeat && event.target === dialog) {
      event.preventDefault();
      close();
    }
  });
  window.addEventListener('message', event => {
    if (frame && event.source === frame.contentWindow && event.origin === location.origin &&
        event.data?.type === 'slides-playground-close') close();
  });

  return {
    open() {
      if (dialog.open) return;
      previousFocus = document.activeElement;
      const name = document.querySelector('.site-name').textContent.trim();
      const title = document.querySelector('#page-title').textContent.trim();
      const sections = [...document.querySelectorAll('.section-nav a')].map(link => link.textContent.trim());
      frame = document.createElement('iframe');
      frame.className = 'playground-frame';
      frame.title = 'Círculo interactivo del material de clase de Diego Ayala';
      frame.dataset.circleText = `${name}. ${title}. ${sections.join(' · ')}.`;
      frame.src = new URL('./frame.html', import.meta.url).href;
      frame.addEventListener('load', () => frame?.contentWindow.focus(), { once: true });
      dialog.prepend(frame);
      document.body.classList.add('playground-open');
      dialog.showModal();
      hint.classList.add('is-visible');
      hintTimer = setTimeout(() => hint.classList.remove('is-visible'), 6500);
    },
  };
}
