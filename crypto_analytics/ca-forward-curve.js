/**
 * CME Crypto Analytics — Implied Rate Forward Curve (Chunk 29 LWC).
 * DTE mapped to synthetic UTC timestamps (approach A). Series = theme accent.
 * @module CAForwardCurve
 */
(function cryptoAnalyticsForwardCurve(global) {
  'use strict';

  const M = global.CAModels;

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
        <dt>Contract</dt><dd>${point.contract_symbol}</dd>
        <dt>Expiry</dt><dd>${M.formatDateMDY(point.expiry_date)}</dd>
        <dt>DTE</dt><dd>${point.dte}</dd>
        <dt>Futures price</dt><dd>${M.formatPrice(point.future_price)}</dd>
        <dt>Spot marker</dt><dd>${M.formatPrice(point.spot_marker)}</dd>
        <dt>Annualized forward rate</dt><dd>${M.formatPct(point.annualized_rate_pct)}</dd>
      </dl>`;
    tooltip.style.left = Math.min(x + 12, window.innerWidth - 200) + 'px';
    tooltip.style.top = Math.max(y - 10, 8) + 'px';
    tooltip.classList.add('ca-tooltip--visible');
  }

  function ensureMount(wrap) {
    let mount = wrap.querySelector('.wtm-lwc-mount');
    if (!mount) {
      const old = wrap.querySelector('canvas.ca-chart-canvas, canvas');
      if (old && old.tagName === 'CANVAS') old.remove();
      mount = document.createElement('div');
      mount.className = 'wtm-lwc-mount ca-chart-canvas';
      mount.setAttribute('role', 'img');
      mount.setAttribute('aria-label', 'Forward curve chart');
      mount.style.width = '100%';
      mount.style.height = '100%';
      mount.style.minHeight = '280px';
      wrap.insertBefore(mount, wrap.firstChild);
    }
    return mount;
  }

  function createForwardCurve(mountEl, callbacks) {
    const wrap = mountEl.querySelector('.ca-chart-wrap') || mountEl;
    const tooltip = mountEl.querySelector('.ca-tooltip');
    let points = [];
    let handle = null;

    function render() {
      const Charts = chartsApi();
      const title = document.getElementById('caCurveTitle');
      if (title) title.textContent = `${callbacks.getAsset()} Implied Forward Curve`;
      const yLabel = document.getElementById('caCurveYLabel');
      if (yLabel) yLabel.textContent = 'Annualized Implied Forward Rate (%)';

      if (!Charts || !Charts.isAvailable()) return;
      const mount = ensureMount(wrap);
      if (!handle || handle.container !== mount) {
        if (handle) Charts.destroyChart(handle);
        handle = Charts.createLineChart(mount, null, {
          minHeight: 280,
          listenTheme: true,
          observeResize: true,
        });
      }
      if (!handle) return;
      const data = Charts.mapDteSeries(
        (points || [])
          .filter((p) => Number.isFinite(p.annualized_rate_pct) && Number.isFinite(p.dte))
          .map((p) => ({ dte: p.dte, value: p.annualized_rate_pct }))
      );
      handle.setData(data);
      handle.applyTheme?.();
      handle.resize?.();
    }

    function setData(curvePoints) {
      points = curvePoints || [];
      render();
    }

    function indexAt(clientX) {
      if (!points.length) return 0;
      const mount = wrap.querySelector('.wtm-lwc-mount') || wrap;
      const rect = mount.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(rect.width, 1)));
      return Math.round(ratio * (points.length - 1));
    }

    wrap.addEventListener('mousemove', (e) => {
      if (!points.length) return;
      const idx = indexAt(e.clientX);
      showTooltip(tooltip, points[idx], e.clientX, e.clientY);
      callbacks.onHover?.(points[idx]);
    });
    wrap.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
    });
    wrap.addEventListener('click', (e) => {
      const pt = points[indexAt(e.clientX)];
      if (pt) callbacks.onPin?.(pt);
    });
    window.addEventListener('resize', render);
    window.addEventListener('wtm:themechange', () => handle?.applyTheme?.());

    return { setData, render };
  }

  function drawForwardCurve() {
    /* LWC path — retained for API compatibility */
  }

  global.CAForwardCurve = { createForwardCurve, drawForwardCurve };
})(typeof window !== 'undefined' ? window : globalThis);
