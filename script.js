const toast = document.querySelector("[data-toast]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

document.querySelectorAll("[data-pending]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Enlace pendiente de configurar.");
  });
});

function initSubjectResources() {
  const template = document.querySelector("#subject-resources-template");
  if (!template) return;

  let openSubject;

  document.querySelectorAll("[data-subject-resources] .subject-link").forEach((link, index) => {
    const subjectName = link.querySelector("span").textContent;
    const resources = template.content.firstElementChild.cloneNode(true);
    const trigger = document.createElement("button");
    const tabs = [...resources.querySelectorAll("[role='tab']")];
    const panels = [...resources.querySelectorAll("[role='tabpanel']")];
    const prefix = `subject-${index + 1}`;
    const download = link.parentElement.querySelector(".subject-download");
    const urls = {
      slides: link.hasAttribute("data-pending") ? "" : link.getAttribute("href"),
      exercises: link.dataset.exercisesUrl?.trim(),
    };

    trigger.type = "button";
    trigger.className = "subject-link";
    trigger.append(...link.cloneNode(true).childNodes);
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", `${prefix}-resources`);
    resources.id = `${prefix}-resources`;
    resources.querySelector("[role='tablist']").setAttribute("aria-label", `Recursos de ${subjectName}`);

    if (download && urls.slides) {
      resources.querySelector(".resource-actions").append(download);
      const note = resources.querySelector("[data-download-note]");
      note.id = `${prefix}-download-note`;
      note.textContent = download.dataset.downloadDescription;
      note.hidden = false;
      download.setAttribute("aria-describedby", note.id);
    }

    tabs.forEach((tab) => {
      tab.id = `${prefix}-${tab.dataset.resource}-tab`;
      tab.setAttribute("aria-controls", `${prefix}-${tab.dataset.resource}-panel`);
    });

    panels.forEach((panel) => {
      const resource = panel.dataset.panel;
      const label = resource === "slides" ? "diapositivas" : "ejercicios";
      const action = panel.querySelector("[data-open]");
      panel.id = `${prefix}-${resource}-panel`;
      panel.setAttribute("aria-labelledby", `${prefix}-${resource}-tab`);

      if (urls[resource]) {
        action.href = urls[resource];
        if (resource === "exercises") {
          action.removeAttribute("target");
          action.removeAttribute("rel");
          action.querySelector("span").textContent = "→";
          action.setAttribute("aria-label", `Abrir ${label} de ${subjectName}`);
        } else {
          action.setAttribute("aria-label", `Abrir ${label} de ${subjectName} en una pestaña nueva`);
        }
      } else {
        action.hidden = true;
        const actions = action.closest(".resource-actions");
        if (actions) actions.hidden = true;
        panel.tabIndex = 0;
        panel.querySelector("[data-unavailable]").hidden = false;
        panel.querySelector("[data-description]").textContent = resource === "slides"
          ? "Las diapositivas de esta asignatura estarán disponibles aquí."
          : "Los ejercicios de esta asignatura estarán disponibles aquí.";
      }
    });

    function selectTab(selectedTab, moveFocus = false) {
      tabs.forEach((tab) => {
        const selected = tab === selectedTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== selectedTab.dataset.resource;
      });
      if (moveFocus) selectedTab.focus();
    }

    function closeSubject() {
      resources.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove("is-active");
      openSubject = undefined;
    }

    trigger.addEventListener("click", () => {
      if (!resources.hidden) {
        closeSubject();
        return;
      }

      openSubject?.();
      selectTab(tabs[0]);
      resources.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      trigger.classList.add("is-active");
      openSubject = closeSubject;
    });

    tabs.forEach((tab, tabIndex) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex;
        if (event.key === "ArrowRight") nextIndex = (tabIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        selectTab(tabs[nextIndex], true);
      });
    });

    link.replaceWith(trigger);
    trigger.after(resources);
    trigger.parentElement.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !resources.hidden) {
        event.preventDefault();
        closeSubject();
        trigger.focus();
      }
    });
  });
}

initSubjectResources();
