export const PUBLISHED_DECKS = Object.freeze({
  lm: {
    name: "Lenguaje de Marcas",
    url: "https://docs.google.com/presentation/d/e/2PACX-1vSgGxnpcx0d7veUB6VO_9h_39i1KS80H405V9xurcaIgrDlWmbL7saxlkiWKzoafg/pub?start=false&loop=false&delayms=3000",
  },
  ssii: {
    name: "Sistemas Informáticos",
    url: "https://docs.google.com/presentation/d/e/2PACX-1vTy-2l8gaIE_m2Quaj3XHRUcQLzRRi8jaHFZxL2f_XVjv-zWayJ4MlSqIS89milRA/pub?start=false&loop=false&delayms=3000",
  },
});

const SLIDE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizeSlideId(value) {
  const normalized = String(value || "").trim().replace(/^id\./, "");
  return SLIDE_ID_PATTERN.test(normalized) ? normalized : null;
}

export function buildPublishedSlideUrl(deckKey, rawSlideId) {
  const deck = PUBLISHED_DECKS[deckKey];
  const slideId = normalizeSlideId(rawSlideId);
  if (!deck || !slideId) return null;

  const target = new URL(deck.url);
  target.searchParams.set("slide", `id.${slideId}`);
  return target.toString();
}

function showError(message) {
  const title = document.querySelector("#redirect-title");
  const status = document.querySelector("[data-slide-status]");
  if (title) title.textContent = "No se pudo abrir la diapositiva";
  if (status) status.textContent = message;
}

function redirectToRequestedSlide() {
  const params = new URLSearchParams(window.location.search);
  const deckKey = params.get("deck") || "";
  const target = buildPublishedSlideUrl(deckKey, params.get("slide"));
  if (!target) {
    showError("El enlace no identifica una asignatura y una diapositiva válidas.");
    return;
  }

  const deck = PUBLISHED_DECKS[deckKey];
  const status = document.querySelector("[data-slide-status]");
  const link = document.querySelector("[data-slide-link]");
  if (status) status.textContent = `Abriendo ${deck.name} en la página exacta.`;
  if (link instanceof HTMLAnchorElement) {
    link.href = target;
    link.hidden = false;
  }
  window.location.replace(target);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  redirectToRequestedSlide();
}
