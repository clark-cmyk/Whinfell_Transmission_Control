/**
 * The Ark — Dig-layer control dashboard (presentation only).
 * Reads data exclusively through WTM_Ark (no raw file loads).
 */
(function arkIaPanel(global) {
  'use strict';

  const BUILD = 'ARK-IA-1.0.0-2026-07-09';

  let active = false;
  let wired = false;
  /** @type {(() => void)|null} */
  let unsubscribe = null;

  function el(id) {
    return global.document?.getElementById(id) || null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else console.log('[ArkIaPanel]', msg);
  }

  function getArk() {
    return global.WTM_Ark || null;
  }

  function statusChipClass(status) {
    const s = String(status || 'unavailable').toLowerCase();
    if (s === 'ok') return 'console-chip console-chip--ok';
    if (s === 'missing' || s === 'stale') return 'console-chip console-chip--warn';
    if (s === 'error') return 'console-chip console-chip--risk';
    return 'console-chip console-chip--meta';
  }

  function formatTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
    } catch (_) {
      return String(iso);
    }
  }

  /**
   * Diagnostic prompt for Fix with LLM (built from Ark inventory only).
   */
  function buildFixWithLlmPrompt() {
    const ark = getArk();
    const stamp = ark && typeof ark.getStamp === 'function' ? ark.getStamp() : {};
    const sources = ark && typeof ark.getSources === 'function'
      ? ark.getSources()
      : (stamp.sources || []);

    const lines = [
      '**WTC Ark Diagnostic — Fix with LLM**',
      '',
      'You are helping debug Whinfell Transmission Control data loading (The Ark SSOT).',
      'Only ark.js may load raw data files. Summarize what is broken and give a short fix plan.',
      '',
      '**Stamp**',
      `- as_of: ${stamp.as_of || 'null'}`,
      `- snapshot_id: ${stamp.snapshot_id || 'null'}`,
      `- freshness_status: ${stamp.freshness_status || 'null'}`,
      `- lastRefreshedAt: ${stamp.lastRefreshedAt || 'null'}`,
      `- Ark BUILD: ${ark?.BUILD || 'missing'}`,
      '',
      '**Data sources**',
    ];

    if (!sources.length) {
      lines.push('- (no sources registered — WTM_Ark may not be loaded)');
    } else {
      sources.forEach((src) => {
        lines.push(
          `- ${src.id}: status=${src.status || '—'} url=${src.url || '—'} `
          + `lastSuccess=${src.lastSuccessAt || '—'} error=${src.error || 'none'}`
        );
      });
    }

    lines.push(
      '',
      '**Expected paths**',
      '- data/hydration/latest.json',
      '- data/barchart/v1/barchart_curve_history.json',
      '- bang_bang_da/bang_bang_da_report.json',
      '- bang_bang_da/litmus/crypto_market.json (CoinGlass / Litmus)',
      '',
      '**Environment notes**',
      `- location.protocol: ${global.location?.protocol || 'unknown'}`,
      '- file: protocol cannot fetch JSON (use http(s) desk host or manual import)',
      '',
      '**Instructions**',
      '1. Identify which sources failed and why.',
      '2. Suggest the smallest safe fix (path, publish, collect, or Ark rewire).',
      '3. Keep the response concise and operator-friendly.',
    );

    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      if (global.navigator?.clipboard?.writeText) {
        await global.navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* fall through */ }
    return false;
  }

  async function onFixWithLlm() {
    const prompt = buildFixWithLlmPrompt();
    const ok = await copyText(prompt);
    if (ok) notify('Ark diagnostic prompt copied to clipboard');
    else notify('Clipboard denied — open console for prompt');
    if (!ok) console.log(prompt);
  }

  function renderSourcesTable(sources) {
    const rows = (sources || []).map((src) => {
      const chip = statusChipClass(src.status);
      return (
        `<tr>`
        + `<td>${escapeHtml(src.id)}</td>`
        + `<td><code class="ark-source-url">${escapeHtml(src.url)}</code></td>`
        + `<td><span class="${chip}">${escapeHtml(src.status || '—')}</span></td>`
        + `<td>${escapeHtml(formatTime(src.lastSuccessAt))}</td>`
        + `<td class="ark-source-error">${escapeHtml(src.error || '—')}</td>`
        + `</tr>`
      );
    }).join('');

    return (
      `<div class="ark-panel-block">`
      + `<div class="ark-panel-block__head">`
      + `<span class="ark-panel-block__title">Data sources</span>`
      + `</div>`
      + `<div class="ark-table-wrap">`
      + `<table class="ark-sources-table" aria-label="Ark data sources">`
      + `<thead><tr>`
      + `<th>Source</th><th>Path</th><th>Status</th><th>Last success</th><th>Error</th>`
      + `</tr></thead>`
      + `<tbody>${rows || '<tr><td colspan="5">No sources</td></tr>'}</tbody>`
      + `</table>`
      + `</div>`
      + `</div>`
    );
  }

  function renderStampStrip(stamp) {
    const asOf = stamp?.as_of || '—';
    const snap = stamp?.snapshot_id || '—';
    const fresh = stamp?.freshness_status || '—';
    const last = formatTime(stamp?.lastRefreshedAt);

    return (
      `<div class="ark-stamp-strip" role="status" aria-live="polite">`
      + `<span class="console-chip console-chip--meta">as_of · ${escapeHtml(asOf)}</span>`
      + `<span class="console-chip console-chip--meta">snapshot · ${escapeHtml(snap)}</span>`
      + `<span class="console-chip console-chip--meta">freshness · ${escapeHtml(fresh)}</span>`
      + `<span class="console-chip console-chip--meta">last refresh · ${escapeHtml(last)}</span>`
      + `</div>`
    );
  }

  function render() {
    const viewport = el('iaArkViewport');
    if (!viewport) return;

    const ark = getArk();
    if (!ark) {
      viewport.innerHTML = (
        `<p class="ark-empty">WTM_Ark not loaded. Ensure js/ark.js is included before this panel.</p>`
      );
      return;
    }

    const stamp = typeof ark.getStamp === 'function' ? ark.getStamp() : {};
    const sources = typeof ark.getSources === 'function' ? ark.getSources() : (stamp.sources || []);

    viewport.innerHTML = (
      `${renderStampStrip(stamp)}`
      + renderSourcesTable(sources)
      + `<div class="ark-panel-block ark-panel-block--meta">`
      + `<p class="ark-help">The Ark is the single source of truth. Panels must not fetch raw data files.</p>`
      + `<p class="ark-help">Ark BUILD · <code>${escapeHtml(ark.BUILD || '—')}</code> · Panel · <code>${escapeHtml(BUILD)}</code></p>`
      + `</div>`
    );
  }

  /**
   * Probe registered sources (load into Ark cache) then re-render.
   * Does not apply hydration to the desk — that remains DeskOps/core.
   */
  async function refreshInventory() {
    const ark = getArk();
    if (!ark) {
      render();
      return;
    }
    const tasks = [];
    if (typeof ark.loadHydration === 'function') tasks.push(ark.loadHydration({ force: true }));
    if (typeof ark.loadCurveHistory === 'function') tasks.push(ark.loadCurveHistory({ force: true }));
    if (typeof ark.loadBbdmReport === 'function') tasks.push(ark.loadBbdmReport({ force: true }));
    if (typeof ark.loadCoinglass === 'function') tasks.push(ark.loadCoinglass({ force: true }));
    try {
      await Promise.all(tasks);
    } catch (err) {
      console.warn('[ArkIaPanel] inventory refresh', err);
    }
    render();
  }

  function wireControls() {
    if (wired) return;
    wired = true;

    el('btnArkFixWithLlm')?.addEventListener('click', () => {
      onFixWithLlm();
    });

    // Optional refresh control if present later; stamp strip is render-only for now.
    const actions = el('iaArkHost')?.querySelector('.ia-ark-actions');
    if (actions && !el('btnArkRefreshInventory')) {
      const btn = global.document.createElement('button');
      btn.type = 'button';
      btn.id = 'btnArkRefreshInventory';
      btn.className = 'ia-ark-btn';
      btn.title = 'Re-probe Ark sources (cache only)';
      btn.textContent = 'Refresh inventory';
      btn.addEventListener('click', () => {
        refreshInventory().then(() => notify('Ark inventory refreshed'));
      });
      actions.insertBefore(btn, actions.firstChild);
    }
  }

  function ensureSubscribe() {
    const ark = getArk();
    if (!ark || typeof ark.subscribe !== 'function') return;
    if (unsubscribe) return;
    unsubscribe = ark.subscribe(() => {
      if (active) render();
    });
  }

  async function activate() {
    active = true;
    const host = el('iaArkHost');
    if (host) host.classList.remove('zone-hidden');

    wireControls();
    ensureSubscribe();
    render();
    // Warm inventory once when opening the page (non-blocking).
    refreshInventory();
  }

  function deactivate() {
    active = false;
    const host = el('iaArkHost');
    if (host) host.classList.add('zone-hidden');
  }

  function isActive() {
    return active;
  }

  function init() {
    wireControls();
    ensureSubscribe();
  }

  global.WTM_ArkIaPanel = {
    BUILD: BUILD,
    activate: activate,
    deactivate: deactivate,
    isActive: isActive,
    render: render,
    refreshInventory: refreshInventory,
    buildFixWithLlmPrompt: buildFixWithLlmPrompt,
    init: init,
  };

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
