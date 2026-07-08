#!/usr/bin/env node
/** Chunk 23 — Litmus shared table renderer tests. */
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
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this._classSet = new Set();
    this.classList = {
      _set: this._classSet,
      add: (...cls) => {
        cls.forEach((c) => this._classSet.add(c));
        this.className = [...this._classSet].join(' ');
      },
      remove: (...cls) => {
        cls.forEach((c) => this._classSet.delete(c));
        this.className = [...this._classSet].join(' ');
      },
      toggle: (c, force) => {
        if (force === true) this._classSet.add(c);
        else if (force === false) this._classSet.delete(c);
        else if (this._classSet.has(c)) this._classSet.delete(c);
        else this._classSet.add(c);
        this.className = [...this._classSet].join(' ');
      },
      contains: (c) => this._classSet.has(c),
    };
    Object.defineProperty(this, 'className', {
      get: () => [...this._classSet].join(' '),
      set: (v) => {
        this._classSet.clear();
        String(v || '').split(/\s+/).filter(Boolean).forEach((c) => this._classSet.add(c));
      },
    });
    this.dataset = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.id = '';
    this.hidden = false;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
    return child;
  }

  replaceChildren(...nodes) {
    this.children = nodes.flat().filter(Boolean);
    this.children.forEach((n) => { n.parentElement = this; });
  }

  querySelector(sel) {
    if (sel.startsWith('#') && this.id === sel.slice(1)) return this;
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
      if (sel.startsWith('.') && node.classList?.contains(sel.slice(1))) out.push(node);
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
  }

  getElementById(id) {
    return this._byId.get(id) || null;
  }

  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  }

  createElement(tag) {
    const el = new ElementShim(tag);
    if (tag === 'input') {
      el.type = 'text';
      el.value = '';
      el.step = '';
      el.min = '';
    }
    return el;
  }
}

function loadModule() {
  const document = new DocumentShim();
  const host = new ElementShim('div');
  host.id = 'bbdmLitmusHost';
  const dig = new ElementShim('div');
  dig.id = 'bbdmDigLitmus';
  const iterate = new ElementShim('div');
  iterate.id = 'bbdmIterateLitmus';
  host.appendChild(dig);
  host.appendChild(iterate);
  document._byId.set('bbdmLitmusHost', host);
  document._byId.set('bbdmDigLitmus', dig);
  document._byId.set('bbdmIterateLitmus', iterate);

  const clipboard = { text: '', async writeText(t) { this.text = t; } };
  const sandbox = {
    window: {},
    document,
    navigator: { clipboard },
    console,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(ROOT, 'js/bbdm_litmus_table.js'), 'utf8');
  vm.runInContext(src, sandbox);
  return { mod: sandbox.BBDM_LitmusTable, document, clipboard, host, dig, iterate };
}

function sampleTable() {
  return {
    id: 'midwest_calendar_primary',
    trade_id: 'midwest_calendar',
    title: 'Midwest Compute — Primary',
    columns: ['company', 'segment', 'current_gm_pct', 'cloud_multiplier', 'status'],
    rows: [
      { company: 'Microsoft', segment: 'Intelligent Cloud', current_gm_pct: 42.5, cloud_multiplier: 1.0, status: 'pending_koyfin' },
      { company: 'Alphabet', segment: 'Google Cloud', current_gm_pct: null, cloud_multiplier: 1.2, status: 'pending_koyfin' },
    ],
  };
}

function sampleLitmus() {
  return {
    tables: [sampleTable()],
    by_trade: {
      midwest_calendar: { alignment: 'neutral', table_ids: ['midwest_calendar_primary'], headline: null },
    },
    unprocessed_filing_count: 0,
  };
}

