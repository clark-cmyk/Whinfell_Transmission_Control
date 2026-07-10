/** Shared helpers for Midwest Compute Crush modules */
window.WMC = window.WMC || {};

WMC.Utils = {
  fmt(v, decimals) {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number') return v.toFixed(decimals ?? 2);
    return String(v);
  },

  dislocClass(d) {
    if (d === 'rich') return 'wmc-disloc--rich';
    if (d === 'cheap') return 'wmc-disloc--cheap';
    if (d === 'extreme') return 'wmc-disloc--extreme';
    return 'wmc-disloc--fair';
  },

  cellClass(col, val, row) {
    if (val === null || val === undefined) return '';
    if (col === 'z_score') {
      if (Math.abs(val) >= 2.5) return 'wmc-cell-warn';
      if (val > 1.5) return 'wmc-cell-rich';
      if (val < -1.5) return 'wmc-cell-cheap';
    }
    if (row.dislocation === 'rich' && ['compute', 'btc_basis'].includes(col)) return 'wmc-cell-rich';
    if (row.dislocation === 'cheap' && ['compute', 'miso_power'].includes(col)) return 'wmc-cell-cheap';
    if (row.dislocation === 'extreme' && col === 'btc_basis') return 'wmc-cell-warn';
    return '';
  },

  corrColor(v) {
    const t = Math.max(-1, Math.min(1, v));
    if (t >= 0) return `rgba(61, 139, 253, ${0.15 + t * 0.75})`;
    return `rgba(245, 101, 101, ${0.15 + Math.abs(t) * 0.75})`;
  },

  showToast(msg) {
    const t = document.getElementById('wmcToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('wmc-toast--show');
    setTimeout(() => t.classList.remove('wmc-toast--show'), 2800);
  },

  liveDateString() {
    if (typeof window.WTM_formatLocalStamp === 'function') {
      return window.WTM_formatLocalStamp(new Date());
    }
    const now = new Date();
    const opts = {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
    };
    return now.toLocaleString('en-US', opts);
  },

  drawSparkline(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2;
    const ch = h / 2;
    const seed = canvas.dataset.sparkSeed || '0';
    const pts = Array.from({ length: 24 }, (_, i) => {
      const n = Math.sin(i * 0.5 + seed.charCodeAt(0) * 0.01) * 0.2;
      return 0.4 + n + ((i * 7 + seed.length) % 10) * 0.008;
    });
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#2a3548';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ch * 0.5);
    ctx.lineTo(cw, ch * 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#3d8bfd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((v, i) => {
      const x = (i / (pts.length - 1)) * cw;
      const y = ch - 8 - ((v - min) / (max - min || 1)) * (ch - 16);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  },
};