#!/usr/bin/env node
/** BasisWatch — invalidateCurveCache + reloadCurve refetch */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadBasisWatch(fetchImpl) {
  // Curve/hydration loads go through The Ark only.
  const arkSrc = fs.readFileSync(path.join(ROOT, 'js/ark.js'), 'utf8');
  const analyticsSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_analytics.js'), 'utf8');
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');
  let fetchCalls = 0;
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      body: { dataset: {} },
      documentElement: { setAttribute() {}, getAttribute: () => 'dark' },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }),
    },
    location: { protocol: 'http:', search: '', href: 'http://localhost/' },
    localStorage: { getItem: () => null, setItem() {} },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    fetch: fetchImpl || (async () => {
      fetchCalls += 1;
      return {
        ok: true,
        json: async () => ({
          records: [{ raw_symbol: 'BTM26', latest: { close: 102000, date: '2026-07-01' } }],
        }),
      };
    }),
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(arkSrc, ctx, { filename: 'ark.js' });
  vm.runInContext(analyticsSrc, ctx, { filename: 'basis_watch_analytics.js' });
  vm.runInContext(panelSrc, ctx, { filename: 'basis_watch_panel.js' });
  return { sandbox, getFetchCalls: () => fetchCalls };
}

async function run() {
  const { sandbox } = loadBasisWatch();
  const bw = sandbox.WTM_BasisWatch;
  assert(bw, 'WTM_BasisWatch exported');
  assert(typeof bw.invalidateCurveCache === 'function', 'invalidateCurveCache');
  assert(typeof bw.reloadCurve === 'function', 'reloadCurve');

  await bw.ensureCurveHistory();
  const state = { basisWatch: { mode: 'live', view: 'basis', asset: 'BTC' }, hydration: { crypto_sleeve: { btc_spot_usd: { last_price: 100000 } } } };

  let curveFetchCount = 0;
  let hydrationFetchCount = 0;
  const { sandbox: sb2 } = loadBasisWatch(async (url) => {
    const path = String(url);
    if (path.includes('barchart_curve_history')) {
      curveFetchCount += 1;
      return {
        ok: true,
        json: async () => ({
          records: [{ raw_symbol: 'BTM26', latest: { close: 102000, date: '2026-07-01' }, contract_meta: { contract_root: 'BT' } }],
        }),
      };
    }
    if (path.includes('latest.json')) {
      hydrationFetchCount += 1;
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
    return { ok: false, json: async () => ({}) };
  });
  const bw2 = sb2.WTM_BasisWatch;
  await bw2.ensureCurveHistory();
  assert(curveFetchCount === 1, 'initial curve fetch');
  await bw2.ensureCurveHistory();
  assert(curveFetchCount === 1, 'cached — no second curve fetch');

  bw2.invalidateCurveCache();
  await bw2.reloadCurve({
    basisWatch: { mode: 'live' },
    hydration: { crypto_sleeve: { assets: { btc_spot_usd: { last_price: 100000 } } } },
  }, {});
  assert(curveFetchCount === 2, 'reloadCurve refetches curve after invalidate');
  assert(hydrationFetchCount >= 1, 'reloadCurve also reloads hydration');

  const model = state._basisWatchModel || bw.buildModel(state, { records: [{ raw_symbol: 'BTM26', latest: { close: 102000 } }] });
  assert(model.contracts.length >= 0, 'buildModel ok');

  console.log([
    'PASS basis_watch_refresh.test.mjs',
    `curveFetchCount=${curveFetchCount}`,
    `hydrationFetchCount=${hydrationFetchCount}`,
    `invalidate=${typeof bw.invalidateCurveCache}`,
    `reloadCurve=${typeof bw.reloadCurve}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL basis_watch_refresh.test.mjs: ${err.message}`);
  process.exit(1);
});