/** Architect Exchange Monitor — modular panel for Whinfell TC */
(function () {
  'use strict';

  const COLORS = { accent: '#3d8bfd', green: '#3dd68c', amber: '#f5a623', red: '#f56565', muted: '#8b9cb3', grid: '#2a3548', bg: '#0b0f14' };

  let data = structuredClone(window.AI_COMPUTE_DEFAULTS || {});

  function el(id) { return document.getElementById(id); }

  function riskCls(r) {
    if (r === 'high') return 'ai-risk-high';
    if (r === 'med') return 'ai-risk-med';
    return 'ai-risk-low';
  }

  function mergeHydration() {
    const bundle = window.appState?.hydration?.ai_compute;
    if (!bundle || typeof bundle !== 'object') return;
    data = { ...structuredClone(window.AI_COMPUTE_DEFAULTS), ...bundle };
    if (bundle.players) data.players = bundle.players;
  }

  function drawLineChart(canvas, series, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2; const ch = h / 2;
    const pad = { l: 32, r: 12, t: 12, b: 24 };
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);
    const vals = series.map(s => s.price ?? s.y ?? 0);
    const min = Math.min(...vals) * 0.95;
    const max = Math.max(...vals) * 1.05;
    const xStep = (cw - pad.l - pad.r) / Math.max(series.length - 1, 1);
    ctx.strokeStyle = COLORS.grid;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch - pad.t - pad.b) * (i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(cw - pad.r, y); ctx.stroke();
    }
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach((pt, i) => {
      const x = pad.l + i * xStep;
      const y = pad.t + (ch - pad.t - pad.b) * (1 - ((vals[i] - min) / (max - min || 1)));
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = COLORS.muted;
    ctx.font = '9px monospace';
    series.forEach((pt, i) => {
      const x = pad.l + i * xStep;
      ctx.fillText(pt.tenor || pt.date || '', x - 8, ch - 6);
    });
    if (opts?.ylabel) {
      ctx.save();
      ctx.translate(10, ch / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(opts.ylabel, 0, 0);
      ctx.restore();
    }
  }

  function drawBasisBtc(canvas, points) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2; const ch = h / 2;
    const pad = { l: 36, r: 36, t: 14, b: 28 };
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);
    const gpu = points.map(p => p.gpu_basis);
    const btc = points.map(p => p.btc_ret);
    const gMin = Math.min(...gpu) - 0.02; const gMax = Math.max(...gpu) + 0.02;
    const bMin = Math.min(...btc) - 1; const bMax = Math.max(...btc) + 1;
    const xStep = (cw - pad.l - pad.r) / Math.max(points.length - 1, 1);
    function yScale(v, min, max) { return pad.t + (ch - pad.t - pad.b) * (1 - (v - min) / (max - min || 1)); }
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad.l + i * xStep;
      const y = yScale(p.gpu_basis, gMin, gMax);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.strokeStyle = COLORS.amber;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad.l + i * xStep;
      const y = yScale(p.btc_ret, bMin, bMax);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = COLORS.muted;
    ctx.font = '8px monospace';
    ctx.fillText('GPU basis', pad.l, 10);
    ctx.fillText('BTC %', cw - pad.r - 30, 10);
    points.forEach((p, i) => ctx.fillText(p.date, pad.l + i * xStep - 6, ch - 8));
  }

  function drawVolSurface(canvas, surface) {
    if (!canvas || !surface) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2; const ch = h / 2;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);
    const rows = surface.values.length;
    const cols = surface.values[0]?.length || 0;
    const cellW = (cw - 40) / cols;
    const cellH = (ch - 30) / rows;
    let vmin = 99; let vmax = 0;
    surface.values.flat().forEach(v => { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); });
    surface.values.forEach((row, ri) => {
      row.forEach((v, ci) => {
        const t = (v - vmin) / (vmax - vmin || 1);
        const r = Math.round(61 + t * 50);
        const g = Math.round(139 + t * 80);
        const b = Math.round(253 - t * 100);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(36 + ci * cellW, 14 + ri * cellH, cellW - 2, cellH - 2);
        ctx.fillStyle = '#0b0f14';
        ctx.font = '8px monospace';
        ctx.fillText(String(v), 38 + ci * cellW, 22 + ri * cellH);
      });
    });
    ctx.fillStyle = COLORS.muted;
    ctx.font = '8px monospace';
    surface.tenors.forEach((t, i) => ctx.fillText(t, 36 + i * cellW, ch - 6));
    surface.strikes.forEach((s, i) => ctx.fillText(String(s), 4, 22 + i * cellH));
  }

  function renderPlayers() {
    const tbody = el('aiComputePlayersBody');
    if (!tbody) return;
    tbody.innerHTML = (data.players || []).map(p => `
      <tr>
        <td>${p.rank}</td>
        <td><strong>${p.name}</strong><br><span class="text-wtm-muted">${p.role}</span></td>
        <td class="${p.exp_return >= 0 ? 'ai-ret-pos' : 'ai-ret-neg'}">${p.exp_return >= 0 ? '+' : ''}${p.exp_return}%</td>
        <td class="${riskCls(p.risk)}">${p.risk}</td>
        <td>${p.note || '—'}</td>
      </tr>`).join('');
  }

  function renderCrush() {
    const c = data.crush_trade || {};
    const out = el('aiCrushOutput');
    if (!out) return;
    const pnl = c.expected_pnl_pct ?? 0;
    out.innerHTML = `
      <p class="ai-crush-out">${c.structure || '—'}</p>
      <p class="text-[10px] mt-1">Entry basis <strong>${c.entry_basis}</strong> → Now <strong>${c.current_basis}</strong></p>
      <p class="text-[10px]">Expected P&amp;L <span class="${pnl >= 0 ? 'ai-ret-pos' : 'ai-ret-neg'}">${pnl >= 0 ? '+' : ''}${pnl}%</span>
        · Max loss ${c.max_loss_pct}% · Horizon ${c.horizon_days}d · <span class="${riskCls(c.status === 'watch' ? 'med' : 'low')}">${c.status}</span></p>`;
    const sim = el('aiCrushSimSlider');
    if (sim && !sim._bound) {
      sim._bound = true;
      sim.addEventListener('input', () => {
        const shock = Number(sim.value) / 100;
        const adj = (c.entry_basis - c.current_basis) * (1 + shock) * 100;
        el('aiCrushSimResult').textContent = `Sim crush P&L: ${adj >= 0 ? '+' : ''}${adj.toFixed(1)}% (basis shock ${sim.value}%)`;
      });
    }
  }

  function renderLadderLink() {
    const chip = el('aiLadderChip');
    const note = el('aiLadderNote');
    const stage = data.ladder_stage || {};
    if (chip) {
      chip.textContent = `${stage.short || 'GPU'} · ${stage.posture || 'watch'}`;
      chip.className = `ai-ladder-chip ai-ladder-chip--${stage.posture || 'watch'}`;
    }
    if (note) note.textContent = stage.note || '—';
  }

  function renderRisks() {
    const list = el('aiComputeRisks');
    if (!list) return;
    list.innerHTML = (data.risks || []).map(r => `<li>${r}</li>`).join('');
  }

  function drawCrushTrade(canvas, curve, basisPts) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2; const ch = h / 2;
    const pad = { l: 36, r: 12, t: 14, b: 26 };
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);
    const gpuVals = (curve || []).map(p => p.price);
    const btcVals = (basisPts || []).map(p => p.btc_ret);
    const gMin = Math.min(...gpuVals) * 0.95; const gMax = Math.max(...gpuVals) * 1.05;
    const bMin = Math.min(...btcVals) - 1; const bMax = Math.max(...btcVals) + 1;
    const n = Math.max(curve.length, basisPts.length);
    const xStep = (cw - pad.l - pad.r) / Math.max(n - 1, 1);
    const yG = v => pad.t + (ch - pad.t - pad.b) * (1 - (v - gMin) / (gMax - gMin || 1));
    const yB = v => pad.t + (ch - pad.t - pad.b) * (1 - (v - bMin) / (bMax - bMin || 1));
    ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 2; ctx.beginPath();
    curve.forEach((p, i) => { const x = pad.l + i * xStep; const y = yG(p.price); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.strokeStyle = COLORS.amber; ctx.beginPath();
    basisPts.forEach((p, i) => { const x = pad.l + i * xStep; const y = yB(p.btc_ret); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = COLORS.muted; ctx.font = '8px monospace';
    ctx.fillText('Crush: GPU fwd (blue) vs BTC % (amber)', pad.l, 10);
  }

  function renderCharts() {
    drawLineChart(el('aiChartGpuFwd'), data.gpu_forward_curve, { ylabel: '$/GPU-hr' });
    drawBasisBtc(el('aiChartBasisBtc'), data.basis_vs_btc || []);
    drawVolSurface(el('aiChartVolSurface'), data.vol_surface);
    drawCrushTrade(el('aiChartCrushTrade'), data.gpu_forward_curve, data.basis_vs_btc || []);
  }

  function renderMeta() {
    const badge = el('aiComputeHydrationBadge');
    if (badge) {
      const hydrated = !!window.appState?.hydration?.ai_compute;
      badge.textContent = hydrated ? `Hydrated · ${data.as_of}` : `Desk defaults · ${data.as_of}`;
    }
    const thesis = el('aiComputeThesis');
    if (thesis) thesis.textContent = data.thesis || '';
  }

  function refresh() {
    mergeHydration();
    renderMeta();
    renderLadderLink();
    renderPlayers();
    renderCrush();
    renderRisks();
    renderCharts();
  }

  function scheduleRefresh() {
    if (scheduleRefresh._queued) return;
    scheduleRefresh._queued = true;
    setTimeout(() => {
      scheduleRefresh._queued = false;
      refresh();
    }, 0);
  }

  function installRenderHook() {
    installRenderHook._n = (installRenderHook._n || 0) + 1;
    if (!window.__WTM_CORE_READY && installRenderHook._n < 300) {
      setTimeout(installRenderHook, 16);
      return;
    }
    if (typeof window.renderAll !== 'function') return;
    if (window.renderAll._wtmAiWrapped) return;
    const orig = window.renderAll;
    function wrappedRenderAll() {
      const r = orig.apply(this, arguments);
      scheduleRefresh();
      return r;
    }
    wrappedRenderAll._wtmAiWrapped = true;
    window.renderAll = wrappedRenderAll;
    scheduleRefresh();
  }

  window.WTM_AICompute = { refresh, getData: () => data, setData: (d) => { data = { ...data, ...d }; refresh(); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installRenderHook);
  } else {
    installRenderHook();
  }
})();