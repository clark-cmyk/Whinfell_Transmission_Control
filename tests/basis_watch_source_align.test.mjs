#!/usr/bin/env node
/**
 * BasisWatch — Ark hydration alignment when curve quotes lag.
 * Chunk 17: front basis/ann from Ark series; DTE from hydration as_of when stale.
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
  sandbox.globalThis = sandbox;
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
  const hydDay = String(hydration.as_of || '').slice(0, 10);

  assert(modelBtc.curveQuoteDate === '2026-06-29', `curve quote vintage ${modelBtc.curveQuoteDate}`);
  assert(modelBtc.curveStale === true, 'curve should be flagged stale vs Ark hydration');
  assert(String(modelBtc.valuationDate || modelBtc.asOf).startsWith(hydDay)
    || String(modelBtc.asOf).includes(hydDay)
    || modelBtc.hydrationDate === hydDay, `asOf/valuation anchored to hydration ${hydDay}, got asOf=${modelBtc.asOf} val=${modelBtc.valuationDate}`);
  assert(modelBtc.hydrationAsOf === hydration.as_of || modelBtc.hydrationDate === hydDay, 'hydration stamp on model');
  assert(String(modelBtc.dataNote || '').includes('Ark') || String(modelBtc.dataNote || '').includes('Hydration'), `dataNote: ${modelBtc.dataNote}`);
  assert(modelBtc.spotDesk === koyfin, 'desk Koyfin spot preserved on spotDesk');
  assert(modelBtc.spotSource === 'ark_koyfin', `spotSource ${modelBtc.spotSource}`);
  assert(Math.abs(modelBtc.spot - koyfin) < 1, `spot from Ark Koyfin ${modelBtc.spot} vs ${koyfin}`);
  // Front basis MUST match Ark hydration series (not raw stale F vs wrong S).
  assert(Math.abs(modelBtc.frontBasisPct - hydrationBasis) < 0.01, `front basis ${modelBtc.frontBasisPct} vs hydration ${hydrationBasis}`);
  assert(modelBtc.frontBasisPct > -1 && modelBtc.frontBasisPct < 1, 'front basis in sane range');
  assert(modelBtc.front, 'front contract present');
  assert(modelBtc.front.symbol !== 'BTM26', `front must not be expired June BTM26, got ${modelBtc.front.symbol}`);
  assert(Math.abs((modelBtc.front.spotBasisPct ?? modelBtc.front.pctBasis) - hydrationBasis) < 0.01, 'front row basis = Ark');
  assert(Number.isFinite(modelBtc.front.spotAnnualizedCarry) || modelBtc.front.dte < 7, `front ann ${modelBtc.front.spotAnnualizedCarry}`);
  // Ann should not be the old ~−100%+ blow-up from wrong DTE/spot mix.
  if (Number.isFinite(modelBtc.front.spotAnnualizedCarry)) {
    assert(Math.abs(modelBtc.front.spotAnnualizedCarry) < 80, `ann carry sane ${modelBtc.front.spotAnnualizedCarry}`);
  }

  const btq = modelBtc.contracts.find((c) => c.symbol === 'BTQ26');
  assert(btq, 'BTQ26 present');
  // Deferred tenors keep curve shape vs Ark-implied spot (not legacy BTM26-implied levels).
  assert(Number.isFinite(btq.spotBasisPct), `BTQ26 basis ${btq.spotBasisPct}`);

  const stateEth = { basisWatch: { asset: 'ETH' }, hydration };
  const modelEth = bw.buildModel(stateEth, curve);
  const ethBasis = hydration.node_cockpits.basis.rv_basis.series.eth_basis_spot_1m.horizons['1m'].current_value;

  assert(modelEth.assetKey === 'ETH', 'eth asset');
  assert(Math.abs(modelEth.frontBasisPct - ethBasis) < 0.01, `ETH front basis ${modelEth.frontBasisPct} vs ${ethBasis}`);
  assert(modelEth.frontBasisPct !== modelBtc.frontBasisPct, 'ETH differs from BTC');

  console.log([
    'PASS basis_watch_source_align.test.mjs',
    `curveQuote=${modelBtc.curveQuoteDate}`,
    `valuationDate=${modelBtc.valuationDate || modelBtc.asOf}`,
    `front=${modelBtc.front.symbol}`,
    `btc_spot_basis=${modelBtc.spot.toFixed(0)}`,
    `btc_front_basis=${modelBtc.frontBasisPct}%`,
    `btc_front_ann=${modelBtc.front.spotAnnualizedCarry?.toFixed?.(2)}%`,
    `eth_front_basis=${modelEth.frontBasisPct}%`,
    `btq_basis=${btq.spotBasisPct?.toFixed(2)}%`,
    `curveStale=${modelBtc.curveStale}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL basis_watch_source_align.test.mjs: ${err.message}`);
  process.exit(1);
});
