const toast = document.querySelector('[data-toast]');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

document.querySelectorAll('[data-pending]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showToast('Enlace pendiente de configurar.');
  });
});

// Los enlaces y los desplegables ya están en el HTML. No se reordena ningún
// elemento visible al arrancar y el material sigue accesible sin JavaScript.
const subjects = [...document.querySelectorAll('[data-subject-resources] .subject-group')];
for (const subject of subjects) {
  const trigger = subject.querySelector('summary');
  const tablist = subject.querySelector('[role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = [...subject.querySelectorAll('[data-panel]')];

  function selectTab(selected, moveFocus = false) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.panel !== selected.dataset.resource;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', panel.id.replace('-panel', '-tab'));
      if (!panel.querySelector('a')) panel.tabIndex = 0;
    });
    if (moveFocus) selected.focus();
  }

  tablist.hidden = false;
  selectTab(tabs[0]);
  subject.addEventListener('toggle', () => {
    if (!subject.open) return;
    subjects.forEach(other => { if (other !== subject) other.open = false; });
    selectTab(tabs[0]);
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight:(index + 1) % tabs.length,
        ArrowLeft:(index - 1 + tabs.length) % tabs.length, Home:0, End:tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next], true);
    });
  });
  subject.addEventListener('keydown', event => {
    if (event.key === 'Escape' && subject.open) {
      event.preventDefault();
      subject.open = false;
      trigger.focus();
    }
  });
}
