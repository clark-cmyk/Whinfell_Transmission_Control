#!/usr/bin/env node
/**
 * Chunk 17 — Whinfell_BasisWatch.html standalone Ark wiring.
 * Asserts script order + hydration/curve loads only via WTM_Ark.
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

function testHtmlWiring() {
  const html = fs.readFileSync(path.join(ROOT, 'Whinfell_BasisWatch.html'), 'utf8');
  const arkIdx = html.indexOf('src="js/ark.js"');
  const analyticsIdx = html.indexOf('src="js/basis_watch_analytics.js"');
  const panelIdx = html.indexOf('src="js/basis_watch_panel.js"');
  const deskOpsIdx = html.indexOf('src="js/desk_data_ops.js"');

  assert(arkIdx >= 0, 'Whinfell_BasisWatch.html must include js/ark.js');
  assert(analyticsIdx > arkIdx, 'ark.js must load before basis_watch_analytics.js');
  assert(panelIdx > arkIdx, 'ark.js must load before basis_watch_panel.js');
  assert(deskOpsIdx > arkIdx, 'ark.js must load before desk_data_ops.js');
  assert(html.includes('data-bw-layout="standalone"'), 'standalone layout flag');
}

async function testStandaloneLoadsViaArk() {
  const arkSrc = fs.readFileSync(path.join(ROOT, 'js/ark.js'), 'utf8');
  const analyticsSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_analytics.js'), 'utf8');
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');

  let hydrationFetch = 0;
  let curveFetch = 0;
  const nodes = new Map();

  function makeClassList() {
    const set = new Set();
    return {
      add(...c) { c.forEach((x) => set.add(x)); },
      remove(...c) { c.forEach((x) => set.delete(x)); },
      contains(c) { return set.has(c); },
      toggle(c, force) {
        if (force === true) set.add(c);
        else if (force === false) set.delete(c);
        else if (set.has(c)) set.delete(c);
        else set.add(c);
        return set.has(c);
      },
    };
  }

  function makeNode(id) {
    return {
      id,
      textContent: '',
      className: '',
      classList: makeClassList(),
      style: {},
      dataset: {},
      innerHTML: '',
      value: '',
      disabled: false,
      width: 400,
      height: 240,
      getContext: () => {
        const noop = () => {};
        return {
          setTransform: noop, scale: noop, clearRect: noop, fillRect: noop, fillText: noop,
          strokeRect: noop, beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop,
          arc: noop, fill: noop, setLineDash: noop, measureText: () => ({ width: 0 }),
          createLinearGradient: () => ({ addColorStop: noop }),
          createRadialGradient: () => ({ addColorStop: noop }),
          save: noop, restore: noop, translate: noop, rotate: noop,
          closePath: noop, clip: noop, rect: noop, quadraticCurveTo: noop,
        };
      },
      appendChild() {},
      setAttribute() {},
      getAttribute: () => null,
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ width: 400, height: 240, top: 0, left: 0 }),
    };
  }

  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      body: {
        dataset: { bwLayout: 'standalone' },
        classList: makeClassList(),
        prepend() {},
        appendChild() {},
      },
      documentElement: {
        setAttribute() {},
        getAttribute: () => 'dark',
        classList: makeClassList(),
      },
      getElementById: (id) => {
        if (!nodes.has(id)) nodes.set(id, makeNode(id));
        return nodes.get(id);
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => makeNode('el'),
    },
    location: {
      protocol: 'http:',
      search: '',
      href: 'http://localhost/Whinfell_BasisWatch.html',
      origin: 'http://localhost',
      pathname: '/Whinfell_BasisWatch.html',
    },
    localStorage: { getItem: () => null, setItem() {} },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    URLSearchParams,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
    fetch: async (url) => {
      const u = String(url);
      // Only Ark may fetch these — panel must not call fetch itself.
      if (u.includes('data/hydration/latest.json')) {
        hydrationFetch += 1;
        return {
          ok: true,
          json: async () => ({
            as_of: '2026-07-09T14:37:30+00:00',
            snapshot_id: 'global-2026-07-09-raw2wtm-01',
            freshness_status: 'fresh',
            crypto_sleeve: { assets: { btc_spot_usd: { last_price: 100000 } } },
          }),
        };
      }
      if (u.includes('barchart_curve_history.json')) {
        curveFetch += 1;
        return {
          ok: true,
          json: async () => ({
            records: [{
              raw_symbol: 'BTM26',
              latest: { close: 102000, date: '2026-07-01' },
              contract_meta: { contract_root: 'BT' },
            }],
          }),
        };
      }
      throw new Error(`unexpected fetch ${u}`);
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(arkSrc, ctx, { filename: 'ark.js' });
  vm.runInContext(analyticsSrc, ctx, { filename: 'basis_watch_analytics.js' });
  vm.runInContext(panelSrc, ctx, { filename: 'basis_watch_panel.js' });

  assert(sandbox.WTM_Ark, 'WTM_Ark exported');
  assert(sandbox.WTM_BasisWatch, 'WTM_BasisWatch exported');
  assert(String(sandbox.WTM_BasisWatch.BW_BUILD).includes('STANDALONE-ARK')
    || String(sandbox.WTM_BasisWatch.BW_BUILD).includes('ARK'), 'BW_BUILD marks Ark path');

  await sandbox.WTM_BasisWatch.initStandalone();

  assert(hydrationFetch >= 1, 'hydration loaded through Ark fetch');
  assert(curveFetch >= 1, 'curve loaded through Ark fetch');
  assert(sandbox.WTM_Ark.getHydration?.(), 'Ark hydration cache warm');
  assert(sandbox.WTM_Ark.getCurveHistory?.(), 'Ark curve cache warm');

  const state = sandbox.WTM_BasisWatch.getState();
  assert(state && state.hydration, 'standalone state has hydration');
  assert(
    state.hydration.snapshot_id === 'global-2026-07-09-raw2wtm-01'
      || state.provenance?.snapshotId === 'global-2026-07-09-raw2wtm-01'
      || state.hydration.as_of === '2026-07-09T14:37:30+00:00',
    'hydration merged into standalone state',
  );
}

async function run() {
  testHtmlWiring();
  await testStandaloneLoadsViaArk();
  console.log('PASS basis_watch_standalone_ark.test.mjs — Chunk 17 HTML + Ark IO');
}

run().catch((err) => {
  console.error(`FAIL basis_watch_standalone_ark.test.mjs: ${err.message}`);
  process.exit(1);
});
