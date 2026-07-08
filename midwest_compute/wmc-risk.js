/** Risk — correlation, VaR, exposure (stacked sub-panels) */
window.WMC = window.WMC || {};

WMC.Risk = {
  init() {
    WMC.Risk.renderCorr();
    WMC.Risk.renderVar();
    WMC.Risk.renderExposure();
  },

  renderCorr() {
    const host = document.getElementById('corrHeatmap');
    if (!host) return;
    const { labels, matrix } = window.WMC_DATA.risk_summary.correlation;
    const n = labels.length;
    host.style.gridTemplateColumns = `72px repeat(${n}, 1fr)`;

    let html = '<div class="wmc-heatmap-corner"></div>';
    labels.forEach((l) => { html += `<div class="wmc-heatmap-label wmc-heatmap-label--col">${l}</div>`; });

    matrix.forEach((row, i) => {
      html += `<div class="wmc-heatmap-label">${labels[i]}</div>`;
      row.forEach((v, j) => {
        const textColor = Math.abs(v) > 0.5 ? '#fff' : 'var(--wmc-muted)';
        html += `<div class="wmc-heatmap-cell wmc-num" style="background:${WMC.Utils.corrColor(v)};color:${textColor}" title="${labels[i]} × ${labels[j]}: ${v.toFixed(2)}">${v.toFixed(2)}</div>`;
      });
    });

    host.innerHTML = html;
  },

  renderVar() {
    const body = document.getElementById('varBody');
    if (!body) return;
    body.innerHTML = window.WMC_DATA.risk_summary.var.map((v) => {
      const utilPct = (v.util * 100).toFixed(0);
      const utilCls = v.util >= 0.75 ? 'wmc-cell-warn' : '';
      return `
        <tr>
          <td class="wmc-var-bucket">${v.bucket}</td>
          <td class="wmc-num">$${(v.var / 1000).toFixed(0)}k</td>
          <td class="wmc-num">$${(v.cvar / 1000).toFixed(0)}k</td>
          <td class="wmc-num">$${(v.limit / 1000).toFixed(0)}k</td>
          <td class="wmc-num ${utilCls}">${utilPct}%</td>
        </tr>
      `;
    }).join('');
  },

  renderExposure() {
    const host = document.getElementById('netExposure');
    if (!host) return;
    const { net_exposure, net_total, net_limit } = window.WMC_DATA.risk_summary;
    const maxVal = Math.max(...net_exposure.map((e) => e.value), net_limit);
    const netColor = net_total > net_limit * 0.8 ? 'var(--wmc-amber)' : 'var(--wmc-green)';

    host.innerHTML = `
      ${net_exposure.map((e) => `
        <div class="wmc-exposure-row">
          <span class="wmc-exposure-label">${e.leg}</span>
          <div class="wmc-exposure-track">
            <div class="wmc-exposure-fill wmc-exposure-fill--${e.direction}" style="width:${(e.value / maxVal * 100).toFixed(1)}%"></div>
          </div>
          <span class="wmc-exposure-val wmc-num">${e.direction === 'short' ? '−' : '+'}${e.value.toFixed(2)}x</span>
        </div>
      `).join('')}
      <div class="wmc-net-exposure">
        <span class="wmc-net-label">Net book exposure</span>
        <span class="wmc-net-value wmc-num" style="color:${netColor}">${net_total.toFixed(1)}x <span class="wmc-net-limit">/ ${net_limit}x limit</span></span>
      </div>
    `;
  },
};