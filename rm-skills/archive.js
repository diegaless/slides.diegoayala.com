(() => {
  function revealLinkedEdition() {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const edition = document.getElementById(id);
    if (!edition?.matches('.exam[data-scope]')) return;

    const selected = document.querySelector('input[name="skills-scope"]:checked');
    if (selected.value !== 'all' && selected.value !== edition.dataset.scope) {
      document.querySelector(`input[name="skills-scope"][value="${edition.dataset.scope}"]`).checked = true;
    }
    edition.open = true;
    requestAnimationFrame(() => edition.scrollIntoView({ block: 'start' }));
  }

  window.addEventListener('hashchange', revealLinkedEdition);
  revealLinkedEdition();
})();
