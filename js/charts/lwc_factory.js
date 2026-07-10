/**
 * WTM Charts — TradingView Lightweight Charts factory (Phase 2.4 Chunk 29).
 *
 * Desk full-size charts must use LWC only:
 *   - line / candlestick series (no area gradients, glows, neon multi-series)
 *   - series color = theme accent (WTM_Theme.getAccent / --wtm-accent)
 *   - subtle grid (--wtm-chart-grid)
 *   - tight scaleMargins (~0.05)
 *   - ResizeObserver → chart.resize for zoom stability foundation
 *
 * Data loading remains via The Ark; this module is presentation-only.
 */
(function wtmChartsFactory(global) {
  'use strict';

  const SCALE_MARGINS = Object.freeze({ top: 0.05, bottom: 0.05 });
  /** Synthetic epoch for DTE→time mapping (approach A): UTC 2020-01-01 + dte days. */
  const DTE_EPOCH_UTC_SEC = Math.floor(Date.UTC(2020, 0, 1) / 1000);
  const DAY_SEC = 86400;

  function getLightweightCharts() {
    if (typeof global.LightweightCharts !== 'undefined') return global.LightweightCharts;
    return null;
  }

  function isAvailable() {
    const LWC = getLightweightCharts();
    return !!(LWC && typeof LWC.createChart === 'function');
  }

  /**
   * Resolve theme tokens for chart options from WTM_Theme / CSS variables.
   */
  function resolveThemeTokens(themeOverride) {
    if (themeOverride && typeof themeOverride === 'object') {
      return {
        bg: themeOverride.bg || themeOverride.surface || '#0A0A0A',
        surface: themeOverride.surface || themeOverride.bg || '#1A1A1A',
        text: themeOverride.text || '#FFFFFF',
        accent: themeOverride.accent || '#228B22',
        muted: themeOverride.muted || 'rgba(255,255,255,0.6)',
        grid: themeOverride.grid || themeOverride.chartGrid || 'rgba(255,255,255,0.07)',
        axis: themeOverride.axis || themeOverride.chartAxis || 'rgba(255,255,255,0.6)',
      };
    }

    let accent = '#228B22';
    let bg = '#0A0A0A';
    let surface = '#1A1A1A';
    let text = '#FFFFFF';
    let muted = 'rgba(255,255,255,0.6)';
    let grid = 'rgba(255,255,255,0.07)';
    let axis = 'rgba(255,255,255,0.6)';

    try {
      if (typeof getComputedStyle === 'function' && global.document?.documentElement) {
        const s = getComputedStyle(global.document.documentElement);
        const v = (name) => s.getPropertyValue(name).trim();
        bg = v('--wtm-bg') || bg;
        surface = v('--wtm-surface') || surface;
        text = v('--wtm-text') || text;
        accent = v('--wtm-chart-line') || v('--wtm-accent') || accent;
        muted = v('--wtm-muted') || muted;
        grid = v('--wtm-chart-grid') || grid;
        axis = v('--wtm-chart-axis') || muted || axis;
      }
    } catch (_) {
      /* non-DOM / test shim */
    }

    // WTM_Theme is authoritative when present (survives CSS lag / test shims).
    if (global.WTM_Theme) {
      if (typeof global.WTM_Theme.getTheme === 'function') {
        const t = global.WTM_Theme.getTheme();
        if (t) {
          bg = t.bg || bg;
          surface = t.surface || surface;
          text = t.text || text;
          accent = t.accent || accent;
        }
      }
      if (typeof global.WTM_Theme.getAccent === 'function') {
        accent = global.WTM_Theme.getAccent() || accent;
      }
    }

    return { bg, surface, text, accent, muted, grid, axis };
  }

  /**
   * Build institutional LWC chart options from theme tokens.
   * No area fills, no glow chrome — clean grid + tight scale only.
   */
  function buildChartOptions(theme) {
    const t = resolveThemeTokens(theme);
    return {
      layout: {
        background: { type: 'solid', color: t.surface || t.bg },
        textColor: t.axis || t.muted || t.text,
        fontSize: 11,
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      },
      grid: {
        vertLines: { color: t.grid, style: 0, visible: true },
        horzLines: { color: t.grid, style: 0, visible: true },
      },
      crosshair: {
        mode: 1, /* CrosshairMode.Normal when LWC loaded */
        vertLine: { color: t.muted, width: 1, style: 3, labelBackgroundColor: t.surface },
        horzLine: { color: t.muted, width: 1, style: 3, labelBackgroundColor: t.surface },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: SCALE_MARGINS.top, bottom: SCALE_MARGINS.bottom },
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: { top: SCALE_MARGINS.top, bottom: SCALE_MARGINS.bottom },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 2,
        minBarSpacing: 4,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    };
  }

  /** Default line series options — accent stroke, no gradient area. */
  function buildLineSeriesOptions(theme, overrides) {
    const t = resolveThemeTokens(theme);
    const base = {
      color: t.accent,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
      lastValueVisible: true,
      priceLineVisible: false,
    };
    return Object.assign(base, overrides || {});
  }

  /**
   * Map a DTE (days to expiry) ordinal onto a synthetic UTC timestamp so LWC
   * can use a time scale while preserving rate-vs-DTE spacing semantics.
   * Approach A: epoch (2020-01-01 UTC) + dte * 86400 seconds.
   */
  function dteToUtcTime(dte) {
    const n = Number(dte);
    if (!Number.isFinite(n)) return DTE_EPOCH_UTC_SEC;
    return DTE_EPOCH_UTC_SEC + Math.round(n) * DAY_SEC;
  }

  /**
   * Convert [{ dte, value }] (or value key) into LWC line data sorted by time.
   */
  function mapDteSeries(points, valueKey) {
    const key = valueKey || 'value';
    const out = [];
    (points || []).forEach((p) => {
      if (!p) return;
      const dte = p.dte != null ? p.dte : p.x;
      const value = p[key] != null ? p[key] : p.value;
      if (!Number.isFinite(Number(dte)) || !Number.isFinite(Number(value))) return;
      out.push({ time: dteToUtcTime(dte), value: Number(value) });
    });
    out.sort((a, b) => a.time - b.time);
    return dedupeByTime(out);
  }

  /**
   * Convert ISO date strings / Date / unix into LWC time points.
   * Prefer business-day strings (YYYY-MM-DD) for daily series.
   */
  function mapTimeSeries(points, valueKey, timeKey) {
    const vKey = valueKey || 'value';
    const tKey = timeKey || 'time';
    const out = [];
    (points || []).forEach((p) => {
      if (!p) return;
      const rawT = p[tKey] != null ? p[tKey] : p.date || p.trade_date;
      const value = Number(p[vKey] != null ? p[vKey] : p.value);
      if (!Number.isFinite(value)) return;
      const time = normalizeTime(rawT);
      if (time == null) return;
      out.push({ time, value });
    });
    out.sort((a, b) => {
      const ta = typeof a.time === 'number' ? a.time : String(a.time);
      const tb = typeof b.time === 'number' ? b.time : String(b.time);
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    return dedupeByTime(out);
  }

  function normalizeTime(raw) {
    if (raw == null) return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      // Heuristic: ms vs sec
      return raw > 1e12 ? Math.floor(raw / 1000) : Math.floor(raw);
    }
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const ms = Date.parse(s);
    if (Number.isFinite(ms)) return Math.floor(ms / 1000);
    return null;
  }

  function dedupeByTime(rows) {
    const map = new Map();
    rows.forEach((r) => map.set(r.time, r));
    return Array.from(map.values()).sort((a, b) => {
      const ta = typeof a.time === 'number' ? a.time : String(a.time);
      const tb = typeof b.time === 'number' ? b.time : String(b.time);
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
  }

  /**
   * Sequential bar times for non-temporal ordinal axes (e.g. RV horizons).
   * Uses epoch + index days so spacing is even.
   */
  function mapOrdinalSeries(values) {
    const out = [];
    (values || []).forEach((v, i) => {
      const value = typeof v === 'object' ? Number(v.value) : Number(v);
      if (!Number.isFinite(value)) return;
      out.push({ time: DTE_EPOCH_UTC_SEC + i * DAY_SEC, value });
    });
    return out;
  }

  function containerSize(container) {
    if (!container) return { width: 0, height: 0 };
    const rect = typeof container.getBoundingClientRect === 'function'
      ? container.getBoundingClientRect()
      : { width: container.clientWidth || 0, height: container.clientHeight || 0 };
    let width = Math.floor(Number(rect.width) || container.clientWidth || 0);
    let height = Math.floor(Number(rect.height) || container.clientHeight || 0);
    if (width < 8 && container.parentElement) {
      const pr = container.parentElement.getBoundingClientRect?.() || {};
      width = Math.floor(Number(pr.width) || 0) || width;
      height = Math.floor(Number(pr.height) || 0) || height;
    }
    return { width, height };
  }

  /**
   * Create a line chart in `container`.
   * @param {HTMLElement} container
   * @param {Array|{primary:Array, secondary?:Array}} seriesData — LWC {time,value}[] or multi
   * @param {object} [opts]
   * @returns {{ chart, series, secondarySeries, setData, applyTheme, resize, destroy, takeScreenshot, container }}
   */
  function createLineChart(container, seriesData, opts) {
    const options = opts || {};
    if (!container) {
      return null;
    }
    if (!isAvailable()) {
      console.warn('[WTM_Charts] LightweightCharts not loaded — chart mount skipped');
      return null;
    }
    const LWC = getLightweightCharts();
    const tokens = resolveThemeTokens(options.theme);
    const chartOpts = Object.assign(buildChartOptions(tokens), options.chartOptions || {});
    if (LWC.ColorType && chartOpts.layout?.background && !chartOpts.layout.background.type) {
      chartOpts.layout.background = { type: LWC.ColorType.Solid, color: tokens.surface };
    }
    if (LWC.CrosshairMode && chartOpts.crosshair) {
      chartOpts.crosshair.mode = LWC.CrosshairMode.Normal;
    }

    // Ensure container is a positioned block for LWC
    if (container.style) {
      if (!container.style.position || container.style.position === 'static') {
        container.style.position = 'relative';
      }
      if (!container.style.width) container.style.width = '100%';
      if (!container.style.height && !container.clientHeight) {
        container.style.minHeight = options.minHeight ? `${options.minHeight}px` : '120px';
      }
    }

    const size = containerSize(container);
    if (size.width >= 8) chartOpts.width = size.width;
    if (size.height >= 8) chartOpts.height = size.height;

    const chart = LWC.createChart(container, chartOpts);
    const lineOpts = buildLineSeriesOptions(tokens, options.seriesOptions);
    const series = chart.addLineSeries(lineOpts);

    let secondarySeries = null;
    if (options.secondary) {
      const secColor = options.secondary.color || tokens.muted;
      secondarySeries = chart.addLineSeries(buildLineSeriesOptions(tokens, {
        color: secColor,
        lineWidth: options.secondary.lineWidth || 1.5,
        lastValueVisible: false,
        priceLineVisible: false,
      }));
    }

    function setData(data) {
      if (!data) {
        series.setData([]);
        if (secondarySeries) secondarySeries.setData([]);
        return;
      }
      if (Array.isArray(data)) {
        series.setData(data);
        if (options.fitContent !== false) chart.timeScale().fitContent();
        return;
      }
      if (data.primary) series.setData(data.primary);
      if (secondarySeries && data.secondary) secondarySeries.setData(data.secondary);
      if (options.fitContent !== false) chart.timeScale().fitContent();
    }

    // Initial data
    if (seriesData) setData(seriesData);

    function applyTheme(theme) {
      applyThemeToChart(chart, series, theme, secondarySeries);
    }

    function resize(w, h) {
      const next = containerSize(container);
      const width = w != null ? w : next.width;
      const height = h != null ? h : next.height;
      if (width >= 8 && height >= 8 && typeof chart.resize === 'function') {
        chart.resize(width, height);
      }
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && options.observeResize !== false) {
      ro = new ResizeObserver(() => {
        resize();
      });
      ro.observe(container);
    }

    function destroy() {
      if (ro) {
        try { ro.disconnect(); } catch (_) { /* ignore */ }
        ro = null;
      }
      try {
        chart.remove();
      } catch (_) {
        /* already removed */
      }
      if (container) {
        try { container.innerHTML = ''; } catch (_) { /* ignore */ }
      }
    }

    function takeScreenshot() {
      if (typeof chart.takeScreenshot === 'function') {
        return chart.takeScreenshot();
      }
      return null;
    }

    // Live theme updates
    if (options.listenTheme !== false && typeof global.addEventListener === 'function') {
      const onTheme = () => applyTheme();
      global.addEventListener('wtm:themechange', onTheme);
      const prevDestroy = destroy;
      // wrap destroy to drop listener
      const destroyWithListener = () => {
        try { global.removeEventListener('wtm:themechange', onTheme); } catch (_) { /* ignore */ }
        prevDestroy();
      };
      return {
        chart,
        series,
        secondarySeries,
        setData,
        applyTheme,
        resize,
        destroy: destroyWithListener,
        takeScreenshot,
        container,
        tokens,
      };
    }

    return {
      chart,
      series,
      secondarySeries,
      setData,
      applyTheme,
      resize,
      destroy,
      takeScreenshot,
      container,
      tokens,
    };
  }

  function applyThemeToChart(chart, series, theme, secondarySeries) {
    if (!chart) return;
    const t = resolveThemeTokens(theme);
    const opts = buildChartOptions(t);
    try {
      chart.applyOptions({
        layout: opts.layout,
        grid: opts.grid,
        crosshair: opts.crosshair,
        rightPriceScale: opts.rightPriceScale,
        timeScale: opts.timeScale,
      });
    } catch (_) {
      /* ignore */
    }
    if (series && typeof series.applyOptions === 'function') {
      series.applyOptions({ color: t.accent });
    }
    if (secondarySeries && typeof secondarySeries.applyOptions === 'function') {
      secondarySeries.applyOptions({ color: t.muted });
    }
  }

  function destroyChart(handle) {
    if (!handle) return;
    if (typeof handle.destroy === 'function') {
      handle.destroy();
      return;
    }
    if (handle.chart && typeof handle.chart.remove === 'function') {
      try { handle.chart.remove(); } catch (_) { /* ignore */ }
    }
  }

  /**
   * Guard: factory must never expose area/gradient series helpers.
   * Used by chart_standards tests.
   */
  function forbiddenHelpers() {
    return {
      createAreaSeries: false,
      createGradientFill: false,
      addAreaSeries: false,
    };
  }

  const api = Object.freeze({
    SCALE_MARGINS,
    DTE_EPOCH_UTC_SEC,
    isAvailable,
    getLightweightCharts,
    resolveThemeTokens,
    buildChartOptions,
    buildLineSeriesOptions,
    dteToUtcTime,
    mapDteSeries,
    mapTimeSeries,
    mapOrdinalSeries,
    createLineChart,
    applyThemeToChart,
    destroyChart,
    containerSize,
    forbiddenHelpers,
  });

  global.WTM_Charts = api;
})(typeof window !== 'undefined' ? window : globalThis);
