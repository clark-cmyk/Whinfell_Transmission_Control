/**
 * CME Crypto Analytics — data models, roll logic, and calculation methodology.
 * @module CAModels
 */
(function cryptoAnalyticsModels(global) {
  'use strict';

  const ASSETS = ['BTC', 'ETH', 'SOL', 'XRP'];
  const ZOOM_PRESETS = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'YTD', 'All'];

  const METHODOLOGY = {
    spot_marker: '60-second TWAP from 3:59pm to 4:00pm ET',
    spot_source: 'CME_CF_Spot_Quoted_Cryptocurrency_Marker',
    front_contract_rule: 'nearest monthly contract at 4:00pm ET, rolling on the last Tuesday of the maturity month',
  };

  function toFinite(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function isDateLike(d) {
    return d && typeof d.getTime === 'function' && !Number.isNaN(d.getTime());
  }

  function parseDate(s) {
    if (!s) return null;
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    return isDateLike(d) ? d : null;
  }

  function formatDateISO(d) {
    if (!isDateLike(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateMDY(iso) {
    const d = parseDate(iso);
    if (!d) return '—';
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  function daysBetween(startIso, endIso) {
    const a = parseDate(startIso);
    const b = parseDate(endIso);
    if (!a || !b) return 0;
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  /** Last Tuesday of a calendar month (month 0-indexed). */
  function lastTuesdayOfMonth(year, month) {
    const last = new Date(year, month + 1, 0);
    while (last.getDay() !== 2) last.setDate(last.getDate() - 1);
    return last;
  }

  /** Roll after last Tuesday of the contract's maturity month. */
  function shouldRollOffContract(tradeDateIso, expiryDateIso) {
    const trade = parseDate(tradeDateIso);
    const expiry = parseDate(expiryDateIso);
    if (!trade || !expiry) return false;
    const rollDate = lastTuesdayOfMonth(expiry.getFullYear(), expiry.getMonth());
    return trade > rollDate;
  }

  function annualizedBasisPct(futurePrice, spotMarker, dte) {
    const F = toFinite(futurePrice);
    const S = toFinite(spotMarker);
    const D = toFinite(dte);
    if (F === null || S === null || S <= 0 || D === null || D <= 0) return null;
    return ((F - S) / S) * (365 / D) * 100;
  }

  function computeForwardCurvePoint(contract, spotMarker, valuationDate) {
    const dte = daysBetween(valuationDate, contract.expiry_date);
    const rate = annualizedBasisPct(contract.future_price, spotMarker, dte);
    return {
      valuation_date: valuationDate,
      asset: contract.asset,
      contract_symbol: contract.symbol,
      expiry_date: contract.expiry_date,
      dte,
      future_price: contract.future_price,
      spot_marker: spotMarker,
      annualized_rate_pct: rate,
      curve_type: 'forward',
    };
  }

  /** Distinct spot-implied rate path (separate from forward curve transform). */
  function computeSpotCurvePoint(contract, spotMarker, valuationDate) {
    const dte = daysBetween(valuationDate, contract.expiry_date);
    const rate = annualizedBasisPct(contract.future_price, spotMarker, dte);
    return {
      valuation_date: valuationDate,
      asset: contract.asset,
      contract_symbol: contract.symbol,
      expiry_date: contract.expiry_date,
      dte,
      spot_marker: spotMarker,
      annualized_rate_pct: rate,
      curve_type: 'spot',
    };
  }

  function pickFrontContract(contracts, tradeDateIso) {
    if (!contracts?.length) return null;
    const sorted = [...contracts].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    const active = sorted.filter((c) => {
      const dte = daysBetween(tradeDateIso, c.expiry_date);
      return dte > 0;
    });
    if (!active.length) return sorted[sorted.length - 1];
    let front = active[0];
    if (shouldRollOffContract(tradeDateIso, front.expiry_date) && active.length > 1) {
      front = active[1];
    }
    return front;
  }

  function buildBasisHistoryPoint(tradeDate, asset, contracts, spotMarker) {
    const front = pickFrontContract(contracts, tradeDate);
    if (!front) return null;
    const dte = daysBetween(tradeDate, front.expiry_date);
    const basis = annualizedBasisPct(front.future_price, spotMarker, dte);
    return {
      trade_date: tradeDate,
      asset,
      front_contract_symbol: front.symbol,
      expiry_date: front.expiry_date,
      dte,
      future_price: front.future_price,
      spot_marker: spotMarker,
      annualized_basis_pct: basis,
    };
  }

  function buildBasisSnapshotRow(point) {
    if (!point) return null;
    return {
      asset: point.asset,
      contract_symbol: point.front_contract_symbol || point.contract_symbol,
      expiry_date: point.expiry_date,
      dte: point.dte,
      future_price: point.future_price,
      spot_marker: point.spot_marker,
      annualized_basis_pct: point.annualized_basis_pct ?? point.annualized_rate_pct,
      valuation_date: point.trade_date || point.valuation_date,
    };
  }

  function zoomPresetRange(preset, historyEnd, historyStart) {
    const end = parseDate(historyEnd) || new Date();
    const startBound = parseDate(historyStart);
    let start = new Date(end);
    if (preset === 'YTD') {
      start = new Date(end.getFullYear(), 0, 1);
    } else if (preset === 'All') {
      start = startBound ? new Date(startBound) : new Date(end.getFullYear() - 5, end.getMonth(), end.getDate());
    } else {
      const map = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '3Y': 36, '5Y': 60 };
      const months = map[preset] || 12;
      start.setMonth(start.getMonth() - months);
    }
    if (startBound && start < startBound) start = new Date(startBound);
    return { start: formatDateISO(start), end: formatDateISO(end) };
  }

  function formatPrice(value) {
    const n = toFinite(value);
    if (n === null) return '—';
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }

  function formatPct(value, digits = 2) {
    const n = toFinite(value);
    if (n === null) return '—';
    return n.toFixed(digits) + '%';
  }

  const api = {
    ASSETS,
    ZOOM_PRESETS,
    METHODOLOGY,
    toFinite,
    parseDate,
    formatDateISO,
    formatDateMDY,
    daysBetween,
    lastTuesdayOfMonth,
    shouldRollOffContract,
    annualizedBasisPct,
    computeForwardCurvePoint,
    computeSpotCurvePoint,
    pickFrontContract,
    buildBasisHistoryPoint,
    buildBasisSnapshotRow,
    zoomPresetRange,
    formatPrice,
    formatPct,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.CAModels = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);