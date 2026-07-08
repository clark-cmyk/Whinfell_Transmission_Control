/**
 * Midwest Compute Crush — IA shell embed adapter (Dig layer).
 * Boots existing WMC modules into #iaMidwestCrushHost; wires decision rail + commentary.
 */
(function wmcIaPanel(global) {
  'use strict';

  const BUILD = 'WMC-IA-2026-07-05';
  let booted = false;
  let active = false;

  function el(id) { return document.getElementById(id); }

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function boot() {
    if (booted) return true;
    try {
      if (global.WMC?.Hydrate?.load) await global.WMC.Hydrate.load();
    } catch (err) {
      console.warn('[WMC IA] hydrate skipped', err);
    }

    const chain = [
      global.WMC?.Overview?.init,
      global.WMC?.Basis?.init,
      global.WMC?.Trades?.init,
      global.WMC?.Risk?.init,
    ];

    chain.forEach((fn) => {
      if (typeof fn !== 'function') return;
      try { fn(); } catch (err) { console.error('[WMC IA boot]', err); }
    });

    booted = true;
    return true;
  }

  function crushSpreadRow() {
    const rows = global.WMC_DATA?.basis_tracker || [];
    return rows.find((r) => /crush spread/i.test(r.leg)) || rows[0];
  }

  function topCorrelation() {
    const corr = global.WMC_DATA?.risk_summary?.correlation;
    if (!corr?.labels?.length || !corr?.matrix?.length) return null;
    let best = null;
    corr.matrix.forEach((row, i) => {
      row.forEach((v, j) => {
        if (i >= j) return;
        const abs = Math.abs(v);
        if (!best || abs > Math.abs(best.value)) {
          best = { a: corr.labels[i], b: corr.labels[j], value: v };
        }
      });
    });
    return best;
  }

  function renderDecisionRail() {
    const mount = el('cockpitDecisionContent');
    if (!mount) return;

    const data = global.WMC_DATA || {};
    const meta = data.meta || {};
    const core = data.trade_variants?.core;
    const crush = crushSpreadRow();
    const corr = topCorrelation();
    const hero = (data.kpis || []).find((k) => k.hero) || data.kpis?.[2];

    const crushLine = crush
      ? `${crush.leg}: Z=${crush.z_score != null ? crush.z_score.toFixed(1) : '—'} · ${crush.dislocation || '—'}`
      : 'Crush spread — awaiting data';

    const corrLine = corr
      ? `Strongest pair ${corr.a}×${corr.b}: ${corr.value.toFixed(2)}`
      : 'Correlations — awaiting data';

    mount.innerHTML = `
      <div class="console-panel-zone-label console-panel-zone-label--inline">Midwest Compute Crush · implications</div>
      <section class="cockpit-decision-block cockpit-decision-block--wmc">
        <h3 class="cockpit-decision-head">Thesis</h3>
        <p class="cockpit-decision-text">${escape(meta.thesis || '—')}</p>
      </section>
      <section class="cockpit-decision-block cockpit-decision-block--wmc">
        <h3 class="cockpit-decision-head">Crush spread</h3>
        <p class="cockpit-decision-text">${escape(crushLine)}</p>
        ${hero ? `<p class="cockpit-decision-meta">${escape(hero.label)}: <span class="wmc-num">${escape(hero.value)}${escape(hero.unit || '')}</span> · ${escape(hero.delta || '')}</p>` : ''}
      </section>
      <section class="cockpit-decision-block cockpit-decision-block--wmc">
        <h3 class="cockpit-decision-head">Cross-asset correlation</h3>
        <p class="cockpit-decision-text">${escape(corrLine)}</p>
      </section>
      ${core ? `
      <section class="cockpit-decision-block cockpit-decision-block--wmc">
        <h3 class="cockpit-decision-head">Preferred expression · ${escape(core.name)}</h3>
        <p class="cockpit-decision-text">${escape(core.signal || '—')}</p>
        <p class="cockpit-decision-meta">${escape(core.sizing || '')} · Stop ${escape(core.stop || '—')} · Target ${escape(core.target || '—')}</p>
        <p class="cockpit-decision-rationale">${escape(core.rationale || '')}</p>
      </section>` : ''}
    `;
  }

  function bindToolbar() {
    el('btnIaWmcExport')?.addEventListener('click', () => {
      global.WMC?.Export?.download?.();
    });
  }

  function refreshCommentary() {
    if (typeof global.WTM_CommentaryFeed?.renderFeed === 'function') {
      global.WTM_CommentaryFeed.renderFeed(global.appState || {});
    }
  }

  async function activate() {
    active = true;
    const host = el('iaMidwestCrushHost');
    if (host) host.classList.remove('zone-hidden');

    await boot();
    renderDecisionRail();
    refreshCommentary();

    const disclosure = el('iaCommentaryDisclosure');
    if (disclosure) disclosure.open = true;
  }

  function deactivate() {
    active = false;
    const host = el('iaMidwestCrushHost');
    if (host) host.classList.add('zone-hidden');
  }

  function isActive() {
    return active;
  }

  function init() {
    bindToolbar();
  }

  global.WTM_WmcIaPanel = {
    BUILD,
    boot,
    activate,
    deactivate,
    isActive,
    renderDecisionRail,
    crushSpreadRow,
    topCorrelation,
    init,
    get booted() { return booted; },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);