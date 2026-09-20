(() => {
  'use strict';
  const list = document.querySelector('#task-list');
  const rows = document.querySelector('#task-rows');
  const search = document.querySelector('#task-search');
  const order = document.querySelector('#task-order');
  const status = document.querySelector('#task-status');
  const count = document.querySelector('#results-count');
  const heading = document.querySelector('#results-title');
  const empty = document.querySelector('#empty-state');
  const draftNote = document.querySelector('#draft-note');
  const tableRows = [...rows.querySelectorAll('.task-row')];
  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const storageKey = `biblioteca-tareas:${location.pathname}`;
  const items = tableRows.map(row => ({
    row,
    id: row.dataset.id,
    title: row.dataset.title,
    state: row.dataset.state,
    created: Date.parse(row.dataset.created),
    searchable: normalize(row.dataset.search)
  }));

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved) {
      search.value = typeof saved.search === 'string' ? saved.search : '';
      if (saved.defaultOrder === 'created-asc' && [...order.options].some(o => o.value === saved.order)) order.value = saved.order;
      if ([...status.options].some(o => o.value === saved.status)) status.value = saved.status;
    }
  } catch { /* La biblioteca también funciona cuando el navegador bloquea almacenamiento local. */ }

  function compare(a, b) {
    const titleOrder = collator.compare(a.title, b.title) || a.id.localeCompare(b.id);
    if (order.value === 'title-asc') return titleOrder;
    if (order.value === 'title-desc') return -titleOrder;
    if (!Number.isFinite(a.created)) return Number.isFinite(b.created) ? 1 : titleOrder;
    if (!Number.isFinite(b.created)) return -1;
    return (order.value === 'created-asc' ? a.created - b.created : b.created - a.created) || titleOrder;
  }

  function update() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const sorted = [...items].sort(compare);
    let visible = 0;
    for (const item of sorted) {
      const matches = (status.value === 'all' || item.state === status.value) && terms.every(term => item.searchable.includes(term));
      item.row.hidden = !matches;
      if (matches) visible++;
      rows.append(item.row);
    }
    const total = items.filter(item => status.value === 'all' || item.state === status.value).length;
    count.textContent = terms.length ? `${visible} de ${total} tareas` : `${visible} ${visible === 1 ? 'tarea' : 'tareas'}`;
    heading.textContent = status.value === 'BORRADOR' ? 'Borradores' : status.value === 'all' ? 'Todas las tareas' : 'Tareas publicadas';
    empty.hidden = visible !== 0;
    list.hidden = visible === 0;
    draftNote.hidden = status.value === 'PUBLICADA';
    try { sessionStorage.setItem(storageKey, JSON.stringify({ search: search.value, order: order.value, status: status.value, defaultOrder: 'created-asc' })); } catch {}
  }

  search.addEventListener('input', update);
  order.addEventListener('change', update);
  status.addEventListener('change', update);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    search.value = '';
    order.value = 'created-asc';
    status.value = 'PUBLICADA';
    update();
    search.focus();
  });
  window.addEventListener('pageshow', update);
  update();
})();