function main() {
  const { mod, clipboard, dig } = loadModule();
  assert(mod?.BUILD?.includes('CHUNK23'), 'BUILD tag');
  assert(Object.keys(mod.COLUMN_REGISTRY).length >= 20, 'column registry size');
  assert(mod.profileForColumns(mod.TABLE_PROFILES.midwest_corporate.columns) === 'midwest_corporate', 'profile detect');

  assert(mod.formatCellValue('current_gm_pct', 42.5) === '42.5%', 'pct format');
  assert(mod.formatCellValue('gm_z_3yr', 1.2) === '+1.20', 'z format');
  assert(mod.formatCellValue('funding_rate', 0.00012) === '0.0120%', 'rate format');
  assert(mod.isEditableColumn('cloud_multiplier'), 'editable cloud_multiplier');

  const tsv = mod.tableToTsv(sampleTable());
  assert(tsv.startsWith('Company\tSegment\tCurrent GM%'), 'tsv header labels');
  assert(tsv.includes('Microsoft'), 'tsv row data');
  assert(tsv.includes('42.5%'), 'tsv formatted pct');

  const tableEl = mod.renderLitmusTable(sampleTable());
  assert(tableEl.classList.contains('bbdm-litmus-table'), 'table wrapper class');
  const copyBtn = tableEl.querySelector('.bbdm-litmus-btn--copy');
  assert(copyBtn, 'copy button present');
  const inputs = tableEl.querySelectorAll('.bbdm-litmus-input');
  assert(inputs.length === 2, 'editable inputs per row');

  const secondaryTable = {
    id: 'midwest_calendar_secondary',
    trade_id: 'midwest_calendar',
    title: 'Midwest Compute — Nice-to-Have',
    tier: 'secondary',
    collapsed: true,
    columns: sampleTable().columns,
    rows: [{ company: 'Meta', segment: 'Reality Labs adj.', current_gm_pct: null, cloud_multiplier: 1.0, status: 'pending_koyfin' }],
  };
  const litmusWithSecondary = {
    ...sampleLitmus(),
    tables: [sampleTable(), secondaryTable],
    by_trade: {
      midwest_calendar: {
        alignment: 'neutral',
        table_ids: ['midwest_calendar_primary', 'midwest_calendar_secondary'],
        headline: null,
      },
    },
  };
  const block = mod.renderLitmusBlock(litmusWithSecondary, { tradeId: 'midwest_calendar' });
  assert(block.querySelector('.bbdm-litmus-align--neutral'), 'alignment badge');
  assert(block.querySelectorAll('.bbdm-litmus-table').length === 2, 'primary + secondary tables');
  assert(block.querySelector('.bbdm-litmus-table--collapsed'), 'secondary collapsed in trade block');

  const filingLitmus = { ...sampleLitmus(), unprocessed_filing_count: 2 };
  const filingBlock = mod.renderLitmusBlock(filingLitmus);
  assert(filingBlock.querySelector('.bbdm-litmus-filing-dot'), 'filing red dot');

  assert(mod.mount('#bbdmDigLitmus', sampleLitmus(), { tradeId: 'midwest_calendar' }), 'mount dig');
  assert(dig.children.length === 1, 'dig mount populated');
  assert(dig.querySelector('.bbdm-litmus-table'), 'dig table rendered');

  const collapsedTable = { ...sampleTable(), collapsed: true, tier: 'secondary' };
  const collapsedEl = mod.renderLitmusTable(collapsedTable);
  assert(collapsedEl.classList.contains('bbdm-litmus-table--collapsed'), 'collapsed default');
  assert(collapsedEl.querySelector('.bbdm-litmus-table__tier'), 'secondary tier badge');

  mod.copyTable(sampleTable());
  assert(clipboard.text.includes('Microsoft'), 'clipboard copy');

  const pyRegistry = fs.readFileSync(path.join(ROOT, 'bang_bang_da/litmus_schema.py'), 'utf8');
  for (const key of ['cloud_multiplier', 'funding_rate', 'cyclical_defensive_gap']) {
    assert(pyRegistry.includes(`"${key}"`), `python registry has ${key}`);
    assert(mod.COLUMN_REGISTRY[key], `js registry has ${key}`);
  }

  console.log('PASS bbdm_litmus_table.test.mjs');
}

try {
  main();
} catch (err) {
  console.error(`FAIL bbdm_litmus_table.test.mjs: ${err.message}`);
  process.exit(1);
}