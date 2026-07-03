import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

class ElementShim {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _set: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._set.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._set.delete(c)),
      toggle: (c, force) => {
        if (force === true) this.classList._set.add(c);
        else if (force === false) this.classList._set.delete(c);
        else if (this.classList._set.has(c)) this.classList._set.delete(c);
        else this.classList._set.add(c);
      },
      contains: (c) => this.classList._set.has(c),
    };
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.parentElement = null;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.scrollTop = 0;
    this.onclick = null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  querySelector(sel) {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) return this;
    }
    for (const c of this.children) {
      const hit = c.querySelector?.(sel);
      if (hit) return hit;
    }
    return null;
  }

  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      if (sel.startsWith('[data-') && sel.includes(']')) {
        const key = sel.match(/data-([^\]=]+)/)?.[1];
        if (key && node.dataset?.[key] != null) out.push(node);
      }
      node.children?.forEach(walk);
    };
    walk(this);
    return out;
  }

  getBoundingClientRect() {
    return { width: 400, height: 240, top: 0, left: 0, right: 400, bottom: 240 };
  }

  setAttribute() {}
  getAttribute() { return null; }
  addEventListener() {}
  removeEventListener() {}
  classList_toggle(cls, force) { this.classList.toggle(cls, force); }
}

class CanvasShim extends ElementShim {
  constructor(id) {
    super('canvas', id);
    this.width = 400;
    this.height = 240;
  }
  getContext() {
    const noop = () => {};
    const measure = (t) => ({ width: String(t || '').length * 7 });
    return {
      setTransform: noop, clearRect: noop, fillRect: noop, fillText: noop,
      strokeRect: noop, beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop,
      arc: noop, fill: noop, setLineDash: noop, measureText: measure,
      fillStyle: '', strokeStyle: '', font: '', textAlign: 'left',
    };
  }
}

class DocumentShim {
  constructor(ids) {
    this._byId = new Map();
    for (const id of ids) {
      const el = id === 'cockpitRvCanvas' ? new CanvasShim(id) : new ElementShim('div', id);
      el.id = id;
      this._byId.set(id, el);
    }
    const shell = this._byId.get('cockpitShell');
    const main = new ElementShim('div', 'cockpit-main');
    main.className = 'cockpit-main';
    shell?.appendChild(main);
    for (const id of ['cockpitChartArea', 'cockpitDecisionRail', 'cockpitFocusLayer', 'cockpitCompareLayer', 'cockpitDetailBand']) {
      const node = this._byId.get(id);
      if (node) main.appendChild(node);
    }
    const banner = this._byId.get('basisTacticalBanner');
    if (banner) {
      banner.appendChild(new ElementShim('p', 'basis-tactical-eyebrow'));
      const sentence = this._byId.get('basisTacticalSentence');
      const suffix = this._byId.get('basisTacticalSuffix');
      if (sentence) banner.appendChild(sentence);
      if (suffix) banner.appendChild(suffix);
    }
    this.body = new ElementShim('body');
    this.documentElement = new ElementShim('html');
    this.documentElement.setAttribute = (k, v) => { this.documentElement[`_${k}`] = v; };
    this.documentElement.getAttribute = (k) => this.documentElement[`_${k}`] ?? null;
  }

  getElementById(id) {
    return this._byId.get(id) || null;
  }

  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    if (sel === '#cockpitShell .cockpit-main') {
      const shell = this.getElementById('cockpitShell');
      return shell?.children?.[0] || null;
    }
    return null;
  }

  querySelectorAll() { return []; }
  createElement(tag) { return tag === 'div' ? new ElementShim('div') : new ElementShim(tag); }
  addEventListener() {}
}

function extractIdsFromIndex() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return [...ids];
}

export function loadCoreJs() {
  const ids = extractIdsFromIndex();
  const document = new DocumentShim(ids);
  const window = {
    document,
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] ?? null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
    },
    sessionStorage: {
      _data: {},
      getItem(k) { return this._data[k] ?? null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
    },
    location: { href: 'http://localhost/', search: '', hash: '' },
    navigator: { userAgent: 'node-test' },
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame: () => {},
    console,
    appState: {},
    DICTIONARY_BADGE_DEFAULT: {},
    __WTM_BOOTED: false,
    fetch: async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => '' }),
  };
  window.window = window;
  window.self = window;
  window.globalThis = window;

  const ctx = vm.createContext(window);
  const preload = ['desk_china_ladder_models.js', 'core.js'];
  for (const file of preload) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    vm.runInContext(src, ctx, { filename: file });
  }
  return window;
}

export function loadBundle(relPath = 'docs/data/hydration/latest.json') {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}