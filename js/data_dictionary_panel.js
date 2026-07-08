/**
 * Functional Data Dictionary panel — full metadata from data_dictionary_meta.json.
 */
(function dataDictionaryPanel(global) {
  'use strict';

  const META_URL = 'data_dictionary_meta.json';
  let metaCache = null;
  let fetchGen = 0;

  function el(id) { return document.getElementById(id); }

  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadMeta() {
    if (metaCache) return metaCache;
    const gen = ++fetchGen;
    try {
      const res = await fetch(META_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (gen === fetchGen) metaCache = json;
      return json;
    } catch (err) {
      console.warn('[WTM DD] meta load failed', err);
      return window.DICTIONARY_BADGE_DEFAULT || null;
    }
  }

  function renderMetaSections(meta) {
    if (!meta) return '<p class="ia-dd-empty">Dictionary metadata unavailable.</p>';
    const views = (meta.saved_views || []).map(v => `<li>${escape(v)}</li>`).join('');
    const blocks = (meta.hydration_blocks_v13 || []).map(b => `<li>${escape(b)}</li>`).join('');
    const specs = (meta.task_force_specialists || []).map(s => `<li>${escape(s)}</li>`).join('');
    const paths = meta.tc_asset_paths || {};
    const jsList = (paths.js || []).map(p => `<li><code>${escape(p)}</code></li>`).join('');
    return `
      <section class="ia-dd-section">
        <h4>Release</h4>
        <p>Version <strong>${escape(meta.version)}</strong> · ${escape(meta.date)} · ${escape(meta.status)}</p>
        <p>Machine ${escape(meta.machine_version)} · Hydration ${escape(meta.hydration_version)} · Task Force ${escape(meta.task_force_version || '—')}</p>
        <p>Build <code>${escape(meta.tc_console_build || '—')}</code></p>
      </section>
      <section class="ia-dd-section">
        <h4>Saved views (${(meta.saved_views || []).length})</h4>
        <ul class="ia-dd-list">${views || '<li>—</li>'}</ul>
      </section>
      <section class="ia-dd-section">
        <h4>Hydration blocks v1.3 (${(meta.hydration_blocks_v13 || []).length})</h4>
        <ul class="ia-dd-list">${blocks || '<li>—</li>'}</ul>
      </section>
      <section class="ia-dd-section">
        <h4>Task Force specialists</h4>
        <ul class="ia-dd-list">${specs || '<li>—</li>'}</ul>
      </section>
      <section class="ia-dd-section">
        <h4>Desk asset paths</h4>
        <ul class="ia-dd-list">${jsList || '<li>—</li>'}</ul>
        <p class="ia-dd-note">Source: ${escape(meta.source || meta.pipeline_repo || '—')}</p>
      </section>`;
  }

  function renderAuditSlot(state) {
    const audit = el('dataDictionaryAudit');
    if (!audit) return '<p class="ia-dd-note">Audit mounts in Signal detail drawer.</p>';
    if (typeof global.openDictionaryAudit === 'function') {
      return `<button type="button" class="ia-dd-audit-btn" id="btnIaDdAudit">Run field audit</button>
        <div id="iaDdAuditMount" class="ia-dd-audit-mount"></div>`;
    }
    return '<p class="ia-dd-note">Import hydration to enable field audit.</p>';
  }

  async function openPanel(state) {
    const drawer = el('iaDictionaryDrawer');
    const body = el('iaDictionaryBody');
    if (!drawer || !body) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.innerHTML = '<p class="ia-dd-loading">Loading dictionary…</p>';
    const meta = await loadMeta();
    body.innerHTML = renderMetaSections(meta) + renderAuditSlot(state);
    const auditBtn = el('btnIaDdAudit');
    if (auditBtn) {
      auditBtn.onclick = () => {
        if (typeof global.openDictionaryAudit === 'function') global.openDictionaryAudit();
        const mount = el('iaDdAuditMount');
        const src = el('dataDictionaryAudit');
        if (mount && src) mount.innerHTML = src.innerHTML;
      };
    }
  }

  function closePanel() {
    const drawer = el('iaDictionaryDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function bindUi() {
    el('btnIaDictionary')?.addEventListener('click', () => {
      openPanel(global.appState || {});
    });
    el('btnCloseIaDictionary')?.addEventListener('click', closePanel);
    el('iaDictionaryBackdrop')?.addEventListener('click', closePanel);
    el('ddVersionBadge')?.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      openPanel(global.appState || {});
    });
  }

  function refreshBadge(meta) {
    const badge = el('ddVersionBadge');
    if (!badge || !meta) return;
    const v = meta.version || '1.5';
    badge.textContent = `DD v${v}`;
    badge.title = `Data Dictionary v${v} — click for full metadata`;
  }

  async function init() {
    bindUi();
    const meta = await loadMeta();
    refreshBadge(meta);
  }

  global.WTM_DataDictionary = { loadMeta, openPanel, closePanel, init, renderMetaSections };
})(typeof window !== 'undefined' ? window : globalThis);