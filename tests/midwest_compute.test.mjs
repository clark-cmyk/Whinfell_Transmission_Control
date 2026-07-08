#!/usr/bin/env node
/** Midwest Compute Crush — modular shell + export schema regression */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = [
  '../js/task_force_panel_feed.js',
  'wmc-data.js',
  'wmc-utils.js',
  'wmc-hydrate.js',
  'wmc-export.js',
  'wmc-nav.js',
  'wmc-overview.js',
  'wmc-explainer.js',
  'wmc-basis.js',
  'wmc-trades.js',
  'wmc-risk.js',
  'wmc-charts.js',
  'wmc-sources.js',
  'wmc-boot.js',
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadWmcScripts({ withBoot = false } = {}) {
  const sandbox = {
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      readyState: 'complete',
      addEventListener: () => {},
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval: () => {},
    addEventListener: () => {},
    IntersectionObserver: class {
      observe() {}
      disconnect() {}
    },
    Blob: class {
      constructor(parts) { this.parts = parts; }
    },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);

  const toLoad = withBoot ? MODULES : MODULES.filter((f) => f !== 'wmc-boot.js');
  for (const f of toLoad) {
    const filePath = f.startsWith('../')
      ? path.join(ROOT, f.replace('../', ''))
      : path.join(ROOT, 'midwest_compute', f);
    const src = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(src, ctx, { filename: path.basename(f) });
  }

  return sandbox;
}

function testFileStructure() {
  const html = fs.readFileSync(path.join(ROOT, 'Whinfell_Midwest_Compute_Crush.html'), 'utf8');
  assert(html.includes('midwest_compute/wmc.css'), 'HTML links wmc.css');
  assert(html.includes('midwest_compute/wmc-boot.js'), 'HTML loads boot script');
  assert(html.includes('js/auto_collect_panel.js'), 'HTML loads auto collect panel');
  assert(!html.includes('<style>'), 'HTML has no inline style block');

  for (const id of ['overview', 'basis', 'trades', 'risk', 'charts', 'sources']) {
    assert(html.includes(`id="${id}"`), `section #${id} present`);
  }

  assert(html.includes('id="crush-reference"'), 'crush-reference details present');
  assert(html.includes('wmc-disclosure'), 'wmc-disclosure class present');
  assert(html.includes('midwest_compute/wmc-explainer.js'), 'HTML loads explainer script');
  assert(!html.includes('id="crush-reference" class="wmc-disclosure" open'), 'reference collapsed by default');
  assert(!/<details[^>]*id="crush-reference"[^>]*\bopen\b/i.test(html), 'crush-reference has no open attribute');

  for (const f of ['wmc.css', ...MODULES]) {
    const filePath = f.startsWith('../')
      ? path.join(ROOT, f.replace('../', ''))
      : path.join(ROOT, 'midwest_compute', f);
    assert(fs.existsSync(filePath), `${f} exists`);
  }
}

function testExplainerData() {
  const sb = loadWmcScripts();
  const { explainer, corporate_comps: comps } = sb.WMC_DATA;

  assert(explainer?.title === 'Understanding the Midwest Compute Crush', 'explainer title');
  assert(Array.isArray(explainer?.formulas) && explainer.formulas.length >= 4, 'explainer formulas');
  assert(explainer?.components?.items?.length >= 5, 'explainer components');
  assert(explainer?.risks?.items?.length >= 5, 'explainer risks');

  assert(Array.isArray(comps?.crush_operators) && comps.crush_operators.length >= 3, 'crush_operators');
  assert(Array.isArray(comps?.margin_analogs) && comps.margin_analogs.length >= 3, 'margin_analogs');

  for (const entry of [...comps.crush_operators, ...comps.margin_analogs]) {
    assert(entry.name && entry.ticker && entry.role && entry.crush_linkage && entry.margin_note, `comp fields: ${entry.name}`);
  }

  const dict = fs.readFileSync(path.join(ROOT, 'documentation/DATA_DICTIONARY_v1.5.md'), 'utf8');
  assert(dict.includes('## Corporate Comps – Crush Analogs'), 'data dictionary section');
  assert(dict.includes('Category 1: Crush-like Operators'), 'dictionary category 1');
  assert(dict.includes('Category 2: Gross Margin Profile Analogs'), 'dictionary category 2');
}

function testExplainerRender() {
  const sb = loadWmcScripts();
  const roots = {};
  sb.document.getElementById = (id) => {
    if (id === 'explainer-root' || id === 'comps-root') {
      roots[id] = { innerHTML: '', childElementCount: 0 };
      return roots[id];
    }
    return null;
  };

  const unboundInit = sb.WMC.Explainer.init;
  unboundInit();
  assert(roots['explainer-root']?.innerHTML.includes('Understanding the Midwest Compute Crush'), 'explainer rendered via unbound init (boot chain)');
  assert(roots['explainer-root']?.innerHTML.includes('Crush Spread'), 'formula rendered');
  assert(roots['comps-root']?.innerHTML.includes('Corporate Sample (Comps)'), 'comps rendered');
  assert(roots['comps-root']?.innerHTML.includes('Category 1: Crush-like Operators'), 'category 1 rendered');
  assert(roots['comps-root']?.innerHTML.includes('Category 2: Gross Margin Profile Analogs'), 'category 2 rendered');
}

function testExplainerDiagnostic() {
  const sb = loadWmcScripts();
  const roots = {};
  sb.document.getElementById = (id) => {
    if (id === 'explainer-root' || id === 'comps-root') {
      roots[id] = { innerHTML: '' };
      return roots[id];
    }
    return null;
  };

  delete sb.WMC_DATA.explainer;
  delete sb.WMC_DATA.corporate_comps;
  sb.WMC.Explainer.init();

  assert(roots['explainer-root']?.innerHTML.includes('Explainer unavailable'), 'explainer diagnostic');
  assert(roots['comps-root']?.innerHTML.includes('Corporate comps unavailable'), 'comps diagnostic');
}

function testExportPayload() {
  const sb = loadWmcScripts();
  const payload = sb.WMC.Export.buildPayload();

  assert(payload.export_type === 'wtc_midwest_compute_crush', 'export_type');
  assert(Array.isArray(payload.basis_tracker) && payload.basis_tracker.length === 8, 'basis_tracker');
  assert(Object.keys(payload.trade_variants).length === 6, 'trade_variants');
  assert(payload.risk_summary?.var?.length === 5, 'risk var rows');
  assert(payload.specialists_compute_gpu?.node_id === 'ai_compute', 'compute_gpu layer');
  assert(payload.wtc_import_hint?.hydration_path === 'data/hydration/latest.json', 'import hint');
}

function testTaskForceMerge() {
  const sb = loadWmcScripts();
  const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/hydration/latest.json'), 'utf8'));
  const panels = sb.WTM_TaskForceFeed.extractTaskForcePanels(bundle.task_force);
  assert(panels?.specialists?.compute_gpu, 'hydration task_force has compute_gpu feed');
  sb.WMC_DATA = sb.WTM_TaskForceFeed.mergeWmcData(sb.WMC_DATA, panels);
  assert(sb.WMC_DATA.meta.thesis === panels.specialists.compute_gpu.signal, 'WMC_DATA thesis merged');
  assert(sb.WMC_DATA._task_force_panels, 'panels retained on WMC_DATA');
  const payload = sb.WMC.Export.buildPayload();
  assert(payload.specialists_compute_gpu?.signal, 'export carries task force gpu layer');
}

function testBasisSort() {
  const sb = loadWmcScripts();
  sb.document.getElementById = () => ({ innerHTML: '' });
  sb.document.querySelectorAll = () => [];

  const firstZ = sb.WMC.Basis.sortRows(sb.WMC_DATA.basis_tracker)[0];
  assert(firstZ.leg === 'BTC Basis (CME)', 'default sort z_score desc puts BTC first');
}

function testNavCollectControls() {
  const navSrc = fs.readFileSync(path.join(ROOT, 'midwest_compute/wmc-nav.js'), 'utf8');
  assert(navSrc.includes('id="btnMorningCollect"'), 'nav Collect CSVs button');
  assert(navSrc.includes('id="btnDeskRefresh"'), 'nav Refresh data button');
  assert(navSrc.includes('id="btnCollectAgentStatus"'), 'nav Agent status chip');
  assert(navSrc.includes('wtm-collect-agent--offline'), 'agent chip offline class');

  const bootSrc = fs.readFileSync(path.join(ROOT, 'midwest_compute/wmc-boot.js'), 'utf8');
  assert(bootSrc.includes('WMC.refreshAfterCollect'), 'refreshAfterCollect hook');

  const css = fs.readFileSync(path.join(ROOT, 'midwest_compute/wmc.css'), 'utf8');
  assert(css.includes('.collect-agent-offline'), 'offline panel styles in wmc.css');
}

function testRefreshAfterCollect() {
  const sb = loadWmcScripts();
  sb.document.readyState = 'loading';
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, 'midwest_compute/wmc-boot.js'), 'utf8'),
    vm.createContext(sb),
    { filename: 'wmc-boot.js' },
  );

  let basisRenders = 0;
  const origRender = sb.WMC.Basis.render;
  sb.WMC.Basis.render = function wrappedRender() {
    basisRenders += 1;
    return origRender.call(sb.WMC.Basis);
  };
  sb.WMC.Hydrate.load = async () => true;
  sb.document.getElementById = () => ({ innerHTML: '' });
  sb.document.querySelectorAll = () => [];

  return sb.WMC.refreshAfterCollect().then((result) => {
    assert(result.refreshed === true, 'refreshAfterCollect refreshed flag');
    assert(result.hydrated === true, 'refreshAfterCollect hydrated flag');
    assert(basisRenders === 1, 'basis re-rendered after collect');
  });
}

testFileStructure();
testExplainerData();
testExplainerRender();
testExplainerDiagnostic();
testExportPayload();
testTaskForceMerge();
testBasisSort();
testNavCollectControls();

testRefreshAfterCollect().then(() => {
  console.log('midwest_compute.test.mjs — PASS (structure · explainer · diagnostic · export · task force merge · basis sort · collect · refresh)');
}).catch((err) => {
  console.error(`FAIL midwest_compute.test.mjs: ${err.message}`);
  process.exit(1);
});