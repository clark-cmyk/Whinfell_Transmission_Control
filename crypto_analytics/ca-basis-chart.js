/**
 * CME Crypto Analytics — BasisWatch historical chart (Chunk 29 LWC).
 * Primary: annualized basis % (theme accent). Secondary series muted only.
 * @module CABasisChart
 */
(function cryptoAnalyticsBasisChart(global) {
  'use strict';

  const M = global.CAModels;

  function el(id) { return document.getElementById(id); }

  function sliceWindow(points, startDate, endDate) {
    return points.filter((p) => p.trade_date >= startDate && p.trade_date <= endDate);
  }

  function chartsApi() {
    return global.WTM_Charts || null;
  }

  function showTooltip(tooltip, point, x, y) {
    if (!tooltip || !point) {
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
      return;
    }
    tooltip.innerHTML = `
      <dl>
        <dt>Trade date</dt><dd>${M.formatDateMDY(point.trade_date)}</dd>
        <dt>Front contract</dt><dd>${point.front_contract_symbol}</dd>
        <dt>Expiry</dt><dd>${M.formatDateMDY(point.expiry_date)}</dd>
        <dt>DTE</dt><dd>${point.dte}</dd>
        <dt>Future price</dt><dd>${M.formatPrice(point.future_price)}</dd>
        <dt>Spot marker</dt><dd>${M.formatPrice(point.spot_marker)}</dd>
        <dt>Annualized basis</dt><dd>${M.formatPct(point.annualized_basis_pct)}</dd>
      </dl>`;
    tooltip.style.left = Math.min(x + 12, window.innerWidth - 200) + 'px';
    tooltip.style.top = Math.max(y - 10, 8) + 'px';
    tooltip.classList.add('ca-tooltip--visible');
  }

  function ensureMount(wrap, className) {
    let mount = wrap.querySelector('.wtm-lwc-mount');
    if (!mount) {
      const oldCanvas = wrap.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();
      mount = document.createElement('div');
      mount.className = 'wtm-lwc-mount ca-chart-canvas';
      mount.setAttribute('role', 'img');
      mount.setAttribute('aria-label', className || 'Basis chart');
      mount.style.width = '100%';
      mount.style.height = '100%';
      mount.style.minHeight = '280px';
      wrap.insertBefore(mount, wrap.firstChild);
    }
    return mount;
  }

  function createBasisChart(mountEl, callbacks) {
    const chartWrap = mountEl.querySelector('.ca-chart-wrap') || mountEl;
    const navCanvas = mountEl.querySelector('.ca-navigator-canvas');
    const tooltip = mountEl.querySelector('.ca-tooltip');
    let allPoints = [];
    let visible = { start: '', end: '' };
    let mainHandle = null;
    let navHandle = null;

    function destroyHandles() {
      const Charts = chartsApi();
      if (mainHandle) {
        try { Charts?.destroyChart(mainHandle); } catch (_) { /* ignore */ }
        mainHandle = null;
      }
      if (navHandle) {
        try { Charts?.destroyChart(navHandle); } catch (_) { /* ignore */ }
        navHandle = null;
      }
    }

    function buildMainData(win) {
      const Charts = chartsApi();
      if (!Charts) return { primary: [], secondary: [] };
      const primary = Charts.mapTimeSeries(
        win.map((p) => ({ trade_date: p.trade_date, value: p.annualized_basis_pct })),
        'value',
        'trade_date'
      );
      // Secondary: future price on right scale is not dual-scale in LWC without two scales —
      // keep single accent basis line only (clean institutional series). Spot/future stay in tooltip.
      return { primary, secondary: [] };
    }

    function render() {
      const Charts = chartsApi();
      const win = sliceWindow(allPoints, visible.start, visible.end);
      const title = el('caChartTitle');
      if (title) title.textContent = `${callbacks.getAsset()} Annualized Daily Basis`;

      if (!Charts || !Charts.isAvailable()) return;

      const mainMount = ensureMount(chartWrap, 'BasisWatch historical chart');
      if (!mainHandle || mainHandle.container !== mainMount) {
        if (mainHandle) Charts.destroyChart(mainHandle);
        mainHandle = Charts.createLineChart(mainMount, null, {
          minHeight: 280,
          listenTheme: true,
          observeResize: true,
        });
      }
      if (mainHandle) {
        const pack = buildMainData(win);
        mainHandle.setData(pack.primary);
        mainHandle.applyTheme?.();
        mainHandle.resize?.();
      }

      // Mini navigator as accent LWC line (full history) — no fill/gradient.
      if (navCanvas) {
        let navMount = navCanvas;
        if (navCanvas.tagName === 'CANVAS' || !navCanvas.classList?.contains?.('wtm-lwc-mount')) {
          navMount = document.createElement('div');
          navMount.className = 'wtm-lwc-mount wtm-lwc-nav ca-navigator-canvas';
          navMount.style.width = '100%';
          navMount.style.height = '44px';
          navMount.style.minHeight = '44px';
          navCanvas.replaceWith(navMount);
        } else {
          navMount.style.height = navMount.style.height || '44px';
          navMount.style.minHeight = '44px';
        }
        if (!navHandle || navHandle.container !== navMount) {
          if (navHandle) Charts.destroyChart(navHandle);
          navHandle = Charts.createLineChart(navMount, null, {
            minHeight: 44,
            listenTheme: true,
            observeResize: true,
            seriesOptions: { lastValueVisible: false, crosshairMarkerVisible: false, priceLineVisible: false },
            chartOptions: {
              handleScroll: false,
              handleScale: false,
              timeScale: { visible: false, borderVisible: false },
              rightPriceScale: { visible: false, borderVisible: false },
              grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
              },
            },
          });
        }
        if (navHandle) {
          const navData = Charts.mapTimeSeries(
            allPoints.map((p) => ({ trade_date: p.trade_date, value: p.annualized_basis_pct })),
            'value',
            'trade_date'
          );
          navHandle.setData(navData);
          navHandle.applyTheme?.();
          navHandle.resize?.();
        }
      }
    }

    function setData(points, range) {
      allPoints = points || [];
      visible = { start: range.start, end: range.end };
      render();
    }

    function setWindow(start, end) {
      visible = { start, end };
      render();
    }

    function indexAtMain(clientX) {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      if (!win.length) return 0;
      const mount = chartWrap.querySelector('.wtm-lwc-mount') || chartWrap;
      const rect = mount.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / Math.max(rect.width, 1)));
      return Math.round(ratio * (win.length - 1));
    }

    chartWrap.addEventListener('mousemove', (e) => {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      if (!win.length) return;
      const idx = indexAtMain(e.clientX);
      const pt = win[idx];
      showTooltip(tooltip, pt, e.clientX, e.clientY);
      callbacks.onHover?.(pt);
    });

    chartWrap.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
    });

    chartWrap.addEventListener('click', (e) => {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      const idx = indexAtMain(e.clientX);
      const pt = win[idx];
      if (pt) callbacks.onPin?.(pt);
    });

    window.addEventListener('resize', () => render());
    window.addEventListener('wtm:themechange', () => {
      mainHandle?.applyTheme?.();
      navHandle?.applyTheme?.();
    });

    return { setData, setWindow, render, destroy: destroyHandles };
  }

  // drawMainChart retained as no-op export for tests that may reference the symbol.
  function drawMainChart() {
    return { hoverIdx: -1 };
  }

  global.CABasisChart = { createBasisChart, drawMainChart, sliceWindow };
})(typeof window !== 'undefined' ? window : globalThis);
