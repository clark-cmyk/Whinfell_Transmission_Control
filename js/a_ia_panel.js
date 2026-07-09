/**
 * Articulate A page — Dig-layer history of past analysis sessions.
 * Reads only WTM_Articulate.listSessions() (no raw data files).
 */
(function aIaPanel(global) {
  'use strict';

  const BUILD = 'A-IA-1.0.0-2026-07-09';

  let active = false;
  let wired = false;

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
    else console.log('[AIaPanel]', msg);
  }

  function getArticulate() {
    return global.WTM_Articulate || null;
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

  function listSessions() {
    const art = getArticulate();
    if (!art || typeof art.listSessions !== 'function') return [];
    try {
      return art.listSessions() || [];
    } catch (_) {
      return [];
    }
  }

  function renderEmpty() {
    return (
      `<div class="ia-a-empty" role="status">`
      + `<p><strong>No Articulate sessions yet.</strong></p>`
      + `<p>Click <strong>A</strong> on BasisWatch or Bang Bang Da to generate a trader prompt, copy it, and log a session here.</p>`
      + `</div>`
    );
  }

  function renderTable(sessions) {
    const rows = sessions.map((s, idx) => {
      const id = escapeHtml(s.id || String(idx));
      const at = escapeHtml(formatTime(s.at));
      const mod = escapeHtml(s.moduleName || s.panelId || '—');
      const snap = escapeHtml(s.snapshot || '—');
      const preview = escapeHtml(s.promptPreview || (s.prompt ? String(s.prompt).slice(0, 120) : '—'));
      return (
        `<tr data-session-id="${id}">`
        + `<td>${at}</td>`
        + `<td>${mod}</td>`
        + `<td>${snap}</td>`
        + `<td><div class="ia-a-preview" title="${preview}">${preview}</div></td>`
        + `<td>`
        + `<button type="button" class="ia-a-btn ia-a-copy-btn" data-session-id="${id}" title="Copy full prompt">Copy</button>`
        + `</td>`
        + `</tr>`
      );
    }).join('');

    return (
      `<div class="ark-panel-block">`
      + `<div class="ark-panel-block__head" style="margin-bottom:8px">`
      + `<span class="console-chip console-chip--meta">${sessions.length} session${sessions.length === 1 ? '' : 's'}</span>`
      + `</div>`
      + `<div class="ark-table-wrap">`
      + `<table class="ia-a-sessions-table" aria-label="Articulate session history">`
      + `<thead><tr>`
      + `<th>Timestamp</th><th>Module</th><th>Snapshot</th><th>Preview</th><th></th>`
      + `</tr></thead>`
      + `<tbody>${rows}</tbody>`
      + `</table>`
      + `</div>`
      + `</div>`
    );
  }

  function render() {
    const viewport = el('iaAViewport');
    if (!viewport) return;

    const art = getArticulate();
    if (!art) {
      viewport.innerHTML = (
        `<p class="ia-a-empty">WTM_Articulate not loaded. Ensure js/articulate.js is included.</p>`
      );
      return;
    }

    const sessions = listSessions();
    if (!sessions.length) {
      viewport.innerHTML = (
        renderEmpty()
        + `<p class="ia-a-empty">Panel BUILD · <code>${escapeHtml(BUILD)}</code> · Articulate · <code>${escapeHtml(art.BUILD || '—')}</code></p>`
      );
      return;
    }

    viewport.innerHTML = (
      renderTable(sessions)
      + `<p class="ia-a-empty">Panel BUILD · <code>${escapeHtml(BUILD)}</code> · Articulate · <code>${escapeHtml(art.BUILD || '—')}</code></p>`
    );

    viewport.querySelectorAll('.ia-a-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-session-id');
        const row = sessions.find((s) => String(s.id) === String(sid));
        const text = row?.prompt || row?.promptPreview || '';
        if (!text) {
          notify('No prompt stored for this session');
          return;
        }
        const copyFn = art.copyPrompt || (async (t) => {
          try {
            await global.navigator?.clipboard?.writeText(t);
            return true;
          } catch (_) {
            return false;
          }
        });
        Promise.resolve(copyFn.call(art, text)).then((ok) => {
          notify(ok ? 'Session prompt copied' : 'Clipboard denied');
          if (!ok) console.log(text);
        });
      });
    });
  }

  function onClearLog() {
    const art = getArticulate();
    if (!art || typeof art.clearSessions !== 'function') {
      notify('Articulate log unavailable');
      return;
    }
    art.clearSessions();
    render();
    notify('Articulate log cleared');
  }

  function wireControls() {
    if (wired) return;
    wired = true;
    el('btnARefresh')?.addEventListener('click', () => {
      render();
      notify('Articulate history refreshed');
    });
    el('btnAClearLog')?.addEventListener('click', () => {
      onClearLog();
    });
  }

  function activate() {
    active = true;
    const host = el('iaAHost');
    if (host) host.classList.remove('zone-hidden');
    wireControls();
    render();
  }

  function deactivate() {
    active = false;
    const host = el('iaAHost');
    if (host) host.classList.add('zone-hidden');
  }

  function isActive() {
    return active;
  }

  function init() {
    wireControls();
  }

  global.WTM_AIaPanel = {
    BUILD: BUILD,
    activate: activate,
    deactivate: deactivate,
    isActive: isActive,
    render: render,
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
