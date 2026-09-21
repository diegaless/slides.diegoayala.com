(() => {
  const checks = [...document.querySelectorAll("[data-check]")];
  const progress = document.querySelector("[data-progress]");
  const label = document.querySelector("[data-progress-label]");
  const note = document.querySelector("[data-storage-note]");
  const reset = document.querySelector("[data-reset-progress]");
  const storageKey = "diego-ayala.rm-skills.progress.v1";
  if (!checks.length || !progress || !label || !reset) return;

  function reportStorageUnavailable() {
    note.textContent = "Puedes marcar tu preparación, pero este navegador no permite guardarla al cerrar o recargar.";
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) {
      checks.forEach((check) => { check.checked = saved.includes(check.dataset.check); });
    }
    note.textContent = "Marca lo que ya tienes preparado. Tu progreso se guarda solo en este navegador.";
  } catch {
    reportStorageUnavailable();
  }

  function updateProgress(save = false) {
    const completed = checks.filter((check) => check.checked).map((check) => check.dataset.check);
    progress.max = checks.length;
    progress.value = completed.length;
    progress.textContent = `${completed.length} de ${checks.length}`;
    label.textContent = `${completed.length} de ${checks.length} preparados`;
    if (save) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(completed));
      } catch {
        reportStorageUnavailable();
      }
    }
  }

  checks.forEach((check) => check.addEventListener("change", () => updateProgress(true)));
  reset.addEventListener("click", () => {
    checks.forEach((check) => { check.checked = false; });
    updateProgress(true);
  });

  document.querySelector("[data-progress-ui]").hidden = false;
  reset.hidden = false;
  updateProgress();
})();
