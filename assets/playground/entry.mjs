let playground;
let loading = false;

document.addEventListener('keydown', async event => {
  if (event.code !== 'Space' || event.repeat || event.defaultPrevented ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      document.querySelector('dialog[open]') ||
      event.target.closest('a, button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return;

  event.preventDefault();
  if (loading) return;
  loading = true;
  try {
    playground ??= (await import('./playground.mjs?v=9')).createPlayground();
    playground.open();
  } catch (error) {
    console.error('No se ha podido abrir el modo interactivo.', error);
  } finally {
    loading = false;
  }
});
