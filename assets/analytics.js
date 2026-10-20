// Solo páginas docentes publicadas; nunca herramientas privadas ni vistas previas.
(() => {
  if (location.hostname !== 'slides.diegoayala.com' || location.protocol !== 'https:' ||
      /^\/(profesor|soluciones|go)(\/|$)/.test(location.pathname) ||
      document.getElementById('analytics-consent')) return;

  const GOOGLE_ID = 'G-5N2T7K0FMJ';
  const CONSENT_KEY = 'slides.analytics-consent.v1';
  const CONSENT_AGE = 180 * 24 * 60 * 60 * 1000;
  let googleStarted = false;

  // Cloudflare conserva la medición sin cookies que ya tenía la web.
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({token:'f00eddf676f948a2b5bb9d7ea685950b'});
  document.head.append(beacon);

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONSENT_KEY));
      const age = Date.now() - saved.at;
      if (['granted', 'denied'].includes(saved.status) && Number.isFinite(saved.at) &&
          age >= 0 && age < CONSENT_AGE) return saved.status;
    } catch { /* Sin almacenamiento o con una preferencia inválida: preguntar. */ }
    return null;
  }

  function clearGoogleCookies() {
    try {
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!name.startsWith('slides_')) continue;
        const expired = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
        document.cookie = expired;
        document.cookie = expired + '; Domain=' + location.hostname;
      }
    } catch { /* El navegador puede bloquear también el acceso a las cookies. */ }
  }

  function startGoogle() {
    if (googleStarted) return;
    googleStarted = true;
    window['ga-disable-' + GOOGLE_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    const gtag = window.gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    gtag('consent', 'update', {analytics_storage: 'granted'});
    gtag('set', 'ads_data_redaction', true);
    gtag('js', new Date());
    let referrer = '';
    try { referrer = new URL(document.referrer).origin + '/'; } catch { /* Acceso directo. */ }
    gtag('config', GOOGLE_ID, {
      send_page_view: true,
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: location.hostname,
      cookie_prefix: 'slides',
      cookie_expires: CONSENT_AGE / 1000,
      cookie_flags: 'SameSite=Lax;Secure'
    });
    // Modo de consentimiento básico: ninguna petición a Google antes de aceptar.
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ID;
    document.head.append(tag);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  const panel = element('section', 'analytics-consent');
  panel.id = 'analytics-consent';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', 'analytics-consent-title');
  panel.hidden = true;
  const title = element('h2', 'analytics-consent-title', 'Estadísticas de visitas');
  title.id = 'analytics-consent-title';
  const description = element('p', 'analytics-consent-description',
    'Podemos usar cookies de Google Analytics para conocer qué páginas se consultan. Puedes aceptarlas o continuar sin ellas.');
  const information = element('a', 'analytics-consent-information', 'Privacidad de Google');
  information.href = 'https://policies.google.com/privacy?hl=es';
  information.target = '_blank';
  information.rel = 'noopener noreferrer';
  const actions = element('div', 'analytics-consent-actions');
  const reject = element('button', 'analytics-consent-choice', 'Rechazar');
  const accept = element('button', 'analytics-consent-choice', 'Aceptar');
  reject.type = accept.type = 'button';
  actions.append(reject, accept);
  panel.append(title, description, information, actions);
  document.body.append(panel);

  const preferences = element('button', 'analytics-preferences', 'Cookies');
  preferences.type = 'button';
  preferences.setAttribute('aria-label', 'Cambiar las preferencias de cookies');
  preferences.setAttribute('aria-controls', panel.id);
  preferences.addEventListener('click', () => {
    panel.hidden = false;
    reject.focus();
  });
  const footer = document.querySelector('.site-footer');
  if (footer) {
    const separator = element('span', '');
    separator.setAttribute('aria-hidden', 'true');
    footer.append(separator, preferences);
  } else {
    preferences.classList.add('analytics-preferences-floating');
    document.body.append(preferences);
  }

  function applyConsent(status) {
    panel.hidden = status !== null;
    if (status === 'granted') {
      startGoogle();
    } else {
      window['ga-disable-' + GOOGLE_ID] = true;
      clearGoogleCookies();
      // Recargar retira también la etiqueta que ya estaba ejecutándose.
      if (googleStarted) location.reload();
    }
  }

  function choose(status) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({status, at: Date.now()})); }
    catch { /* La elección sigue siendo válida para esta página. */ }
    applyConsent(status);
    if (panel.contains(document.activeElement)) preferences.focus();
  }
  reject.addEventListener('click', () => choose('denied'));
  accept.addEventListener('click', () => choose('granted'));
  window.addEventListener('storage', event => {
    if (event.key === CONSENT_KEY || event.key === null) applyConsent(readConsent());
  });
  applyConsent(readConsent());
})();
