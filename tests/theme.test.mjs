#!/usr/bin/env node
/**
 * Chunk 26 — Theme System: exact hex map, localStorage round-trip,
 * data-theme attribute, markup options Dark/Light/Nature.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Minimal localStorage shim */
function createStorage() {
  const map = new Map();
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(String(k), String(v));
    },
    removeItem(k) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
    _map: map,
  };
}

class ElementShim {
  constructor(tag = 'div', id = '') {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.className = '';
    this.textContent = '';
    this.title = '';
    this.value = '';
    this.style = {
      _props: {},
      setProperty(name, value) {
        this._props[name] = value;
      },
      getPropertyValue(name) {
        return this._props[name] || '';
      },
    };
    this.dataset = {};
    this.children = [];
    this.options = [];
    this._attrs = {};
    this._listeners = {};
  }

  setAttribute(name, value) {
    this._attrs[name] = String(value);
    if (name === 'data-theme') this.dataset.theme = String(value);
    if (name === 'data-wtm-theme-wired') this.dataset.wtmThemeWired = String(value);
  }

  getAttribute(name) {
    return this._attrs[name] ?? null;
  }

  querySelector() {
    return null;
  }

  addEventListener(type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
  }

  appendChild(child) {
    this.children.push(child);
    if (this.tagName === 'SELECT' && child.tagName === 'OPTION') {
      this.options.push(child);
    }
    return child;
  }
}

