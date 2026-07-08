#!/usr/bin/env node
/** CME Crypto Analytics — formulas, roll logic, DOM structure, example row parity */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadModels() {
  const src = fs.readFileSync(path.join(ROOT, 'crypto_analytics/ca-models.js'), 'utf8');
  const sandbox = { module: { exports: {} }, globalThis: {} };
  sandbox.window = sandbox.globalThis;
  vm.runInNewContext(src, sandbox);
  return sandbox.module.exports;
}

function loadData(models) {
  const src = fs.readFileSync(path.join(ROOT, 'crypto_analytics/ca-data.js'), 'utf8');
  const sandbox = { module: { exports: {} }, globalThis: {} };
  sandbox.globalThis.CAModels = models;
  sandbox.window = sandbox.globalThis;
  vm.runInNewContext(src, sandbox);
  return sandbox.module.exports;
}

function runFormulaTests(M) {
  const basis = M.annualizedBasisPct(61655.0, 61403.87, 29);
  assert(basis !== null, 'basis computes');
  assert(Math.abs(basis - 5.15) < 0.02, `BTCN26 example ~5.15% got ${basis}`);

  const zeroDte = M.annualizedBasisPct(100, 100, 0);
  assert(zeroDte === null, 'zero DTE returns null');
}

function runRollTests(M) {
  const lastTue = M.lastTuesdayOfMonth(2026, 6);
  assert(lastTue.getMonth() === 6, 'July last Tuesday in July');
  assert(lastTue.getDay() === 2, 'last Tuesday is Tuesday');

  const beforeRoll = M.shouldRollOffContract('2026-06-29', '2026-07-31');
  assert(beforeRoll === false, 'June 29 before last Tuesday of July maturity — no roll');

  const afterRoll = M.shouldRollOffContract('2026-07-29', '2026-07-31');
  assert(afterRoll === true, 'after last Tuesday of maturity month triggers roll');
}

function runDistinctCurveTests(M) {
  const contract = {
    asset: 'BTC',
    symbol: 'BTCN26',
    expiry_date: '2026-07-31',
    future_price: 61655,
  };
  const spot = 61403.87;
  const date = '2026-06-29';
  const fwd = M.computeForwardCurvePoint(contract, spot, date);
  const spotC = M.computeSpotCurvePoint(contract, spot, date);
  assert(fwd.curve_type === 'forward', 'forward curve type');
  assert(spotC.curve_type === 'spot', 'spot curve type');
  assert(M.computeForwardCurvePoint !== M.computeSpotCurvePoint, 'distinct transform functions');
  assert('future_price' in fwd, 'forward point includes future_price');
  assert(!('future_price' in spotC), 'spot point omits future_price per API shape');
}

function runZoomTests(M) {
  const range = M.zoomPresetRange('1M', '2026-06-29', '2021-01-01');
  assert(range.end === '2026-06-29', '1M end date');
  const start = M.parseDate(range.start);
  const end = M.parseDate(range.end);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  assert(months >= 0 && months <= 2, `1M window ~1 month got ${months}`);
}

function runHtmlTests() {
  const html = fs.readFileSync(path.join(ROOT, 'Crypto_Analytics.html'), 'utf8');
  assert(html.includes('Crypto Analytics'), 'page title');
  assert(html.includes('id="caAsset"'), 'asset selector');
  assert(html.includes('data-ca-view="chart"'), 'chart nav');
  assert(html.includes('data-ca-view="forwardCurve"'), 'forward nav');
  assert(html.includes('data-ca-view="spotCurve"'), 'spot nav');
  assert(html.includes('BasisWatch'), 'BasisWatch group');
  assert(html.includes('Implied Rate'), 'Implied Rate group');
  assert(html.includes('Spot Marker'), 'summary spot marker column');
  assert(html.includes('Annualized Basis'), 'summary basis column');
  assert(html.includes('data-zoom="1M"'), 'zoom 1M');
  assert(html.includes('data-zoom="All"'), 'zoom All');
  assert(html.includes('ca-navigator-canvas'), 'bottom navigator');
  assert(!html.includes('ia-dig-source'), 'no console IA classes');
  assert(html.includes('crypto_analytics/ca-models.js'), 'models script');
  assert(html.includes('crypto_analytics/ca-spot-curve.js'), 'spot curve script');
  assert(html.includes('crypto_analytics/ca-forward-curve.js'), 'forward curve script');
}

async function runDataTests(D, M) {
  const hist = await D.fetchBasisHistory('BTC', '2026-06-01', '2026-06-29');
  assert(hist.methodology.spot_marker.includes('TWAP'), 'methodology metadata');
  const anchor = hist.points.find((p) => p.trade_date === '2026-06-29');
  assert(anchor, 'anchor trade date present');
  assert(anchor.front_contract_symbol === 'BTCN26', 'front contract BTCN26');
  assert(anchor.dte === 29, 'anchor DTE 29');
  assert(Math.abs(anchor.annualized_basis_pct - 5.15) < 0.02, 'anchor basis ~5.15%');

  const fwd = await D.fetchForwardCurve('BTC', '2026-06-29');
  assert(fwd.curve_type === 'forward', 'forward API curve_type');
  assert(fwd.points.length >= 3, 'forward curve has points');

  const spot = await D.fetchSpotCurve('BTC', '2026-06-29');
  assert(spot.curve_type === 'spot', 'spot API curve_type');
  assert(spot.points.length >= 3, 'spot curve has points');

  for (const asset of ['ETH', 'SOL', 'XRP']) {
    const h = await D.fetchBasisHistory(asset, '2026-06-01', '2026-06-29');
    assert(h.asset === asset, `${asset} history`);
  }
}

async function run() {
  const M = loadModels();
  const D = loadData(M);
  runFormulaTests(M);
  runRollTests(M);
  runDistinctCurveTests(M);
  runZoomTests(M);
  runHtmlTests();
  await runDataTests(D, M);
  console.log('PASS crypto_analytics.test.mjs');
}

run().catch((err) => {
  console.error(`FAIL crypto_analytics.test.mjs: ${err.message}`);
  process.exit(1);
});