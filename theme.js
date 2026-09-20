(() => {
  const root = document.documentElement;
  const defaultTheme = "dark";
  // La nueva preferencia empieza en oscuro y recuerda los cambios posteriores.
  const preferenceKey = "diego-ayala.theme";
  let savedTheme;
  try {
    savedTheme = localStorage.getItem(preferenceKey);
  } catch {
    // El tema sigue funcionando si el navegador no permite guardar preferencias.
  }

  function applyTheme(theme) {
    root.dataset.theme = theme === "light" ? "light" : defaultTheme;
    const isDark = root.dataset.theme === "dark";
    const toggle = document.querySelector("[data-theme-toggle]");
    toggle?.setAttribute("aria-label", isDark ? "Activar modo claro" : "Activar modo oscuro");
    toggle?.setAttribute("aria-pressed", String(isDark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#030405" : "#f8fafc");
  }

  // Se ejecuta en la cabecera para aplicar el tema antes de mostrar la página.
  applyTheme(savedTheme);

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(root.dataset.theme);
    document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
      try {
        localStorage.setItem(preferenceKey, root.dataset.theme);
      } catch {
        // La preferencia se mantiene en esta página aunque no pueda persistirse.
      }
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === preferenceKey) applyTheme(event.newValue);
  });
})();
