#!/usr/bin/env node
/** BasisWatch — annualization floor, ETH synthesis, decomposition consistency */
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
  assert(bw.MIN_ANN_DTE === 7, 'MIN_ANN_DTE');

  const short = bw.computeSpotAnnualizedCarry(102000, 100000, 1);
  assert(short === null, 'suppress annualization below 7d DTE');

  const ann = bw.computeSpotAnnualizedCarry(102000, 100000, 30);
  const expected = ((102000 / 100000) - 1) * (365 / 30) * 100;
  assert(Math.abs(ann - expected) < 0.01, `ann carry ${ann} vs ${expected}`);

  const btcSpot = 100000;
  const ethSpot = 3500;
  const stateBtc = {
    basisWatch: { asset: 'BTC', view: 'basis' },
    hydration: {
      as_of: '2026-06-01T12:00:00Z',
      crypto_sleeve: { assets: { btc_spot_usd: { last_price: btcSpot }, eth_spot_usd: { last_price: ethSpot } } },
    },
  };
  const stateEth = {
    basisWatch: { asset: 'ETH', view: 'basis' },
    hydration: stateBtc.hydration,
  };
  const curve = {
    records: [
      { raw_symbol: 'BTM26', latest: { close: 102000 }, contract_meta: { contract_root: 'BT' } },
      { raw_symbol: 'BTU26', latest: { close: 104000 }, contract_meta: { contract_root: 'BT' } },
    ],
  };

  const modelBtc = bw.buildModel(stateBtc, curve);
  const modelEth = bw.buildModel(stateEth, curve);
  assert(modelBtc.spot === btcSpot, 'BTC spot');
  assert(modelEth.spot === ethSpot, 'ETH spot');
  assert(modelEth.syntheticCurve, 'ETH synthetic flag');
  assert(modelBtc.contracts[0].futuresPrice !== modelEth.contracts[0].futuresPrice, 'ETH futures $ differs');
  assert(modelBtc.contracts[0].absBasis !== modelEth.contracts[0].absBasis, 'ETH basis $ differs');
  assert(
    Math.abs(modelBtc.contracts[0].spotBasisPct - modelEth.contracts[0].spotBasisPct) < 0.001,
    'synthetic ETH basis % tracks BTC shape',
  );

  console.log([
    'PASS basis_watch_math.test.mjs',
    `MIN_ANN_DTE=${bw.MIN_ANN_DTE}`,
    `btc_spot=${modelBtc.spot}`,
    `eth_spot=${modelEth.spot}`,
    `btc_basis_pct=${modelBtc.contracts[0].spotBasisPct?.toFixed(2)}`,
    `eth_futures=${modelEth.contracts[0].futuresPrice}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL basis_watch_math.test.mjs: ${err.message}`);
  process.exit(1);
});