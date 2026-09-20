(() => {
  'use strict';
  const list = document.querySelector('#task-list');
  const rows = document.querySelector('#task-rows');
  const search = document.querySelector('#task-search');
  const order = document.querySelector('#task-order');
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-state');
  const tableRows = [...rows.querySelectorAll('.task-row')];
  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const storageKey = `biblioteca-tareas:${location.pathname}`;
  const items = tableRows.map(row => ({
    row,
    id: row.dataset.id,
    title: row.dataset.title,
    created: Date.parse(row.dataset.created),
    searchable: normalize(row.dataset.search)
  }));

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved) {
      search.value = typeof saved.search === 'string' ? saved.search : '';
      if (saved.defaultOrder === 'created-asc' && [...order.options].some(o => o.value === saved.order)) order.value = saved.order;
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
      const matches = terms.every(term => item.searchable.includes(term));
      item.row.hidden = !matches;
      if (matches) visible++;
      rows.append(item.row);
    }
    const total = items.length;
    count.textContent = terms.length ? `${visible} de ${total} tareas` : `${visible} ${visible === 1 ? 'tarea' : 'tareas'}`;
    empty.hidden = visible !== 0;
    list.hidden = visible === 0;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ search: search.value, order: order.value, defaultOrder: 'created-asc' })); } catch {}
  }

  search.addEventListener('input', update);
  order.addEventListener('change', update);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    search.value = '';
    order.value = 'created-asc';
    update();
    search.focus();
  });
  window.addEventListener('pageshow', update);
  update();
})();
