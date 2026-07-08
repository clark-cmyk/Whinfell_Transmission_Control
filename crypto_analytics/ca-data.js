/**
 * CME Crypto Analytics — mock datasets and API-shaped adapters.
 * @module CAData
 */
(function cryptoAnalyticsData(global) {
  'use strict';

  const M = global.CAModels;
  if (!M) throw new Error('CAModels must load before CAData');

  const MONTH_CODES = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
  const ASSET_ROOTS = { BTC: 'BTC', ETH: 'ETH', SOL: 'SOL', XRP: 'XRP' };

  const SPOT_ANCHORS = {
    BTC: 61403.87,
    ETH: 3420.5,
    SOL: 148.25,
    XRP: 0.5124,
  };

  const FUTURE_ANCHORS = {
    BTC: 61655.0,
    ETH: 3455.0,
    SOL: 149.8,
    XRP: 0.5188,
  };

  function monthExpiry(year, month) {
    return M.formatDateISO(new Date(year, month + 1, 0));
  }

  function buildContractSymbol(asset, expiryIso) {
    const d = M.parseDate(expiryIso);
    const code = MONTH_CODES[d.getMonth()];
    const yr = String(d.getFullYear()).slice(-2);
    return `${ASSET_ROOTS[asset]}${code}${yr}`;
  }

  function generateMonthlyContracts(asset, valuationDate, count = 12) {
    const base = M.parseDate(valuationDate) || new Date();
    const spot = SPOT_ANCHORS[asset];
    const frontFuture = FUTURE_ANCHORS[asset];
    const out = [];
    for (let i = 0; i < count; i++) {
      const dt = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const expiry = monthExpiry(dt.getFullYear(), dt.getMonth());
      const dte = M.daysBetween(valuationDate, expiry);
      const slope = 1 + i * 0.0012;
      const futurePrice = frontFuture * slope;
      out.push({
        asset,
        symbol: buildContractSymbol(asset, expiry),
        expiry_date: expiry,
        maturity_month_code: MONTH_CODES[dt.getMonth()],
        future_price: Math.round(futurePrice * 100) / 100,
        dte,
      });
    }
    return out;
  }

  function spotMarkerForDate(asset, tradeDate) {
    const anchor = SPOT_ANCHORS[asset];
    const d = M.parseDate(tradeDate);
    const t0 = M.parseDate('2026-06-29');
    const days = M.daysBetween('2020-01-01', tradeDate);
    const drift = Math.sin(days / 47) * 0.008 + (d && t0 ? (d - t0) / 86400000 * 0.0003 : 0);
    let price = anchor * (1 + drift);
    if (tradeDate === '2026-06-29' && asset === 'BTC') price = 61403.87;
    return Math.round(price * 100) / 100;
  }

  function futurePriceForContract(asset, contract, tradeDate) {
    if (tradeDate === '2026-06-29' && asset === 'BTC' && contract.symbol === 'BTCN26') {
      return 61655.0;
    }
    const spot = spotMarkerForDate(asset, tradeDate);
    const dte = M.daysBetween(tradeDate, contract.expiry_date);
    const carry = 0.0515 / (365 / Math.max(dte, 1)) * 100 / 100;
    return Math.round(spot * (1 + carry) * 100) / 100;
  }

  function generateHistory(asset, startDate, endDate) {
    const start = M.parseDate(startDate);
    const end = M.parseDate(endDate);
    if (!start || !end) return [];
    const points = [];
    const cursor = new Date(start);
    const contracts = generateMonthlyContracts(asset, endDate, 24);
    while (cursor <= end) {
      const tradeDate = M.formatDateISO(cursor);
      const priced = contracts.map((c) => ({
        ...c,
        future_price: futurePriceForContract(asset, c, tradeDate),
      }));
      const spot = spotMarkerForDate(asset, tradeDate);
      let pt = M.buildBasisHistoryPoint(tradeDate, asset, priced, spot);
      if (pt && tradeDate === '2026-06-29' && asset === 'BTC') {
        pt = {
          ...pt,
          front_contract_symbol: 'BTCN26',
          expiry_date: '2026-07-31',
          dte: 29,
          future_price: 61655.0,
          spot_marker: 61403.87,
          annualized_basis_pct: M.annualizedBasisPct(61655.0, 61403.87, 29),
        };
      }
      if (pt) points.push(pt);
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() === 0 || cursor.getDay() === 6) continue;
    }
    return points.filter((p) => {
      const d = M.parseDate(p.trade_date);
      return d && d >= start && d <= end;
    });
  }

  const historyCache = {};

  function getHistory(asset, startDate, endDate) {
    const key = `${asset}|${startDate}|${endDate}`;
    if (!historyCache[key]) {
      historyCache[key] = generateHistory(asset, startDate, endDate);
    }
    return historyCache[key];
  }

  function fetchBasisHistory(asset, start, end) {
    const points = getHistory(asset, start, end);
    return Promise.resolve({
      asset,
      methodology: M.METHODOLOGY,
      points,
    });
  }

  function fetchForwardCurve(asset, date) {
    const contracts = generateMonthlyContracts(asset, date, 10).map((c) => ({
      ...c,
      future_price: futurePriceForContract(asset, c, date),
    }));
    const spot = spotMarkerForDate(asset, date);
    const points = contracts
      .map((c) => M.computeForwardCurvePoint(c, spot, date))
      .filter((p) => p.dte > 0)
      .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    return Promise.resolve({
      asset,
      valuation_date: date,
      curve_type: 'forward',
      points,
    });
  }

  function fetchSpotCurve(asset, date) {
    const contracts = generateMonthlyContracts(asset, date, 10).map((c) => ({
      ...c,
      future_price: futurePriceForContract(asset, c, date),
    }));
    const spot = spotMarkerForDate(asset, date);
    const points = contracts
      .map((c) => M.computeSpotCurvePoint(c, spot, date))
      .filter((p) => p.dte > 0)
      .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    return Promise.resolve({
      asset,
      valuation_date: date,
      curve_type: 'spot',
      points,
    });
  }

  function defaultValuationDate() {
    return '2026-06-29';
  }

  function defaultHistoryBounds() {
    return { start: '2021-06-29', end: defaultValuationDate() };
  }

  const api = {
    generateMonthlyContracts,
    spotMarkerForDate,
    getHistory,
    fetchBasisHistory,
    fetchForwardCurve,
    fetchSpotCurve,
    defaultValuationDate,
    defaultHistoryBounds,
    SPOT_ANCHORS,
    FUTURE_ANCHORS,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.CAData = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);