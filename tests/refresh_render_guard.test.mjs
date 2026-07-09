#!/usr/bin/env node
/** Hard-refresh render guard — sticky FALLBACK must clear after healthy paint. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function extractIds() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
}

class ElementShim {
  constructor(id = '') {
    this.tagName = id === 'fragment' ? 'FRAGMENT' : 'DIV';
    this.id = id;
    this.className = '';
    this.classList = {
      _set: new Set(),
      add: (...cls) => cls.forEach((c) => this.classList._set.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classList._set.delete(c)),
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
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.onclick = null;
    this.onchange = null;
    this.disabled = false;
  }
  appendChild(c) {
    c.parentElement = this;
    this.children.push(c);
    return c;
  }
  replaceChildren(...nodes) {
    const expanded = [];
    nodes.flat().forEach((n) => {
      if (n.tagName === 'FRAGMENT') expanded.push(...n.children);
      else expanded.push(n);
    });
    this.children = expanded;
    expanded.forEach((n) => {
      n.parentElement = this;
    });
  }
  querySelector(sel) {
    if (sel.startsWith('#')) return this._doc.getElementById(sel.slice(1));
    if (sel === '.console-tech-meta') return this._doc._metaMount || null;
    if (sel === '#cockpitShell .cockpit-main') {
      const sh = this._doc.getElementById('cockpitShell');
      return sh?.children?.[0] || null;
    }
    return null;
  }
  querySelectorAll() {
    return [];
  }
  addEventListener() {}
  setAttribute() {}
  getAttribute() {
    return null;
  }
  getBoundingClientRect() {
    return { width: 400, height: 240, top: 0, left: 0 };
  }
}

class CanvasShim extends ElementShim {
  constructor(id) {
    super(id);
    this.width = 400;
    this.height = 240;
  }
  getContext() {
    const noop = () => {};
    return {
      setTransform: noop,
      scale: noop,
      clearRect: noop,
      fillRect: noop,
      fillText: noop,
      strokeRect: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      stroke: noop,
      arc: noop,
      fill: noop,
      setLineDash: noop,
      measureText: (t) => ({ width: String(t || '').length * 7 }),
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textAlign: 'left',
    };
  }
}

function findById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const hit = findById(child, id);
    if (hit) return hit;
  }
  return null;
}

class DocumentShim {
  constructor(ids) {
    this._byId = new Map();
    for (const id of ids) {
      const el =
        id === 'cockpitRvCanvas' || (id.startsWith('bw') && id.includes('Canvas'))
          ? new CanvasShim(id)
          : new ElementShim(id);
      el._doc = this;
      this._byId.set(id, el);
    }
    this._metaMount = new ElementShim('console-tech-meta');
    this._metaMount.className = 'console-tech-meta';
    this._metaMount._doc = this;
    this.documentElement = new ElementShim('html');
    this.body = new ElementShim('body');
    this.readyState = 'complete';
  }
  getElementById(id) {
    if (this._byId.has(id)) return this._byId.get(id);
    for (const el of this._byId.values()) {
      const hit = findById(el, id);
      if (hit) return hit;
    }
    return findById(this._metaMount, id);
  }
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    if (sel === '.console-tech-meta') return this._metaMount;
    if (sel === '#cockpitShell .cockpit-main') {
      const sh = this.getElementById('cockpitShell');
      return sh?.children?.[0] || null;
    }
    return null;
  }
  querySelectorAll() {
    return [];
  }
  createElement(tag) {
    const el = new ElementShim(tag === 'fragment' ? 'fragment' : tag);
    el._doc = this;
    return el;
  }
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function run() {
  const document = new DocumentShim(extractIds());
  const window = {
    document,
    URLSearchParams: globalThis.URLSearchParams,
    localStorage: {
      _d: {},
      getItem(k) {
        return this._d[k] ?? null;
      },
      setItem(k, v) {
        this._d[k] = String(v);
      },
    },
    sessionStorage: {
      _d: {},
      getItem(k) {
        return this._d[k] ?? null;
      },
      setItem(k, v) {
        this._d[k] = String(v);
      },
    },
    location: {
      href: 'file:///index.html?safe_boot=1&boot_log=1',
      search: '?safe_boot=1&boot_log=1',
      protocol: 'file:',
      hash: '',
    },
    navigator: { userAgent: 'node-test' },
    devicePixelRatio: 1,
    performance: { now: () => Date.now() },
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    confirm: () => false,
    alert: () => {},
    console,
    appState: { debug: true, booted: false },
    DICTIONARY_BADGE_DEFAULT: { version: '1.0', status: 'Locked', alignment: 'Aligned', source: 'x' },
    fetch: async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => '' }),
    setTimeout: (fn, ms) => setTimeout(fn, ms ?? 0),
    clearTimeout: globalThis.clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame: () => {},
    WHINFELL_SAFE_BOOT: true,
    __WTM_BOOTED: false,
  };
  window.window = window;
  window.self = window;
  window.globalThis = window;

  const ctx = vm.createContext(window);
  for (const file of [
    'desk_china_ladder_models.js',
    'basis_watch_analytics.js',
    'basis_watch_panel.js',
    'bootstrap.js',
    'top_utility_registry.js',
    'core.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', file), 'utf8'), ctx, { filename: file });
  }

  await new Promise((r) => setTimeout(r, 400));

  assert(window.__WTM_BOOT_COMPLETE, '__WTM_BOOT_COMPLETE');
  assert(window.__WTM_LAST_RENDER_OK === true, `__WTM_LAST_RENDER_OK=${window.__WTM_LAST_RENDER_OK}`);
  const bootEl = document.getElementById('js-boot-check');
  assert(bootEl, 'js-boot-check');
  assert(
    /RENDER SUCCESS/i.test(bootEl.textContent || '') || bootEl.classList.contains('boot-check--ok'),
    `boot badge after success: ${bootEl.textContent}`,
  );

  // Simulate transient post-boot failure → sticky FALLBACK (pre-fix bug).
  window.__testExports.renderAllFallback(new Error('simulated_refresh_failure'));
  assert(window.__WTM_LAST_RENDER_OK === false, 'LAST_RENDER_OK false after fallback');
  assert(/FALLBACK/i.test(bootEl.textContent || ''), `expected FALLBACK got ${bootEl.textContent}`);
  assert(bootEl.classList.contains('boot-check--error'), 'error class on fallback');

  // Healthy re-render must recover SUCCESS (the actual fix).
  const ok = window.renderAll();
  assert(ok === true, `renderAll returned ${ok}`);
  assert(window.__WTM_LAST_RENDER_OK === true, 'LAST_RENDER_OK recovered');
  assert(/RENDER SUCCESS/i.test(bootEl.textContent || ''), `expected SUCCESS recovery got ${bootEl.textContent}`);
  assert(!bootEl.classList.contains('boot-check--error'), 'error class cleared');

  // Guard snapshot exists and is data-driven (not UA-specific).
  assert(window.__WTM_BOOT_GUARD, '__WTM_BOOT_GUARD');
  assert(window.__WTM_BOOT_GUARD.reason === 'success', `guard.reason=${window.__WTM_BOOT_GUARD.reason}`);
  assert(typeof window.__testExports.consoleCanRenderSuccess === 'function', 'consoleCanRenderSuccess export');
  assert(window.__testExports.consoleCanRenderSuccess() === true, 'consoleCanRenderSuccess true');

  // Subsequent healthy paints must not thrash the badge timer (prevOk already true).
  const textBefore = bootEl.textContent;
  window.renderAll();
  assert(bootEl.textContent === textBefore, 'badge text stable on repeat healthy paint');

  console.log(
    [
      'PASS refresh_render_guard.test.mjs',
      `last_render_ok=${window.__WTM_LAST_RENDER_OK}`,
      `boot_text=${bootEl.textContent}`,
      `guard_reason=${window.__WTM_BOOT_GUARD?.reason}`,
    ].join('\n'),
  );
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`FAIL refresh_render_guard.test.mjs: ${err.message}`);
    process.exit(1);
  });
