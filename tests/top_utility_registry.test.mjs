#!/usr/bin/env node
/** Chunk 01 — top utility registry + unified console-chip classes. */
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
    this.textContent = '';
    this.title = '';
    this.href = '';
    this.target = '';
    this.rel = '';
    this.type = '';
    this.dataset = {};
    this.children = [];
    this.parentElement = null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...nodes) {
    const expanded = [];
    nodes.flat().forEach((n) => {
      if (n.tagName === 'FRAGMENT') expanded.push(...n.children);
      else expanded.push(n);
    });
    this.children = expanded;
    expanded.forEach((n) => { n.parentElement = this; });
  }
}

function loadModule() {
  const code = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
  const metaMount = new ElementShim('div');
  metaMount.className = 'console-tech-meta';

  const actionIds = [
    'btnImportHydration', 'btnImport', 'btnExport',
    'btnExportPipeline', 'btnSave', 'btnTheme',
  ];
  const actionEls = {};
  actionIds.forEach((id) => {
    const btn = new ElementShim('button', id);
    actionEls[id] = btn;
  });

  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      querySelector(sel) {
        if (sel === '.console-tech-meta') return metaMount;
        return null;
      },
      getElementById(id) {
        return actionEls[id] || null;
      },
      createElement(tag) {
        return new ElementShim(tag);
      },
      createDocumentFragment() {
        const frag = new ElementShim('fragment');
        frag.appendChild = (child) => {
          child.parentElement = frag;
          frag.children.push(child);
          return child;
        };
        return frag;
      },
      addEventListener() {},
    },
    console,
  };
  sandbox.window = sandbox;

  vm.runInNewContext(code, sandbox, { filename: 'top_utility_registry.js' });
  return { WTM: sandbox.window.WTM_TopUtility, metaMount, actionEls };
}

const { WTM, metaMount, actionEls } = loadModule();

assert(WTM, 'WTM_TopUtility exported');
assert(WTM.TOP_UTILITY_REGISTRY.length === 10, 'ten tech-meta utilities');
assert(WTM.ACTION_BUTTON_REGISTRY.length === 6, 'six action buttons');

assert(WTM.HEADER_LAYOUT?.compactMeta === true, 'header compact meta enabled');

const build = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'build');
const dictionary = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'dictionary');
assert(build?.compactLabel === 'Build', 'build compact label');
assert(dictionary?.compactLabel === 'DD', 'dictionary compact label');

const collect = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'collect');
assert(collect?.variant === 'primary', 'collect is primary utility action');
assert(collect?.shortcut === 'c', 'collect keyboard shortcut');
assert(collect?.shortcutMod === 'alt-shift', 'collect alt-shift modifier');

const publishWeb = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'publish-web');
assert(publishWeb?.domId === 'btnPublishWeb', 'publish-web utility registered');

const importBtn = WTM.ACTION_BUTTON_REGISTRY.find((e) => e.id === 'btnImport');
assert(importBtn?.variant === 'primary', 'import WTM is primary action-row');

const collectCls = WTM.chipClasses(collect);
assert(collectCls.includes('console-chip'), 'chip base');
assert(collectCls.includes('console-chip--primary'), 'collect primary variant');
assert(collectCls.includes('console-chip--action'), 'collect action tier');
assert(collectCls.includes('wtm-collect-btn'), 'collect busy hook class');

const external = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'koyfin');
const extCls = WTM.chipClasses(external);
assert(extCls.includes('console-chip--external'), 'external tier');

const actionCls = WTM.actionButtonClasses(importBtn);
assert(actionCls.includes('btn-console'), 'btn-console alias');
assert(actionCls.includes('console-chip--primary'), 'import primary');

const buildNode = WTM.createUtilityNode(build);
assert(buildNode.textContent === 'Build', 'build renders compact label');
assert(buildNode.className.includes('console-chip--compact'), 'build compact class');
assert(buildNode.title.includes('Operator-console build'), 'build title preserved');

