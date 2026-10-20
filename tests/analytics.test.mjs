import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/analytics.js', import.meta.url), 'utf8');
const key = 'slides.analytics-consent.v1';
const googleId = 'G-5N2T7K0FMJ';

// Se ejecuta el cargador real con un DOM en memoria, sin conexiones externas.
function browser({url = 'https://slides.diegoayala.com/', saved = null, storageBlocked = false,
                  referrer = '', cookies = 'session=keep; slides_ga=old'} = {}) {
  let document;
  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.dataset = {};
      this.listeners = {};
      this.classList = {add() {}};
    }
    append(...nodes) { this.children.push(...nodes); }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    click() { this.focus(); this.listeners.click?.(); }
    focus() { document.activeElement = this; }
    contains(target) { return this === target || this.children.some(node => node.contains(target)); }
  }
  const head = new Element('head');
  const body = new Element('body');
  const footer = new Element('footer');
  body.append(footer);
  const all = (node) => [node, ...node.children.flatMap(all)];
  const jar = new Map(cookies.split(';').filter(Boolean).map(cookie => cookie.trim().split('=')));
  document = {
    head, body, referrer, activeElement: body,
    createElement: tag => new Element(tag),
    getElementById: id => all(body).find(node => node.id === id),
    querySelector: selector => selector === '.site-footer' ? footer : null,
    get cookie() { return [...jar].map(([name, value]) => name + '=' + value).join('; '); },
    set cookie(value) { if (value.includes('Max-Age=0')) jar.delete(value.split('=')[0]); }
  };
  const storage = new Map(saved === null ? [] : [[key, saved]]);
  const listeners = {};
  let reloads = 0;
  const parsed = new URL(url);
  const location = {
    hostname: parsed.hostname, protocol: parsed.protocol, origin: parsed.origin,
    pathname: parsed.pathname, href: parsed.href,
    reload() { reloads++; }
  };
  const context = vm.createContext({
    document, location, URL, Date,
    localStorage: {
      getItem(name) { if (storageBlocked) throw new Error('blocked'); return storage.get(name) ?? null; },
      setItem(name, value) { if (storageBlocked) throw new Error('blocked'); storage.set(name, value); }
    },
    addEventListener(type, callback) { listeners[type] = callback; }
  });
  context.window = context;
  vm.runInContext(source, context);
  return {
    context, jar, storage, location,
    get reloads() { return reloads; },
    get panel() { return document.getElementById('analytics-consent'); },
    button(text) { return all(body).find(node => node.tagName === 'button' && node.textContent === text); },
    scripts(host) { return head.children.filter(node => node.src && new URL(node.src).hostname === host); },
    storageEvent(value) {
      if (value === null) storage.delete(key); else storage.set(key, value);
      listeners.storage({key});
    }
  };
}

const choice = (status, age = 0) => JSON.stringify({status, at: Date.now() - age});
const googleScripts = instance => instance.scripts('www.googletagmanager.com');

test('Una primera visita y el rechazo no hacen peticiones a Google; Cloudflare se conserva', () => {
  const page = browser();
  assert.equal(page.panel.hidden, false);
  assert.equal(googleScripts(page).length, 0);
  assert.equal(page.scripts('static.cloudflareinsights.com').length, 1);
  page.button('Rechazar').click();
  assert.equal(googleScripts(page).length, 0);
  assert.equal(page.panel.hidden, true);
  assert.equal(JSON.parse(page.storage.get(key)).status, 'denied');
  assert.equal(page.jar.has('slides_ga'), false);
  assert.equal(page.jar.get('session'), 'keep');
});

