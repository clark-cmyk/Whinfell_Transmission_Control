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

  replaceChildren(...nodes) {
    const expanded = [];
    nodes.flat().forEach((n) => {
      if (n?.tagName === 'FRAGMENT') expanded.push(...(n.children || []));
      else if (n) expanded.push(n);
    });
    this.children = expanded;
    expanded.forEach((n) => { n.parentElement = this; });
  }

  querySelector(sel) {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) return this;
    }
    if (sel.startsWith('#') && this.id === sel.slice(1)) return this;
    const dataEq = sel.match(/^\[data-([^\]=]+)="([^"]*)"\]$/);
    if (dataEq) {
      const key = dataEq[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (this.dataset?.[key] === dataEq[2]) return this;
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
      if (sel.startsWith('.')) {
        const cls = sel.slice(1);
        if (node.classList?.contains(cls)) out.push(node);
      } else if (sel.startsWith('[data-') && sel.includes(']')) {
        const m = sel.match(/^\[data-([^\]=]+)="([^"]*)"\]$/);
        if (m) {
          const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (node.dataset?.[key] === m[2]) out.push(node);
        } else {
          const key = sel.match(/data-([^\]=]+)/)?.[1];
          if (key && node.dataset?.[key] != null) out.push(node);
        }
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
    const scanStrip = this._byId.get('scanKpiStrip');
    const scanTiles = this._byId.get('scanKpiTiles');
    if (scanStrip && scanTiles) scanStrip.appendChild(scanTiles);
    const radar = this._byId.get('transmissionRadar');
    const radarMount = this._byId.get('transmissionRadarMount');
    if (radar && radarMount) radar.appendChild(radarMount);
    this._metaMount = new ElementShim('div');
    this._metaMount.className = 'console-tech-meta';
    this.body = new ElementShim('body');
    this.documentElement = new ElementShim('html');
    this.documentElement.setAttribute = (k, v) => { this.documentElement[`_${k}`] = v; };
    this.documentElement.getAttribute = (k) => this.documentElement[`_${k}`] ?? null;
  }

  getElementById(id) {
    const direct = this._byId.get(id);
    if (direct) return direct;
    const walk = (node) => {
      if (!node) return null;
      if (node.id === id) return node;
      for (const c of node.children || []) {
        const hit = walk(c);
        if (hit) return hit;
      }
      return null;
    };
    for (const el of this._byId.values()) {
      const hit = walk(el);
      if (hit) return hit;
    }
    return walk(this._metaMount);
  }

  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    if (sel === '.console-tech-meta') return this._metaMount || null;
    if (sel === '#cockpitShell .cockpit-main') {
      const shell = this.getElementById('cockpitShell');
      return shell?.children?.[0] || null;
    }
    return null;
  }

  querySelectorAll() { return []; }
  createElement(tag) { return tag === 'div' ? new ElementShim('div') : new ElementShim(tag); }
  createDocumentFragment() {
    const frag = new ElementShim('fragment');
    frag.appendChild = (child) => {
      child.parentElement = frag;
      frag.children.push(child);
      return child;
    };
    return frag;
  }
  addEventListener() {}
}

function extractIdsFromIndex() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return [...ids];
}

/** domIds rendered by js/top_utility_registry.js (not in static index.html). */
function extractTopUtilityDomIds() {
  try {
    const js = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
    const ids = new Set();
    for (const m of js.matchAll(/domId:\s*'([^']+)'/g)) ids.add(m[1]);
    return [...ids];
  } catch {
    return [];
  }
}

export function loadCoreJs() {
  const ids = [...new Set([...extractIdsFromIndex(), ...extractTopUtilityDomIds()])];
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
    confirm: () => false,
    alert: () => {},
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
  const preload = [
    'data_states.js',
    'command_bar_kpis.js',
    'scan_kpi_strip.js',
    'top_utility_registry.js',
    'signal_detail_copy.js',
    'transmission_radar.js',
    'desk_china_ladder_models.js',
    'task_force_panel_feed.js',
    'core.js',
  ];
  for (const file of preload) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    vm.runInContext(src, ctx, { filename: file });
  }
  return window;
}

export function loadBundle(relPath = 'docs/data/hydration/latest.json') {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}