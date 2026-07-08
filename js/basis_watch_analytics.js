/**
 * Whinfell BasisWatch — quartile analytics for spot basis and calendar forward yields.
 * @module BasisWatchAnalytics
 */
(function (global) {
  'use strict';

  const MIN_HISTORY_N = 5;

  function toFiniteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeDate(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (!s) return null;
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  function futuresPriceFromPoint(point) {
    if (!point || typeof point !== 'object') return null;
    return toFiniteNumber(
      point.close ?? point.settle ?? point.settlement ?? point.price ?? point.last ?? point.value
    );
  }

  function cleanSortedSeries(series) {
    if (!Array.isArray(series)) return [];
    const out = [];
    series.forEach(v => {
      const n = toFiniteNumber(v);
      if (n !== null) out.push(n);
    });
    out.sort((a, b) => a - b);
    return out;
  }

  function quantileSorted(sorted, q) {
    const n = sorted.length;
    if (n === 0) return null;
    if (n === 1) return sorted[0];
    const pos = (n - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    return sorted[base];
  }

  function historyRecords(allHistory) {
    if (!allHistory) return [];
    if (Array.isArray(allHistory)) return allHistory;
    if (Array.isArray(allHistory.records)) return allHistory.records;
    if (Array.isArray(allHistory.data)) return allHistory.data;
    return [];
  }

  function findHistoryRecord(allHistory, symbol) {
    const key = String(symbol || '').trim().toUpperCase();
    if (!key) return null;
    const records = historyRecords(allHistory);
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const sym = String(rec.raw_symbol || rec.symbol || rec.contract || rec.ticker || '').toUpperCase();
      if (sym === key) return rec;
    }
    return null;
  }

  function intervalDaysFromRecord(record) {
    if (!record || typeof record !== 'object') return null;
    return toFiniteNumber(record.intervalDays ?? record.daysBetween ?? record.calendarDays ?? record.spreadDays);
  }

  function resolveIntervalDays(allHistory, nearSymbol, farSymbol, explicitDays) {
    let days = toFiniteNumber(explicitDays);
    if (days !== null && days > 0) return days;
    const pairKey = `${String(nearSymbol).trim()}|${String(farSymbol).trim()}`;
    if (allHistory && typeof allHistory === 'object' && !Array.isArray(allHistory)) {
      const pair = allHistory.pairs?.[pairKey] || allHistory.calendars?.[pairKey];
      days = intervalDaysFromRecord(pair);
      if (days !== null && days > 0) return days;
    }
    days = intervalDaysFromRecord(findHistoryRecord(allHistory, farSymbol));
    if (days !== null && days > 0) return days;
    return intervalDaysFromRecord(findHistoryRecord(allHistory, nearSymbol));
  }

  function priceMapFromHistoryRecord(historyRecord) {
    const map = {};
    if (!historyRecord || !Array.isArray(historyRecord.points)) return map;
    historyRecord.points.forEach(pt => {
      const d = normalizeDate(pt?.date || pt?.tradeDate || pt?.tradingDay || pt?.dt);
      const px = futuresPriceFromPoint(pt);
      if (d && px !== null) map[d] = px;
    });
    return map;
  }

  function intersectDates(mapA, mapB) {
    const dates = Object.keys(mapA).filter(d => mapB[d] != null);
    dates.sort();
    return dates;
  }

  function insufficientRankFields() {
    return {
      percentile: null,
      quartile: null,
      heatClass: quartileHeatClass(null),
      insufficientHistory: true,
      historyN: 0,
    };
  }

  function rankFieldsForValue(valueSeries, currentValue) {
    const series = cleanSortedSeries(valueSeries);
    const n = series.length;
    if (n < MIN_HISTORY_N || currentValue === null) {
      const base = insufficientRankFields();
      base.historyN = n;
      return base;
    }
    const pct = percentileRank(series, currentValue);
    const q = quartileFromPercentile(pct);
    return {
      percentile: pct,
      quartile: q,
      heatClass: quartileHeatClass(q),
      insufficientHistory: false,
      historyN: n,
    };
  }

  function pickExtremeByRank(items, rankField, mode) {
    if (!Array.isArray(items) || !items.length) return null;
    let best = null;
    let bestVal = null;
    items.forEach(item => {
      if (!item || item.insufficientHistory) return;
      const val = toFiniteNumber(item[rankField]);
      if (val === null) return;
      if (best === null) { best = item; bestVal = val; return; }
      if (mode === 'max' && val > bestVal) { best = item; bestVal = val; }
      else if (mode === 'min' && val < bestVal) { best = item; bestVal = val; }
    });
    return best;
  }

  function percentileRank(series, value) {
    const sorted = cleanSortedSeries(series);
    const n = sorted.length;
    const v = toFiniteNumber(value);
    if (n === 0 || v === null) return null;
    if (n === 1) return v === sorted[0] ? 50 : (v < sorted[0] ? 0 : 100);
    let below = 0;
    let equal = 0;
    sorted.forEach(x => {
      if (x < v) below += 1;
      else if (x === v) equal += 1;
    });
    return Math.min(100, Math.max(0, ((below + equal) / n) * 100));
  }

  function quartileFromPercentile(p) {
    const pct = toFiniteNumber(p);
    if (pct === null) return null;
    if (pct <= 25) return 1;
    if (pct <= 50) return 2;
    if (pct <= 75) return 3;
    return 4;
  }

  function quartileHeatClass(quartile) {
    if (quartile === 1) return 'bw-quartile--q1';
    if (quartile === 2) return 'bw-quartile--q2';
    if (quartile === 3) return 'bw-quartile--q3';
    if (quartile === 4) return 'bw-quartile--q4';
    return 'bw-quartile--na';
  }

  function computeQuartileStats(series) {
    const sorted = cleanSortedSeries(series);
    const n = sorted.length;
    if (n === 0) return { q1: null, median: null, q3: null, min: null, max: null, n: 0 };
    return {
      q1: quantileSorted(sorted, 0.25),
      median: quantileSorted(sorted, 0.5),
      q3: quantileSorted(sorted, 0.75),
      min: sorted[0],
      max: sorted[n - 1],
      n,
    };
  }

  function buildBasisPctSeriesForContract(historyRecord, spotResolver) {
    const out = [];
    if (!historyRecord || !Array.isArray(historyRecord.points) || typeof spotResolver !== 'function') return out;
    historyRecord.points.forEach(pt => {
      const date = normalizeDate(pt?.date || pt?.tradeDate || pt?.tradingDay || pt?.dt);
      const futuresPrice = futuresPriceFromPoint(pt);
      if (!date || futuresPrice === null) return;
      const spotPrice = toFiniteNumber(spotResolver(date));
      if (spotPrice === null || spotPrice === 0) return;
      out.push({
        date,
        futuresPrice,
        spotPrice,
        basisPct: ((futuresPrice - spotPrice) / spotPrice) * 100,
      });
    });
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return out;
  }

  function buildBasisPctSeriesBySymbol(allHistory, symbol, spotResolver) {
    return buildBasisPctSeriesForContract(findHistoryRecord(allHistory, symbol), spotResolver);
  }

  function buildForwardSeriesByPairKey(allHistory, nearSymbol, farSymbol, intervalDays) {
    const out = [];
    const days = resolveIntervalDays(allHistory, nearSymbol, farSymbol, intervalDays);
    if (days === null || days <= 0) return out;
    const nearMap = priceMapFromHistoryRecord(findHistoryRecord(allHistory, nearSymbol));
    const farMap = priceMapFromHistoryRecord(findHistoryRecord(allHistory, farSymbol));
    intersectDates(nearMap, farMap).forEach(date => {
      const nearPrice = nearMap[date];
      const farPrice = farMap[date];
      if (nearPrice === null || farPrice === null || nearPrice === 0) return;
      out.push({
        date,
        nearPrice,
        farPrice,
        intervalDays: days,
        forwardAnnualizedYield: ((farPrice / nearPrice) - 1) * (365 / days) * 100,
      });
    });
    return out;
  }

  function computeSpotBasisPct(futuresPrice, spotPrice) {
    const f = toFiniteNumber(futuresPrice);
    const s = toFiniteNumber(spotPrice);
    if (f === null || s === null || s === 0) return null;
    return ((f - s) / s) * 100;
  }

  function computeForwardAnnualizedYield(nearPrice, farPrice, intervalDays) {
    const near = toFiniteNumber(nearPrice);
    const far = toFiniteNumber(farPrice);
    const days = toFiniteNumber(intervalDays);
    if (near === null || far === null || days === null || near === 0 || days <= 0) return null;
    return ((far / near) - 1) * (365 / days) * 100;
  }

  function enrichContractRows(rows, historyData, spotPrice, spotResolver) {
    if (!Array.isArray(rows)) return [];
    const resolver = typeof spotResolver === 'function'
      ? spotResolver
      : () => toFiniteNumber(spotPrice);

    return rows.map(row => {
      const symbol = row.symbol || row.contract || row.ticker || '';
      const futuresPrice = toFiniteNumber(row.futuresPrice ?? row.price ?? row.last ?? row.close);
      const basisPct = row.spotBasisPct != null
        ? toFiniteNumber(row.spotBasisPct)
        : computeSpotBasisPct(futuresPrice, spotPrice);
      const historySeries = buildBasisPctSeriesBySymbol(historyData, symbol, resolver);
      const basisHistory = historySeries.map(p => p.basisPct);
      const stats = computeQuartileStats(basisHistory);
      const rank = rankFieldsForValue(basisHistory, basisPct);
      return {
        ...row,
        symbol,
        futuresPrice,
        spotBasisPct: basisPct,
        basisHistory,
        basisStats: stats,
        basisPercentile: rank.percentile,
        basisQuartile: rank.quartile,
        basisHeatClass: rank.heatClass,
        histQ1: stats.q1,
        histMedian: stats.median,
        histQ3: stats.q3,
        insufficientHistory: rank.insufficientHistory,
        historyN: rank.historyN,
      };
    });
  }

  function enrichCalendarPairs(pairs, historyData) {
    if (!Array.isArray(pairs)) return [];
    return pairs.map(pair => {
      const nearSymbol = pair.nearSymbol || pair.near || '';
      const farSymbol = pair.farSymbol || pair.far || '';
      const intervalDays = resolveIntervalDays(
        historyData,
        nearSymbol,
        farSymbol,
        pair.intervalDays ?? pair.daysBetween ?? pair.calendarDays
      );
      const nearPrice = toFiniteNumber(pair.nearPrice ?? pair.nearPx);
      const farPrice = toFiniteNumber(pair.farPrice ?? pair.farPx);
      const forwardYield = pair.forwardAnnualizedYield != null
        ? toFiniteNumber(pair.forwardAnnualizedYield)
        : computeForwardAnnualizedYield(nearPrice, farPrice, intervalDays);
      const forwardSeries = buildForwardSeriesByPairKey(historyData, nearSymbol, farSymbol, intervalDays);
      const forwardHistory = forwardSeries.map(p => p.forwardAnnualizedYield);
      const stats = computeQuartileStats(forwardHistory);
      const rank = rankFieldsForValue(forwardHistory, forwardYield);
      return {
        ...pair,
        nearSymbol,
        farSymbol,
        nearPrice,
        farPrice,
        intervalDays,
        forwardAnnualizedYield: forwardYield,
        forwardHistory,
        forwardStats: stats,
        forwardPercentile: rank.percentile,
        forwardQuartile: rank.quartile,
        forwardHeatClass: rank.heatClass,
        histForwardQ1: stats.q1,
        histForwardMedian: stats.median,
        histForwardQ3: stats.q3,
        insufficientHistory: rank.insufficientHistory,
        historyN: rank.historyN,
      };
    });
  }

  function richestTenorByBasisRank(rows) {
    return pickExtremeByRank(rows, 'basisPercentile', 'max');
  }

  function flattestCalendarByForwardRank(pairs) {
    return pickExtremeByRank(pairs, 'forwardPercentile', 'min');
  }

  function steepestCalendarByForwardRank(pairs) {
    return pickExtremeByRank(pairs, 'forwardPercentile', 'max');
  }

  const BasisWatchAnalytics = {
    MIN_HISTORY_N,
    percentileRank,
    quartileFromPercentile,
    quartileHeatClass,
    computeQuartileStats,
    buildBasisPctSeriesForContract,
    buildBasisPctSeriesBySymbol,
    buildForwardSeriesByPairKey,
    enrichContractRows,
    enrichCalendarPairs,
    richestTenorByBasisRank,
    flattestCalendarByForwardRank,
    steepestCalendarByForwardRank,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BasisWatchAnalytics;
  } else {
    global.BasisWatchAnalytics = BasisWatchAnalytics;
  }
})(typeof window !== 'undefined' ? window : globalThis);