test('Aceptar activa una sola etiqueta, solo las cookies analíticas y ninguna función publicitaria', () => {
  const page = browser();
  page.button('Aceptar').click();
  page.button('Cookies').click();
  page.button('Aceptar').click();
  assert.equal(googleScripts(page).length, 1);
  assert.equal(new URL(googleScripts(page)[0].src).searchParams.get('id'), googleId);
  const commands = page.context.dataLayer.map(args => Array.from(args));
  const defaults = commands.find(command => command[0] === 'consent' && command[1] === 'default')[2];
  assert.ok(Object.values(defaults).every(value => value === 'denied'));
  const update = commands.find(command => command[0] === 'consent' && command[1] === 'update')[2];
  assert.deepEqual(Object.keys(update), ['analytics_storage']);
  assert.equal(update.analytics_storage, 'granted');
  const config = commands.find(command => command[0] === 'config')[2];
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_domain, 'slides.diegoayala.com');
  assert.equal(JSON.parse(page.storage.get(key)).status, 'granted');
});

test('Las visitas medidas excluyen parámetros, fragmentos y rutas de procedencia', () => {
  const page = browser({
    url: 'https://slides.diegoayala.com/ejercicios/di/INDICE.html?email=private@example.test#private',
    referrer: 'https://source.example.test/private/path?token=private#private',
    saved: choice('granted')
  });
  const config = page.context.dataLayer.find(args => args[0] === 'config')[2];
  assert.equal(config.page_location, 'https://slides.diegoayala.com/ejercicios/di/INDICE.html');
  assert.equal(config.page_referrer, 'https://source.example.test/');
});

test('La elección recordada se respeta; elecciones inválidas, futuras o caducadas no activan Google', () => {
  assert.equal(googleScripts(browser({saved: choice('granted')})).length, 1);
  const denied = browser({saved: choice('denied')});
  assert.equal(denied.panel.hidden, true);
  assert.equal(googleScripts(denied).length, 0);
  for (const saved of ['invalid', 'null', '{}', choice('unknown'), choice('granted', -60000),
                       choice('granted', 181 * 86400000)]) {
    const page = browser({saved});
    assert.equal(googleScripts(page).length, 0);
    assert.equal(page.panel.hidden, false);
  }
});

test('Retirar el consentimiento desactiva Google y recarga para retirar la etiqueta en ejecución', () => {
  const page = browser({saved: choice('granted')});
  page.button('Cookies').click();
  page.button('Rechazar').click();
  assert.equal(page.context['ga-disable-' + googleId], true);
  assert.equal(page.reloads, 1);
  assert.equal(JSON.parse(page.storage.get(key)).status, 'denied');
  assert.equal(page.jar.has('slides_ga'), false);
  assert.equal(page.jar.get('session'), 'keep');
});

test('Las otras pestañas aplican tanto la aceptación como la retirada del consentimiento', () => {
  const page = browser();
  page.storageEvent(choice('granted'));
  assert.equal(googleScripts(page).length, 1);
  page.storageEvent(choice('denied'));
  assert.equal(page.context['ga-disable-' + googleId], true);
  assert.equal(page.reloads, 1);
});

test('El almacenamiento bloqueado nunca se interpreta como consentimiento', () => {
  const page = browser({storageBlocked: true});
  assert.equal(page.panel.hidden, false);
  assert.equal(googleScripts(page).length, 0);
  page.button('Aceptar').click();
  assert.equal(googleScripts(page).length, 1);
  assert.equal(googleScripts(browser({storageBlocked: true})).length, 0);
});

test('Las herramientas privadas, localhost, HTTP y otros dominios no cargan ninguna analítica', () => {
  for (const url of [
    'http://localhost:4173/', 'http://slides.diegoayala.com/', 'file:///tmp/index.html',
    'https://another.diegoayala.com/', 'https://slides.diegoayala.com/profesor/',
    'https://slides.diegoayala.com/soluciones/', 'https://slides.diegoayala.com/go/index.html'
  ]) {
    const page = browser({url, saved: choice('granted')});
    assert.equal(googleScripts(page).length, 0);
    assert.equal(page.scripts('static.cloudflareinsights.com').length, 0);
    assert.equal(page.panel, undefined);
  }
});
