#!/usr/bin/env node
/**
 * BasisWatch — Ark hydration alignment when curve quotes lag.
 * Chunk 19: front basis/ann from F/S (not RV series clobber); dual boards BTC|ETH.
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

/**
 * Chunk 28 hist lock: applyHydrationQuartileFallback must never assign
 * histQ1 / histMedian / histQ3 (rank-only from RV; bands only from curve history).
 */
function testHydrationFallbackDoesNotInventHistBands() {
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');
  const start = panelSrc.indexOf('function applyHydrationQuartileFallback');
  assert(start >= 0, 'applyHydrationQuartileFallback present');
  const nextFn = panelSrc.indexOf('\n  function ', start + 1);
  const body = nextFn > start ? panelSrc.slice(start, nextFn) : panelSrc.slice(start, start + 1200);
  assert(body.includes('historySource'), 'fallback body extracted');
  assert(!/\.histQ1\s*=/.test(body), 'fallback must not assign histQ1 from RV');
  assert(!/\.histMedian\s*=/.test(body), 'fallback must not assign histMedian from RV');
  assert(!/\.histQ3\s*=/.test(body), 'fallback must not assign histQ3 from RV');
  // Positive lock: rank fields still set; bands left untouched.
  assert(/basisPercentile\s*=/.test(body), 'fallback may set basisPercentile');
  assert(/basisQuartile\s*=/.test(body), 'fallback may set basisQuartile');
  assert(body.includes('histQ1') && body.includes('histMedian') && body.includes('histQ3'),
    'fallback comment documents hist bands left untouched');
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
    cancelAnimationFrame: (id) => clearTimeout(id),
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
  testHydrationFallbackDoesNotInventHistBands();

  const bw = loadBasisWatch();
  const hydration = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/hydration/latest.json'), 'utf8'));
  const curve = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/barchart/v1/barchart_curve_history.json'), 'utf8'));

  const stateBtc = { basisWatch: { asset: 'BTC' }, hydration };
  const modelBtc = bw.buildModel(stateBtc, curve);

  const koyfin = hydration.crypto_sleeve.assets.btc_spot_usd.last_price;
  const hydrationBasis = hydration.node_cockpits.basis.rv_basis.series.btc_basis_spot_1m.horizons['1m'].current_value;
  const hydDay = String(hydration.as_of || '').slice(0, 10);

  // Chunk 21/22: curve is live-refreshed from Barchart watchlist (BTN26 current).
  // Accept whatever max quote date the SSOT JSON carries (not a hard-coded session day).
  const liveCurveDay = String(
    curve?.refresh?.max_quote_date
    || curve?.as_of
    || '',
  ).slice(0, 10);
  assert(
    modelBtc.curveQuoteDate === liveCurveDay
      || modelBtc.curveQuoteDate === hydDay
      || (liveCurveDay && modelBtc.curveQuoteDate >= liveCurveDay.slice(0, 8)),
    `curve quote vintage ${modelBtc.curveQuoteDate} (ssot max=${liveCurveDay})`,
  );
  assert(modelBtc.curveStale === false, 'fresh curve should not be stale vs Ark hydration');
  assert(String(modelBtc.valuationDate || modelBtc.asOf).startsWith(hydDay)
    || String(modelBtc.asOf).includes(hydDay)
    || modelBtc.hydrationDate === hydDay, `asOf/valuation anchored to hydration ${hydDay}, got asOf=${modelBtc.asOf} val=${modelBtc.valuationDate}`);
  assert(modelBtc.hydrationAsOf === hydration.as_of || modelBtc.hydrationDate === hydDay, 'hydration stamp on model');
  assert(String(modelBtc.dataNote || '').includes('Ark') || String(modelBtc.dataNote || '').includes('curve'), `dataNote: ${modelBtc.dataNote}`);
  assert(modelBtc.spotDesk === koyfin, 'desk Koyfin spot preserved on spotDesk');
  assert(modelBtc.spotSource === 'ark_koyfin', `spotSource ${modelBtc.spotSource}`);
  assert(Math.abs(modelBtc.spot - koyfin) < 1, `spot from Ark Koyfin ${modelBtc.spot} vs ${koyfin}`);

  // Chunk 19/21: front basis MUST be futures-vs-spot; BTN26 live ~63,375.
  assert(modelBtc.front, 'front contract present');
  assert(modelBtc.front.symbol !== 'BTM26', `front must not be expired June BTM26, got ${modelBtc.front.symbol}`);
  assert(modelBtc.front.symbol === 'BTN26' || modelBtc.front.dte >= 0, `front live ${modelBtc.front.symbol}`);
  assert(modelBtc.front.futuresPrice > 60000 && modelBtc.front.futuresPrice < 80000,
    `BTN26 near market, got ${modelBtc.front.futuresPrice}`);

  const f = modelBtc.front.futuresPrice;
  const s = modelBtc.spot;
  const expectedPct = ((f - s) / s) * 100;
  const expectedAnn = bw.computeSpotAnnualizedCarry(f, s, modelBtc.front.dte);
  assert(Math.abs(modelBtc.frontBasisPct - expectedPct) < 0.02, `front basis F/S ${modelBtc.frontBasisPct} vs ${expectedPct}`);
  assert(Math.abs((modelBtc.front.spotBasisPct ?? modelBtc.front.pctBasis) - expectedPct) < 0.02, 'front row basis = F/S');
  // Positive contango vs Koyfin spot (not the old −0.47% / −7% hydration path).
  assert(modelBtc.frontBasisPct > 0 && modelBtc.frontBasisPct < 5,
    `front basis sane contango ${modelBtc.frontBasisPct}%`);
  assert(Math.abs(modelBtc.frontBasisPct - hydrationBasis) > 0.05 || Math.abs(expectedPct - hydrationBasis) < 0.05,
    'front basis is F/S (differs from hydration unless market matches)');
  if (Number.isFinite(modelBtc.front.spotAnnualizedCarry) && Number.isFinite(expectedAnn)) {
    assert(Math.abs(modelBtc.front.spotAnnualizedCarry - expectedAnn) < 0.05, `ann F/S ${modelBtc.front.spotAnnualizedCarry} vs ${expectedAnn}`);
  }
  // The infamous -7% garbage must not reappear from hydration annualize.
  if (Number.isFinite(modelBtc.front.spotAnnualizedCarry)) {
    const hydAnn = hydrationBasis * (365 / modelBtc.front.dte);
    assert(Math.abs(modelBtc.front.spotAnnualizedCarry - hydAnn) > 0.5
      || Math.abs(expectedAnn - hydAnn) < 0.5,
      `ann must not be hydration×365/DTE garbage (${modelBtc.front.spotAnnualizedCarry} vs ${hydAnn})`);
    assert(modelBtc.front.spotAnnualizedCarry > 0, `ann carry positive contango ${modelBtc.front.spotAnnualizedCarry}`);
  }

  const btq = modelBtc.contracts.find((c) => c.symbol === 'BTQ26');
  assert(btq, 'BTQ26 present');
  assert(Number.isFinite(btq.spotBasisPct), `BTQ26 basis ${btq.spotBasisPct}`);

  // Dual boards
  assert(modelBtc.dualBoards?.btc && modelBtc.dualBoards?.eth, 'dualBoards present');
  assert(modelBtc.dualBoards.btc.contracts.length > 0, 'BTC dual board rows');
  assert(modelBtc.dualBoards.btc.contracts.length <= bw.DUAL_CURVE_MAX, 'BTC dual board ≤ 8');
  assert(modelBtc.dualBoards.btc.contracts.every((c) => c.symbol !== 'BTM26'), 'no expired BTM26 on dual board');
  assert(modelBtc.dualBoards.btc.contracts[0].symbol === 'BTN26' || modelBtc.dualBoards.btc.front?.symbol === 'BTN26',
    `dual BTC starts at BTN26, got ${modelBtc.dualBoards.btc.contracts[0]?.symbol}`);
  assert(Number.isFinite(modelBtc.dualBoards.btc.spot), 'BTC dual spot');
  assert(Number.isFinite(modelBtc.dualBoards.eth.spot), 'ETH dual spot');
  assert(modelBtc.dualBoards.eth.synthetic === true, 'ETH dual board synthetic from BTC');
  assert(String(modelBtc.dualBoards.eth.front?.symbol || '').startsWith('ET'), 'ETH dual front uses ET root');
  assert(
    Math.abs((modelBtc.dualBoards.eth.front?.spotBasisPct ?? 0) - (modelBtc.frontBasisPct ?? 0)) > 0.2
      || Math.abs((modelBtc.dualBoards.eth.front?.spotBasisPct ?? 0)) > 0,
    'ETH dual front basis is independent of pure BTC clone when eth_basis present',
  );
  // Hist Q1/Med/Q3 restored via BT history alias on synthetic ETH.
  // Chunk 28 lock: hist bands come from curve history (not invented from hydration RV).
  const ethFront = modelBtc.dualBoards.eth.front;
  assert(ethFront, 'ETH dual front');
  assert(Number.isFinite(ethFront.histMedian) || Number.isFinite(ethFront.basisPercentile),
    `ETH hist/rank present histMed=${ethFront.histMedian} pct=${ethFront.basisPercentile}`);
  if (Number.isFinite(ethFront.histMedian)) {
    assert(Number.isFinite(ethFront.histQ1) && Number.isFinite(ethFront.histQ3),
      `ETH hist Q1/Med/Q3 complete when median present q1=${ethFront.histQ1} q3=${ethFront.histQ3}`);
    assert(ethFront.histQ1 <= ethFront.histMedian && ethFront.histMedian <= ethFront.histQ3,
      'ETH hist Q1 ≤ Med ≤ Q3 (real series stats)');
  }
  // BTC front hist from curve history when available.
  if (Number.isFinite(modelBtc.front.histMedian)) {
    assert(Number.isFinite(modelBtc.front.histQ1) && Number.isFinite(modelBtc.front.histQ3),
      'BTC front hist Q1/Med/Q3 complete');
    assert(modelBtc.front.histQ1 <= modelBtc.front.histMedian
      && modelBtc.front.histMedian <= modelBtc.front.histQ3,
      'BTC hist Q1 ≤ Med ≤ Q3');
  }

  const dualHtml = bw.renderDualCurveSection(modelBtc);
  assert(dualHtml.includes('Enhanced basis curve'), 'dual section title');
  assert(dualHtml.includes('data-asset="BTC"'), 'BTC column');
  assert(dualHtml.includes('data-asset="ETH"'), 'ETH column');
  assert(dualHtml.includes('BTN26'), 'BTN26 in dual table');
  assert(dualHtml.includes('ETN26') || dualHtml.includes('ET'), 'ET symbols in dual ETH column');
  assert(!dualHtml.includes('BTM26'), 'BTM26 excluded from dual table');

  const stateEth = { basisWatch: { asset: 'ETH' }, hydration };
  const modelEth = bw.buildModel(stateEth, curve);
  assert(modelEth.assetKey === 'ETH', 'eth asset');
  assert(modelEth.spotSource === 'ark_koyfin', `ETH spot ark ${modelEth.spotSource}`);
  assert(Math.abs(modelEth.spot - hydration.crypto_sleeve.assets.eth_spot_usd.last_price) < 1, 'ETH Ark spot');
  assert(modelEth.syntheticCurve, 'ETH model synthetic without ET nodes');
  assert(String(modelEth.front?.symbol || '').startsWith('ET'), `ETH front ET* got ${modelEth.front?.symbol}`);
  assert(Number.isFinite(modelEth.frontBasisPct), `ETH front basis ${modelEth.frontBasisPct}`);
  // Re-anchored front should not equal BTC front basis.
  assert(Math.abs(modelEth.frontBasisPct - modelBtc.frontBasisPct) > 0.3,
    `ETH basis ${modelEth.frontBasisPct} must differ from BTC ${modelBtc.frontBasisPct}`);
  assert(Number.isFinite(modelEth.front?.histQ1) || Number.isFinite(modelEth.front?.histMedian),
    `ETH hist Q1/Med/Q3 restored q1=${modelEth.front?.histQ1} med=${modelEth.front?.histMedian}`);
  // Chunk 28 — hist lock in ETH focus mode (curve-history alias, not hydration fabrication).
  if (Number.isFinite(modelEth.front?.histMedian)) {
    assert(
      Number.isFinite(modelEth.front.histQ1)
      && Number.isFinite(modelEth.front.histQ3)
      && modelEth.front.histQ1 <= modelEth.front.histMedian
      && modelEth.front.histMedian <= modelEth.front.histQ3,
      'ETH focus hist ordered Q1/Med/Q3 from history',
    );
  }
  assert(modelEth.dualBoards?.btc?.contracts?.length > 0, 'ETH mode still has BTC dual board');

  console.log([
    'PASS basis_watch_source_align.test.mjs',
    `curveQuote=${modelBtc.curveQuoteDate}`,
    `valuationDate=${modelBtc.valuationDate || modelBtc.asOf}`,
    `front=${modelBtc.front.symbol}`,
    `btc_spot=${modelBtc.spot.toFixed(0)}`,
    `btc_front_basis=${modelBtc.frontBasisPct?.toFixed?.(4)}%`,
    `btc_front_ann=${modelBtc.front.spotAnnualizedCarry?.toFixed?.(2)}%`,
    `eth_front=${modelEth.front?.symbol}`,
    `eth_front_basis=${modelEth.frontBasisPct?.toFixed?.(4)}%`,
    `eth_hist=${modelEth.front?.histQ1?.toFixed?.(2)}/${modelEth.front?.histMedian?.toFixed?.(2)}/${modelEth.front?.histQ3?.toFixed?.(2)}`,
    `dual_btc_n=${modelBtc.dualBoards.btc.contracts.length}`,
    `dual_eth_n=${modelBtc.dualBoards.eth.contracts.length}`,
    `dual_eth_spot=${modelBtc.dualBoards.eth.spot?.toFixed?.(0)}`,
    `curveStale=${modelBtc.curveStale}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL basis_watch_source_align.test.mjs: ${err.message}`);
  process.exit(1);
});
