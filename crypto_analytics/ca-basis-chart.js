/**
 * CME Crypto Analytics — BasisWatch historical dual-axis chart + navigator.
 * @module CABasisChart
 */
(function cryptoAnalyticsBasisChart(global) {
  'use strict';

  const M = global.CAModels;
  const COLORS = {
    basis: '#4c8db8',
    future: '#c58e62',
    spot: '#78a88a',
    grid: '#e8e8e8',
    axis: '#555555',
  };

  function el(id) { return document.getElementById(id); }

  function resizeCanvas(canvas, heightPx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(280, rect.width);
    const h = heightPx || Math.max(280, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function extent(values) {
    const nums = values.filter((v) => Number.isFinite(v));
    if (!nums.length) return { min: 0, max: 1 };
    let min = Math.min(...nums);
    let max = Math.max(...nums);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }

  function sliceWindow(points, startDate, endDate) {
    return points.filter((p) => p.trade_date >= startDate && p.trade_date <= endDate);
  }

  function drawMainChart(canvas, points, asset, hoverIdx) {
    const { ctx, w, h } = resizeCanvas(canvas);
    const pad = { l: 52, r: 58, t: 16, b: 32 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (!points.length) {
      ctx.fillStyle = COLORS.axis;
      ctx.font = '12px Segoe UI, system-ui, sans-serif';
      ctx.fillText('No data in range', pad.l, pad.t + 20);
      return { hoverIdx: -1 };
    }

    const basisExt = extent(points.map((p) => p.annualized_basis_pct));
    const priceExt = extent(points.flatMap((p) => [p.future_price, p.spot_marker]));

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
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
    function yLeft(v) {
      return pad.t + plotH * (1 - (v - basisExt.min) / (basisExt.max - basisExt.min));
    }
    function yRight(v) {
      return pad.t + plotH * (1 - (v - priceExt.min) / (priceExt.max - priceExt.min));
    }

    function drawLine(key, color, yFn) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      points.forEach((p, i) => {
        const v = p[key];
        if (!Number.isFinite(v)) return;
        const x = xAt(i);
        const y = yFn(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    drawLine('annualized_basis_pct', COLORS.basis, yLeft);
    drawLine('future_price', COLORS.future, yRight);
    drawLine('spot_marker', COLORS.spot, yRight);

    ctx.fillStyle = COLORS.axis;
    ctx.font = '11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = basisExt.min + ((basisExt.max - basisExt.min) * (4 - i)) / 4;
      ctx.fillText(v.toFixed(2) + '%', pad.l - 6, pad.t + (plotH * i) / 4 + 4);
    }
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const v = priceExt.min + ((priceExt.max - priceExt.min) * (4 - i)) / 4;
      ctx.fillText('$' + Math.round(v).toLocaleString(), w - pad.r + 6, pad.t + (plotH * i) / 4 + 4);
    }

    ctx.save();
    ctx.translate(12, pad.t + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Annualized Basis (%)', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(w - 10, pad.t + plotH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Price ($)', 0, 0);
    ctx.restore();

    const title = el('caChartTitle');
    if (title) title.textContent = `${asset} Annualized Daily Basis`;

    if (hoverIdx >= 0 && hoverIdx < points.length) {
      const x = xAt(hoverIdx);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    return { pad, plotW, plotH, hoverIdx, points };
  }

  function drawNavigator(canvas, allPoints, windowStart, windowEnd) {
    const { ctx, w, h } = resizeCanvas(canvas, 44);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    if (!allPoints.length) return { pad: 8 };

    const pad = 8;
    const plotW = w - pad * 2;
    const vals = allPoints.map((p) => p.annualized_basis_pct).filter(Number.isFinite);
    const ex = extent(vals);

    ctx.strokeStyle = COLORS.basis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    allPoints.forEach((p, i) => {
      const x = pad + (plotW * i) / Math.max(allPoints.length - 1, 1);
      const y = h - pad - ((p.annualized_basis_pct - ex.min) / (ex.max - ex.min)) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const i0 = allPoints.findIndex((p) => p.trade_date >= windowStart);
    const i1 = allPoints.map((p) => p.trade_date).lastIndexOf(
      allPoints.filter((p) => p.trade_date <= windowEnd).slice(-1)[0]?.trade_date
    );
    const startIdx = Math.max(0, i0);
    const endIdx = Math.max(startIdx, i1 < 0 ? allPoints.length - 1 : i1);
    const x0 = pad + (plotW * startIdx) / Math.max(allPoints.length - 1, 1);
    const x1 = pad + (plotW * endIdx) / Math.max(allPoints.length - 1, 1);

    ctx.fillStyle = 'rgba(76, 141, 184, 0.18)';
    ctx.fillRect(x0, pad, x1 - x0, h - pad * 2);
    ctx.strokeStyle = '#4c8db8';
    ctx.strokeRect(x0, pad, x1 - x0, h - pad * 2);

    return { pad, plotW, allPoints, x0, x1, startIdx, endIdx };
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

  function createBasisChart(mountEl, callbacks) {
    const chartCanvas = mountEl.querySelector('.ca-chart-canvas');
    const navCanvas = mountEl.querySelector('.ca-navigator-canvas');
    const tooltip = mountEl.querySelector('.ca-tooltip');
    let allPoints = [];
    let visible = { start: '', end: '' };
    let hoverIdx = -1;
    let navMeta = null;
    let dragging = null;

    function render() {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      drawMainChart(chartCanvas, win, callbacks.getAsset(), hoverIdx);
      navMeta = drawNavigator(navCanvas, allPoints, visible.start, visible.end);
    }

    function setData(points, range) {
      allPoints = points || [];
      visible = { start: range.start, end: range.end };
      hoverIdx = -1;
      render();
    }

    function setWindow(start, end) {
      visible = { start, end };
      render();
    }

    function indexAtMain(clientX) {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      const rect = chartCanvas.getBoundingClientRect();
      const pad = { l: 52, r: 58 };
      const plotW = rect.width - pad.l - pad.r;
      const x = clientX - rect.left - pad.l;
      const idx = Math.round((x / Math.max(plotW, 1)) * Math.max(win.length - 1, 0));
      return Math.max(0, Math.min(win.length - 1, idx));
    }

    chartCanvas.addEventListener('mousemove', (e) => {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      if (!win.length) return;
      hoverIdx = indexAtMain(e.clientX);
      const pt = win[hoverIdx];
      render();
      showTooltip(tooltip, pt, e.clientX, e.clientY);
      callbacks.onHover?.(pt);
    });

    chartCanvas.addEventListener('mouseleave', () => {
      hoverIdx = -1;
      render();
      if (tooltip) tooltip.classList.remove('ca-tooltip--visible');
    });

    chartCanvas.addEventListener('click', (e) => {
      const win = sliceWindow(allPoints, visible.start, visible.end);
      const idx = indexAtMain(e.clientX);
      const pt = win[idx];
      if (pt) callbacks.onPin?.(pt);
    });

    function navIndexAt(clientX) {
      if (!navMeta?.allPoints?.length) return 0;
      const rect = navCanvas.getBoundingClientRect();
      const x = clientX - rect.left - navMeta.pad;
      const ratio = Math.max(0, Math.min(1, x / Math.max(navMeta.plotW, 1)));
      return Math.round(ratio * (navMeta.allPoints.length - 1));
    }

    function applyNavWindow(startIdx, endIdx) {
      const a = Math.min(startIdx, endIdx);
      const b = Math.max(startIdx, endIdx);
      const start = navMeta.allPoints[a]?.trade_date;
      const end = navMeta.allPoints[b]?.trade_date;
      if (start && end) {
        visible = { start, end };
        callbacks.onWindowChange?.(visible);
        render();
      }
    }

    navCanvas.addEventListener('mousedown', (e) => {
      if (!navMeta) return;
      const idx = navIndexAt(e.clientX);
      const distL = Math.abs(e.clientX - navCanvas.getBoundingClientRect().left - navMeta.x0);
      const distR = Math.abs(e.clientX - navCanvas.getBoundingClientRect().left - navMeta.x1);
      dragging = distL < distR ? 'left' : 'right';
      if (distL > 12 && distR > 12) dragging = 'pan';
      navCanvas._dragStartIdx = idx;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging || !navMeta) return;
      const idx = navIndexAt(e.clientX);
      if (dragging === 'left') applyNavWindow(idx, navMeta.endIdx);
      else if (dragging === 'right') applyNavWindow(navMeta.startIdx, idx);
      else applyNavWindow(navMeta._dragStartIdx || navMeta.startIdx, idx);
    });

    window.addEventListener('mouseup', () => { dragging = null; });

    window.addEventListener('resize', () => render());

    return { setData, setWindow, render };
  }

  global.CABasisChart = { createBasisChart, drawMainChart, sliceWindow };
})(typeof window !== 'undefined' ? window : globalThis);