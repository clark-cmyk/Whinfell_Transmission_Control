/**
 * WTM BasisWatch + Implied Rate
 * Embedded panel (Transmission Control) · Standalone page (Whinfell_BasisWatch.html)
 *
 * ── Formula reference (CME-style separation) ──
 *
 * Spot curve (futures vs spot, per contract tenor):
 *   absBasis_i           = F_i - S
 *   spotBasisPct_i       = (F_i - S) / S × 100
 *   spotAnnualizedCarry_i = ((F_i / S) - 1) × (365 / dte_i) × 100
 *
 * Forward curve (adjacent calendar pairs only):
 *   calendarSpread_i     = F_{i+1} - F_i
 *   intervalDays_i       = dte_{i+1} - dte_i  (≈ days between expiries)
 *   forwardAnnualizedYield_i = ((F_{i+1} / F_i) - 1) × (365 / intervalDays_i) × 100
 *
 * Basis Watch view  → spot curve only (no forward mixing).
 * Implied Rate view → spot curve table + forward curve table.
 */
(function basisWatchPanel(global) {
  'use strict';

  /**
   * Chunk 17 — standalone loads via WTM_Ark; valuation anchors to Ark hydration
   * when curve quote dates lag (stale Barchart nodes).
   */
  const BW_BUILD = '3.9-BASISWATCH-ARK-ETH-ASSET-SPLIT-2026-07-09';
  const THEME_COLORS = { dark: '#090d12', light: '#eef1f5' };
  const PREFS_KEY = 'whinfell_basiswatch_prefs';
  const THEME_KEY = 'whinfell_tc_theme';
  /** Documented paths — raw loads owned by WTM_Ark only (no direct fetch here). */
  const HYDRATION_URL = 'data/hydration/latest.json';
  const CURVE_URL = 'data/barchart/v1/barchart_curve_history.json';
  /** CME-style floor — do not annualize ultra-short DTE (avoids 500%+ noise on 1d front). */
  const MIN_ANN_DTE = 7;
  /** Chunk 19 — dual BTC|ETH curve board depth (active tenors only). */
  const DUAL_CURVE_MAX = 8;
  /** Heuristic: AE dollar spreads mis-stored as unit=pct when |v| is large vs spot. */
  const HYDRATION_BASIS_DOLLAR_ABS = 5;

  /** Clark desk shortcuts — saved Barchart watchlist + Koyfin MYD */
  const DESK_LINKS = {
    barchart: 'https://www.barchart.com/my/watchlist?viewName=197689',
    koyfin: 'https://app.koyfin.com/myd/55782528-369d-4f09-a6fb-4b1d041a6656',
  };

  const CME_MONTH = { F: 0, G: 1, H: 2, J: 3, K: 4, M: 5, N: 6, Q: 7, U: 8, V: 9, X: 10, Z: 11 };
  const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** Barchart CME roots: BT = Bitcoin, ET = Ether (not "ETH"). */
  const ASSETS = {
    BTC: { root: 'BT', roots: ['BT'], spotKey: 'btc_spot_usd', label: 'Bitcoin' },
    ETH: { root: 'ET', roots: ['ET', 'ETH'], spotKey: 'eth_spot_usd', label: 'Ethereum' },
  };

  const CROSS_ASSET_ROOTS = [
    { root: 'DX', label: 'US Dollar (DX)', role: 'FX bridge' },
    { root: 'HG', label: 'Copper (HG)', role: 'Industrial' },
    { root: 'ZM', label: 'Soybean Meal (ZM)', role: 'Ag complex' },
    { root: 'TA', label: 'Iron Ore (TA)', role: 'China industrial' },
  ];

  const CROSS_PEERS = [
    ...CROSS_ASSET_ROOTS,
    { root: 'HYG_LQD', label: 'HYG/LQD', role: 'Credit beta', kind: 'credit' },
    { root: 'USDCNH', label: 'USDCNH', role: 'China FX', kind: 'fx' },
  ];

  const TOOLTIP_CONTENT = {
    basisPct: 'Basis % vs spot: (Futures − Spot) ÷ Spot × 100. The cleanest cross-tenor and cross-asset anchor. Higher = richer futures vs spot. Not annualized.',
    annBasis: 'Spot Curve % (ann.): Basis % × (365 ÷ DTE). CME BasisWatch-style carry if held to expiry. Short DTE can inflate annualized readings.',
    forwardCurve: 'Forward Curve % (ann.): ((F_far ÷ F_near) − 1) × (365 ÷ interval days). Marginal roll yield between adjacent expiries — not spot carry.',
    quartileRank: 'Quartile rank vs history: Q1 = cheap (bottom quartile), Q4 = rich (top quartile). Distinguishes extreme readings from merely positive values.',
    crossAssetContext: 'Compares BTC basis to TradFi carry-sensitive bridges (DX, HG, ZM, TA, HYG/LQD, USDCNH). Directional context — not exact arbitrage equivalence.',
    crossAssetMetric: 'Peer carry or spread proxy. Δ vs BTC is the signed gap vs BTC front ann. basis where comparable. Use for relative richness, not precision.',
  };

  const A = () => global.BasisWatchAnalytics;

  let curveCache = null;
  let curveFetchPromise = null;
  let standaloneState = null;
  let stateGetter = null;
  let _refreshGen = 0;
  let _refreshLoop = null;
  let _pendingRefresh = null;
  const isStandalone = () => document.body?.dataset?.bwLayout === 'standalone';

  function getState() {
    if (typeof stateGetter === 'function') {
      const s = stateGetter();
      if (s && typeof s === 'object') return s;
    }
    if (isStandalone() && standaloneState) return standaloneState;
    return global.appState || {};
  }

  function mergeHydrationBundle(state, bundle) {
    if (!state || !bundle) {
      return { ok: false, as_of: null, snapshot_id: null, freshness_status: null };
    }
    state.hydration = {
      ...state.hydration,
      crypto_sleeve: bundle.crypto_sleeve,
      global: bundle.global,
      execution: bundle.execution,
      as_of: bundle.as_of,
      snapshot_id: bundle.snapshot_id,
      freshness_status: bundle.freshness_status,
      node_cockpits: bundle.node_cockpits,
      task_force: bundle.task_force,
      task_force_panels: bundle.task_force_panels
        || global.WTM_TaskForceFeed?.extractTaskForcePanels?.(bundle.task_force),
      rv_history: bundle.rv_history,
    };
    state.provenance = {
      ...state.provenance,
      dataAsOf: bundle.as_of,
      snapshotId: bundle.snapshot_id || state.provenance?.snapshotId || null,
      freshnessStatus: bundle.freshness_status || state.provenance?.freshnessStatus || null,
      hydratedAt: new Date().toISOString(),
    };
    return {
      ok: true,
      as_of: bundle.as_of || null,
      snapshot_id: bundle.snapshot_id || null,
      freshness_status: bundle.freshness_status || null,
    };
  }

  function yieldToMain() {
    if (typeof global.WTM_yieldToMain === 'function') return global.WTM_yieldToMain();
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => setTimeout(resolve, 0));
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  function el(id) { return document.getElementById(id); }

  /** Local desk stamp: "2026-07-09 23:45 CDT" */
  function formatLocalStamp(value, fallback) {
    if (typeof global.WTM_formatLocalStamp === 'function') {
      return global.WTM_formatLocalStamp(value, { fallback: fallback != null ? fallback : '—' });
    }
    if (value == null || value === '') return fallback != null ? fallback : '—';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
    } catch (_) {
      return String(value);
    }
  }

  function unavailSpan(kind = 'awaiting') {
    return kind === 'na'
      ? '<span class="bw-unavail bw-unavail--na">N/A</span>'
      : '<span class="bw-unavail bw-unavail--awaiting">Awaiting</span>';
  }

  function fmtNum(n, d = 2) {
    if (n == null || !Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function fmtNumDisplay(n, d = 2, kind = 'awaiting') {
    if (n == null || !Number.isFinite(n)) return unavailSpan(kind);
    return fmtNum(n, d);
  }

  function fmtPct(n, d = 2) {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${fmtNum(n, d)}%`;
  }

  function fmtPctDisplay(n, d = 2, kind = 'awaiting') {
    if (n == null || !Number.isFinite(n)) return unavailSpan(kind);
    return fmtPct(n, d);
  }

  function renderBasisNullState() {
    return `<div class="bw-null-card" role="status">
      <p class="bw-null-card__title">No futures curve loaded</p>
      <p class="bw-null-card__detail">Curve data publishes after the daily hydration chain completes and Barchart desk preview is available.</p>
      <button type="button" class="bw-btn bw-btn--primary bw-null-card__action" data-bw-null-action="refresh">Refresh curve</button>
    </div>`;
  }

  function parseCmeSymbol(sym) {
    const m = String(sym || '').match(/^([A-Z0-9!]+)([FGHJKMNQUVXZ])(\d{2})$/);
    if (!m) return null;
    const month = CME_MONTH[m[2]];
    if (month == null) return null;
    const year = 2000 + parseInt(m[3], 10);
    return { root: m[1], monthCode: m[2], month, year, expiry: lastFridayOfMonth(year, month), label: `${MONTH_LABEL[month]} ${year}` };
  }

  function lastFridayOfMonth(year, month) {
    const d = new Date(Date.UTC(year, month + 1, 0));
    while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }

  function daysBetween(a, b) { return Math.max(0, Math.round((b - a) / 86400000)); }
  function daysToExpiry(expiry, asOf = new Date()) { return daysBetween(asOf, expiry); }

  function computeSpotAnnualizedCarry(futuresPrice, spot, dte) {
    const f = Number(futuresPrice);
    const s = Number(spot);
    const d = Number(dte);
    if (!Number.isFinite(f) || !Number.isFinite(s) || s <= 0 || !Number.isFinite(d) || d < MIN_ANN_DTE) {
      return null;
    }
    return ((f / s) - 1) * (365 / d) * 100;
  }

  function heatClass(ann) {
    if (!Number.isFinite(ann)) return 'bw-heat--na';
    if (ann >= 12) return 'bw-heat--hot';
    if (ann >= 6) return 'bw-heat--warm';
    if (ann >= 0) return 'bw-heat--flat';
    return 'bw-heat--cold';
  }

  function quartileRichnessLabel(q) {
    if (q === 1) return 'Cheap';
    if (q === 2) return 'Fair';
    if (q === 3) return 'Warm';
    if (q === 4) return 'Rich';
    return '—';
  }

  function fmtPercentile(p) {
    if (!Number.isFinite(p)) return '—';
    return `${Math.round(p)}th pct`;
  }

  function quartileBadge(q, label) {
    const cls = A()?.quartileHeatClass(q) || 'bw-quartile--na';
    const text = Number.isFinite(q)
      ? (label ? `Q${q} · ${label}` : `Q${q}`)
      : unavailSpan('na');
    return `<span class="bw-quartile ${cls}">${text}</span>`;
  }

  function interpretationFromPercentile(p, kind = 'basis') {
    if (!Number.isFinite(p)) return 'Insufficient history for quartile context.';
    if (p >= 75) {
      return kind === 'forward'
        ? 'Front-end roll is historically steep.'
        : 'This basis is rich relative to its own history.';
    }
    if (p >= 25) {
      return kind === 'forward'
        ? 'Roll slope is within normal range.'
        : 'This basis is near its historical middle range.';
    }
    return kind === 'forward'
      ? 'Roll slope is historically flat.'
      : 'This basis is cheap relative to its own history.';
  }

  function rvHorizon(hydration, nodeKey, seriesId, horizon = '3m') {
    const series = hydration?.node_cockpits?.[nodeKey]?.rv_basis?.series?.[seriesId];
    return series?.horizons?.[horizon] || null;
  }

  function basisSpotSeriesId(assetKey) {
    return assetKey === 'ETH' ? 'eth_basis_spot_1m' : 'btc_basis_spot_1m';
  }

  function basisRankSeriesId(assetKey) {
    return assetKey === 'ETH' ? 'eth_basis_spot_1m' : 'btc_basis_vs_refs';
  }

  function calendarRankSeriesId(assetKey) {
    return assetKey === 'ETH' ? 'eth_calendar_et_near_deferred' : 'btc_calendar_bt_near_deferred';
  }

  function hydrationBasisSpot(hydration, assetKey, horizon = '1m') {
    return rvHorizon(hydration, 'basis', basisSpotSeriesId(assetKey), horizon);
  }

  /**
   * Convert hydration basis current_value to true % of spot.
   * Barchart AE spreads are dollars; when ref price was missing they land as raw
   * dollar levels (e.g. -18) with unit=pct. Detect and convert with spot.
   */
  function normalizeHydrationBasisPct(raw, spot) {
    const v = Number(raw);
    if (!Number.isFinite(v)) return null;
    const s = Number(spot);
    if (Number.isFinite(s) && s > 50 && Math.abs(v) > HYDRATION_BASIS_DOLLAR_ABS) {
      return (v / s) * 100;
    }
    return v;
  }

  function btcCounterpartSymbol(symbol) {
    const s = String(symbol || '').toUpperCase();
    if (s.startsWith('ETH') && s.length >= 5) return `BT${s.slice(3)}`;
    if (s.startsWith('ET') && !s.startsWith('ETH') && s.length >= 4) return `BT${s.slice(2)}`;
    return s;
  }

  function parseQuoteDate(raw) {
    const s = String(raw || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }

  function quoteDateGapDays(a, b) {
    if (!a || !b) return null;
    const da = Date.parse(`${a}T12:00:00Z`);
    const db = Date.parse(`${b}T12:00:00Z`);
    if (!Number.isFinite(da) || !Number.isFinite(db)) return null;
    return Math.round(Math.abs(db - da) / 86400000);
  }

  function maxRootQuoteDate(records, rootOrRoots) {
    let max = '';
    recordsForRoot(records, rootOrRoots).forEach((r) => {
      const d = parseQuoteDate(r.latest?.date);
      if (d && d >= max) max = d;
    });
    return max || null;
  }

  function impliedSpotFromBasis(futuresPrice, basisPct) {
    const f = Number(futuresPrice);
    const b = Number(basisPct);
    if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(b)) return null;
    return f / (1 + b / 100);
  }

  /**
   * Nearest live futures node under asOf (skip expired). Prefer dte >= MIN_ANN_DTE.
   * Implied spot must use the same front the panel displays (never a hardcoded expired month).
   */
  function pickNearestLiveFuture(records, rootOrRoots, asOfDate) {
    const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate || Date.now());
    const asOfMs = asOf.getTime();
    const live = [];
    recordsForRoot(records, rootOrRoots).forEach((r) => {
      const parsed = parseCmeSymbol(r.raw_symbol);
      if (!parsed) return;
      const futuresPrice = Number(r.latest?.close ?? r.points?.[r.points.length - 1]?.close);
      if (!Number.isFinite(futuresPrice) || futuresPrice <= 0) return;
      const rawDays = Math.round((parsed.expiry.getTime() - asOfMs) / 86400000);
      if (rawDays < 0) return;
      const dte = Math.max(0, rawDays);
      live.push({
        rec: r,
        symbol: r.raw_symbol,
        parsed,
        dte,
        futuresPrice,
        quoteDate: parseQuoteDate(r.latest?.date),
      });
    });
    live.sort((a, b) => a.dte - b.dte || String(a.symbol).localeCompare(String(b.symbol)));
    return live.find((x) => x.dte >= MIN_ANN_DTE) || live[0] || null;
  }

  /** Annualized carry from basis % + DTE (consistent with F/S when front is hydration-aligned). */
  function annualizeBasisPct(basisPct, dte) {
    const b = Number(basisPct);
    const d = Number(dte);
    if (!Number.isFinite(b) || !Number.isFinite(d) || d < MIN_ANN_DTE) return null;
    return b * (365 / d);
  }

  function resolveBasisValuation(state, curveData, assetKey) {
    const records = curveData?.records || [];
    // Prefer panel state hydration; fall back to live Ark cache (console boot lag).
    const arkHyd = (typeof getArk === 'function' ? getArk()?.getHydration?.() : null)
      || global.WTM_Ark?.getHydration?.()
      || null;
    const hyd = state.hydration || arkHyd || {};
    const sleeve = hyd.crypto_sleeve?.assets || arkHyd?.crypto_sleeve?.assets || {};
    const asset = ASSETS[assetKey] || ASSETS.BTC;

    // Curve vintage = max node quote date (may lag Ark hydration).
    const curveQuoteDate = maxRootQuoteDate(records, 'BT')
      || maxRootQuoteDate(records, asset.root)
      || parseQuoteDate(curveData?.as_of);
    // Ark SSOT stamp for current desk read.
    const hydrationDate = parseQuoteDate(hyd.as_of)
      || parseQuoteDate(hyd.crypto_sleeve?.as_of)
      || parseQuoteDate(state.provenance?.dataAsOf)
      || parseQuoteDate(arkHyd?.as_of);
    const gap = quoteDateGapDays(curveQuoteDate, hydrationDate);
    const aligned = gap == null || gap <= 1;

    // When curve quotes lag hydration, DTE/ann math uses Ark hydration as_of.
    const valuationDateStr = (!aligned && hydrationDate)
      ? hydrationDate
      : (curveQuoteDate || hydrationDate);
    const asOfDate = valuationDateStr
      ? new Date(`${valuationDateStr}T12:00:00Z`)
      : new Date();

    const koyfinSpot = Number(sleeve[asset.spotKey]?.last_price);
    const basisH = hydrationBasisSpot(hyd, assetKey, '1m')
      || hydrationBasisSpot(arkHyd, assetKey, '1m');

    // Live futures root for this asset (ET when present; BTC never uses ETH).
    const assetRoots = asset.roots || [asset.root];
    const refLive = pickNearestLiveFuture(records, assetRoots, asOfDate)
      || (assetKey === 'ETH' ? pickNearestLiveFuture(records, 'BT', asOfDate) : null);
    const refFuture = refLive ? refLive.futuresPrice : null;
    const refQuoteDate = refLive?.quoteDate || null;
    const refFutureSymbol = refLive?.symbol || null;

    // Chunk 18/19: primary displayed spot = Ark hydration Koyfin (crypto_sleeve) when present.
    // Front basis % = (F−S)/S from curve futures × Ark spot (not RV series clobber).
    let spotForBasis = null;
    let spotSource = 'unavailable';
    let impliedSpot = null;

    if (assetKey === 'ETH') {
      const ethKoyfin = Number(sleeve.eth_spot_usd?.last_price
        || arkHyd?.crypto_sleeve?.assets?.eth_spot_usd?.last_price);
      if (Number.isFinite(ethKoyfin) && ethKoyfin > 0) {
        spotForBasis = ethKoyfin;
        spotSource = 'ark_koyfin';
      }
    } else if (Number.isFinite(koyfinSpot) && koyfinSpot > 0) {
      spotForBasis = koyfinSpot;
      spotSource = 'ark_koyfin';
    }

    const basisPct = normalizeHydrationBasisPct(basisH?.current_value, spotForBasis || koyfinSpot);

    if (assetKey === 'BTC' && Number.isFinite(refFuture) && Number.isFinite(basisPct)) {
      impliedSpot = impliedSpotFromBasis(refFuture, basisPct);
    }

    if (assetKey === 'ETH') {
      if (Number.isFinite(refFuture) && Number.isFinite(basisPct)
        && String(refFutureSymbol || '').toUpperCase().startsWith('ET')) {
        impliedSpot = impliedSpotFromBasis(refFuture, basisPct);
      }
      if (!(Number.isFinite(spotForBasis) && spotForBasis > 0)
        && Number.isFinite(impliedSpot) && impliedSpot > 0) {
        spotForBasis = impliedSpot;
        spotSource = 'ark_eth_basis_implied';
      }
    } else if (!(Number.isFinite(spotForBasis) && spotForBasis > 0)
      && Number.isFinite(impliedSpot) && impliedSpot > 0) {
      spotForBasis = impliedSpot;
      spotSource = 'ark_basis_implied';
    }

    let dataNote = '';
    const hydLabel = hydrationDate ? formatLocalStamp(hydrationDate) : '';
    const curveLabel = curveQuoteDate ? formatLocalStamp(curveQuoteDate) : '';
    if (curveQuoteDate && hydrationDate && gap != null && gap > 1) {
      dataNote = `Ark hydration ${hydLabel} · curve quotes ${curveLabel} (${gap}d lag) · front ${refFutureSymbol || '—'} · basis ${basisSpotSeriesId(assetKey)}`;
    } else if (curveQuoteDate && hydrationDate) {
      dataNote = `Ark hydration ${hydLabel} · curve ${curveLabel} · front ${refFutureSymbol || '—'} · ${spotSource}`;
    } else if (hydrationDate) {
      dataNote = `Ark hydration ${hydLabel} · futures curve pending`;
    } else if (curveQuoteDate) {
      dataNote = `Curve quotes ${curveLabel} · ${spotSource}`;
    }

    return {
      curveQuoteDate,
      hydrationDate,
      valuationDate: valuationDateStr || null,
      gap,
      asOfDate,
      spotForBasis,
      spotSource,
      koyfinSpot: Number.isFinite(koyfinSpot) ? koyfinSpot : null,
      hydrationBasisPct: Number.isFinite(basisPct) ? basisPct : null,
      basisHorizon: basisH,
      refFutureSymbol,
      refQuoteDate,
      refFuture,
      dataNote,
      aligned,
      curveStale: !aligned && !!curveQuoteDate && !!hydrationDate,
    };
  }

  /**
   * Chunk 19 — attach Ark RV series as metadata only.
   * Front basis/ann MUST stay futures-vs-spot: (F−S)/S and ((F/S)−1)×(365/DTE).
   * Never clobber with btc_basis_spot_1m (that produced the −7% garbage path).
   */
  function applyHydrationFrontBasis(contracts, front, valuation) {
    if (!front || !contracts?.length) return front;
    const basisPct = Number(valuation?.hydrationBasisPct);
    contracts.forEach((c) => {
      if (c.symbol !== front.symbol) return;
      if (Number.isFinite(basisPct)) c.hydrationBasisPct = basisPct;
      c.basisSource = 'futures_vs_spot';
    });
    return contracts.find((c) => c.symbol === front.symbol) || front;
  }

  function applyHydrationQuartileFallback(contracts, front, hydration, assetKey) {
    if (!front || !hydration) return;
    const seriesId = basisRankSeriesId(assetKey || 'BTC');
    const h = rvHorizon(hydration, 'basis', seriesId)
      || (assetKey === 'ETH' ? null : rvHorizon(hydration, 'basis', 'btc_basis_vs_refs'));
    if (!h || !Number.isFinite(h.percentile)) return;
    contracts.forEach(c => {
      if (c.symbol !== front.symbol || !c.insufficientHistory) return;
      c.basisPercentile = h.percentile;
      c.basisQuartile = h.quartile;
      c.basisHeatClass = A()?.quartileHeatClass(h.quartile) || 'bw-quartile--na';
      c.insufficientHistory = false;
      c.historySource = 'hydration_rv';
      c.historyN = h.n_observations || null;
    });
  }

  function applyHydrationForwardFallback(pairs, frontPair, hydration, assetKey) {
    if (!pairs.length || !hydration) return;
    const h = rvHorizon(hydration, 'basis', calendarRankSeriesId(assetKey || 'BTC'));
    if (!h || !Number.isFinite(h.percentile)) return;
    const target = frontPair || pairs[0];
    pairs.forEach(p => {
      if (p.nearSymbol !== target.nearSymbol || p.farSymbol !== target.farSymbol || !p.insufficientHistory) return;
      p.forwardPercentile = h.percentile;
      p.forwardQuartile = h.quartile;
      p.forwardHeatClass = A()?.quartileHeatClass(h.quartile) || 'bw-quartile--na';
      p.insufficientHistory = false;
      p.historySource = 'hydration_rv';
      p.historyN = h.n_observations || null;
    });
  }

  function peerMetricFromRecords(records, spec) {
    if (spec.kind === 'credit') {
      const h = rvHorizon(global._bwHydrationRef, 'credit', 'hy_oas_proxy');
      if (h) {
        return {
          metric: `${fmtNum(h.current_value, 1)} bps`,
          chg: null,
          percentile: h.percentile,
          quartile: h.quartile,
          interpretation: interpretationFromPercentile(h.percentile),
          rowClass: 'bw-xasset-row--credit',
        };
      }
    }
    const recs = recordsForRoot(records, spec.root);
    const latest = recs.map(r => r.latest).filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    const pctChg = Number(latest?.pct_change);
    const price = Number(latest?.close);
    const points = recs[0]?.points || [];
    const chgSeries = points.map(p => Number(p.pct_change)).filter(Number.isFinite);
    const rank = A() ? A().percentileRank(chgSeries, pctChg) : null;
    const q = A() ? A().quartileFromPercentile(rank) : null;
    return {
      metric: Number.isFinite(pctChg) ? `${fmtPct(pctChg)} 1d` : (Number.isFinite(price) ? fmtNum(price, price < 10 ? 4 : 2) : '—'),
      chg: pctChg,
      percentile: rank,
      quartile: q,
      interpretation: interpretationFromPercentile(rank),
      rowClass: spec.kind === 'fx' ? 'bw-xasset-row--fx' : '',
    };
  }

  function buildCrossAssetInterpretation(model) {
    const front = model.front;
    const ann = front?.spotAnnualizedCarry;
    const fq = front?.basisQuartile;
    const fl = quartileRichnessLabel(fq);
    const credit = model.crossPeers?.find(p => p.root === 'HYG_LQD');
    const cheapPeers = (model.crossPeers || []).filter(p => p.quartile === 1).map(p => p.label.split(' ')[0]);
    const richPeers = (model.crossPeers || []).filter(p => p.quartile === 4).map(p => p.label.split(' ')[0]);
    let text = `${model.assetKey} front basis screens `;
    text += Number.isFinite(fq)
      ? `<strong>${fl.toLowerCase()} (Q${fq}${Number.isFinite(front.basisPercentile) ? ', ' + fmtPercentile(front.basisPercentile) : ''})</strong>`
      : '<strong>without quartile context</strong>';
    if (Number.isFinite(ann)) text += ` at <strong>${fmtPct(ann)} ann.</strong>`;
    if (credit?.quartile === 4) text += '; credit beta via HYG/LQD is <strong>rich (Q4)</strong>';
    if (cheapPeers.length) text += `; ${cheapPeers.join(', ')} screen <strong>cheap vs history</strong>`;
    if (richPeers.length) text += `; ${richPeers.join(', ')} screen <strong>rich vs history</strong>`;
    text += '.';
    return {
      guidance: text,
      support: 'Use for relative carry context — not prop size-up without gate confirmation.',
    };
  }

  function shapeBadgeClass(shape) {
    if (shape === 'Contango') return 'bw-shape-badge--contango';
    if (shape === 'Backwardation') return 'bw-shape-badge--backwardation';
    return 'bw-shape-badge--flat';
  }

  function curveShapeLabel(contracts) {
    if (!contracts.length) return '—';
    const front = contracts.slice(0, Math.min(3, contracts.length));
    const avg = front.reduce((s, c) => s + (c.annBasis || 0), 0) / front.length;
    if (avg >= 4) return 'Contango';
    if (avg <= -2) return 'Backwardation';
    return 'Flat';
  }

  function getChartTheme() {
    const s = getComputedStyle(document.documentElement);
    const v = name => s.getPropertyValue(name).trim() || undefined;
    return {
      grid: v('--bw-chart-grid') || 'rgba(255,255,255,0.07)',
      axis: v('--bw-chart-axis') || '#8b9aab',
      spotLine: v('--bw-chart-spot-line') || 'rgba(94,179,255,0.55)',
      spotLabel: v('--bw-chart-spot-label') || '#9ec5f0',
      curve: v('--bw-chart-curve') || '#e07b39',
      front: v('--bw-chart-front') || '#3d8bfd',
      node: v('--bw-chart-node') || '#c5d0dc',
      muted: v('--bw-muted') || '#8b9aab',
      empty: v('--bw-muted') || '#8b9aab',
    };
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (document.documentElement?.setAttribute) {
      document.documentElement.setAttribute('data-theme', next);
    }
    const btn = el('btnBwTheme');
    if (btn) {
      const label = btn.querySelector('.bw-theme-label');
      if (label) label.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
      else btn.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
      btn.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
      btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
    const themeColor = el('bwThemeColor');
    if (themeColor) themeColor.setAttribute('content', THEME_COLORS[next] || THEME_COLORS.dark);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  }

  function initTheme() {
    const params = new URLSearchParams(location.search);
    let theme = params.get('theme');
    if (!theme) {
      try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch { theme = 'dark'; }
    }
    applyTheme(theme);
  }

  function popOutUrl(state) {
    const bw = state?.basisWatch || loadPrefs();
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const base = isStandalone()
      ? location.href.split('?')[0]
      : (location.protocol === 'file:'
        ? new URL('Whinfell_BasisWatch.html', location.href).href
        : new URL('Whinfell_BasisWatch.html', location.origin + location.pathname.replace(/\/[^/]*$/, '/')).href);
    const q = new URLSearchParams({
      asset: bw.asset || 'BTC',
      view: bw.view || 'basis',
      theme,
    });
    return `${base}?${q.toString()}`;
  }

  /** When true, next ensureCurveHistory forces Ark re-fetch (set by invalidateCurveCache). */
  let forceNextCurveLoad = false;

  function getArk() {
    return global.WTM_Ark || null;
  }

  function invalidateCurveCache() {
    curveCache = null;
    curveFetchPromise = null;
    forceNextCurveLoad = true;
    // Chunk 23: also drop Ark curve cache so ensureCurveHistory cannot reuse a warm stale vintage.
    try {
      if (typeof getArk()?.invalidateCurveHistory === 'function') {
        getArk().invalidateCurveHistory();
      } else if (typeof global.WTM_Ark?.invalidateCurveHistory === 'function') {
        global.WTM_Ark.invalidateCurveHistory();
      }
    } catch (_) { /* ignore */ }
  }

  async function reloadHydration(state) {
    const target = state || getState();
    if (location.protocol === 'file:') {
      return { ok: false, as_of: null, snapshot_id: null, freshness_status: null };
    }
    // Force re-load through Ark so desk refresh stays current (Ark may already be warm).
    const bundle = await loadHydrationBundle({ force: true });
    if (!bundle) {
      return { ok: false, as_of: null, snapshot_id: null, freshness_status: null };
    }
    return mergeHydrationBundle(target, bundle);
  }

  async function reloadCurve(state, hooks) {
    const target = state || getState();
    invalidateCurveCache();
    // Always re-merge hydration (embedded + standalone) so as_of/snapshot stay current.
    await reloadHydration(target);
    target.basisWatch = target.basisWatch || {};
    target.basisWatch.mode = 'live';
    return refresh(target, hooks || {});
  }

  /**
   * Curve history via The Ark only (no direct fetch).
   * Local curveCache still avoids repeat work within the panel.
   */
  async function ensureCurveHistory() {
    if (curveCache) return curveCache;
    if (curveFetchPromise) return curveFetchPromise;
    if (location.protocol === 'file:') {
      curveCache = { records: [] };
      forceNextCurveLoad = false;
      return curveCache;
    }

    const force = forceNextCurveLoad;
    forceNextCurveLoad = false;

    curveFetchPromise = (async () => {
      const ark = getArk();
      if (!ark || typeof ark.loadCurveHistory !== 'function') {
        console.warn('[BasisWatch] WTM_Ark unavailable — curve load skipped');
        curveCache = { records: [] };
        return curveCache;
      }
      try {
        // Chunk 23: always force Ark re-fetch when panel cache was invalidated;
        // also force when Ark has no curve, or when caller set forceNextCurveLoad.
        const needForce = force || !ark.getCurveHistory?.();
        if (needForce && typeof ark.invalidateCurveHistory === 'function') {
          ark.invalidateCurveHistory();
        }
        const result = await ark.loadCurveHistory({ force: needForce });
        if (result && result.ok && result.data) {
          curveCache = result.data;
        } else {
          curveCache = ark.getCurveHistory?.() || { records: [] };
        }
        if (!curveCache || typeof curveCache !== 'object') curveCache = { records: [] };
        return curveCache;
      } catch (err) {
        console.warn('[BasisWatch] Ark curve load failed', err);
        curveCache = { records: [] };
        return curveCache;
      } finally {
        curveFetchPromise = null;
      }
    })();

    return curveFetchPromise;
  }

  /**
   * Hydration bundle via The Ark only (no direct fetch).
   * @param {{ force?: boolean }} [options]
   */
  async function loadHydrationBundle(options) {
    if (location.protocol === 'file:') return null;
    const opts = options || {};
    const ark = getArk();
    if (!ark || typeof ark.loadHydration !== 'function') {
      console.warn('[BasisWatch] WTM_Ark unavailable — hydration load skipped');
      return null;
    }
    try {
      const force = opts.force !== undefined ? !!opts.force : !ark.getHydration?.();
      const result = await ark.loadHydration({ force });
      if (result && result.ok && result.data) return result.data;
      return ark.getHydration?.() || null;
    } catch (err) {
      console.warn('[BasisWatch] Ark hydration load failed', err);
      return null;
    }
  }

  function recordsForRoot(records, rootOrRoots) {
    const roots = Array.isArray(rootOrRoots)
      ? rootOrRoots.map((r) => String(r || '').toUpperCase()).filter(Boolean)
      : [String(rootOrRoots || '').toUpperCase()].filter(Boolean);
    if (!roots.length) return [];
    // Longer roots first so ETH is preferred over ET prefix collisions if both appear.
    const ordered = [...roots].sort((a, b) => b.length - a.length);
    return (records || []).filter((r) => {
      const meta = r.contract_meta || {};
      const metaRoot = String(meta.contract_root || '').toUpperCase();
      const sym = String(r.raw_symbol || '').toUpperCase();
      return ordered.some((root) => metaRoot === root || sym.startsWith(root));
    });
  }

  function buildContracts(records, spot, asOfDate) {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const asOfMs = asOf.getTime();
    return records.map(r => {
      const parsed = parseCmeSymbol(r.raw_symbol);
      if (!parsed) return null;
      const futuresPrice = Number(r.latest?.close ?? r.points?.[r.points.length - 1]?.close);
      if (!Number.isFinite(futuresPrice) || futuresPrice <= 0) return null;
      // daysBetween floors at 0 — use raw signed days so expired months drop off.
      const rawDays = Math.round((parsed.expiry.getTime() - asOfMs) / 86400000);
      if (rawDays < 0) return null;
      const dte = Math.max(0, rawDays);
      const absBasis = futuresPrice - spot;
      const spotBasisPct = spot > 0 ? (absBasis / spot) * 100 : null;
      const spotAnnualizedCarry = computeSpotAnnualizedCarry(futuresPrice, spot, dte);
      const quoteDate = parseQuoteDate(r.latest?.date);
      return {
        symbol: r.raw_symbol, label: parsed.label, expiry: parsed.expiry, dte,
        futuresPrice, spotPrice: spot, quoteDate,
        absBasis, spotBasisPct, spotAnnualizedCarry,
        price: futuresPrice, pctBasis: spotBasisPct, annBasis: spotAnnualizedCarry,
        chg: Number(r.latest?.change), pctChg: Number(r.latest?.pct_change),
      };
    }).filter(Boolean).sort((a, b) => a.expiry - b.expiry);
  }

  /**
   * Build ETH term structure when Barchart ET nodes are missing.
   * - Prefer re-anchor: front F = S × (1 + ethBasis%/100), deferred follow BTC shape vs front.
   * - Fallback: pure spot-ratio scale of BTC (same basis % — only when eth basis unavailable).
   * Symbols use CME/Barchart ET* root (not ETH*).
   */
  function synthesizeEthCurve(btcContracts, ethSpot, btcSpot, ethFrontBasisPct) {
    if (!btcContracts.length || !Number.isFinite(ethSpot) || ethSpot <= 0) return [];
    const btcFront = btcContracts[0];
    const btcFrontF = Number(btcFront?.futuresPrice);
    if (!Number.isFinite(btcFrontF) || btcFrontF <= 0) return [];

    let ethFrontF = null;
    let mode = 'ratio';
    if (Number.isFinite(ethFrontBasisPct)) {
      ethFrontF = ethSpot * (1 + ethFrontBasisPct / 100);
      mode = 'basis_reanchor';
    } else if (Number.isFinite(btcSpot) && btcSpot > 0) {
      ethFrontF = btcFrontF * (ethSpot / btcSpot);
      mode = 'ratio';
    } else {
      return [];
    }

    return btcContracts.map((c) => {
      const btcF = Number(c.futuresPrice);
      const futuresPrice = mode === 'basis_reanchor'
        ? ethFrontF * (btcF / btcFrontF)
        : btcF * (ethSpot / btcSpot);
      const absBasis = futuresPrice - ethSpot;
      const spotBasisPct = (absBasis / ethSpot) * 100;
      const spotAnnualizedCarry = computeSpotAnnualizedCarry(futuresPrice, ethSpot, c.dte);
      const etSymbol = String(c.symbol || '').replace(/^BT/i, 'ET');
      return {
        ...c,
        symbol: etSymbol,
        label: c.label,
        futuresPrice,
        spotPrice: ethSpot,
        price: futuresPrice,
        absBasis,
        spotBasisPct,
        pctBasis: spotBasisPct,
        spotAnnualizedCarry,
        annBasis: spotAnnualizedCarry,
        synthetic: true,
        syntheticMode: mode,
        historySymbol: btcCounterpartSymbol(etSymbol),
        historySpotResolver: Number.isFinite(btcSpot) && btcSpot > 0
          ? () => btcSpot
          : null,
      };
    });
  }

  function pickFrontContract(contracts, rollLogic, manualNear) {
    if (!contracts.length) return null;
    if (rollLogic === 'manual' && manualNear) {
      const hit = contracts.find(c => c.symbol.toUpperCase().includes(String(manualNear).toUpperCase().slice(0, 3)));
      if (hit) return hit;
    }
    if (rollLogic === 'constant') {
      let best = contracts[0], bestDist = Math.abs(best.dte - 30);
      contracts.forEach(c => {
        const d = Math.abs(c.dte - 30);
        if (d < bestDist) { best = c; bestDist = d; }
      });
      return best;
    }
    return contracts.find(c => c.dte >= 7) || contracts[0];
  }

  function buildCalendarPairs(contracts) {
    const out = [];
    for (let i = 1; i < contracts.length; i++) {
      const near = contracts[i - 1], far = contracts[i];
      const intervalDays = daysBetween(near.expiry, far.expiry);
      const forwardAnnualizedYield = near.futuresPrice > 0
        ? ((far.futuresPrice / near.futuresPrice) - 1) * (365 / intervalDays) * 100
        : null;
      const calendarSpread = far.futuresPrice - near.futuresPrice;
      out.push({
        nearSymbol: near.symbol, farSymbol: far.symbol,
        nearDte: near.dte, farDte: far.dte, intervalDays,
        nearPrice: near.futuresPrice, farPrice: far.futuresPrice,
        calendarSpread, forwardAnnualizedYield,
        from: near.symbol, to: far.symbol, days: intervalDays,
        fwd: forwardAnnualizedYield, calendar: calendarSpread,
      });
    }
    return out;
  }

  function richestTenor(contracts) {
    return contracts.length
      ? contracts.reduce((b, c) => (!b || (c.spotAnnualizedCarry ?? -999) > (b.spotAnnualizedCarry ?? -999) ? c : b), null)
      : null;
  }

  function steepestCalendar(pairs) {
    return pairs.length
      ? pairs.reduce((b, p) => (!b || (p.forwardAnnualizedYield ?? -999) > (b.forwardAnnualizedYield ?? -999) ? p : b), null)
      : null;
  }

  function flattestCalendar(pairs) {
    return pairs.length
      ? pairs.reduce((b, p) => (!b || (p.forwardAnnualizedYield ?? 999) < (b.forwardAnnualizedYield ?? 999) ? p : b), null)
      : null;
  }

  function spotCurveVector(contracts) {
    return contracts.map(c => c.spotAnnualizedCarry).filter(Number.isFinite);
  }

  function forwardCurveVector(pairs) {
    return pairs.map(p => p.forwardAnnualizedYield).filter(Number.isFinite);
  }

  /**
   * Resolve contracts for one asset: real curve nodes when present, else ETH synthetic.
   */
  function resolveAssetContracts(state, curveData, assetKey, valuation) {
    const asset = ASSETS[assetKey] || ASSETS.BTC;
    const records = curveData?.records || [];
    const spot = valuation.spotForBasis;
    const asOf = valuation.asOfDate;
    const roots = asset.roots || [asset.root];

    let contracts = buildContracts(recordsForRoot(records, roots), spot, asOf)
      .filter((c) => Number.isFinite(c.dte) && c.dte >= 0);
    let synthetic = false;

    // Real ET nodes present — use them (no BTC clone).
    if (assetKey === 'ETH' && contracts.length) {
      return { contracts, synthetic: false, btcSpot: null };
    }

    if (assetKey === 'ETH') {
      const btcVal = resolveBasisValuation(state, curveData, 'BTC');
      const btcContracts = buildContracts(
        recordsForRoot(records, 'BT'),
        btcVal.spotForBasis,
        btcVal.asOfDate
      ).filter((c) => Number.isFinite(c.dte) && c.dte >= 0);
      if (btcContracts.length && Number.isFinite(spot) && spot > 0) {
        const ethBasisPct = Number.isFinite(valuation.hydrationBasisPct)
          ? valuation.hydrationBasisPct
          : null;
        contracts = synthesizeEthCurve(
          btcContracts,
          spot,
          btcVal.spotForBasis,
          ethBasisPct
        );
        synthetic = true;
        return { contracts, synthetic, btcSpot: btcVal.spotForBasis };
      }
    }

    return { contracts, synthetic, btcSpot: null };
  }

  function enrichContractsForAsset(contracts, curveData, spot, synthetic, btcSpot) {
    const analytics = A();
    if (!analytics) return contracts;
    const rows = (contracts || []).map((c) => {
      if (!synthetic) return c;
      return {
        ...c,
        historySymbol: c.historySymbol || btcCounterpartSymbol(c.symbol),
        historySpotResolver: c.historySpotResolver
          || (Number.isFinite(btcSpot) && btcSpot > 0 ? () => btcSpot : null),
      };
    });
    // History resolver uses BTC spot for synthetic ETH; current basis stays F/S on ETH.
    const historySpot = synthetic && Number.isFinite(btcSpot) ? btcSpot : spot;
    return analytics.enrichContractRows(rows, curveData || { records: [] }, historySpot);
  }

  /**
   * Chunk 19/25 — single-asset board for dual BTC|ETH curve table.
   * Active contracts only (dte ≥ 0), max DUAL_CURVE_MAX, F/S basis (no hydration clobber).
   */
  function buildAssetBoard(state, curveData, assetKey) {
    const asset = ASSETS[assetKey] || ASSETS.BTC;
    const valuation = resolveBasisValuation(state, curveData, assetKey);
    const spot = valuation.spotForBasis;
    const resolved = resolveAssetContracts(state, curveData, assetKey, valuation);
    let contracts = resolved.contracts
      .filter((c) => Number.isFinite(c.dte) && c.dte >= 0)
      .slice(0, DUAL_CURVE_MAX);
    contracts = enrichContractsForAsset(
      contracts,
      curveData,
      spot,
      resolved.synthetic,
      resolved.btcSpot
    );

    const front = pickFrontContract(contracts, 'nearest', '');
    return {
      assetKey,
      asset,
      spot: Number.isFinite(spot) ? spot : null,
      spotSource: valuation.spotSource,
      synthetic: resolved.synthetic,
      front,
      contracts,
      valuationDate: valuation.valuationDate,
      curveQuoteDate: valuation.curveQuoteDate,
      curveStale: !!valuation.curveStale,
    };
  }

  function buildDualCurveBoards(state, curveData) {
    return {
      btc: buildAssetBoard(state, curveData, 'BTC'),
      eth: buildAssetBoard(state, curveData, 'ETH'),
    };
  }

  function crossAssetStrip(records) {
    return CROSS_ASSET_ROOTS.map(spec => {
      const recs = recordsForRoot(records, spec.root);
      const latest = recs.map(r => r.latest).filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      return { ...spec, symbol: recs[0]?.raw_symbol || spec.root, price: latest?.close, change: latest?.pct_change };
    });
  }

  function rollStateLabel(contracts, front) {
    if (!front || contracts.length < 2) return '—';
    const idx = contracts.findIndex(c => c.symbol === front.symbol);
    const next = contracts[idx + 1];
    if (!next) return 'Back of curve';
    if (front.dte <= 14) return `Roll window · ${front.symbol} → ${next.symbol}`;
    return `Hold ${front.symbol}`;
  }

  function buildModel(state, curveData) {
    const prefs = { ...loadPrefs(), ...(state.basisWatch || {}) };
    const assetKey = prefs.asset || 'BTC';
    const asset = ASSETS[assetKey] || ASSETS.BTC;
    const records = curveData?.records || [];
    const sleeve = state.hydration?.crypto_sleeve?.assets || {};
    const spotRec = sleeve[asset.spotKey];
    const spotChg = Number(spotRec?.chg_1d ?? spotRec?.['1_day']) * 100;

    const valuation = resolveBasisValuation(state, curveData, assetKey);
    const spot = valuation.spotForBasis;
    const koyfinSpot = valuation.koyfinSpot;

    const resolved = resolveAssetContracts(state, curveData, assetKey, valuation);
    let contracts = resolved.contracts
      .filter((c) => Number.isFinite(c.dte) && c.dte >= 0);
    let dataNote = valuation.dataNote || '';
    let syntheticCurve = resolved.synthetic;

    if (syntheticCurve && assetKey === 'ETH') {
      const mode = contracts[0]?.syntheticMode || 'ratio';
      const modeBit = mode === 'basis_reanchor'
        ? `ETH front re-anchored to ${basisSpotSeriesId('ETH')}`
        : 'ETH shape from BTC ratio (no eth basis)';
      if (!dataNote) {
        dataNote = `ETH curve synthetic (ET*) · ${modeBit} · Ark ETH spot`;
      } else if (!String(dataNote).includes('ETH')) {
        dataNote = `${dataNote} · ${modeBit}`;
      }
    }

    if (!contracts.length) {
      dataNote = isStandalone() ? 'Loading hydration bundle…' : 'Import hydration + publish desk preview for Barchart curve JSON';
    }

    if (valuation.curveQuoteDate && contracts.length) {
      contracts.forEach((c) => {
        c.quoteStaleDays = c.quoteDate && valuation.curveQuoteDate
          ? quoteDateGapDays(c.quoteDate, valuation.curveQuoteDate)
          : null;
      });
    }

    const rollLogic = prefs.rollLogic || 'nearest';
    let front = pickFrontContract(contracts, rollLogic, state.btcL3?.nearMonth || '');
    // Metadata only — basis stays F/S (Chunk 19).
    front = applyHydrationFrontBasis(contracts, front, valuation);
    let calendarPairs = buildCalendarPairs(contracts);

    global._bwHydrationRef = state.hydration;
    const analytics = A();
    if (analytics) {
      contracts = enrichContractsForAsset(
        contracts,
        curveData,
        spot,
        syntheticCurve,
        resolved.btcSpot
      );
      calendarPairs = analytics.enrichCalendarPairs(calendarPairs, curveData || { records });
      front = applyHydrationFrontBasis(contracts, front, valuation);
      applyHydrationQuartileFallback(contracts, front, state.hydration, assetKey);
      const steepestPair = steepestCalendar(calendarPairs);
      applyHydrationForwardFallback(calendarPairs, steepestPair, state.hydration, assetKey);
      front = contracts.find(c => c.symbol === front?.symbol) || front;
    }

    const dualBoards = buildDualCurveBoards(state, curveData);

    const richestByAnn = richestTenor(contracts);
    const richest = analytics?.richestTenorByBasisRank(contracts) || richestByAnn;
    const steepest = steepestCalendar(calendarPairs);
    const flattest = flattestCalendar(calendarPairs);
    const shape = curveShapeLabel(contracts);

    const crossPeers = CROSS_PEERS.map(spec => {
      const peer = { ...spec, ...peerMetricFromRecords(records, spec) };
      const ann = front?.spotAnnualizedCarry;
      if (peer.kind !== 'credit' && peer.kind !== 'fx' && Number.isFinite(peer.chg) && Number.isFinite(ann)) {
        peer.deltaVsBtc = peer.chg - ann;
      }
      return peer;
    });

    const frontCalendar = calendarPairs[0] || null;

    const taskForceBasis = global.WTM_TaskForceFeed?.basisWatchFeed?.(state.hydration) || null;
    const deskRead = buildCrossAssetInterpretation({
      assetKey, front, crossPeers, steepest, flattest,
    });

    return {
      assetKey, asset,
      spot,
      spotDesk: koyfinSpot,
      spotSource: valuation.spotSource,
      spotChg: Number.isFinite(spotChg) ? spotChg : null,
      // Primary asOf = Ark valuation date (hydration when curve lags); curve vintage kept separate.
      asOf: valuation.valuationDate || valuation.hydrationDate || valuation.curveQuoteDate
        || state.hydration?.as_of || state.provenance?.dataAsOf,
      hydrationAsOf: state.hydration?.as_of || state.provenance?.dataAsOf || valuation.hydrationDate || null,
      snapshotId: state.hydration?.snapshot_id || state.provenance?.snapshotId || null,
      curveQuoteDate: valuation.curveQuoteDate,
      hydrationDate: valuation.hydrationDate,
      valuationDate: valuation.valuationDate || null,
      quoteGapDays: valuation.gap,
      curveStale: !!valuation.curveStale,
      hydrationBasisPct: valuation.hydrationBasisPct,
      // Chunk 19: front basis is always futures vs spot (not RV series).
      frontBasisPct: front?.spotBasisPct ?? null,
      frontAnnCarry: front?.spotAnnualizedCarry ?? null,
      refFutureSymbol: valuation.refFutureSymbol || null,
      syntheticCurve,
      dualBoards,
      contracts, front, calendarPairs, forwards: calendarPairs,
      spotCurve: spotCurveVector(contracts), forwardCurve: forwardCurveVector(calendarPairs),
      cross: crossAssetStrip(records), crossPeers,
      richest, richestByAnn, steepest, flattest, frontCalendar, shape,
      rollLabel: rollStateLabel(contracts, front), dataNote,
      refMid: Number(state.hydration?.global?.basis_spread || state.hydration?.execution?.basis_spread || state.hydration?.execution?.ref_mid) || null,
      mode: prefs.mode || 'live', view: prefs.view || 'basis',
      taskForceBasis,
      interpretation: deskRead.guidance,
      interpretationSupport: deskRead.support,
    };
  }

  function vectorSummary(vec) {
    if (!vec.length) return '—';
    const min = Math.min(...vec), max = Math.max(...vec);
    return `${fmtPct(min, 1)} → ${fmtPct(max, 1)}`;
  }

  function spotAnnFactor(dte) {
    const d = Number(dte);
    if (!Number.isFinite(d) || d < MIN_ANN_DTE) return null;
    return 365 / d;
  }

  function spotAnnDecomposition(c) {
    if (!Number.isFinite(c.spotBasisPct)) return unavailSpan('na');
    if (Number(c.dte) < MIN_ANN_DTE) {
      return `<span class="bw-decomp-short" title="Spot curve % not annualized below ${MIN_ANN_DTE}d DTE">&lt;${MIN_ANN_DTE}d</span>`;
    }
    const factor = spotAnnFactor(c.dte);
    if (!Number.isFinite(factor) || !Number.isFinite(c.spotAnnualizedCarry)) return unavailSpan('na');
    return `((F/S)−1) × ${factor.toFixed(2)}`;
  }

  function renderSummaryCards(model, standalone) {
    const front = model.front;
    const spot = model.spot;
    const frontBasisPct = Number.isFinite(model.frontBasisPct) ? model.frontBasisPct : front?.spotBasisPct;
    const hi = standalone ? ' bw-card--highlight' : '';
    const rankMeta = front && Number.isFinite(front.basisPercentile)
      ? `${fmtPercentile(front.basisPercentile)} · ${quartileRichnessLabel(front.basisQuartile)}`
      : (front?.insufficientHistory ? 'History building' : unavailSpan('awaiting'));
    return `
      <div class="bw-card"><span class="bw-card-label">${model.asset.label} spot${model.spotSource === 'ark_koyfin' ? ' · Ark Koyfin' : (model.spotSource?.includes('implied') ? ' · basis-implied' : (model.spotSource?.includes('barchart') ? ' · Barchart' : ' · desk'))}${model.syntheticCurve ? ' · BTC curve' : ''}</span><strong class="bw-card-value">${spot > 0 ? '$' + fmtNum(spot, 0) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${Number.isFinite(model.spotDesk) && model.spotDesk !== spot ? `Sleeve $${fmtNum(model.spotDesk, 0)} · ` : ''}${Number.isFinite(model.spotChg) ? fmtPct(model.spotChg) + ' 1d' : (model.hydrationAsOf || model.curveQuoteDate || unavailSpan('na'))}</span></div>
      <div class="bw-card"><span class="bw-card-label">Front basis ($)</span><strong class="bw-card-value bw-card-value--secondary">${front ? '$' + fmtNum(front.absBasis, 0) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${front ? front.symbol + ' · ' + front.dte + 'd' : unavailSpan('awaiting')}</span></div>
      <div class="bw-card${hi}"><span class="bw-card-label">Front basis % vs spot <button type="button" class="bw-tip" data-bw-tip="basisPct" aria-label="Basis % definition">?</button></span><strong class="bw-card-value bw-card-value--primary">${Number.isFinite(frontBasisPct) ? fmtPct(frontBasisPct) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${front ? 'F/S · ' + interpretationFromPercentile(front.basisPercentile) : unavailSpan('awaiting')}</span></div>
      <div class="bw-card${hi}"><span class="bw-card-label">Basis % rank <button type="button" class="bw-tip" data-bw-tip="quartileRank" aria-label="Quartile rank">?</button></span><strong class="bw-card-value">${front?.basisQuartile ? 'Q' + front.basisQuartile : unavailSpan('na')}</strong><span class="bw-card-meta">${rankMeta}</span></div>
      <div class="bw-card"><span class="bw-card-label">Spot curve % (ann.) <button type="button" class="bw-tip" data-bw-tip="annBasis" aria-label="Annualized basis">?</button></span><strong class="bw-card-value">${front ? fmtPct(front.spotAnnualizedCarry) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${model.spotCurve.length ? vectorSummary(model.spotCurve) : unavailSpan('awaiting')}</span></div>
      <div class="bw-card"><span class="bw-card-label">Forward curve % (ann.) <button type="button" class="bw-tip" data-bw-tip="forwardCurve" aria-label="Forward curve">?</button></span><strong class="bw-card-value">${model.steepest ? fmtPct(model.steepest.forwardAnnualizedYield) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${model.forwardCurve.length ? vectorSummary(model.forwardCurve) : unavailSpan('awaiting')}</span></div>`;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTaskForceCallout(model) {
    const feed = model.taskForceBasis;
    if (!feed?.signal) return '';
    const conf = Number.isFinite(feed.confidence) ? ` · conf ${Math.round(feed.confidence * 100)}%` : '';
    const src = feed.source === 'task_force' ? 'task force' : (feed.source || feed.status || 'feed');
    const inv = feed.invalidation ? ` · inv: ${escapeHtml(feed.invalidation)}` : '';
    return `<div class="bw-task-force-callout">
      <span class="bw-callout-label">Task Force · btc_eth_basis</span>
      <p class="bw-task-force-signal">${escapeHtml(feed.signal)}</p>
      <span class="bw-callout-meta">${escapeHtml(src)}${conf}${inv}</span>
    </div>`;
  }

  function renderCallouts(model) {
    const richestMeta = model.richest
      ? `${fmtPct(model.richest.spotBasisPct)} basis % · ${Number.isFinite(model.richest.basisPercentile) ? fmtPercentile(model.richest.basisPercentile) : unavailSpan('na')}`
      : unavailSpan('awaiting');
    const steepestMeta = model.steepest
      ? `${fmtPct(model.steepest.forwardAnnualizedYield)} fwd · ${Number.isFinite(model.steepest.forwardPercentile) ? fmtPercentile(model.steepest.forwardPercentile) : unavailSpan('na')}`
      : unavailSpan('awaiting');
    const flattestMeta = model.flattest
      ? `${fmtPct(model.flattest.forwardAnnualizedYield)} fwd · ${Number.isFinite(model.flattest.forwardPercentile) ? fmtPercentile(model.flattest.forwardPercentile) : unavailSpan('na')}`
      : unavailSpan('awaiting');
    return `${renderTaskForceCallout(model)}<div class="bw-callout-strip bw-callout-strip--triple">
      <div class="bw-callout"><span class="bw-callout-label">Richest by basis % rank</span><div class="bw-callout-value">${model.richest?.symbol || unavailSpan('awaiting')}</div><div class="bw-callout-meta">${richestMeta}</div></div>
      <div class="bw-callout"><span class="bw-callout-label">Steepest calendar</span><div class="bw-callout-value">${model.steepest ? model.steepest.nearSymbol + '→' + model.steepest.farSymbol : unavailSpan('awaiting')}</div><div class="bw-callout-meta">${steepestMeta}</div></div>
      <div class="bw-callout"><span class="bw-callout-label">Flattest calendar</span><div class="bw-callout-value">${model.flattest ? model.flattest.nearSymbol + '→' + model.flattest.farSymbol : unavailSpan('awaiting')}</div><div class="bw-callout-meta">${flattestMeta}</div></div>
    </div>`;
  }

  function histRangeCell(c) {
    if (!c.basisStats || c.basisStats.n < 2) return unavailSpan('awaiting');
    return `${fmtPct(c.histQ1, 2)} / ${fmtPct(c.histMedian, 2)} / ${fmtPct(c.histQ3, 2)}`;
  }

  /** Highlight extreme basis rows on the dual board (rich/cheap ann or wide simple basis). */
  function dualRowExtremeClass(c) {
    const ann = Number(c.spotAnnualizedCarry);
    const pct = Number(c.spotBasisPct);
    if (Number.isFinite(ann) && Math.abs(ann) >= 12) return 'bw-dual-row--extreme';
    if (Number.isFinite(pct) && Math.abs(pct) >= 2) return 'bw-dual-row--extreme';
    return '';
  }

  function renderDualBoardColumn(board) {
    if (!board) {
      return `<div class="bw-dual-col"><p class="bw-dual-empty">Awaiting curve</p></div>`;
    }
    const label = board.asset?.label || board.assetKey || '—';
    const spotTxt = Number.isFinite(board.spot) ? `$${fmtNum(board.spot, 0)}` : unavailSpan('awaiting');
    const srcBit = board.spotSource === 'ark_koyfin'
      ? 'Ark Koyfin'
      : (board.synthetic ? 'synthetic curve' : (board.spotSource || 'Ark'));
    const frontSym = board.front?.symbol || '—';

    if (!board.contracts?.length) {
      return `<div class="bw-dual-col" data-asset="${escapeHtml(board.assetKey)}">
        <header class="bw-dual-col-head">
          <div class="bw-dual-col-title">${escapeHtml(board.assetKey)} · ${escapeHtml(label)}</div>
          <div class="bw-dual-spot"><span class="bw-dual-spot-label">Spot</span><strong class="bw-dual-spot-val">${spotTxt}</strong></div>
          <div class="bw-dual-col-meta">${escapeHtml(srcBit)}</div>
        </header>
        <p class="bw-dual-empty">No active futures tenors</p>
      </div>`;
    }

    const rows = board.contracts.map((c) => {
      const isFront = board.front && c.symbol === board.front.symbol;
      const extreme = dualRowExtremeClass(c);
      const rank = Number.isFinite(c.basisPercentile)
        ? fmtPercentile(c.basisPercentile)
        : (c.basisQuartile ? `Q${c.basisQuartile}` : unavailSpan('na'));
      const qTitle = c.quoteDate ? ` title="Futures quote ${escapeHtml(c.quoteDate)}"` : '';
      return `<tr class="${isFront ? 'bw-row-front ' : ''}${extreme}">
        <td class="bw-dual-sym">${escapeHtml(c.symbol)}${c.synthetic ? ' <span class="bw-dual-syn" title="Synthetic ET curve: front re-anchored to eth_basis_spot_1m, shape from BTC">*</span>' : ''}</td>
        <td>${escapeHtml(c.label || '')}</td>
        <td class="bw-num">${c.dte}d</td>
        <td class="bw-num"${qTitle}>$${fmtNumDisplay(c.futuresPrice, 0)}</td>
        <td class="bw-num ${Number(c.absBasis) < 0 ? 'bw-heat--cold' : (Number(c.absBasis) > 0 ? 'bw-heat--flat' : '')}">$${fmtNumDisplay(c.absBasis, 0)}</td>
        <td class="bw-num bw-col-primary ${c.basisHeatClass || heatClass(c.spotBasisPct)}"><strong>${fmtPctDisplay(c.spotBasisPct)}</strong></td>
        <td class="bw-num ${heatClass(c.spotAnnualizedCarry)}">${fmtPctDisplay(c.spotAnnualizedCarry)}</td>
        <td class="bw-num">${rank}</td>
      </tr>`;
    }).join('');

    return `<div class="bw-dual-col" data-asset="${escapeHtml(board.assetKey)}">
      <header class="bw-dual-col-head">
        <div class="bw-dual-col-title">${escapeHtml(board.assetKey)} · ${escapeHtml(label)}</div>
        <div class="bw-dual-spot">
          <span class="bw-dual-spot-label">Spot</span>
          <strong class="bw-dual-spot-val">${spotTxt}</strong>
          <span class="bw-dual-col-meta">${escapeHtml(srcBit)}${board.synthetic ? ' · BTC shape' : ''} · front ${escapeHtml(frontSym)}</span>
        </div>
      </header>
      <div class="bw-table-wrap bw-dual-table-wrap">
        <table class="bw-table bw-table--compact bw-dual-table">
          <thead>
            <tr>
              <th>Contract</th><th>Expiry</th><th>DTE</th><th>Futures Price</th>
              <th>Basis ($)</th><th>Basis %</th><th>Annualized %</th><th>Rank</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  function renderDualCurveSection(model) {
    const boards = model.dualBoards || {};
    const btc = boards.btc;
    const eth = boards.eth;
    const staleNote = (btc?.curveStale || eth?.curveStale)
      ? '<span class="bw-dual-stale">Curve quotes lag Ark spot — basis is still (F−S)/S on published nodes</span>'
      : '';
    return `<section class="bw-dual-curve" id="bwDualCurveInner" aria-label="BTC and ETH basis curve table">
      <div class="bw-dual-head">
        <h4 class="bw-subhead bw-dual-title">Enhanced basis curve · BTC | ETH</h4>
        <p class="bw-methodology-inline">Next ${DUAL_CURVE_MAX} active contracts · Basis % = (F−S)/S · Ann. = ((F/S)−1)×(365/DTE) · Ark spot + curve via The Ark ${staleNote}</p>
      </div>
      <div class="bw-dual-grid">
        ${renderDualBoardColumn(btc)}
        ${renderDualBoardColumn(eth)}
      </div>
    </section>`;
  }

  function renderBasisTable(model) {
    if (!model.contracts.length) return renderBasisNullState();
    const rows = model.contracts.map(c => `
      <tr class="${model.front && c.symbol === model.front.symbol ? 'bw-row-front' : ''}">
        <td>${c.symbol}${c.synthetic ? ' <span title="Synthesized">*</span>' : ''}</td>
        <td>${c.label}</td><td>${c.dte}d</td>
        <td class="bw-col-secondary">$${fmtNumDisplay(c.futuresPrice, 0)}</td>
        <td class="bw-col-secondary">$${fmtNumDisplay(c.absBasis, 0)}</td>
        <td class="bw-col-primary ${c.basisHeatClass || ''}"><strong>${fmtPctDisplay(c.spotBasisPct)}</strong></td>
        <td>${Number.isFinite(c.basisPercentile) ? fmtPercentile(c.basisPercentile) : unavailSpan('na')}</td>
        <td>${c.basisQuartile ? quartileBadge(c.basisQuartile, quartileRichnessLabel(c.basisQuartile)) : unavailSpan('na')}</td>
        <td class="bw-col-hist" title="Q1 / Median / Q3">${histRangeCell(c)}</td>
        <td class="bw-decomp" title="Basis % × (365/DTE)">${spotAnnDecomposition(c)}</td>
        <td class="${heatClass(c.spotAnnualizedCarry)}" title="${spotAnnDecomposition(c)}">${fmtPctDisplay(c.spotAnnualizedCarry)}</td>
        <td>${Number.isFinite(c.pctChg) ? fmtPct(c.pctChg) : unavailSpan('na')}</td>
      </tr>`).join('');
    return `<h4 class="bw-subhead">Spot curve · futures vs spot</h4><p class="bw-methodology-inline">Spot Curve % (ann.) = ((F/S)−1) × (365 ÷ DTE) · suppressed below ${MIN_ANN_DTE}d DTE · Quartiles from hydrated history</p><div class="bw-table-wrap"><table class="bw-table"><thead><tr><th>Contract</th><th>Expiry</th><th>DTE</th><th>Futures</th><th>Basis ($)</th><th>Basis %</th><th>Rank</th><th>Quartile</th><th>Hist Q1/Med/Q3</th><th>×365/DTE</th><th>Spot Curve % (ann.)</th><th>Chg</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderImpliedTable(model) {
    if (!model.contracts.length) return renderBasisNullState();
    const spotRows = model.contracts.map(c => `<tr class="${model.front && c.symbol === model.front.symbol ? 'bw-row-front' : ''}"><td>${c.symbol}</td><td>${c.dte}d</td><td class="bw-col-primary"><strong>${fmtPctDisplay(c.spotBasisPct)}</strong></td><td>${Number.isFinite(c.basisPercentile) ? fmtPercentile(c.basisPercentile) : unavailSpan('na')}</td><td class="bw-decomp">${spotAnnDecomposition(c)}</td><td class="${heatClass(c.spotAnnualizedCarry)}">${fmtPctDisplay(c.spotAnnualizedCarry)}</td></tr>`).join('');
    const fwdRows = model.calendarPairs.map(p => `<tr><td>${p.nearSymbol} → ${p.farSymbol}</td><td>${p.intervalDays}d</td><td class="${heatClass(p.forwardAnnualizedYield)} ${p.forwardHeatClass || ''}"><strong>${fmtPctDisplay(p.forwardAnnualizedYield)}</strong></td><td>${Number.isFinite(p.forwardPercentile) ? fmtPercentile(p.forwardPercentile) : unavailSpan('na')}</td><td>${p.forwardQuartile ? quartileBadge(p.forwardQuartile, quartileRichnessLabel(p.forwardQuartile)) : unavailSpan('na')}</td><td class="bw-col-secondary">$${fmtNumDisplay(p.calendarSpread, 0)}</td></tr>`).join('');
    return `<div class="bw-implied-grid">
      <div class="bw-panel" style="border:none;box-shadow:none"><h4 class="bw-subhead">Spot curve % (ann.)</h4><p class="bw-methodology-inline">((F/S)−1) × (365/DTE) · not shown below ${MIN_ANN_DTE}d DTE</p><div class="bw-table-wrap"><table class="bw-table bw-table--compact"><thead><tr><th>Tenor</th><th>DTE</th><th>Basis %</th><th>Rank</th><th>×365/DTE</th><th>Spot Curve %</th></tr></thead><tbody>${spotRows}</tbody></table></div></div>
      <div class="bw-panel" style="border:none;box-shadow:none"><h4 class="bw-subhead">Forward curve % (ann.)</h4><p class="bw-methodology-inline">Adjacent pairs · ((F_far/F_near)−1)×(365/interval)</p><div class="bw-table-wrap"><table class="bw-table bw-table--compact"><thead><tr><th>Near → Far</th><th>Days Between</th><th>Forward Curve %</th><th>Rank</th><th>Quartile</th><th>Calendar Spread ($)</th></tr></thead><tbody>${fwdRows || '<tr><td colspan="6">—</td></tr>'}</tbody></table></div></div>
    </div>`;
  }

  function renderHeatmap(model) {
    if (!model.contracts.length) return '';
    return `<div class="bw-heatmap" aria-label="Basis % heatmap with quartile context">${model.contracts.map(c => `
      <div class="bw-heat-cell ${c.basisHeatClass || heatClass(c.spotAnnualizedCarry)}" title="${c.symbol}: ${fmtPct(c.spotBasisPct)} basis % · ${Number.isFinite(c.basisPercentile) ? fmtPercentile(c.basisPercentile) : 'no rank'}">
        <span class="bw-heat-sym">${c.symbol.replace(/\d{2}$/, '')}</span>
        <span class="bw-heat-val bw-heat-val--primary">${fmtPct(c.spotBasisPct, 2)}</span>
        <span class="bw-heat-val">${fmtPct(c.spotAnnualizedCarry, 1)} ann.</span>
        <span class="bw-heat-dte">${c.basisQuartile ? 'Q' + c.basisQuartile : '—'} · ${c.dte}d</span>
      </div>`).join('')}</div>`;
  }

  function renderMethodology(model) {
    const viewNote = model.view === 'implied'
      ? 'Implied Rate · spot + forward roll yields.'
      : 'Basis Watch · spot curve carry only.';
    return `<ul class="bw-methodology-bullets">
      <li>Basis $ = F − S</li>
      <li>Basis % = (F−S)/S</li>
      <li>Ann carry = ((F/S)−1)×(365/DTE)</li>
      <li class="bw-methodology-view">${viewNote}</li>
    </ul>`;
  }

  function renderCrossAsset(model) {
    const front = model.front;
    const cal = model.frontCalendar || model.steepest;
    const asOf = formatLocalStamp(model.asOf, '');
    const anchor = `
      <article class="bw-xasset-card bw-xasset-card--anchor">
        <div class="bw-xasset-card-top">
          <span class="bw-xasset-symbol">${model.assetKey}</span>
          <span class="bw-xasset-contract">${front ? front.symbol + ' · ' + front.dte + 'd' : unavailSpan('awaiting')}</span>
          ${front?.basisQuartile ? quartileBadge(front.basisQuartile, quartileRichnessLabel(front.basisQuartile)) : ''}
        </div>
        <div class="bw-xasset-metrics">
          <div class="bw-xasset-metric">
            <span class="bw-xasset-metric-label">Basis % <button type="button" class="bw-tip" data-bw-tip="basisPct" aria-label="Basis %">?</button></span>
            <strong class="bw-xasset-metric-value">${front ? fmtPctDisplay(front.spotBasisPct) : unavailSpan('awaiting')}</strong>
          </div>
          <div class="bw-xasset-metric">
            <span class="bw-xasset-metric-label">Spot curve % (ann.) <button type="button" class="bw-tip" data-bw-tip="annBasis" aria-label="Ann. basis">?</button></span>
            <strong class="bw-xasset-metric-value ${heatClass(front?.spotAnnualizedCarry)}">${front ? fmtPctDisplay(front.spotAnnualizedCarry) : unavailSpan('awaiting')}</strong>
          </div>
          <div class="bw-xasset-metric">
            <span class="bw-xasset-metric-label">Calendar fwd % <button type="button" class="bw-tip" data-bw-tip="forwardCurve" aria-label="Forward curve">?</button></span>
            <strong class="bw-xasset-metric-value">${cal ? fmtPctDisplay(cal.forwardAnnualizedYield) : unavailSpan('na')}</strong>
          </div>
          <div class="bw-xasset-metric">
            <span class="bw-xasset-metric-label">Basis rank <button type="button" class="bw-tip" data-bw-tip="quartileRank" aria-label="Quartile">?</button></span>
            <strong class="bw-xasset-metric-value">${Number.isFinite(front?.basisPercentile) ? fmtPercentile(front.basisPercentile) : unavailSpan('na')}</strong>
          </div>
        </div>
        <p class="bw-xasset-card-note" title="Hover for dollar detail">Basis ($): ${front ? '$' + fmtNum(front.absBasis, 0) : unavailSpan('awaiting')} · Ann.: ${front ? fmtPctDisplay(front.spotAnnualizedCarry) : unavailSpan('awaiting')}</p>
      </article>`;

    const btcCalRow = cal ? `
      <tr>
        <td><span class="bw-xasset-peer">${model.assetKey}</span> <span class="bw-xasset-peer-sub">${cal.nearSymbol}→${cal.farSymbol}</span></td>
        <td class="bw-xasset-role">Calendar roll</td>
        <td class="bw-xasset-num"><strong>${fmtPct(cal.forwardAnnualizedYield)} fwd</strong></td>
        <td class="bw-xasset-num">${unavailSpan('na')}</td>
        <td class="bw-xasset-num">${unavailSpan('na')}</td>
        <td>${cal.forwardQuartile ? quartileBadge(cal.forwardQuartile, quartileRichnessLabel(cal.forwardQuartile)) : unavailSpan('na')}</td>
      </tr>` : '';

    const peerRows = (model.crossPeers || []).map(peer => {
      const chgCls = Number.isFinite(peer.chg) ? (peer.chg >= 0 ? 'bw-xasset-chg--up' : 'bw-xasset-chg--down') : '';
      const deltaCls = Number.isFinite(peer.deltaVsBtc)
        ? (peer.deltaVsBtc >= 0 ? 'bw-xasset-delta--pos' : 'bw-xasset-delta--neg')
        : '';
      const metric = peer.metric && peer.metric !== '—' ? peer.metric : unavailSpan('awaiting');
      return `<tr class="${peer.rowClass || ''}">
        <td><span class="bw-xasset-peer">${peer.label.split(' ')[0]}</span> <span class="bw-xasset-peer-sub">${peer.label.replace(/^[^\s]+\s*/, '')}</span></td>
        <td class="bw-xasset-role">${peer.role}</td>
        <td class="bw-xasset-num"><strong>${metric}</strong></td>
        <td class="bw-xasset-num ${chgCls}">${Number.isFinite(peer.chg) ? fmtPct(peer.chg) : unavailSpan('na')}</td>
        <td class="bw-xasset-num ${deltaCls}">${Number.isFinite(peer.deltaVsBtc) ? fmtNum(peer.deltaVsBtc, 1) : unavailSpan('na')}</td>
        <td>${peer.quartile ? quartileBadge(peer.quartile, quartileRichnessLabel(peer.quartile)) : unavailSpan('awaiting')}</td>
      </tr>`;
    }).join('');

    return `<section class="bw-xasset" aria-label="Cross-asset basis context">
      <header class="bw-xasset-head">
        <h4 class="bw-xasset-title">Cross-asset basis</h4>
        <span class="bw-xasset-asof">${asOf ? 'As of ' + asOf : ''}</span>
        <button type="button" class="bw-tip" data-bw-tip="crossAssetContext" aria-label="Cross-asset context">?</button>
      </header>
      ${anchor}
      <div class="bw-xasset-table-wrap">
        <table class="bw-xasset-table">
          <thead><tr>
            <th scope="col">Peer</th><th scope="col">Role</th>
            <th scope="col">Current % <button type="button" class="bw-tip" data-bw-tip="crossAssetMetric" aria-label="Metric">?</button></th>
            <th scope="col">1d</th><th scope="col">Δ vs BTC</th>
            <th scope="col">Q (3M) <button type="button" class="bw-tip" data-bw-tip="quartileRank" aria-label="Quartile">?</button></th>
          </tr></thead>
          <tbody>
            <tr>
              <td><span class="bw-xasset-peer">${model.assetKey}</span> <span class="bw-xasset-peer-sub">${front?.symbol || 'front'}</span></td>
              <td class="bw-xasset-role">Spot basis %</td>
              <td class="bw-xasset-num"><strong>${front ? fmtPctDisplay(front.spotBasisPct) + ' basis' : unavailSpan('awaiting')}</strong></td>
              <td class="bw-xasset-num">${unavailSpan('na')}</td>
              <td class="bw-xasset-num">${unavailSpan('na')}</td>
              <td>${front?.basisQuartile ? quartileBadge(front.basisQuartile, quartileRichnessLabel(front.basisQuartile)) : unavailSpan('na')}</td>
            </tr>
            ${btcCalRow}
            ${peerRows}
          </tbody>
        </table>
      </div>
      <footer class="bw-xasset-interpret">
        <span class="bw-xasset-interpret-label">Desk read</span>
        <p class="bw-xasset-interpret-text">${model.interpretation || unavailSpan('awaiting')}</p>
        ${model.interpretationSupport ? `<span class="bw-xasset-interpret-support">${model.interpretationSupport}</span>` : ''}
      </footer>
    </section>`;
  }

  function initTooltips(content = TOOLTIP_CONTENT) {
    if (global._bwTooltipWired) return global._bwTooltipCtl;
    global._bwTooltipWired = true;
    const root = document;
    let popover = document.getElementById('bwTipPopover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'bwTipPopover';
      popover.className = 'bw-tip-popover';
      popover.setAttribute('role', 'tooltip');
      popover.hidden = true;
      popover.innerHTML = '<button type="button" class="bw-tip-popover-close" aria-label="Close tooltip">×</button><p class="bw-tip-popover-body"></p>';
      document.body.appendChild(popover);
    }
    const bodyEl = popover.querySelector('.bw-tip-popover-body');
    const closeBtn = popover.querySelector('.bw-tip-popover-close');
    let backdrop = null;
    let openTrigger = null;
    const isCoarse = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

    function closePopover() {
      popover.hidden = true;
      openTrigger?.classList.remove('bw-tip--open');
      openTrigger?.setAttribute('aria-expanded', 'false');
      openTrigger = null;
      backdrop?.remove();
      backdrop = null;
    }

    function openPopover(trigger, key) {
      const text = content[key];
      if (!text) return;
      closePopover();
      bodyEl.textContent = text;
      popover.hidden = false;
      trigger.classList.add('bw-tip--open');
      trigger.setAttribute('aria-expanded', 'true');
      openTrigger = trigger;
      backdrop = document.createElement('div');
      backdrop.className = 'bw-tip-backdrop';
      backdrop.addEventListener('click', closePopover);
      document.body.insertBefore(backdrop, popover);
    }

    closeBtn?.addEventListener('click', closePopover);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });
    root.addEventListener('click', e => {
      const trigger = e.target.closest?.('.bw-tip[data-bw-tip]');
      if (!trigger || !root.contains(trigger)) return;
      const key = trigger.dataset.bwTip;
      if (!content[key]) return;
      e.preventDefault();
      e.stopPropagation();
      if (isCoarse()) {
        if (openTrigger === trigger && !popover.hidden) closePopover();
        else openPopover(trigger, key);
      }
    });
    root.addEventListener('mouseenter', e => {
      const trigger = e.target.closest?.('.bw-tip[data-bw-tip]');
      if (!trigger || isCoarse() || !content[trigger.dataset.bwTip]) return;
      trigger.setAttribute('title', content[trigger.dataset.bwTip]);
    }, true);
    root.addEventListener('mouseleave', e => {
      const trigger = e.target.closest?.('.bw-tip[data-bw-tip]');
      if (trigger) trigger.removeAttribute('title');
    }, true);
    global._bwTooltipCtl = { close: closePopover };
    return global._bwTooltipCtl;
  }

  function drawRateSeries(ctx, pad, plotW, plotH, w, h, dtes, rates, color, yMin, yMax, xOffset = 0, xDenom) {
    const denom = xDenom || Math.max(...dtes, 1);
    const yAt = r => pad.t + plotH - ((r - yMin) / (yMax - yMin || 1)) * plotH;
    const xAt = d => pad.l + xOffset + (d / denom) * plotW;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    dtes.forEach((d, i) => {
      const x = xAt(d), y = yAt(rates[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineWidth = 1;
    dtes.forEach((d, i) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(xAt(d), yAt(rates[i]), 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  function contractChartLabel(symbol) {
    const m = String(symbol || '').match(/([FGHJKMNQUVXZ]\d{2})$/);
    return m ? m[1] : String(symbol || '').slice(-3);
  }

  function drawYAxisPriceLabels(ctx, pad, plotH, yAt, minP, maxP, theme) {
    ctx.fillStyle = theme.axis;
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const p = minP + ((maxP - minP) * i) / 4;
      ctx.fillText(`$${fmtNum(p, 0)}`, pad.l - 6, yAt(p));
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function paintBasisChart(ctx, w, h, model, theme) {
    ctx.clearRect(0, 0, w, h);
    const contracts = model.contracts || [];
    if (!contracts.length || !(model.spot > 0)) {
      ctx.fillStyle = theme.empty;
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText('Curve populates after hydration + Barchart curve JSON', 16, h / 2);
      return;
    }

    if (model.view === 'implied') {
      const spotPts = contracts.filter(c => Number.isFinite(c.spotAnnualizedCarry));
      const spotDtes = spotPts.map(c => c.dte);
      const spotRates = spotPts.map(c => c.spotAnnualizedCarry);
      const fwdPts = (model.calendarPairs || []).filter(p => Number.isFinite(p.forwardAnnualizedYield));
      const fwdDtes = fwdPts.map(p => (p.nearDte + p.farDte) / 2);
      const fwdRates = fwdPts.map(p => p.forwardAnnualizedYield);
      const allRates = [...spotRates, ...fwdRates].filter(Number.isFinite);
      if (!allRates.length) {
        ctx.fillStyle = theme.empty;
        ctx.font = '12px system-ui,sans-serif';
        ctx.fillText(`No annualized tenors ≥ ${MIN_ANN_DTE}d DTE`, 16, h / 2);
        return;
      }
      const yMin = Math.min(0, ...allRates) - 1;
      const yMax = Math.max(...allRates, 1) + 1;
      const maxDte = Math.max(...spotDtes, ...fwdPts.map(p => p.farDte), 1);
      const pad = { l: 48, r: 16, t: 18, b: 40 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      const yAt = r => pad.t + plotH - ((r - yMin) / (yMax - yMin || 1)) * plotH;
      const xAtDte = d => pad.l + (d / maxDte) * plotW;

      ctx.strokeStyle = theme.grid;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (plotH * i) / 4;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();

      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = theme.muted;
      const zeroY = yAt(0);
      ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(w - pad.r, zeroY); ctx.stroke();
      ctx.setLineDash([]);

      drawRateSeries(ctx, pad, plotW, plotH, w, h, spotDtes, spotRates, theme.curve, yMin, yMax, 0, maxDte);
      drawRateSeries(ctx, pad, plotW, plotH, w, h, fwdDtes, fwdRates, theme.front, yMin, yMax, 0, maxDte);

      ctx.fillStyle = theme.axis;
      ctx.font = '9px system-ui,sans-serif';
      ctx.textAlign = 'center';
      spotPts.forEach((c) => {
        ctx.fillText(contractChartLabel(c.symbol), xAtDte(c.dte), h - pad.b + 14);
      });
      ctx.textAlign = 'left';
      ctx.fillText('DTE →', w - pad.r - 36, h - 8);
      ctx.save();
      ctx.translate(12, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('% ann.', 0, 0);
      ctx.restore();
      return;
    }

    const prices = [model.spot, ...contracts.map(c => c.futuresPrice)];
    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const pad = { l: 58, r: 16, t: 18, b: 40 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;
    const xAt = i => pad.l + (i / Math.max(1, contracts.length)) * plotW;
    const yAt = p => pad.t + plotH - ((p - minP) / (maxP - minP || 1)) * plotH;

    ctx.strokeStyle = theme.grid;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();
    drawYAxisPriceLabels(ctx, pad, plotH, yAt, minP, maxP, theme);

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = theme.spotLine;
    ctx.beginPath(); ctx.moveTo(pad.l, yAt(model.spot)); ctx.lineTo(w - pad.r, yAt(model.spot)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.spotLabel;
    ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(`${model.assetKey} spot $${fmtNum(model.spot, 0)}`, pad.l + 6, Math.max(pad.t + 10, yAt(model.spot) - 6));

    const grad = ctx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    grad.addColorStop(0, theme.curve);
    grad.addColorStop(1, theme.front);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    contracts.forEach((c, i) => {
      const x = xAt(i + 1);
      const y = yAt(c.futuresPrice);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineWidth = 1;

    const labelY = h - pad.b + 14;
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'center';
    contracts.forEach((c, i) => {
      const x = xAt(i + 1);
      const y = yAt(c.futuresPrice);
      const isFront = model.front && c.symbol === model.front.symbol;
      ctx.fillStyle = isFront ? theme.front : theme.node;
      ctx.beginPath(); ctx.arc(x, y, isFront ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.axis;
      ctx.fillText(contractChartLabel(c.symbol), x, labelY);
    });
    ctx.textAlign = 'left';
    ctx.fillText('Tenor →', w - pad.r - 44, h - 8);
  }

  function drawBasisChart(model) {
    const canvas = el('bwCurveCanvas');
    if (!canvas) return;
    const theme = getChartTheme();
    const legend = el('bwChartLegend');
    // Tag canvas with active asset so switch BTC↔ETH always invalidates paint path.
    const paintKey = `${model.assetKey || 'BTC'}|${model.view || 'basis'}|${model.front?.symbol || ''}|${model.contracts?.length || 0}`;
    canvas.dataset.bwPaintKey = paintKey;
    canvas.setAttribute('aria-label', `${model.assetKey || 'BTC'} futures curve vs spot`);

    const paint = () => {
      // Drop stale frames if asset/view changed mid-rAF.
      if (canvas.dataset.bwPaintKey !== paintKey) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 8) {
        requestAnimationFrame(paint);
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(280, rect.width);
      const h = isStandalone() ? 280 : Math.max(110, rect.height || 110);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.scale(dpr, dpr);
      paintBasisChart(ctx, w, h, model, theme);
      if (legend) {
        if (model.view === 'implied') {
          legend.innerHTML = `
            <span class="bw-legend-item"><i class="bw-legend-swatch" style="background:var(--bw-chart-curve)"></i>${model.assetKey} spot curve % (ann.)</span>
            <span class="bw-legend-item"><i class="bw-legend-swatch" style="background:var(--bw-chart-front)"></i>${model.assetKey} forward curve % (ann.)</span>`;
        } else {
          legend.innerHTML = `
            <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--spot"></i>${model.assetKey} spot (CF proxy)</span>
            <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--curve"></i>${model.assetKey} futures curve</span>
            <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--front"></i>Front ${model.front?.symbol || 'contract'}</span>`;
        }
      }
    };
    paint();
  }

  function approxEq(a, b, tol = 0.01) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
  }

  function runBasisWatchValidation() {
    const results = [];
    const fail = (name, detail) => { results.push({ name, ok: false, detail }); };
    const pass = (name, detail) => { results.push({ name, ok: true, detail }); };

    const spot = 100000;
    const asOf = new Date('2026-06-01T12:00:00Z');
    const fakeRecords = [
      { raw_symbol: 'BTM26', latest: { close: 102000 } },
      { raw_symbol: 'BTU26', latest: { close: 104000 } },
      { raw_symbol: 'BTZ26', latest: { close: 106000 } },
    ];
    const contracts = buildContracts(fakeRecords, spot, asOf);
    if (contracts.length !== 3) fail('buildContracts count', `expected 3 got ${contracts.length}`);
    else pass('buildContracts count', '3 contracts');

    const c0 = contracts[0];
    const expectedAbs = 2000;
    const expectedPct = 2;
    const expectedAnn = ((102000 / spot) - 1) * (365 / c0.dte) * 100;
    if (!approxEq(c0.absBasis, expectedAbs, 0.5)) fail('absBasis', `${c0.absBasis} vs ${expectedAbs}`);
    else pass('absBasis', `F−S = ${c0.absBasis}`);
    if (!approxEq(c0.spotBasisPct, expectedPct, 0.01)) fail('spotBasisPct', `${c0.spotBasisPct} vs ${expectedPct}`);
    else pass('spotBasisPct', `${c0.spotBasisPct}%`);
    if (!approxEq(c0.spotAnnualizedCarry, expectedAnn, 0.05)) fail('spotAnnualizedCarry', `${c0.spotAnnualizedCarry} vs ${expectedAnn}`);
    else pass('spotAnnualizedCarry', `${c0.spotAnnualizedCarry}%`);

    const pairs = buildCalendarPairs(contracts);
    if (pairs.length !== 2) fail('calendarPairs count', `expected 2 got ${pairs.length}`);
    else pass('calendarPairs count', '2 adjacent pairs');

    const p0 = pairs[0];
    const interval = daysBetween(contracts[0].expiry, contracts[1].expiry);
    const expectedFwd = ((104000 / 102000) - 1) * (365 / interval) * 100;
    const expectedCal = 2000;
    if (p0.intervalDays !== interval) fail('intervalDays', `${p0.intervalDays} vs ${interval}`);
    else pass('intervalDays', `${p0.intervalDays}d between expiries`);
    if (!approxEq(p0.forwardAnnualizedYield, expectedFwd, 0.05)) fail('forwardAnnualizedYield', `${p0.forwardAnnualizedYield} vs ${expectedFwd}`);
    else pass('forwardAnnualizedYield', `${p0.forwardAnnualizedYield}%`);
    if (!approxEq(p0.calendarSpread, expectedCal, 0.5)) fail('calendarSpread', `${p0.calendarSpread} vs ${expectedCal}`);
    else pass('calendarSpread', `$${p0.calendarSpread}`);

    const richest = richestTenor(contracts);
    const steepest = steepestCalendar(pairs);
    if (!richest || richest.symbol !== 'BTM26') fail('richestTenor', richest?.symbol);
    else pass('richestTenor', `${richest.symbol} (${richest.spotAnnualizedCarry}%)`);
    if (!steepest) fail('steepestCalendar', 'null');
    else pass('steepestCalendar', `${steepest.nearSymbol}→${steepest.farSymbol}`);

    const flat = flattestCalendar(pairs);
    if (!flat) fail('flattestCalendar', 'null');
    else pass('flattestCalendar', `${flat.nearSymbol}→${flat.farSymbol} ${flat.forwardAnnualizedYield}%`);

    const analytics = A();
    if (analytics) {
      const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const hiRank = analytics.percentileRank(series, 10);
      const loRank = analytics.percentileRank(series, 1);
      if (!(hiRank >= 90)) fail('percentileRank monotonic high', `${hiRank}`);
      else pass('percentileRank monotonic high', `${hiRank}th for value 10`);
      if (!(loRank <= 15)) fail('percentileRank monotonic low', `${loRank}`);
      else pass('percentileRank monotonic low', `${loRank}th for value 1`);
      const q4 = analytics.quartileFromPercentile(92);
      const q1 = analytics.quartileFromPercentile(8);
      if (q4 !== 4 || q1 !== 1) fail('quartileFromPercentile', `q4=${q4} q1=${q1}`);
      else pass('quartileFromPercentile', 'Q4 for 92nd · Q1 for 8th');
      const enriched = analytics.enrichContractRows(contracts, { records: fakeRecords }, spot);
      if (!enriched[0]?.basisStats) fail('enrichContractRows', 'missing stats');
      else pass('enrichContractRows', `n=${enriched[0].historyN}`);
    } else {
      fail('BasisWatchAnalytics', 'module not loaded');
    }

    const allOk = results.every(r => r.ok);
    return { ok: allOk, passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results };
  }

  function syncControls(model) {
    document.querySelectorAll('.bw-view-tab').forEach(btn => btn.classList.toggle('bw-view-tab--active', btn.dataset.bwView === model.view));
    document.querySelectorAll('.bw-asset-btn').forEach(btn => btn.classList.toggle('bw-asset-btn--active', btn.dataset.bwAsset === model.assetKey));
    const roll = el('bwRollLogic'); if (roll) roll.value = getState().basisWatch?.rollLogic || loadPrefs().rollLogic || 'nearest';
    const mode = el('bwModeToggle'); if (mode) mode.value = model.mode;
  }

  function renderPanelChrome(state, model) {
    const panel = el('basisWatchPanel');
    if (!panel && !isStandalone()) return false;
    if (panel) {
      panel.classList.toggle('basis-watch-panel--collapsed', !!state.basisWatch?.collapsed);
    }
    const standalone = isStandalone();

    const status = el('bwStatusChip');
    if (status) {
      if (model.mode === 'snapshot') {
        status.textContent = 'Snapshot';
        status.className = 'bw-status-chip bw-status-chip--snapshot';
      } else if (model.curveStale) {
        status.textContent = 'Live · curve lag';
        status.className = 'bw-status-chip bw-status-chip--snapshot';
      } else {
        status.textContent = isStandalone() ? 'Live · Ark' : 'Live';
        status.className = 'bw-status-chip bw-status-chip--live';
      }
    }

    const note = el('bwDataNote');
    if (note) {
      if (model.dataNote) {
        note.textContent = model.dataNote;
      } else if (model.contracts.length) {
        const hyd = model.hydrationAsOf || model.hydrationDate;
        const fut = model.curveQuoteDate || model.asOf;
        if (hyd && fut && String(hyd).slice(0, 10) !== String(fut).slice(0, 10)) {
          note.textContent = `Hydration ${formatLocalStamp(hyd)} · Futures quote ${formatLocalStamp(fut)}`;
        } else if (hyd) {
          note.textContent = `Hydration ${formatLocalStamp(hyd)}`;
        } else {
          note.textContent = `As of ${formatLocalStamp(model.asOf)}`;
        }
      } else {
        note.textContent = '';
      }
    }

    const shapeBadge = el('bwShapeBadge');
    if (shapeBadge && standalone) {
      shapeBadge.className = `bw-shape-badge ${shapeBadgeClass(model.shape)}`;
      shapeBadge.textContent = `${model.shape} · ${model.rollLabel}`;
    }

    const curveTitle = document.querySelector('.bw-panel-head .bw-panel-title');
    if (curveTitle && standalone) {
      curveTitle.textContent = model.view === 'implied'
        ? 'Spot & forward curve rates'
        : 'Futures curve vs spot';
    }

    const curveMeta = el('bwCurveMeta');
    if (curveMeta) {
      const front = model.front;
      curveMeta.textContent = front
        ? `${model.asset.label} · ${front.symbol} · ${model.contracts.length} nodes`
        : `${model.asset.label} · awaiting curve`;
    }

    const summary = el('bwSummaryCards');
    if (summary) summary.innerHTML = renderSummaryCards(model, standalone);

    const callouts = el('bwCallouts');
    if (callouts) callouts.innerHTML = renderCallouts(model);

    syncControls(model);
    state._basisWatchModel = model;

    const buildBadge = el('bwBuildBadge');
    if (buildBadge) buildBadge.textContent = BW_BUILD;

    const footerStamp = el('bwFooterStamp');
    if (footerStamp) footerStamp.textContent = BW_BUILD;
    return true;
  }

  function renderPanelHeavy(state, model) {
    // Chunk 19 — dual BTC|ETH curve board sits below the chart mount.
    const dualHost = el('bwDualCurveTable');
    if (dualHost) {
      dualHost.innerHTML = renderDualCurveSection(model);
      dualHost.hidden = false;
    }

    const main = el('bwMainView');
    if (main) {
      const dualInline = dualHost ? '' : renderDualCurveSection(model);
      main.innerHTML = model.view === 'implied'
        ? `${dualInline}${renderImpliedTable(model)}`
        : `${dualInline}${renderHeatmap(model)}${renderBasisTable(model)}`;
    }

    const methodology = el('bwMethodology');
    if (methodology) methodology.innerHTML = renderMethodology(model);

    const cross = el('bwCrossAsset');
    if (cross) {
      cross.innerHTML = renderCrossAsset(model);
      cross.className = 'bw-xasset-host';
    }
  }

  function renderPanelChart(model) {
    drawBasisChart(model);
  }

  function renderPanel(state) {
    const model = state._basisWatchModel || buildModel(state, curveCache || { records: [] });
    if (!renderPanelChrome(state, model)) return;
    renderPanelHeavy(state, model);
    renderPanelChart(model);
  }

  async function renderPanelAsync(state, gen) {
    const model = state._basisWatchModel;
    if (!model || gen !== _refreshGen) return;
    if (!renderPanelChrome(state, model)) return;

    await yieldToMain();
    if (gen !== _refreshGen) return;
    renderPanelHeavy(state, model);

    await yieldToMain();
    if (gen !== _refreshGen) return;
    await new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve);
      else setTimeout(resolve, 0);
    });
    if (gen !== _refreshGen) return;
    renderPanelChart(model);
  }

  function persistBasisWatchPrefs(state) {
    const p = {
      asset: state.basisWatch?.asset || 'BTC',
      view: state.basisWatch?.view || 'basis',
      rollLogic: state.basisWatch?.rollLogic || 'nearest',
      mode: state.basisWatch?.mode || 'live',
    };
    savePrefs(p);
  }

  async function refreshOnce(state, hooks, gen) {
    await ensureCurveHistory();
    if (gen !== _refreshGen) return;

    if (state.basisWatch?.mode === 'snapshot' && state.basisWatch.snapshot) {
      curveCache = state.basisWatch.snapshot.curve || curveCache;
    }

    await yieldToMain();
    if (gen !== _refreshGen) return;

    state._basisWatchModel = buildModel(state, curveCache || { records: [] });
    persistBasisWatchPrefs(state);
    await renderPanelAsync(state, gen);
    if (gen !== _refreshGen) return;

    if (hooks?.renderAll && !hooks._fromRenderAll) {
      hooks.renderAll();
    }
  }

  async function drainRefreshQueue() {
    while (_pendingRefresh) {
      const job = _pendingRefresh;
      _pendingRefresh = null;
      await refreshOnce(job.state, job.hooks, job.gen);
    }
    _refreshLoop = null;
  }

  function refresh(state, hooks) {
    const gen = ++_refreshGen;
    _pendingRefresh = { state, hooks, gen };
    if (!_refreshLoop) {
      _refreshLoop = drainRefreshQueue().catch((err) => {
        console.warn('[BasisWatch] refresh failed', err);
        _refreshLoop = null;
      });
    }
    return _refreshLoop;
  }

  function exportCsv(state) {
    const model = state._basisWatchModel || buildModel(state, curveCache || { records: [] });
    const lines = [
      '# WTM BasisWatch export',
      '# Spot curve: futures vs spot',
      'section,contract,expiry,dte,futures,spot,basis_dollars,basis_pct,basis_pct_rank,basis_quartile,hist_q1,hist_median,hist_q3,spot_curve_pct_ann',
    ];
    model.contracts.forEach(c => lines.push([
      'spot_curve', c.symbol, c.label, c.dte, c.futuresPrice, model.spot,
      c.absBasis, c.spotBasisPct, c.basisPercentile, c.basisQuartile,
      c.histQ1, c.histMedian, c.histQ3, c.spotAnnualizedCarry,
    ].join(',')));
    lines.push('');
    lines.push('# Forward curve: adjacent calendar pairs');
    lines.push('section,near,far,near_dte,far_dte,interval_days,near_price,far_price,calendar_spread_dollars,forward_curve_pct_ann,forward_pct_rank,forward_quartile');
    model.calendarPairs.forEach(p => lines.push([
      'forward_curve', p.nearSymbol, p.farSymbol, p.nearDte, p.farDte, p.intervalDays,
      p.nearPrice, p.farPrice, p.calendarSpread, p.forwardAnnualizedYield,
      p.forwardPercentile, p.forwardQuartile,
    ].join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `wtm_basiswatch_${model.assetKey}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPng(state) {
    const model = state._basisWatchModel || buildModel(state, curveCache || { records: [] });
    const theme = getChartTheme();
    const exportW = 960;
    const exportH = isStandalone() ? 360 : 280;
    const off = document.createElement('canvas');
    const dpr = 2;
    off.width = exportW * dpr;
    off.height = exportH * dpr;
    const ctx = off.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    paintBasisChart(ctx, exportW, exportH, model, theme);

    const a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = `wtm_basiswatch_${model.assetKey || 'curve'}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();

    const btn = el('btnBwExportPng');
    if (btn) {
      if (!btn.dataset.bwLabel) btn.dataset.bwLabel = btn.textContent || 'Export PNG';
      btn.textContent = 'Saved';
      btn.classList.add('bw-btn--saved');
      setTimeout(() => {
        btn.textContent = btn.dataset.bwLabel;
        btn.classList.remove('bw-btn--saved');
      }, 1400);
    }
  }

  function captureSnapshot(state) {
    state.basisWatch = state.basisWatch || {};
    state.basisWatch.snapshot = { capturedAt: new Date().toISOString(), curve: curveCache ? JSON.parse(JSON.stringify(curveCache)) : null };
    state.basisWatch.mode = 'snapshot';
  }

  function wireControls(getState, hooks) {
    const markDirty = hooks?.markDirty || (() => {});

    el('btnBwCollapse')?.addEventListener('click', () => {
      const s = getState();
      s.basisWatch = s.basisWatch || {};
      s.basisWatch.collapsed = !s.basisWatch.collapsed;
      renderPanel(s);
      markDirty();
    });

    el('btnBwPopOut')?.addEventListener('click', () => {
      window.open(popOutUrl(getState()), '_blank', 'noopener,noreferrer');
    });

    document.getElementById('basisWatchPanel')?.addEventListener('click', (e) => {
      const btn = e.target.closest?.('[data-bw-null-action="refresh"]');
      if (!btn) return;
      e.preventDefault();
      if (typeof global.WTM_DeskOps?.triggerDeskRefresh === 'function') {
        global.WTM_DeskOps.triggerDeskRefresh();
        return;
      }
      reloadCurve(getState(), hooks);
    });

    el('btnBwTheme')?.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      renderPanel(getState());
      if (typeof global.dispatchEvent === 'function') {
        try { global.dispatchEvent(new CustomEvent('whinfell-theme-change', { detail: { theme: next } })); } catch { /* ignore */ }
      }
    });

    document.querySelectorAll('.bw-view-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = getState();
        s.basisWatch = s.basisWatch || {};
        s.basisWatch.view = btn.dataset.bwView || 'basis';
        refresh(s, hooks);
        markDirty();
      });
    });

    document.querySelectorAll('.bw-asset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = getState();
        s.basisWatch = s.basisWatch || {};
        const nextAsset = (btn.getAttribute('data-bw-asset') || btn.dataset.bwAsset || 'BTC').toUpperCase();
        s.basisWatch.asset = nextAsset === 'ETH' ? 'ETH' : 'BTC';
        // Drop cached model so chart/table rebuild from the selected asset immediately.
        s._basisWatchModel = null;
        savePrefs({ asset: s.basisWatch.asset, view: s.basisWatch.view, rollLogic: s.basisWatch.rollLogic, mode: s.basisWatch.mode });
        refresh(s, hooks);
        markDirty();
      });
    });

    el('bwRollLogic')?.addEventListener('change', e => {
      const s = getState();
      s.basisWatch = s.basisWatch || {};
      s.basisWatch.rollLogic = e.target.value;
      refresh(s, hooks);
      markDirty();
    });

    el('bwModeToggle')?.addEventListener('change', e => {
      const s = getState();
      s.basisWatch = s.basisWatch || {};
      if (e.target.value === 'snapshot') captureSnapshot(s);
      else s.basisWatch.mode = 'live';
      renderPanel(s);
      persistBasisWatchPrefs(s);
      markDirty();
    });

    el('btnBwRefresh')?.addEventListener('click', () => {
      if (typeof global.WTM_DeskOps?.triggerDeskRefresh === 'function') {
        global.WTM_DeskOps.triggerDeskRefresh();
        return;
      }
      reloadCurve(getState(), hooks);
    });

    el('btnBwExportCsv')?.addEventListener('click', () => exportCsv(getState()));
    el('btnBwExportPng')?.addEventListener('click', () => exportPng(getState()));
    el('btnBwArticulate')?.addEventListener('click', () => {
      const articulate = global.WTM_Articulate;
      if (!articulate || typeof articulate.runBasisWatch !== 'function') {
        console.warn('[BasisWatch] WTM_Articulate unavailable');
        if (typeof global.showToast === 'function') global.showToast('Articulate not loaded');
        return;
      }
      articulate.runBasisWatch(getState()).catch((err) => {
        console.warn('[BasisWatch] Articulate failed', err);
      });
    });
    el('btnBwBarchart')?.addEventListener('click', () => {
      window.open(DESK_LINKS.barchart, '_blank', 'noopener');
    });
    el('btnBwKoyfin')?.addEventListener('click', () => {
      window.open(DESK_LINKS.koyfin, '_blank', 'noopener');
    });
  }

  function init(hooks) {
    stateGetter = hooks?.getState || null;
    initTheme();
    initTooltips();
    wireControls(hooks.getState, hooks);
    ensureCurveHistory().then(() => {
      try { refresh(hooks.getState(), hooks); } catch (err) { console.warn('[BasisWatch] refresh skipped', err); }
    });
    window.addEventListener('resize', () => renderPanel(hooks.getState()));
  }

  /**
   * Surface Ark / protocol status on the standalone status chip.
   * Raw data always loads through WTM_Ark when protocol allows fetch.
   */
  function setStandaloneStatus(kind, text) {
    const chip = el('bwStatusChip');
    if (!chip) return;
    chip.textContent = text || '—';
    chip.classList.remove('bw-status-chip--live', 'bw-status-chip--snapshot');
    // Reuse existing chip chrome: live = green, snapshot/warn = amber.
    if (kind === 'live') chip.classList.add('bw-status-chip--live');
    else chip.classList.add('bw-status-chip--snapshot');
  }

  async function initStandalone() {
    initTheme();
    const params = new URLSearchParams(location.search);
    const prefs = loadPrefs();
    standaloneState = {
      basisWatch: {
        asset: params.get('asset') || prefs.asset || 'BTC',
        view: params.get('view') || prefs.view || 'basis',
        rollLogic: prefs.rollLogic || 'nearest',
        mode: 'live',
        collapsed: false,
      },
      hydration: {},
      btcL3: {},
      provenance: {},
    };

    // Chunk 17: standalone page requires The Ark for hydration + curve.
    const ark = getArk();
    const onFile = location.protocol === 'file:';
    if (!ark) {
      console.error('[BasisWatch] Chunk 17: WTM_Ark missing — include js/ark.js before basis_watch_panel.js');
      setStandaloneStatus('warn', 'Ark missing');
    } else if (onFile) {
      // Browsers block fetch of local JSON under file:; serve via http (dist/).
      console.warn('[BasisWatch] file: protocol — serve Whinfell_BasisWatch.html over http so Ark can load data/');
      setStandaloneStatus('warn', 'Serve via http');
    } else {
      setStandaloneStatus('live', 'Live');
    }

    // Hydration + curve only via WTM_Ark (loadHydrationBundle / ensureCurveHistory).
    const bundle = await loadHydrationBundle({ force: true });
    if (bundle) mergeHydrationBundle(standaloneState, bundle);

    stateGetter = () => standaloneState;
    initTooltips();
    wireControls(() => standaloneState, {});
    await ensureCurveHistory();
    await refresh(standaloneState, {});

    // Confirm stamp after Ark loads (standalone single-page boot).
    if (ark && typeof ark.getStamp === 'function' && !onFile) {
      const stamp = ark.getStamp() || {};
      if (stamp.snapshot_id || stamp.as_of) {
        setStandaloneStatus('live', stamp.snapshot_id ? 'Live · Ark' : 'Live');
      } else if (!bundle) {
        setStandaloneStatus('warn', 'No hydration');
      }
    }

    window.addEventListener('resize', () => renderPanel(standaloneState));

    window.addEventListener('whinfell-desk-refresh', () => {
      reloadCurve(standaloneState, {}).catch((err) => {
        console.warn('[BasisWatch] desk refresh failed', err);
      });
    });

    window.addEventListener('storage', e => {
      if (e.key === PREFS_KEY || e.key === THEME_KEY) {
        if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue);
        const p = loadPrefs();
        standaloneState.basisWatch = { ...standaloneState.basisWatch, ...p };
        refresh(standaloneState, {});
      }
    });
  }

  global.WTM_BasisWatch = {
    init, initStandalone, getState, render: renderPanel, refresh, reloadCurve, reloadHydration,
    invalidateCurveCache, exportCsv, exportPng,
    buildModel, buildContracts, buildCalendarPairs, computeSpotAnnualizedCarry, resolveBasisValuation,
    buildAssetBoard, buildDualCurveBoards, renderDualCurveSection,
    hydrationBasisSpot, ensureCurveHistory,
    popOutUrl, applyTheme, runBasisWatchValidation, DESK_LINKS, BW_BUILD, MIN_ANN_DTE, DUAL_CURVE_MAX,
  };

  if (document.body?.dataset?.bwLayout === 'standalone') {
    document.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(location.search);
      if (params.get('selftest') === '1') {
        const report = runBasisWatchValidation();
        const banner = document.createElement('div');
        banner.className = report.ok ? 'bw-selftest bw-selftest--ok' : 'bw-selftest bw-selftest--fail';
        banner.innerHTML = `<strong>Self-test ${report.ok ? 'PASSED' : 'FAILED'}</strong> — ${report.passed}/${report.results.length} checks` +
          report.results.map(r => `<div class="bw-selftest-row ${r.ok ? 'bw-selftest-row--ok' : 'bw-selftest-row--fail'}">${r.ok ? '✓' : '✗'} ${r.name}: ${r.detail || ''}</div>`).join('');
        document.body.prepend(banner);
        if (!report.ok) console.error('BasisWatch self-test failed', report);
      }
      initStandalone();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);