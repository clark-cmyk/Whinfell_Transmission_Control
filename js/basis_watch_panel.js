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

  const BW_BUILD = '3.0-BASISWATCH-QUARTILES-2026-07-01';
  const THEME_COLORS = { dark: '#090d12', light: '#eef1f5' };
  const PREFS_KEY = 'whinfell_basiswatch_prefs';
  const THEME_KEY = 'whinfell_tc_theme';
  const HYDRATION_URL = 'data/hydration/latest.json';
  const CURVE_URL = 'data/barchart/v1/barchart_curve_history.json';

  /** Clark desk shortcuts — saved Barchart watchlist + Koyfin MYD */
  const DESK_LINKS = {
    barchart: 'https://www.barchart.com/my/watchlist?viewName=197689',
    koyfin: 'https://app.koyfin.com/myd/55782528-369d-4f09-a6fb-4b1d041a6656',
  };

  const CME_MONTH = { F: 0, G: 1, H: 2, J: 3, K: 4, M: 5, N: 6, Q: 7, U: 8, V: 9, X: 10, Z: 11 };
  const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ASSETS = {
    BTC: { root: 'BT', spotKey: 'btc_spot_usd', label: 'Bitcoin' },
    ETH: { root: 'ETH', spotKey: 'eth_spot_usd', label: 'Ethereum' },
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
  let _refreshGen = 0;
  let _refreshLoop = null;
  let _pendingRefresh = null;
  const isStandalone = () => document.body?.dataset?.bwLayout === 'standalone';

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

  function daysBetween(a, b) { return Math.max(1, Math.round((b - a) / 86400000)); }
  function daysToExpiry(expiry, asOf = new Date()) { return daysBetween(asOf, expiry); }

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

  function applyHydrationQuartileFallback(contracts, front, hydration) {
    if (!front || !hydration) return;
    const h = rvHorizon(hydration, 'basis', 'btc_basis_vs_refs');
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

  function applyHydrationForwardFallback(pairs, frontPair, hydration) {
    if (!pairs.length || !hydration) return;
    const h = rvHorizon(hydration, 'basis', 'btc_calendar_bt_near_deferred');
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

  function invalidateCurveCache() {
    curveCache = null;
    curveFetchPromise = null;
  }

  async function reloadCurve(state, hooks) {
    invalidateCurveCache();
    if (isStandalone() && state.hydration) {
      const bundle = await loadHydrationBundle();
      if (bundle) {
        state.hydration = {
          ...state.hydration,
          ...bundle,
          crypto_sleeve: bundle.crypto_sleeve,
          global: bundle.global,
          execution: bundle.execution,
          as_of: bundle.as_of,
          task_force_panels: bundle.task_force_panels
            || global.WTM_TaskForceFeed?.extractTaskForcePanels?.(bundle.task_force),
        };
      }
    }
    if (state.basisWatch) state.basisWatch.mode = 'live';
    return refresh(state, hooks);
  }

  async function ensureCurveHistory() {
    if (curveCache) return curveCache;
    if (curveFetchPromise) return curveFetchPromise;
    if (location.protocol === 'file:') {
      curveCache = { records: [] };
      return curveCache;
    }
    curveFetchPromise = fetch(`${CURVE_URL}?_=${Date.now()}`)
      .then(r => (r.ok ? r.json() : { records: [] }))
      .then(data => { curveCache = data || { records: [] }; return curveCache; })
      .catch(() => { curveCache = { records: [] }; return curveCache; });
    return curveFetchPromise;
  }

  async function loadHydrationBundle() {
    if (location.protocol === 'file:') return null;
    try {
      const res = await fetch(`${HYDRATION_URL}?_=${Date.now()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function recordsForRoot(records, root) {
    return (records || []).filter(r => {
      const meta = r.contract_meta || {};
      return meta.contract_root === root || String(r.raw_symbol || '').startsWith(root);
    });
  }

  function buildContracts(records, spot, asOfDate) {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    return records.map(r => {
      const parsed = parseCmeSymbol(r.raw_symbol);
      if (!parsed) return null;
      const futuresPrice = Number(r.latest?.close ?? r.points?.[r.points.length - 1]?.close);
      if (!Number.isFinite(futuresPrice) || futuresPrice <= 0) return null;
      const dte = daysToExpiry(parsed.expiry, asOf);
      if (dte < 0) return null;
      const absBasis = futuresPrice - spot;
      const spotBasisPct = spot > 0 ? (absBasis / spot) * 100 : null;
      const spotAnnualizedCarry = spot > 0 && dte > 0 ? ((futuresPrice / spot) - 1) * (365 / dte) * 100 : null;
      return {
        symbol: r.raw_symbol, label: parsed.label, expiry: parsed.expiry, dte,
        futuresPrice, spotPrice: spot,
        absBasis, spotBasisPct, spotAnnualizedCarry,
        price: futuresPrice, pctBasis: spotBasisPct, annBasis: spotAnnualizedCarry,
        chg: Number(r.latest?.change), pctChg: Number(r.latest?.pct_change),
      };
    }).filter(Boolean).sort((a, b) => a.expiry - b.expiry);
  }

  function synthesizeEthCurve(btcContracts, ethSpot, btcSpot) {
    if (!btcContracts.length || !ethSpot || !btcSpot) return [];
    const ratio = ethSpot / btcSpot;
    return btcContracts.map(c => {
      const futuresPrice = c.futuresPrice * ratio;
      const absBasis = futuresPrice - ethSpot;
      const spotBasisPct = (absBasis / ethSpot) * 100;
      return {
        ...c, symbol: c.symbol.replace(/^BT/, 'ETH'),
        futuresPrice, spotPrice: ethSpot, price: futuresPrice,
        absBasis, spotBasisPct, pctBasis: spotBasisPct,
        spotAnnualizedCarry: c.spotAnnualizedCarry, annBasis: c.spotAnnualizedCarry,
        synthetic: true,
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
    const spot = Number(spotRec?.last_price);
    const spotChg = Number(spotRec?.chg_1d ?? spotRec?.['1_day']) * 100;
    const asOf = state.hydration?.as_of || state.provenance?.dataAsOf || new Date().toISOString();

    let contracts = buildContracts(recordsForRoot(records, asset.root), spot, asOf);
    let dataNote = '';
    if (!contracts.length && assetKey === 'ETH' && spot > 0) {
      const btcSpot = Number(sleeve.btc_spot_usd?.last_price);
      contracts = synthesizeEthCurve(buildContracts(recordsForRoot(records, 'BT'), btcSpot, asOf), spot, btcSpot);
      dataNote = 'ETH curve synthesized from BTC term structure · wire CME ETH futures for live curve';
    } else if (!contracts.length) {
      dataNote = isStandalone() ? 'Loading hydration bundle…' : 'Import hydration + publish desk preview for Barchart curve JSON';
    }

    const rollLogic = prefs.rollLogic || 'nearest';
    let front = pickFrontContract(contracts, rollLogic, state.btcL3?.nearMonth || '');
    let calendarPairs = buildCalendarPairs(contracts);

    global._bwHydrationRef = state.hydration;
    const analytics = A();
    if (analytics) {
      contracts = analytics.enrichContractRows(contracts, curveData || { records }, spot);
      calendarPairs = analytics.enrichCalendarPairs(calendarPairs, curveData || { records });
      applyHydrationQuartileFallback(contracts, front, state.hydration);
      const steepestPair = steepestCalendar(calendarPairs);
      applyHydrationForwardFallback(calendarPairs, steepestPair, state.hydration);
      front = contracts.find(c => c.symbol === front?.symbol) || front;
    }

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
      assetKey, asset, spot, spotChg: Number.isFinite(spotChg) ? spotChg : null, asOf,
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
    return dte > 0 ? 365 / dte : null;
  }

  function spotAnnDecomposition(c) {
    const factor = spotAnnFactor(c.dte);
    if (!Number.isFinite(c.spotBasisPct) || !Number.isFinite(factor)) return unavailSpan('na');
    return `${fmtPct(c.spotBasisPct, 2)} × ${factor.toFixed(2)}`;
  }

  function renderSummaryCards(model, standalone) {
    const front = model.front;
    const spot = model.spot;
    const hi = standalone ? ' bw-card--highlight' : '';
    const rankMeta = front && Number.isFinite(front.basisPercentile)
      ? `${fmtPercentile(front.basisPercentile)} · ${quartileRichnessLabel(front.basisQuartile)}`
      : (front?.insufficientHistory ? 'History building' : unavailSpan('awaiting'));
    return `
      <div class="bw-card"><span class="bw-card-label">Spot · CF proxy</span><strong class="bw-card-value">${spot > 0 ? '$' + fmtNum(spot, 0) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${Number.isFinite(model.spotChg) ? fmtPct(model.spotChg) + ' 1d' : unavailSpan('na')}</span></div>
      <div class="bw-card"><span class="bw-card-label">Front basis ($)</span><strong class="bw-card-value bw-card-value--secondary">${front ? '$' + fmtNum(front.absBasis, 0) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${front ? front.symbol + ' · ' + front.dte + 'd' : unavailSpan('awaiting')}</span></div>
      <div class="bw-card${hi}"><span class="bw-card-label">Front basis % vs spot <button type="button" class="bw-tip" data-bw-tip="basisPct" aria-label="Basis % definition">?</button></span><strong class="bw-card-value bw-card-value--primary">${front ? fmtPct(front.spotBasisPct) : unavailSpan('awaiting')}</strong><span class="bw-card-meta">${front ? interpretationFromPercentile(front.basisPercentile) : unavailSpan('awaiting')}</span></div>
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
    return `<h4 class="bw-subhead">Spot curve · futures vs spot</h4><p class="bw-methodology-inline">Spot Curve % = Basis % × (365 ÷ DTE) · Quartiles from hydrated history</p><div class="bw-table-wrap"><table class="bw-table"><thead><tr><th>Contract</th><th>Expiry</th><th>DTE</th><th>Futures</th><th>Basis ($)</th><th>Basis %</th><th>Rank</th><th>Quartile</th><th>Hist Q1/Med/Q3</th><th>×365/DTE</th><th>Spot Curve % (ann.)</th><th>Chg</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderImpliedTable(model) {
    if (!model.contracts.length) return renderBasisNullState();
    const spotRows = model.contracts.map(c => `<tr class="${model.front && c.symbol === model.front.symbol ? 'bw-row-front' : ''}"><td>${c.symbol}</td><td>${c.dte}d</td><td class="bw-col-primary"><strong>${fmtPctDisplay(c.spotBasisPct)}</strong></td><td>${Number.isFinite(c.basisPercentile) ? fmtPercentile(c.basisPercentile) : unavailSpan('na')}</td><td class="bw-decomp">${spotAnnDecomposition(c)}</td><td class="${heatClass(c.spotAnnualizedCarry)}">${fmtPctDisplay(c.spotAnnualizedCarry)}</td></tr>`).join('');
    const fwdRows = model.calendarPairs.map(p => `<tr><td>${p.nearSymbol} → ${p.farSymbol}</td><td>${p.intervalDays}d</td><td class="${heatClass(p.forwardAnnualizedYield)} ${p.forwardHeatClass || ''}"><strong>${fmtPctDisplay(p.forwardAnnualizedYield)}</strong></td><td>${Number.isFinite(p.forwardPercentile) ? fmtPercentile(p.forwardPercentile) : unavailSpan('na')}</td><td>${p.forwardQuartile ? quartileBadge(p.forwardQuartile, quartileRichnessLabel(p.forwardQuartile)) : unavailSpan('na')}</td><td class="bw-col-secondary">$${fmtNumDisplay(p.calendarSpread, 0)}</td></tr>`).join('');
    return `<div class="bw-implied-grid">
      <div class="bw-panel" style="border:none;box-shadow:none"><h4 class="bw-subhead">Spot curve % (ann.)</h4><p class="bw-methodology-inline">Basis % × (365/DTE) — equivalent to ((F/S)−1)×(365/DTE)</p><div class="bw-table-wrap"><table class="bw-table bw-table--compact"><thead><tr><th>Tenor</th><th>DTE</th><th>Basis %</th><th>Rank</th><th>×365/DTE</th><th>Spot Curve %</th></tr></thead><tbody>${spotRows}</tbody></table></div></div>
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
    const asOf = String(model.asOf || '').slice(0, 19).replace('T', ' ');
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
        <span class="bw-xasset-asof">${asOf ? 'As of ' + asOf + ' UTC' : ''}</span>
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

  function drawBasisChart(model) {
    const canvas = el('bwCurveCanvas');
    if (!canvas) return;
    const theme = getChartTheme();
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const h = isStandalone() ? 280 : Math.max(110, rect.height);
    canvas.width = Math.max(280, rect.width) * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    ctx.clearRect(0, 0, w, h);
    const contracts = model.contracts;
    if (!contracts.length || !(model.spot > 0)) {
      ctx.fillStyle = theme.empty;
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText('Curve populates after hydration + Barchart curve JSON', 16, h / 2);
      return;
    }

    const legend = el('bwChartLegend');
    if (model.view === 'implied') {
      if (legend) legend.innerHTML = `
        <span class="bw-legend-item"><i class="bw-legend-swatch" style="background:var(--bw-chart-curve)"></i>Spot curve % (ann.)</span>
        <span class="bw-legend-item"><i class="bw-legend-swatch" style="background:var(--bw-chart-front)"></i>Forward curve % (ann.)</span>`;
      const spotDtes = contracts.map(c => c.dte);
      const spotRates = contracts.map(c => c.spotAnnualizedCarry ?? 0);
      const fwdDtes = model.calendarPairs.map(p => (p.nearDte + p.farDte) / 2);
      const fwdRates = model.calendarPairs.map(p => p.forwardAnnualizedYield ?? 0);
      const allRates = [...spotRates, ...fwdRates].filter(Number.isFinite);
      const yMin = Math.min(0, ...allRates) - 1;
      const yMax = Math.max(...allRates, 1) + 1;
      const maxDte = Math.max(...spotDtes, ...model.calendarPairs.map(p => p.farDte), 1);
      const pad = { l: 48, r: 16, t: 18, b: 32 };
      const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
      const yAt = r => pad.t + plotH - ((r - yMin) / (yMax - yMin || 1)) * plotH;

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
      ctx.font = '9px system-ui';
      ctx.fillText('DTE →', w - pad.r - 36, h - 8);
      ctx.save();
      ctx.translate(12, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('% ann.', 0, 0);
      ctx.restore();
      return;
    }

    if (legend) legend.innerHTML = `
      <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--spot"></i>Spot (CF proxy)</span>
      <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--curve"></i>Futures curve</span>
      <span class="bw-legend-item"><i class="bw-legend-swatch bw-legend-swatch--front"></i>Front contract</span>`;

    const prices = [model.spot, ...contracts.map(c => c.futuresPrice)];
    const minP = Math.min(...prices) * 0.998, maxP = Math.max(...prices) * 1.002;
    const pad = { l: 52, r: 16, t: 18, b: 32 };
    const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
    const xAt = i => pad.l + (i / Math.max(1, contracts.length)) * plotW;
    const yAt = p => pad.t + plotH - ((p - minP) / (maxP - minP || 1)) * plotH;

    ctx.strokeStyle = theme.grid;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = theme.spotLine;
    ctx.beginPath(); ctx.moveTo(pad.l, yAt(model.spot)); ctx.lineTo(w - pad.r, yAt(model.spot)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.spotLabel;
    ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(`Spot $${fmtNum(model.spot, 0)}`, pad.l + 6, yAt(model.spot) - 6);

    const grad = ctx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    grad.addColorStop(0, theme.curve);
    grad.addColorStop(1, theme.front);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    contracts.forEach((c, i) => { const x = xAt(i + 1), y = yAt(c.futuresPrice); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.lineWidth = 1;

    contracts.forEach((c, i) => {
      const x = xAt(i + 1), y = yAt(c.futuresPrice);
      const isFront = model.front && c.symbol === model.front.symbol;
      ctx.fillStyle = isFront ? theme.front : theme.node;
      ctx.beginPath(); ctx.arc(x, y, isFront ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = theme.axis;
      ctx.font = '9px system-ui';
      ctx.fillText(c.symbol.replace(/\d{2}$/, ''), x - 10, h - 10);
    });
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
    const roll = el('bwRollLogic'); if (roll) roll.value = (standaloneState || {}).basisWatch?.rollLogic || loadPrefs().rollLogic || 'nearest';
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
      status.textContent = model.mode === 'snapshot' ? 'Snapshot' : 'Live';
      status.className = `bw-status-chip bw-status-chip--${model.mode}`;
    }

    const note = el('bwDataNote');
    if (note) note.textContent = model.dataNote || (model.contracts.length ? `As of ${String(model.asOf).slice(0, 19)}` : '');

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
    const main = el('bwMainView');
    if (main) {
      main.innerHTML = model.view === 'implied'
        ? renderImpliedTable(model)
        : `${renderHeatmap(model)}${renderBasisTable(model)}`;
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
    const canvas = el('bwCurveCanvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `wtm_basiswatch_curve_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
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
        s.basisWatch.asset = btn.dataset.bwAsset || 'BTC';
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
    el('btnBwBarchart')?.addEventListener('click', () => {
      window.open(DESK_LINKS.barchart, '_blank', 'noopener');
    });
    el('btnBwKoyfin')?.addEventListener('click', () => {
      window.open(DESK_LINKS.koyfin, '_blank', 'noopener');
    });
  }

  function init(hooks) {
    initTheme();
    initTooltips();
    wireControls(hooks.getState, hooks);
    ensureCurveHistory().then(() => {
      try { refresh(hooks.getState(), hooks); } catch (err) { console.warn('[BasisWatch] refresh skipped', err); }
    });
    window.addEventListener('resize', () => renderPanel(hooks.getState()));
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

    const bundle = await loadHydrationBundle();
    if (bundle) {
      standaloneState.hydration = {
        crypto_sleeve: bundle.crypto_sleeve,
        global: bundle.global,
        execution: bundle.execution,
        as_of: bundle.as_of,
        node_cockpits: bundle.node_cockpits,
        task_force_panels: bundle.task_force_panels
          || global.WTM_TaskForceFeed?.extractTaskForcePanels?.(bundle.task_force),
      };
      standaloneState.provenance = { dataAsOf: bundle.as_of, hydratedAt: new Date().toISOString() };
    }

    initTooltips();
    wireControls(() => standaloneState, {});
    await ensureCurveHistory();
    await refresh(standaloneState, {});
    window.addEventListener('resize', () => renderPanel(standaloneState));

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
    init, initStandalone, render: renderPanel, refresh, reloadCurve, invalidateCurveCache,
    exportCsv, exportPng,
    buildModel, buildContracts, buildCalendarPairs, ensureCurveHistory, popOutUrl, applyTheme,
    runBasisWatchValidation, DESK_LINKS, BW_BUILD,
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