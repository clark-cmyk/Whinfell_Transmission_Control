#!/usr/bin/env node
/** BBDM v2 Chunk 06 — five-module IA shell router + HTML mounts. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class ElementShim {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
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
    this.dataset = {};
    this.children = [];
    this.parentElement = null;
    this.innerHTML = '';
    this.textContent = '';
    this.hidden = false;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  querySelector(sel) {
    if (sel === '.bbdm-pane-placeholder') {
      const walk = (node) => {
        if (node.classList?.contains('bbdm-pane-placeholder')) return node;
        for (const c of node.children || []) {
          const hit = walk(c);
          if (hit) return hit;
        }
        return null;
      };
      return walk(this);
    }
    return null;
  }

  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      if (!node) return;
      if (sel.startsWith('[data-bbdm-module]') && node.dataset?.bbdmModule) out.push(node);
      node.children?.forEach(walk);
    };
    walk(this);
    return out;
  }

  setAttribute() {}
  getAttribute() { return null; }
  addEventListener() {}
}

class DocumentShim {
  constructor() {
    this.body = new ElementShim('body');
    this._byId = new Map();
    const ids = [
      'bbdmIaShell', 'bbdmScanHost', 'bbdmDigHost', 'bbdmLitmusHost',
      'bbdmIterateHost', 'bbdmArticulatorHost', 'bbdmDigStats', 'bbdmDigLitmus',
      'bbdmIterateLitmus', 'bbdmIterateModeler', 'bbdmIterateArticulator', 'bbdmDigArticulator',
      'btnBbdmLeftCollapse',
    ];
    ids.forEach((id) => {
      const node = new ElementShim('div', id);
      node.id = id;
      this._byId.set(id, node);
    });
    const shell = this._byId.get('bbdmIaShell');
    ['bbdmScanHost', 'bbdmDigHost', 'bbdmLitmusHost', 'bbdmIterateHost', 'bbdmArticulatorHost'].forEach((id) => {
      shell.appendChild(this._byId.get(id));
    });
    this._byId.get('bbdmDigHost').appendChild(this._byId.get('bbdmDigStats'));
    const tabs = ['scan', 'dig', 'litmus', 'iterate', 'articulator'];
    tabs.forEach((mod) => {
      const btn = new ElementShim('button');
      btn.dataset.bbdmModule = mod;
      btn.tagName = 'BUTTON';
      this.body.appendChild(btn);
    });
    this.readyState = 'complete';
    this._listeners = {};
    this.addEventListener = (type, fn) => {
      this._listeners[type] = fn;
    };
  }

  getElementById(id) {
    return this._byId.get(id) || null;
  }

  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  }

  createElement(tag) {
    return new ElementShim(tag);
  }
}

function loadShell(doc) {
  const sandbox = {
    window: {},
    document: doc,
    console,
    globalThis: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const src = fs.readFileSync(path.join(ROOT, 'js/bbdm_ia_shell.js'), 'utf8');
  vm.runInContext(src, vm.createContext(sandbox), { filename: 'bbdm_ia_shell.js' });
  return sandbox.BBDM_IaShell;
}

function main() {
  const html = fs.readFileSync(path.join(ROOT, 'bang_bang_da_machine.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css/bbdm_ia.css'), 'utf8');
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data_dictionary_meta.json'), 'utf8'));

  assert(html.includes('id="bbdmIaShell"'), 'bbdmIaShell mount');
  assert(html.includes('id="bbdmScanHost"'), 'scan host');
  assert(html.includes('id="bbdmDigHost"'), 'dig host');
  assert(html.includes('id="bbdmLitmusHost"'), 'litmus host');
  assert(html.includes('id="bbdmIterateHost"'), 'iterate host');
  assert(html.includes('id="bbdmArticulatorHost"'), 'articulator host');
  assert(html.includes('id="bbdmRiskDashboard"'), 'risk dashboard mount');
  assert(html.includes('id="bbdmWtcReturn"'), 'WTC return link');
  assert(html.includes('href="./index.html"'), 'WTC return href');
  assert(html.includes('data-bbdm-module="dig"'), 'D.I.G. tab');
  assert(html.includes('data-bbdm-module="articulator"'), 'Articulator tab');
  assert(html.includes('js/bbdm_ia_shell.js'), 'shell script wired');
  assert(html.includes('css/bbdm_ia.css'), 'shell css wired');

  assert(css.includes('.bbdm-module-tab--active'), 'active tab style');
  assert(css.includes('.bbdm-module-pane--active'), 'active pane style');

  const stub = meta.bbdm_report || {};
  assert(stub.ia_shell_module === 'js/bbdm_ia_shell.js', 'meta ia_shell_module');
  assert(stub.ia_shell_version === '2.0.0-chunk06', 'meta ia_shell_version');
  assert(stub.locked_chunk === '08', 'meta locked_chunk');

  const doc = new DocumentShim();
  const mod = loadShell(doc);
  assert(mod, 'BBDM_IaShell export');
  assert(mod.BUILD.includes('CHUNK06'), 'chunk 06 build tag');
  assert(mod.MODULE_REGISTRY.length === 5, 'five modules');
  assert(mod.moduleIds().join(',') === 'scan,dig,litmus,iterate,articulator', 'module order');

  assert(mod.activateShell() === true, 'shell activates');
  assert(doc.body.classList.contains('bbdm-shell-active'), 'shell active class');
  assert(mod.getModule() === 'scan', 'default scan');

  mod.setModule('litmus');
  assert(mod.getModule() === 'litmus', 'set litmus');
  assert(doc.body.classList.contains('bbdm-module-litmus'), 'litmus body class');
  const litmusPane = doc.getElementById('bbdmLitmusHost');
  assert(litmusPane.classList.contains('bbdm-module-pane--active'), 'litmus pane active');
  assert(litmusPane.hidden === false, 'litmus pane visible');

  const digPane = doc.getElementById('bbdmDigHost');
  assert(digPane.hidden === true, 'dig pane hidden');

  mod.setModule('bogus');
  assert(mod.getModule() === 'scan', 'invalid module falls back to scan');

  console.log([
    'PASS bbdm_ia_shell.test.mjs',
    `modules=${mod.MODULE_REGISTRY.length}`,
    `build=${mod.BUILD}`,
    `active=${mod.getModule()}`,
  ].join('\n'));
}

try {
  main();
} catch (err) {
  console.error(`FAIL bbdm_ia_shell.test.mjs: ${err.message}`);
  process.exit(1);
}