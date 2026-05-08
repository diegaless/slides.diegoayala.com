const toast = document.querySelector("[data-toast]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const subjectLinks = [...document.querySelectorAll(".subject-link")];
let toastTimer;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);

  const isDark = theme === "dark";
  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Activar modo claro" : "Activar modo oscuro",
    );
  }
}

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

setTheme(document.documentElement.dataset.theme || "light");

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

document.querySelectorAll("[data-pending]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.classList.contains("subject-link")) {
      subjectLinks.forEach((item) => item.classList.remove("is-active"));
      link.classList.add("is-active");
      showToast("PDF pendiente de enlazar.");
      return;
    }

    showToast("Enlace pendiente de configurar.");
  });
});
