/**
 * CME Crypto Analytics — Implied Rate Spot Curve (distinct term structure).
 * @module CASpotCurve
 */
(function cryptoAnalyticsSpotCurve(global) {
  'use strict';

  const M = global.CAModels;
  const COLOR = '#78a88a';

  function drawSpotCurve(canvas, points, asset, hoverIdx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(280, rect.width);
    const h = Math.max(280, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = { l: 52, r: 20, t: 16, b: 40 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const title = document.getElementById('caCurveTitle');
    if (title) title.textContent = `${asset} Implied Spot Curve`;

    const yLabel = document.getElementById('caCurveYLabel');
    if (yLabel) yLabel.textContent = 'Annualized Spot Rate (%)';

    if (!points?.length) {
      ctx.fillStyle = '#555';
      ctx.font = '12px Segoe UI, system-ui, sans-serif';
      ctx.fillText('No curve data', pad.l, pad.t + 20);
      return;
    }

    const vals = points.map((p) => p.annualized_rate_pct).filter(Number.isFinite);
    let ymin = Math.min(...vals);
    let ymax = Math.max(...vals);
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    const ypad = (ymax - ymin) * 0.1;
    ymin -= ypad;
    ymax += ypad;

    ctx.strokeStyle = '#e8e8e8';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    function xAt(i) {
      return pad.l + (plotW * i) / Math.max(points.length - 1, 1);
    }
    function yAt(v) {
      return pad.t + plotH * (1 - (v - ymin) / (ymax - ymin));
    }

    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xAt(i);
      const y = yAt(p.annualized_rate_pct);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    points.forEach((p, i) => {
      const x = xAt(i);
      const y = yAt(p.annualized_rate_pct);
      ctx.fillStyle = i === hoverIdx ? '#4d7a5c' : COLOR;
      ctx.beginPath();
      ctx.arc(x, y, i === hoverIdx ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#555';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    points.forEach((p, i) => {
      const x = xAt(i);
      ctx.save();
      ctx.translate(x, h - 8);
      ctx.rotate(-0.45);
      ctx.fillText(p.contract_symbol, 0, 0);
      ctx.restore();
    });
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = ymin + ((ymax - ymin) * (4 - i)) / 4;
      ctx.fillText(v.toFixed(2) + '%', pad.l - 6, pad.t + (plotH * i) / 4 + 4);
    }
  }

  function showTooltip(tooltip, point, x, y) {
    if (!tooltip || !point) {
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
      return;
    }
    tooltip.innerHTML = `
      <dl>
        <dt>Tenor</dt><dd>${point.contract_symbol}</dd>
        <dt>Expiry</dt><dd>${M.formatDateMDY(point.expiry_date)}</dd>
        <dt>DTE</dt><dd>${point.dte}</dd>
        <dt>Spot marker</dt><dd>${M.formatPrice(point.spot_marker)}</dd>
        <dt>Annualized spot-implied rate</dt><dd>${M.formatPct(point.annualized_rate_pct)}</dd>
      </dl>`;
    tooltip.style.left = Math.min(x + 12, window.innerWidth - 200) + 'px';
    tooltip.style.top = Math.max(y - 10, 8) + 'px';
    tooltip.classList.add('ca-tooltip--visible');
  }

  function createSpotCurve(mountEl, callbacks) {
    const canvas = mountEl.querySelector('.ca-chart-canvas');
    const tooltip = mountEl.querySelector('.ca-tooltip');
    let points = [];
    let hoverIdx = -1;

    function render() {
      drawSpotCurve(canvas, points, callbacks.getAsset(), hoverIdx);
    }

    function setData(curvePoints) {
      points = curvePoints || [];
      hoverIdx = -1;
      render();
    }

    function indexAt(clientX) {
      const rect = canvas.getBoundingClientRect();
      const pad = { l: 52, r: 20 };
      const plotW = rect.width - pad.l - pad.r;
      const x = clientX - rect.left - pad.l;
      return Math.max(0, Math.min(points.length - 1, Math.round((x / Math.max(plotW, 1)) * Math.max(points.length - 1, 0))));
    }

    canvas.addEventListener('mousemove', (e) => {
      if (!points.length) return;
      hoverIdx = indexAt(e.clientX);
      render();
      showTooltip(tooltip, points[hoverIdx], e.clientX, e.clientY);
      callbacks.onHover?.(points[hoverIdx]);
    });

    canvas.addEventListener('mouseleave', () => {
      hoverIdx = -1;
      render();
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
    });

    canvas.addEventListener('click', (e) => {
      const pt = points[indexAt(e.clientX)];
      if (pt) callbacks.onPin?.(pt);
    });

    window.addEventListener('resize', render);

    return { setData, render };
  }

  global.CASpotCurve = { createSpotCurve, drawSpotCurve };
})(typeof window !== 'undefined' ? window : globalThis);