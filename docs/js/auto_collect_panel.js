/**
 * WTM Auto Collect — one-click Barchart/Koyfin CSV download via local collect agent.
 * Requires: python3 scripts/whinfell_collect_agent.py (or Whinfell_Morning_Collect.command)
 */
(function autoCollectPanel(global) {
  'use strict';

  const COLLECT_BUILD = '0.1-AUTO-COLLECT-2026-07-05';
  const AGENT_BASE = 'http://127.0.0.1:8767';
  const FALLBACK_CMD = 'bash scripts/morning_auto_collect.sh';
  const AGENT_START_CMD = 'python3 scripts/whinfell_collect_agent.py';

  const EXPORT_IDS = {
    barchart: 'barchart_futures_intraday',
    koyfin: 'koyfin_rates',
  };

  let busy = false;

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else if (global.WMC?.Utils?.showToast) global.WMC.Utils.showToast(msg);
    else console.log('[AutoCollect]', msg);
  }

  async function agentFetch(path, opts = {}) {
    const url = `${AGENT_BASE}${path}`;
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  }

  async function pingAgent() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1200);
      const { ok, data } = await agentFetch('/health', { signal: ctrl.signal });
      clearTimeout(t);
      return ok && data.ok;
    } catch {
      return false;
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function fallbackClipboard(label) {
    const copied = await copyText(FALLBACK_CMD);
    notify(
      copied
        ? `${label}: agent offline — command copied. Paste in Terminal, or run ${AGENT_START_CMD}`
        : `${label}: agent offline — run in Terminal: ${FALLBACK_CMD}`,
    );
    return { ok: false, mode: 'clipboard' };
  }

  async function openTerminalCollect() {
    try {
      const { ok, data } = await agentFetch('/v1/collect/terminal', { method: 'POST' });
      if (ok && data.ok) {
        notify('Morning collect opened in Terminal — Comet may prompt for Barchart/Koyfin login');
        return { ok: true, mode: 'terminal' };
      }
    } catch { /* fall through */ }
    return null;
  }

  async function triggerMorningCollect() {
    if (busy) {
      notify('Collect already running — check Terminal or Comet');
      return { ok: false, mode: 'busy' };
    }
    busy = true;
    try {
      const alive = await pingAgent();
      if (!alive) {
        const term = await openTerminalCollect();
        if (term) return term;
        return fallbackClipboard('Collect CSVs');
      }

      const { ok, data } = await agentFetch('/v1/collect/morning', { method: 'POST' });
      if (ok && data.ok) {
        notify(`Morning collect started (job ${data.job_id}) — Barchart + wired Koyfin → drop → chain`);
        return { ok: true, mode: 'agent', job_id: data.job_id };
      }

      const term = await openTerminalCollect();
      if (term) return term;
      return fallbackClipboard('Collect CSVs');
    } finally {
      busy = false;
    }
  }

  async function triggerFetch(exportId) {
    if (!exportId) {
      notify('Missing export id');
      return { ok: false, mode: 'error' };
    }
    if (busy) {
      notify('Collect already running');
      return { ok: false, mode: 'busy' };
    }
    busy = true;
    try {
      const alive = await pingAgent();
      if (!alive) {
        const cmd = `python3 run_auto_download.py fetch --id ${exportId}`;
        const copied = await copyText(cmd);
        notify(
          copied
            ? `Agent offline — fetch command copied: ${exportId}`
            : `Agent offline — run: ${cmd}`,
        );
        return { ok: false, mode: 'clipboard' };
      }

      const { ok, data } = await agentFetch('/v1/collect/fetch', {
        method: 'POST',
        body: { id: exportId },
      });
      if (ok && data.ok) {
        notify(`Fetch started: ${exportId} (job ${data.job_id})`);
        return { ok: true, mode: 'agent', job_id: data.job_id };
      }
      notify(`Fetch failed for ${exportId}`);
      return { ok: false, mode: 'error' };
    } finally {
      busy = false;
    }
  }

  async function triggerBarchartCollect() {
    return triggerFetch(EXPORT_IDS.barchart);
  }

  async function triggerKoyfinCollect() {
    return triggerFetch(EXPORT_IDS.koyfin);
  }

  async function refreshDropStatus() {
    const alive = await pingAgent();
    if (!alive) return null;
    try {
      const { ok, data } = await agentFetch('/v1/status');
      return ok ? data : null;
    } catch {
      return null;
    }
  }

  function setButtonBusy(btn, on) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle('wtm-collect--busy', !!on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function wireButton(id, handler) {
    const btn = document.getElementById(id);
    if (!btn || btn._autoCollectBound) return;
    btn._autoCollectBound = true;
    btn.addEventListener('click', async () => {
      setButtonBusy(btn, true);
      try {
        await handler();
      } catch (err) {
        notify(`Collect error: ${err?.message || err}`);
      } finally {
        setButtonBusy(btn, false);
      }
    });
  }

  function wireAll() {
    wireButton('btnMorningCollect', triggerMorningCollect);
    wireButton('btnBwCollect', triggerMorningCollect);
    wireButton('btnWmcCollect', triggerMorningCollect);
    wireButton('btnBwBarchartCollect', triggerBarchartCollect);
    wireButton('btnBwKoyfinCollect', triggerKoyfinCollect);
  }

  const api = {
    COLLECT_BUILD,
    AGENT_BASE,
    FALLBACK_CMD,
    EXPORT_IDS,
    pingAgent,
    triggerMorningCollect,
    triggerFetch,
    triggerBarchartCollect,
    triggerKoyfinCollect,
    refreshDropStatus,
    wireAll,
  };

  global.WTM_AutoCollect = api;
  global.__testExports = global.__testExports || {};
  global.__testExports.autoCollect = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})(typeof window !== 'undefined' ? window : globalThis);