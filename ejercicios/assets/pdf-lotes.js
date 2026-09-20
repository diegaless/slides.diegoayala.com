(() => {
  'use strict';
  const boxes = [...document.querySelectorAll('.pdf-select')];
  const selected = document.querySelector('#pdf-selected');
  const toggle = document.querySelector('#pdf-select-visible');
  const clear = document.querySelector('#pdf-clear');
  const status = document.querySelector('#pdf-selection-status');
  if (!selected || !toggle) return;
  let busy = false;
  let payloadPromise;
  const pdfDataURL = new URL('assets/pdf-datos.js', location.href).href;
  const visibleBoxes = () => boxes.filter(b => !b.closest('tr').hidden);
  function refresh() {
    const chosen = boxes.filter(b => b.checked);
    const visible = visibleBoxes();
    selected.disabled = busy || chosen.length === 0;
    selected.textContent = busy ? 'Preparando ZIP…' : `Descargar seleccionados (${chosen.length})`;
    clear.disabled = busy || chosen.length === 0;
    toggle.disabled = busy || visible.length === 0;
    toggle.checked = visible.length > 0 && visible.every(b => b.checked);
    toggle.indeterminate = visible.some(b => b.checked) && !toggle.checked;
    if (!busy) {
      const hidden = chosen.filter(b => b.closest('tr').hidden).length;
      status.textContent = chosen.length
        ? `${chosen.length} seleccionadas${hidden ? ` (${hidden} fuera del filtro actual)` : ''}. Se descargarán juntas en un ZIP.`
        : 'Selecciona tareas en la tabla. Descarga en ZIP.';
    }
  }
  toggle.addEventListener('change', () => {
    visibleBoxes().forEach(b => { b.checked = toggle.checked; });
    refresh();
  });
  boxes.forEach(b => b.addEventListener('change', refresh));
  clear.addEventListener('click', () => { boxes.forEach(b => { b.checked = false; }); refresh(); });
  new MutationObserver(refresh).observe(document.querySelector('#task-rows'), {subtree:true, attributes:true, attributeFilter:['hidden']});
  function loadPDFs() {
    if (window.bibliotecaPDF) return Promise.resolve(window.bibliotecaPDF);
    if (!payloadPromise) payloadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pdfDataURL;
      script.onload = () => window.bibliotecaPDF ? resolve(window.bibliotecaPDF) : reject(new Error('Datos PDF no disponibles'));
      script.onerror = () => { payloadPromise = undefined; script.remove(); reject(new Error('No se pudieron abrir los PDF')); };
      document.head.append(script);
    });
    return payloadPromise;
  }
  // ZIP sin compresión: conserva los PDF originales y funciona también desde file://.
  function zip(files) {
    const encoder = new TextEncoder();
    const parts = [], central = [];
    let offset = 0, centralSize = 0;
    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
      const local = new Uint8Array(30 + name.length);
      const l = new DataView(local.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true);
      l.setUint16(6, 0x800, true); l.setUint16(12, 0x21, true);
      l.setUint32(14, file.crc, true); l.setUint32(18, data.length, true);
      l.setUint32(22, data.length, true); l.setUint16(26, name.length, true);
      local.set(name, 30);
      const directory = new Uint8Array(46 + name.length);
      const d = new DataView(directory.buffer);
      d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true);
      d.setUint16(8, 0x800, true); d.setUint16(14, 0x21, true);
      d.setUint32(16, file.crc, true); d.setUint32(20, data.length, true);
      d.setUint32(24, data.length, true); d.setUint16(28, name.length, true);
      d.setUint32(42, offset, true); directory.set(name, 46);
      parts.push(local, data); central.push(directory);
      offset += local.length + data.length; centralSize += directory.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], {type:'application/zip'});
  }
  selected.addEventListener('click', async () => {
    const ids = new Set(boxes.filter(b => b.checked).map(b => b.value));
    if (!ids.size || busy) return;
    busy = true; refresh(); status.textContent = 'Preparando los PDF seleccionados…';
    try {
      const payload = await loadPDFs();
      const files = payload.files.filter(f => ids.has(f.id));
      if (files.length !== ids.size) throw new Error('Falta algún PDF de la selección');
      const url = URL.createObjectURL(zip(files));
      const a = document.createElement('a'); a.href = url; a.download = payload.zipName;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      busy = false; refresh(); status.textContent = `ZIP preparado con ${files.length} PDF.`;
    } catch (error) {
      busy = false; refresh();
      status.textContent = `${error.message}. Conserva juntas las carpetas de esta biblioteca e inténtalo de nuevo.`;
    }
  });
  refresh();
})();