const dictNode = WTM.createUtilityNode(dictionary);
assert(dictNode.textContent === 'DD', 'dictionary renders compact label');
assert(dictNode.title.includes('Master Data Dictionary'), 'dictionary title preserved');

const node = WTM.createUtilityNode(collect);
assert(node.id === 'btnMorningCollect', 'dom id preserved');
assert(node.className === collectCls, 'createUtilityNode applies chipClasses');
assert(node.textContent === 'Collect CSVs', 'label from registry');
assert(node.className.includes('console-chip--compact') === false, 'action chips stay full width');
assert(node.dataset.shortcut === 'c', 'collect data-shortcut on node');
assert(node.dataset.shortcutMod === 'alt-shift', 'collect data-shortcut-mod on node');

const agentStatus = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'collect-agent-status');
assert(agentStatus?.domId === 'btnCollectAgentStatus', 'agent status registry entry');
assert(agentStatus.label === 'Agent ○', 'agent status default label');

WTM.renderTechMetaStrip(metaMount);
assert(metaMount.children.length === 10, 'rendered ten chips');
metaMount.children.forEach((child) => {
  assert(child.className.includes('console-chip'), `chip class on ${child.id}`);
  assert(child.className.includes('12px') === false, 'no inline size in className');
});

WTM.applyActionRowChips({ getElementById: (id) => actionEls[id] });
Object.values(actionEls).forEach((btn) => {
  assert(btn.className.includes('console-chip'), `action ${btn.id} gets console-chip`);
  assert(btn.className.includes('btn-console'), `action ${btn.id} keeps btn-console`);
});

/* COMET C4 — CSS control set locks (map to .console-chip; no .wtc-btn fork) */
const css = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');
assert(
  /\.console-chip\s*,[\s\S]{0,120}?border-radius:\s*var\(--wf-radius-control\)/s.test(css),
  'COMET C4 console-chip radius-control'
);
assert(
  /\.console-chip--primary[\s\S]{0,160}?background:\s*var\(--wf-ok-strong\)/s.test(css),
  'COMET C4 primary = ok-strong'
);
assert(!css.includes('.wtc-btn'), 'COMET C4 no .wtc-btn fork');
assert(!css.includes('.wtc-search'), 'COMET C4 no .wtc-search fork');

/* COMET C5 — status chip variants + strip height locks */
assert(
  /\.console-chip--ok[\s\S]{0,160}?background:\s*var\(--wf-ok-soft\)/s.test(css),
  'COMET C5 chip--ok soft token'
);
assert(
  /\.console-chip--warn[\s\S]{0,160}?background:\s*var\(--wf-warn-soft\)/s.test(css),
  'COMET C5 chip--warn soft token'
);
assert(
  /\.console-chip--risk[\s\S]{0,160}?background:\s*var\(--wf-risk-soft\)/s.test(css),
  'COMET C5 chip--risk soft token'
);
assert(
  /\.ia-top-pipeline-strip\s*\{[^}]*height:\s*var\(--wf-status-strip-h\)/s.test(css),
  'COMET C5 pipeline strip --wf-status-strip-h'
);
assert(!/\.wtc-chip[\s{,.-]/.test(css), 'COMET C5 no .wtc-chip fork');

/* COMET C6 — desk links + form field locks */
assert(
  /\.console-chip--external\s*\{[^}]*color:\s*var\(--wf-accent\)/s.test(css),
  'COMET C6 external link accent'
);
assert(
  /\.ia-selectors select\s*\{[^}]*border-radius:\s*var\(--wf-radius-control\)/s.test(css),
  'COMET C6 form select radius-control'
);
assert(!/\.wtc-link[\s{,.-]/.test(css), 'COMET C6 no .wtc-link fork');
assert(!/\.wtc-field[\s{,.-]/.test(css), 'COMET C6 no .wtc-field fork');

console.log('top_utility_registry.test.mjs — all assertions passed');