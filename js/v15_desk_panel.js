/** v1.5 Desk — Corporate Credit, Trade Tracker, BTC Attribution, Margin Rules */
(function () {
  'use strict';

  const DEF = () => structuredClone(window.V15_DESK_DEFAULTS || {});

  function el(id) { return document.getElementById(id); }

  function merge() {
    const h = window.appState?.hydration || {};
    return {
      corporate_credit: { ...DEF().corporate_credit, ...(h.corporate_credit || {}) },
      trade_tracker: { ...DEF().trade_tracker, ...(h.trade_tracker || {}) },
      btc_attribution: { ...DEF().btc_attribution, ...(h.btc_attribution || {}) },
      margin_rules: { ...DEF().margin_rules, ...(h.margin_rules || {}) },
    };
  }

  function chipCls(label) {
    const l = String(label || '').toLowerCase();
    if (l.includes('cheap') || l.includes('open')) return 'v15-chip v15-chip--cheap';
    if (l.includes('block')) return 'v15-chip v15-chip--blocked';
    return 'v15-chip v15-chip--watch';
  }

  function renderCredit(d) {
    const c = d.corporate_credit;
    const out = el('v15CreditBody');
    if (!out) return;
    out.innerHTML = `
      <p class="v15-metric">${c.hy_oas_bps} bps</p>
      <p class="v15-muted">Q${c.quartile || 4} · ${c.percentile || '—'}th pct · ${c.richness}</p>
      <p class="mt-1"><span class="${chipCls(c.band)}">${c.band}</span>
        ${c.is_weakest_link ? '<span class="v15-chip v15-chip--watch">Weakest link</span>' : ''}</p>
      <p class="v15-muted mt-1">${c.tactical_lead || '—'}</p>
      <p class="v15-muted">RV: ${c.rv_posture} · ${c.preferred_expression}</p>`;
    const badge = el('v15HydrationBadge');
    if (badge) {
      const asOf = typeof window.WTM_formatLocalStamp === 'function'
        ? window.WTM_formatLocalStamp(c.as_of)
        : c.as_of;
      badge.textContent = window.appState?.hydration?.corporate_credit
        ? `Hydrated · ${asOf}`
        : `Desk defaults · ${asOf}`;
    }
  }

  function renderTrades(d) {
    const tbody = el('v15TradesBody');
    if (!tbody) return;
    tbody.innerHTML = (d.trade_tracker.trades || []).map(t => `
      <tr>
        <td>${t.book}</td>
        <td>${t.structure}</td>
        <td><span class="${chipCls(t.status)}">${t.status}</span></td>
        <td>${t.pnl_pct >= 0 ? '+' : ''}${t.pnl_pct}%</td>
        <td>${t.size_cap}</td>
      </tr>`).join('');
  }

  function renderAttribution(d) {
    const a = d.btc_attribution;
    const out = el('v15AttributionBody');
    if (!out) return;
    out.innerHTML = `
      <p class="v15-metric">${a.btc_bias} · ${a.btc_ret_1d_pct >= 0 ? '+' : ''}${a.btc_ret_1d_pct}%</p>
      <p class="v15-muted">${a.summary || '—'}</p>
      <table class="v15-table mt-1"><thead><tr><th>Stage</th><th>d1</th><th>Net</th><th>BTC drag</th></tr></thead>
      <tbody>${(a.attribution || []).map(r => `
        <tr><td>${r.stage}</td><td>${r.d1}</td><td>${r.net_impact}</td><td>${r.btc_drag ? 'yes' : '—'}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function renderMargin(d) {
    const m = d.margin_rules;
    const out = el('v15MarginBody');
    if (!out) return;
    out.innerHTML = `
      <p class="v15-metric">${m.tier} · ${m.gross_risk_cap_pct}% gross cap</p>
      <p class="v15-muted">Score ${m.whinfell_score} · per-trade ${m.max_per_trade_risk_pct}% · max ${m.max_concurrent_trades} concurrent</p>
      <p class="v15-muted">L2 ${m.layer2_allowed ? 'allowed' : 'blocked'} · L3 ${m.layer3_allowed ? 'allowed' : 'blocked'}</p>
      <ul class="v15-muted list-disc pl-4 mt-1">${(m.rules || []).map(r => `<li>${r}</li>`).join('')}</ul>`;
  }

  function refresh() {
    const d = merge();
    renderCredit(d);
    renderTrades(d);
    renderAttribution(d);
    renderMargin(d);
  }

  function scheduleRefresh() {
    if (scheduleRefresh._queued) return;
    scheduleRefresh._queued = true;
    setTimeout(() => {
      scheduleRefresh._queued = false;
      refresh();
    }, 0);
  }

  function installHook() {
    installHook._n = (installHook._n || 0) + 1;
    if (!window.__WTM_CORE_READY && installHook._n < 300) {
      setTimeout(installHook, 16);
      return;
    }
    if (typeof window.renderAll !== 'function') return;
    if (window.renderAll._wtmV15Wrapped) return;
    const orig = window.renderAll;
    function wrappedRenderAll() {
      const r = orig.apply(this, arguments);
      scheduleRefresh();
      return r;
    }
    wrappedRenderAll._wtmV15Wrapped = true;
    window.renderAll = wrappedRenderAll;
    scheduleRefresh();
  }

  window.WTM_V15Desk = { refresh, merge };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHook);
  else installHook();
})();