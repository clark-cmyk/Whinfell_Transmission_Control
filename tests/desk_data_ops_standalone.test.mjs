#!/usr/bin/env node
/** Desk ops — standalone BasisWatch state routing (no appState). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadDeskOpsWithBasisWatch() {
  const analyticsSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_analytics.js'), 'utf8');
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');
  const deskOpsSrc = fs.readFileSync(path.join(ROOT, 'js/desk_data_ops.js'), 'utf8');

  const standaloneState = {
    basisWatch: { asset: 'BTC', view: 'basis', mode: 'live' },
    hydration: { as_of: '2026-07-08T00:00:00Z', crypto_sleeve: { assets: { btc_spot_usd: { last_price: 100000 } } } },
  };

  let reloadCurveState = null;
  let reloadHydrationState = null;
  let hydrationFetchCount = 0;
  let curveFetchCount = 0;

  const sandbox = {
    window: {},
    appState: undefined,
    document: {
      readyState: 'complete',
      body: { dataset: { bwLayout: 'standalone' } },
      documentElement: { setAttribute() {}, getAttribute: () => 'dark' },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }),
    },
    location: { protocol: 'http:', search: '', href: 'http://localhost/Whinfell_BasisWatch.html' },
    localStorage: { getItem: () => null, setItem() {} },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    fetch: async (url) => {
      const path = String(url);
      if (path.includes('data/hydration/latest.json')) {
        hydrationFetchCount += 1;
        return {
          ok: true,
          json: async () => ({
            as_of: '2026-07-08T12:00:00Z',
            snapshot_id: 'global-2026-07-08-test-01',
            freshness_status: 'fresh',
            crypto_sleeve: { assets: { btc_spot_usd: { last_price: 101000 } } },
          }),
        };
      }
      if (path.includes('barchart_curve_history.json')) {
        curveFetchCount += 1;
        return {
          ok: true,
          json: async () => ({
            records: [{ raw_symbol: 'BTM26', latest: { close: 102000, date: '2026-07-01' }, contract_meta: { contract_root: 'BT' } }],
          }),
        };
      }
      throw new Error(`unexpected fetch ${path}`);
    },
  };
  sandbox.window = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(analyticsSrc, ctx, { filename: 'basis_watch_analytics.js' });
  vm.runInContext(panelSrc, ctx, { filename: 'basis_watch_panel.js' });
  vm.runInContext(deskOpsSrc, ctx, { filename: 'desk_data_ops.js' });

  sandbox.standaloneState = standaloneState;
  sandbox.WTM_BasisWatch.getState = () => standaloneState;
  const origReloadCurve = sandbox.WTM_BasisWatch.reloadCurve.bind(sandbox.WTM_BasisWatch);
  sandbox.WTM_BasisWatch.reloadCurve = async (state, hooks) => {
    reloadCurveState = state;
    return origReloadCurve(state, hooks);
  };
  const origReloadHydration = sandbox.WTM_BasisWatch.reloadHydration.bind(sandbox.WTM_BasisWatch);
  sandbox.WTM_BasisWatch.reloadHydration = async (state) => {
    reloadHydrationState = state;
    return origReloadHydration(state);
  };

  return {
    sandbox,
    standaloneState,
    getReloadCurveState: () => reloadCurveState,
    getReloadHydrationState: () => reloadHydrationState,
    getHydrationFetchCount: () => hydrationFetchCount,
    getCurveFetchCount: () => curveFetchCount,
  };
}

async function run() {
  const { sandbox, standaloneState, getReloadCurveState, getReloadHydrationState } = loadDeskOpsWithBasisWatch();
  const ops = sandbox.WTM_DeskOps;

  assert(ops, 'WTM_DeskOps exported');
  assert(ops.BUILD.includes('DESK-OPS'), 'desk ops build stamp');
  assert(typeof ops.resolveDeskState === 'function', 'resolveDeskState');

  const resolved = ops.resolveDeskState();
  assert(resolved === standaloneState, 'resolveDeskState returns standalone state, not empty appState');
  assert(resolved.basisWatch.asset === 'BTC', 'standalone asset preserved');

  const hydrationOk = await ops.refreshHydration();
  assert(hydrationOk && hydrationOk.ok, 'refreshHydration via reloadHydration');
  assert(getReloadHydrationState() === standaloneState, 'reloadHydration received standalone state');
  assert(standaloneState.hydration.crypto_sleeve.assets.btc_spot_usd.last_price === 101000, 'hydration merged');
  assert(hydrationOk.snapshot_id === 'global-2026-07-08-test-01', 'stamp snapshot_id from BW merge');
  assert(hydrationOk.as_of === '2026-07-08T12:00:00Z', 'stamp as_of from BW merge');
  assert(standaloneState.provenance?.snapshotId === 'global-2026-07-08-test-01', 'provenance.snapshotId stamped');

  const curveOk = await ops.refreshBasisWatch();
  assert(curveOk, 'refreshBasisWatch');
  assert(getReloadCurveState() === standaloneState, 'reloadCurve received standalone state, not {}');
  assert(standaloneState._basisWatchModel, 'model attached to standalone state after refresh');

  const full = await ops.refreshAllDeskData({ silent: true });
  assert(full.ok, 'refreshAllDeskData ok on standalone');
  assert(full.results.hydration, 'hydration result');
  assert(full.results.curve, 'curve result');
  assert(full.results.snapshot_id === 'global-2026-07-08-test-01', 'full refresh carries snapshot_id');

  // Main desk: when deploy hydrate exists, it runs first and fills stamp (no BW short-circuit).
  let deployCalls = 0;
  sandbox.WTM_reloadDeployHydration = async () => {
    deployCalls += 1;
    return {
      ok: true,
      as_of: '2026-07-09T14:37:30+00:00',
      snapshot_id: 'global-2026-07-09-raw2wtm-01',
      freshness_status: 'fresh',
    };
  };
  const mainStamp = await ops.refreshHydration();
  assert(deployCalls === 1, 'deploy hydrate preferred when present');
  assert(mainStamp.ok && mainStamp.snapshot_id === 'global-2026-07-09-raw2wtm-01', 'main desk stamp from deploy');

  console.log([
    'PASS desk_data_ops_standalone.test.mjs',
    `build=${ops.BUILD}`,
    `bw_build=${sandbox.WTM_BasisWatch.BW_BUILD}`,
    `spot=${standaloneState.hydration.crypto_sleeve.assets.btc_spot_usd.last_price}`,
    `model_asset=${standaloneState._basisWatchModel?.assetKey}`,
    `deploy_calls=${deployCalls}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL desk_data_ops_standalone.test.mjs: ${err.message}`);
  process.exit(1);
});