function loadThemeModule() {
  const code = fs.readFileSync(path.join(ROOT, 'js/theme.js'), 'utf8');
  const storage = createStorage();
  const html = new ElementShim('html');
  html.style = {
    _props: {},
    setProperty(name, value) {
      this._props[name] = value;
    },
    getPropertyValue(name) {
      return this._props[name] || '';
    },
  };

  const themeSelect = new ElementShim('select', 'themeSelect');
  ['dark', 'light', 'nature'].forEach((id) => {
    const opt = new ElementShim('option');
    opt.value = id;
    opt.textContent = id.charAt(0).toUpperCase() + id.slice(1);
    themeSelect.appendChild(opt);
  });
  themeSelect.value = 'dark';

  const bwThemeSelect = new ElementShim('select', 'bwThemeSelect');

  const byId = {
    themeSelect,
    bwThemeSelect,
  };

  const sandbox = {
    console,
    localStorage: storage,
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
    document: {
      readyState: 'complete',
      documentElement: html,
      getElementById(id) {
        return byId[id] || null;
      },
      querySelector(sel) {
        if (sel === '#themeSelect') return themeSelect;
        if (sel === '#bwThemeSelect') return bwThemeSelect;
        return null;
      },
      createElement(tag) {
        return new ElementShim(tag);
      },
      addEventListener() {},
    },
    location: { search: '' },
    window: null,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.dispatchEvent = function dispatchEvent() {
    return true;
  };

  vm.runInNewContext(code, sandbox, { filename: 'theme.js' });
  return {
    WTM: sandbox.WTM_Theme,
    storage,
    html,
    themeSelect,
    byId,
  };
}

const { WTM, storage, html, themeSelect } = loadThemeModule();

assert(WTM, 'WTM_Theme exported');
assert(Array.isArray(WTM.THEME_IDS) && WTM.THEME_IDS.length === 3, 'three theme ids');
assert(
  WTM.THEME_IDS.includes('dark') && WTM.THEME_IDS.includes('light') && WTM.THEME_IDS.includes('nature'),
  'ids are dark|light|nature'
);

/* Exact hex map from Chunk 26 design */
const EXPECTED = {
  dark: { bg: '#0A0A0A', surface: '#1A1A1A', text: '#FFFFFF', accent: '#228B22' },
  light: { bg: '#F8F9F6', surface: '#FFFFFF', text: '#1F2937', accent: '#228B22' },
  nature: { bg: '#F1F5F2', surface: '#FFFFFF', text: '#1F2937', accent: '#1E6B2B' },
};

Object.keys(EXPECTED).forEach((id) => {
  const t = WTM.THEMES[id];
  assert(t, `theme ${id} present`);
  assert(t.bg === EXPECTED[id].bg, `${id}.bg exact ${EXPECTED[id].bg} got ${t.bg}`);
  assert(t.surface === EXPECTED[id].surface, `${id}.surface exact`);
  assert(t.text === EXPECTED[id].text, `${id}.text exact`);
  assert(t.accent === EXPECTED[id].accent, `${id}.accent exact`);
});

assert(WTM.STORAGE_KEY === 'whinfell_tc_theme', 'storage key whinfell_tc_theme');
assert(WTM.DEFAULT_THEME_ID === 'dark', 'default dark');

/* applyTheme → data-theme + CSS vars + localStorage */
storage.clear();
const applied = WTM.applyTheme('light');
assert(applied === 'light', 'applyTheme returns light');
assert(html.getAttribute('data-theme') === 'light', 'data-theme=light on documentElement');
assert(storage.getItem('whinfell_tc_theme') === 'light', 'localStorage round-trip write light');
assert(WTM.getTheme().id === 'light', 'getTheme id light');
assert(WTM.getAccent() === '#228B22', 'getAccent light forest green');
assert(html.style.getPropertyValue('--wtm-bg') === '#F8F9F6', '--wtm-bg written');
assert(html.style.getPropertyValue('--wtm-surface') === '#FFFFFF', '--wtm-surface written');
assert(html.style.getPropertyValue('--wtm-text') === '#1F2937', '--wtm-text written');
assert(html.style.getPropertyValue('--wtm-accent') === '#228B22', '--wtm-accent written');
assert(html.style.getPropertyValue('--wtm-chart-line') === '#228B22', '--wtm-chart-line = accent');
assert(html.style.getPropertyValue('--wtm-chart-axis'), '--wtm-chart-axis written');
assert(html.style.getPropertyValue('--wtm-muted'), '--wtm-muted derived');
assert(html.style.getPropertyValue('--wtm-border'), '--wtm-border derived');
assert(html.style.getPropertyValue('--wtm-chart-grid'), '--wtm-chart-grid derived');
assert(html.style.getPropertyValue('--wtm-surface-2') === '#EEF1EC', 'light surface-2 solid #EEF1EC');

WTM.applyTheme('nature');
assert(html.getAttribute('data-theme') === 'nature', 'data-theme=nature');
assert(storage.getItem('whinfell_tc_theme') === 'nature', 'localStorage nature');
assert(WTM.getAccent() === '#1E6B2B', 'nature accent #1E6B2B');
assert(html.style.getPropertyValue('--wtm-bg') === '#F1F5F2', 'nature bg');
assert(html.style.getPropertyValue('--wtm-accent') === '#1E6B2B', 'nature accent var');
assert(html.style.getPropertyValue('--wtm-surface-2') === '#E6EDE8', 'nature surface-2 solid #E6EDE8');

WTM.applyTheme('dark');
assert(html.getAttribute('data-theme') === 'dark', 'data-theme=dark');
assert(storage.getItem('whinfell_tc_theme') === 'dark', 'localStorage dark');
assert(WTM.getAccent() === '#228B22', 'dark accent');
assert(html.style.getPropertyValue('--wtm-surface-2') === '#242424', 'dark surface-2 solid');

/* Invalid id normalizes to dark */
assert(WTM.normalizeThemeId('neon') === 'dark', 'invalid → dark');
assert(WTM.normalizeThemeId('LIGHT') === 'light', 'case normalize');
WTM.applyTheme('purple-ai');
assert(html.getAttribute('data-theme') === 'dark', 'invalid apply → dark');

/* localStorage round-trip via initTheme */
storage.clear();
storage.setItem('whinfell_tc_theme', 'nature');
const initId = WTM.initTheme();
assert(initId === 'nature', `initTheme reads storage → nature got ${initId}`);
assert(html.getAttribute('data-theme') === 'nature', 'init sets data-theme nature');
assert(themeSelect.value === 'nature', 'themeSelect synced to nature');

/* Idempotent wire — double initTheme must not stack change listeners */
const changeCountBefore = (themeSelect._listeners.change || []).length;
WTM.initTheme();
WTM.initTheme();
const changeCountAfter = (themeSelect._listeners.change || []).length;
assert(changeCountAfter === changeCountBefore, `wireThemeSelect idempotent (${changeCountBefore} → ${changeCountAfter})`);
assert(themeSelect.getAttribute('data-wtm-theme-wired') === '1' || themeSelect.dataset.wtmThemeWired === '1', 'select marked wired');

/* Markup: index.html theme select + options + user chip */
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(indexHtml.includes('id="themeSelect"'), 'index has #themeSelect');
assert(indexHtml.includes('console-theme-account') || indexHtml.includes('data-theme-account-mount'), 'top-right theme account cluster');
assert(indexHtml.includes('id="consoleUserChip"') || indexHtml.includes('console-user-chip'), 'user/account chip present');
assert(/<option[^>]*value="dark"[^>]*>Dark<\/option>/i.test(indexHtml), 'Dark option');
assert(/<option[^>]*value="light"[^>]*>Light<\/option>/i.test(indexHtml), 'Light option');
assert(/<option[^>]*value="nature"[^>]*>Nature<\/option>/i.test(indexHtml), 'Nature option');
assert(indexHtml.includes('js/theme.js'), 'theme.js script included');
assert(indexHtml.includes('css/theme.css'), 'theme.css stylesheet included');
assert(!/id="btnTheme"/.test(indexHtml), 'binary #btnTheme removed from index');

/* BasisWatch standalone shares storage key + select */
const bwHtml = fs.readFileSync(path.join(ROOT, 'Whinfell_BasisWatch.html'), 'utf8');
assert(bwHtml.includes('id="bwThemeSelect"') || bwHtml.includes('id="themeSelect"'), 'BW theme select');
assert(bwHtml.includes('js/theme.js'), 'BW loads theme.js');
assert(bwHtml.includes('css/theme.css'), 'BW loads theme.css');
assert(/value="dark"/i.test(bwHtml) && /value="light"/i.test(bwHtml) && /value="nature"/i.test(bwHtml), 'BW options dark/light/nature');

/* CSS token file */
const themeCss = fs.readFileSync(path.join(ROOT, 'css/theme.css'), 'utf8');
assert(themeCss.includes('--wtm-bg'), 'theme.css --wtm-bg');
assert(themeCss.includes('--wtm-surface'), 'theme.css --wtm-surface');
assert(themeCss.includes('--wtm-text'), 'theme.css --wtm-text');
assert(themeCss.includes('--wtm-accent'), 'theme.css --wtm-accent');
assert(themeCss.includes('--wtm-chart-grid'), 'theme.css chart grid');
assert(themeCss.includes('--wtm-chart-line'), 'theme.css chart line');
assert(themeCss.includes('#0A0A0A'), 'dark bg hex in CSS');
assert(themeCss.includes('#F8F9F6'), 'light bg hex in CSS');
assert(themeCss.includes('#F1F5F2'), 'nature bg hex in CSS');
assert(themeCss.includes('#1E6B2B'), 'nature accent in CSS');
assert(!themeCss.includes('#5eb3ff'), 'no neon blue in theme.css');

/* BasisWatch CSS no longer hardcodes neon accent */
const bwCss = fs.readFileSync(path.join(ROOT, 'css/basis_watch.css'), 'utf8');
assert(!bwCss.includes('#5eb3ff'), 'basis_watch.css drops #5eb3ff');
assert(bwCss.includes('--wtm-accent') || bwCss.includes('#228B22'), 'BW uses forest accent bridge');
assert(!bwCss.includes('#3d8bfd'), 'basis_watch.css drops #3d8bfd');

/* main chrome + nature parity with light surface remaps */
const mainCss = fs.readFileSync(path.join(ROOT, 'css/main.css'), 'utf8');
const consoleCss = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');
const lightMain = (mainCss.match(/data-theme="light"/g) || []).length;
const natureMain = (mainCss.match(/data-theme="nature"/g) || []).length;
assert(natureMain >= lightMain, `main.css nature (${natureMain}) >= light (${lightMain}) selectors`);
const lightConsole = (consoleCss.match(/data-theme="light"/g) || []).length;
const natureConsole = (consoleCss.match(/data-theme="nature"/g) || []).length;
assert(natureConsole >= lightConsole * 0.9, `console_ia nature (${natureConsole}) ~ light (${lightConsole})`);
assert(!mainCss.includes('#3d8bfd'), 'main.css drops hardcoded #3d8bfd');
assert(!mainCss.includes('#5eb3ff'), 'main.css drops #5eb3ff');
assert(mainCss.includes('var(--wtm-accent') || mainCss.includes('#228B22'), 'main uses forest accent');

/* Tailwind config uses CSS vars for accent */
assert(indexHtml.includes("accent: 'var(--wtm-accent)'") || indexHtml.includes('accent: "var(--wtm-accent)"') || indexHtml.includes('var(--wtm-accent)'), 'tailwind accent → CSS var');
assert(!indexHtml.includes("accent: '#3d8bfd'"), 'tailwind no neon #3d8bfd');

/* Core listens for chart redraw on theme change */
const coreJs = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
assert(coreJs.includes('wtm:themechange'), 'core listens wtm:themechange');
assert(coreJs.includes('redrawChartsForThemeChange') || coreJs.includes('renderNodeCockpitShell'), 'core redraws cockpit on theme');

/* top_utility registry theme account */
const utilCode = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
assert(utilCode.includes('THEME_ACCOUNT_REGISTRY'), 'THEME_ACCOUNT_REGISTRY present');
assert(utilCode.includes('themeSelect'), 'themeSelect in registry');

console.log([
  'PASS theme.test.mjs',
  `themes=${WTM.THEME_IDS.join(',')}`,
  `storage=${WTM.STORAGE_KEY}`,
  `accent_dark=${WTM.THEMES.dark.accent}`,
  `accent_nature=${WTM.THEMES.nature.accent}`,
  `init=${initId}`,
  `main light/nature=${lightMain}/${natureMain}`,
  `console light/nature=${lightConsole}/${natureConsole}`,
  `wire_listeners=${changeCountAfter}`,
].join('\n'));
