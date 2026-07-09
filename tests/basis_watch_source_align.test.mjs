#!/usr/bin/env node
/** BasisWatch — spot/futures date alignment vs source data */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadBasisWatch() {
  const analyticsSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_analytics.js'), 'utf8');
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');
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
    fetch: async () => ({ ok: true, json: async () => ({ records: [] }) }),
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(analyticsSrc, ctx, { filename: 'basis_watch_analytics.js' });
  vm.runInContext(panelSrc, ctx, { filename: 'basis_watch_panel.js' });
  return sandbox.WTM_BasisWatch;
}

async function run() {
  const bw = loadBasisWatch();
  const hydration = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/hydration/latest.json'), 'utf8'));
  const curve = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/barchart/v1/barchart_curve_history.json'), 'utf8'));

  const stateBtc = { basisWatch: { asset: 'BTC' }, hydration };
  const modelBtc = bw.buildModel(stateBtc, curve);

  const koyfin = hydration.crypto_sleeve.assets.btc_spot_usd.last_price;
  const hydrationBasis = hydration.node_cockpits.basis.rv_basis.series.btc_basis_spot_1m.horizons['1m'].current_value;

  assert(modelBtc.curveQuoteDate === '2026-06-29', `curve quote date ${modelBtc.curveQuoteDate}`);
  assert(modelBtc.hydrationAsOf === hydration.as_of || modelBtc.hydrationDate, 'hydration stamp on model');
  assert(String(modelBtc.dataNote || '').includes('Hydration'), `dataNote shows Hydration: ${modelBtc.dataNote}`);
  assert(modelBtc.spotDesk === koyfin, 'desk spot preserved');
  assert(Math.abs(modelBtc.spot - 64753.5) < 50, `basis-implied spot ${modelBtc.spot}`);
  assert(modelBtc.spotSource === 'barchart_basis_implied', modelBtc.spotSource);
  assert(Math.abs(modelBtc.frontBasisPct - hydrationBasis) < 0.01, `front basis ${modelBtc.frontBasisPct} vs hydration ${hydrationBasis}`);
  assert(modelBtc.frontBasisPct > -1 && modelBtc.frontBasisPct < 1, 'not misaligned +1.62%');

  const btq = modelBtc.contracts.find((c) => c.symbol === 'BTQ26');
  assert(btq, 'BTQ26 present');
  assert(btq.basisPct == null || Math.abs(btq.spotBasisPct + 6.65) < 1, `BTQ26 basis ~-6.65% got ${btq.spotBasisPct}`);

  const stateEth = { basisWatch: { asset: 'ETH' }, hydration };
  const modelEth = bw.buildModel(stateEth, curve);
  const ethBasis = hydration.node_cockpits.basis.rv_basis.series.eth_basis_spot_1m.horizons['1m'].current_value;

  assert(modelEth.assetKey === 'ETH', 'eth asset');
  assert(Math.abs(modelEth.frontBasisPct - ethBasis) < 0.01, `ETH front basis ${modelEth.frontBasisPct} vs ${ethBasis}`);
  assert(modelEth.frontBasisPct !== modelBtc.frontBasisPct, 'ETH differs from BTC');

  console.log([
    'PASS basis_watch_source_align.test.mjs',
    `curveQuote=${modelBtc.curveQuoteDate}`,
    `btc_spot_basis=${modelBtc.spot.toFixed(0)}`,
    `btc_front_basis=${modelBtc.frontBasisPct}%`,
    `eth_front_basis=${modelEth.frontBasisPct}%`,
    `btq_basis=${btq.spotBasisPct?.toFixed(2)}%`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL basis_watch_source_align.test.mjs: ${err.message}`);
  process.exit(1);
});